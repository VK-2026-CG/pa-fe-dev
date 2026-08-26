import type { ContestCatalogueVM, MetricDefinitionVM, OperandVM, RuleExpressionVM, RulePredicateVM } from '@spec/contest-admin-vm';
import { formatCount, formatMoney, formatShortDate } from '@/lib/format';
import { hasKey, t } from '@/lib/i18n';

export interface RuleExplanationNode {
  nodeId:string;
  type:RuleExpressionVM['type'];
  badge:string;
  description:string;
  sentence?:string;
  children:RuleExplanationNode[];
}

const translatedCode=(prefix:string,code:string)=>hasKey(`${prefix}.${code}`)?t(`${prefix}.${code}`):code.replaceAll('_',' ');
const decimal=(value:string)=>{const [integer='0',fraction='']=value.split('.');const grouped=integer.replace(/\B(?=(\d{3})+(?!\d))/g,',');const trimmed=fraction.replace(/0+$/,'');return trimmed?`${grouped}.${trimmed}`:grouped;};
const date=(value:string)=>/^\d{4}-\d{2}-\d{2}$/.test(value)?formatShortDate(value):t('contest.ruleExplanation.valueMissing');
const list=(values:string[])=>values.length?new Intl.ListFormat('en',{style:'long',type:'disjunction'}).format(values):t('contest.ruleExplanation.valueMissing');

function lovValue(catalogue:ContestCatalogueVM,lovKey:string,code:string):string{
  const value=catalogue.lovs.find(lov=>lov.key===lovKey)?.values.find(item=>item.code===code);
  return value?t(value.labelKey):code.replaceAll('_',' ');
}

function operandValue(operand:OperandVM|undefined,metric:MetricDefinitionVM,catalogue:ContestCatalogueVM):string{
  if(!operand)return t('contest.ruleExplanation.valueMissing');
  switch(operand.kind){
    case 'MONEY':return operand.value?formatMoney(operand.value,operand.currency??metric.currency??'MYR'):t('contest.ruleExplanation.valueMissing');
    case 'PERCENT':return operand.value?t('contest.ruleExplanation.percent',{value:decimal(operand.value)}):t('contest.ruleExplanation.valueMissing');
    case 'DECIMAL':return operand.value?decimal(operand.value):t('contest.ruleExplanation.valueMissing');
    case 'INTEGER':return formatCount(operand.value);
    case 'BOOLEAN':return t(operand.value?'contest.ruleExplanation.true':'contest.ruleExplanation.false');
    case 'DATE':return date(operand.value);
    case 'DATE_RANGE':return t('contest.ruleExplanation.range',{from:date(operand.from),to:date(operand.to)});
    case 'RANGE':{
      const value=(item:string)=>!item?t('contest.ruleExplanation.valueMissing'):operand.currency?formatMoney(item,operand.currency):metric.kind==='PERCENT'?t('contest.ruleExplanation.percent',{value:decimal(item)}):decimal(item);
      return t('contest.ruleExplanation.range',{from:value(operand.from),to:value(operand.to)});
    }
    case 'LOV':return operand.valueCode?lovValue(catalogue,operand.lovKey,operand.valueCode):t('contest.ruleExplanation.valueMissing');
    case 'LOV_SET':return list(operand.valueCodes.map(code=>lovValue(catalogue,operand.lovKey,code)));
  }
}

function contextText(node:RulePredicateVM):string{
  if(!node.context)return'';
  const details:string[]=[];
  if(node.context.periodId)details.push(t('contest.ruleExplanation.context.period',{value:translatedCode('contest.period',node.context.periodId)}));
  if(node.context.audienceCode)details.push(t('contest.ruleExplanation.context.audience',{value:translatedCode('contest.audience',node.context.audienceCode)}));
  if(node.context.aggregationCode)details.push(t('contest.ruleExplanation.context.aggregation',{value:node.context.aggregationCode.replaceAll('_',' ')}));
  if(node.context.repricingCode)details.push(t('contest.ruleExplanation.context.repricing',{value:translatedCode('contest.catalogue.production.repricing',node.context.repricingCode)}));
  if(node.context.productScopeCode)details.push(t('contest.ruleExplanation.context.productScope',{value:node.context.productScopeCode.replaceAll('_',' ')}));
  return details.length?t('contest.ruleExplanation.context',{details:new Intl.ListFormat('en',{style:'long',type:'conjunction'}).format(details)}):'';
}

export function explainPredicate(node:RulePredicateVM,catalogue:ContestCatalogueVM):string{
  const metric=catalogue.metrics.find(item=>item.code===node.metricCode);
  const metricLabel=metric?t(metric.labelKey):node.metricCode.replaceAll('_',' ');
  const operator=t(`contest.ruleExplanation.operator.${node.operator}`);
  const context=contextText(node);
  if(node.operator==='EXISTS')return t('contest.ruleExplanation.predicateExists',{metric:metricLabel,operator,context});
  return t('contest.ruleExplanation.predicate',{metric:metricLabel,operator,value:metric?operandValue(node.operand,metric,catalogue):t('contest.ruleExplanation.valueMissing'),context});
}

export function explainRule(node:RuleExpressionVM,catalogue:ContestCatalogueVM):RuleExplanationNode{
  if(node.type==='PREDICATE')return{nodeId:node.nodeId,type:node.type,badge:t('contest.ruleExplanation.condition'),description:t('contest.ruleExplanation.conditionDescription'),sentence:explainPredicate(node,catalogue),children:[]};
  if(node.type==='NOT')return{nodeId:node.nodeId,type:node.type,badge:t('contest.ruleExplanation.notBadge'),description:t('contest.ruleExplanation.notDescription'),children:[explainRule(node.child,catalogue)]};
  const threshold=node.type==='ANY'?(node.minimumPass??1):node.children.length;
  return{
    nodeId:node.nodeId,
    type:node.type,
    badge:node.type==='ALL'?t('contest.ruleExplanation.allBadge'):node.minimumPass?t('contest.ruleExplanation.minimumBadge',{count:threshold}):t('contest.ruleExplanation.anyBadge'),
    description:node.children.length===0?t('contest.ruleExplanation.emptyGroup'):node.type==='ALL'?t('contest.ruleExplanation.allDescription'):node.minimumPass?t('contest.ruleExplanation.minimumDescription',{count:threshold}):t('contest.ruleExplanation.anyDescription'),
    children:node.children.map(child=>explainRule(child,catalogue)),
  };
}