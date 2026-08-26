import { expect, test } from '@playwright/test';
import type { RuleExpressionVM, RuleOperator, RulePredicateVM } from '@spec/contest-admin-vm';
import { governedContestCatalogue } from '@/lib/contest-admin/governed-catalogue';
import { explainPredicate, explainRule } from '@/lib/contest-admin/rule-explanation';

const predicate=(metricCode:string,operator:RuleOperator,operand?:RulePredicateVM['operand'],context?:RulePredicateVM['context']):RulePredicateVM=>({nodeId:`${metricCode}_${operator}`,type:'PREDICATE',metricCode,operator,operand,context});

test.describe('Plain-English rule explanation',()=>{
  test('(AC-CA-RULE-EN-01) explains every operator and governed operand shape without losing values',()=>{
    const cases:Array<[RulePredicateVM,string[]]>=[
      [predicate('FYP','GTE',{kind:'MONEY',value:'25000.00',currency:'MYR'}),['First Year Premium / Contribution','greater than or equal to','RM 25,000']],
      [predicate('CASE_COUNT','GT',{kind:'INTEGER',value:10}),['Case count','greater than','10']],
      [predicate('IPR','LTE',{kind:'PERCENT',value:'85.50'}),['Persistency rate','less than or equal to','85.5%']],
      [predicate('UGQP','LT',{kind:'DECIMAL',value:'4.25'}),['Unit Group Qualification Points','less than','4.25']],
      [predicate('IS_ROOKIE','EQ',{kind:'BOOLEAN',value:true}),['Rookie agent','equal to','true']],
      [predicate('CONTRACT_DATE','NEQ',{kind:'DATE',value:'2026-01-15'}),['Contract date','not equal to','15 Jan 2026']],
      [predicate('AGENT_LEVEL','IN',{kind:'LOV_SET',lovKey:'agent.level',valueCodes:['AGENT','UM1']}),['Agent level','one of','Agent or Unit Manager 1']],
      [predicate('PRODUCT_FAMILY','NOT_IN',{kind:'LOV_SET',lovKey:'product.family',valueCodes:['UNIT_TRUST','GROUP_BUSINESS']}),['Product family','none of','Unit Trust or Group Business']],
      [predicate('FYP','BETWEEN',{kind:'RANGE',from:'10000.00',to:'25000.00',currency:'MYR'}),['First Year Premium / Contribution','between','RM 10,000 and RM 25,000']],
      [predicate('CONTRACT_DATE','BETWEEN',{kind:'DATE_RANGE',from:'2026-01-01',to:'2026-06-30'}),['Contract date','between','1 Jan 2026 and 30 Jun 2026']],
      [predicate('AGENT_LEVEL','EXISTS'),['Agent level','must have a value']],
    ];
    for(const [node,parts] of cases){const sentence=explainPredicate(node,governedContestCatalogue);for(const part of parts)expect(sentence).toContain(part);}
  });

  test('(AC-CA-RULE-EN-02) preserves ALL, thresholded ANY and NOT brackets with complete nested logic',()=>{
    const expression:RuleExpressionVM={nodeId:'root',type:'ALL',children:[
      predicate('FYP','GTE',{kind:'MONEY',value:'25000.00',currency:'MYR'}),
      {nodeId:'alternatives',type:'ANY',minimumPass:2,children:[predicate('CASE_COUNT','GTE',{kind:'INTEGER',value:10}),predicate('IPR','GTE',{kind:'PERCENT',value:'85.00'})]},
      {nodeId:'excluded',type:'NOT',child:predicate('PRODUCT_FAMILY','IN',{kind:'LOV_SET',lovKey:'product.family',valueCodes:['UNIT_TRUST','GROUP_BUSINESS']})},
    ]};
    const result=explainRule(expression,governedContestCatalogue);
    expect(result).toMatchObject({type:'ALL',badge:'ALL',children:[{sentence:expect.stringContaining('RM 25,000')},{type:'ANY',badge:'AT LEAST 2',children:[{sentence:expect.stringContaining('Case count')},{sentence:expect.stringContaining('Persistency rate')}]},{type:'NOT',badge:'NOT',children:[{sentence:expect.stringContaining('Unit Trust or Group Business')}]}]});
  });

  test('(AC-CA-RULE-EN-03) includes all configured predicate context and handles incomplete groups safely',()=>{
    const contextual=predicate('TPC','GTE',{kind:'MONEY',value:'200000.00',currency:'MYR'},{periodId:'H1',audienceCode:'PERSONAL',aggregationCode:'DIRECT_UNIT',repricingCode:'EXCLUDING_REPRICING',productScopeCode:'HEALTH_PRODUCTS'});
    expect(explainPredicate(contextual,governedContestCatalogue)).toContain('during First half, for P4 · Individual production, using DIRECT UNIT aggregation, with Excluding repricing, and within HEALTH PRODUCTS');
    expect(explainRule({nodeId:'empty',type:'ANY',children:[]},governedContestCatalogue).description).toBe('This group has no conditions yet.');
    expect(explainPredicate(predicate('FYP','GTE',{kind:'MONEY',value:'',currency:'MYR'}),governedContestCatalogue)).toContain('a value that has not been selected');
  });
});