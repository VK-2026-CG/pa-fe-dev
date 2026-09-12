import { useCallback } from 'react';
import type { ContestCatalogueVM, MetricDefinitionVM, OperandVM, RuleExpressionVM, RuleOperator, ValidationIssueVM } from '@spec/contest-admin-vm';
import { t } from '@/lib/i18n';
import { randomUUID } from '@/lib/id';

const newId = () => `node_${randomUUID().slice(0,8)}`;
const defaultOperand = (metric:MetricDefinitionVM,operator:RuleOperator=metric.operators[0]!):OperandVM => metric.operandLovKey ? (['IN','NOT_IN'].includes(operator)?{kind:'LOV_SET',lovKey:metric.operandLovKey,valueCodes:[]}:{kind:'LOV',lovKey:metric.operandLovKey,valueCode:''}) : operator==='BETWEEN' ? (metric.kind==='DATE'?{kind:'DATE_RANGE',from:'',to:''}:{kind:'RANGE',from:'0.00',to:'0.00',...(metric.currency?{currency:metric.currency}:{})}) : metric.kind==='BOOLEAN'?{kind:'BOOLEAN',value:true}:metric.kind==='DATE'?{kind:'DATE',value:''}:metric.kind==='COUNT' ? {kind:'INTEGER',value:0} : {kind:metric.kind==='MONEY'?'MONEY':metric.kind==='PERCENT'?'PERCENT':'DECIMAL',value:'0.00',...(metric.currency?{currency:metric.currency}:{})};
export const newPredicate = (catalogue:ContestCatalogueVM):RuleExpressionVM => { const metric=catalogue.metrics[0]!; return {nodeId:newId(),type:'PREDICATE',metricCode:metric.code,operator:metric.operators[0]!,operand:defaultOperand(metric)}; };

export function mapRule(node:RuleExpressionVM,nodeId:string,replace:(node:RuleExpressionVM)=>RuleExpressionVM|null):RuleExpressionVM|null {
  if(node.nodeId===nodeId)return replace(node);
  if(node.type==='NOT'){const child=mapRule(node.child,nodeId,replace);return child?{...node,child}:null;}
  if(node.type==='ALL'||node.type==='ANY')return {...node,children:node.children.map(child=>mapRule(child,nodeId,replace)).filter((child):child is RuleExpressionVM=>child!==null)};
  return node;
}

export function ruleStats(node:RuleExpressionVM,depth=1):{nodes:number;depth:number}{
  if(node.type==='PREDICATE')return{nodes:1,depth};
  const children=node.type==='NOT'?[node.child]:node.children;const stats=children.map(child=>ruleStats(child,depth+1));
  return{nodes:1+stats.reduce((sum,item)=>sum+item.nodes,0),depth:Math.max(depth,...stats.map(item=>item.depth))};
}

function OperandEditor({metric,operator,operand,catalogue,onChange}:{metric:MetricDefinitionVM;operator:RuleOperator;operand?:OperandVM;catalogue:ContestCatalogueVM;onChange:(operand:OperandVM)=>void}){
  if(operator==='EXISTS')return <span className="ca-exists-value">{t('contest.field.noValueRequired')}</span>;
  if(metric.operandLovKey){const lov=metric.operandLovKey;const values=catalogue.lovs.find(item=>item.key===lov)?.values??[];if(['IN','NOT_IN'].includes(operator)){const selected=operand?.kind==='LOV_SET'?operand.valueCodes:[];return <div className="ca-lov-set" aria-label={t('contest.field.value')}>{values.map(value=><label key={value.code}><input type="checkbox" checked={selected.includes(value.code)} onChange={()=>onChange({kind:'LOV_SET',lovKey:lov,valueCodes:selected.includes(value.code)?selected.filter(code=>code!==value.code):[...selected,value.code]})}/><span>{t(value.labelKey)}</span></label>)}</div>;}return <select aria-label={t('contest.field.value')} value={operand?.kind==='LOV'?operand.valueCode:''} onChange={event=>onChange({kind:'LOV',lovKey:lov,valueCode:event.target.value})}><option value="">{t('contest.field.selectValue')}</option>{values.map(value=><option key={value.code} value={value.code}>{t(value.labelKey)}</option>)}</select>;}
  if(operator==='BETWEEN'){const range=operand?.kind==='RANGE'||operand?.kind==='DATE_RANGE'?operand:defaultOperand(metric,operator);return <div className="ca-range"><input aria-label={t('contest.field.from')} type={metric.kind==='DATE'?'date':'text'} inputMode={metric.kind==='DATE'?undefined:'decimal'} value={'from'in range?range.from:''} onChange={event=>onChange(metric.kind==='DATE'?{kind:'DATE_RANGE',from:event.target.value,to:'to'in range?range.to:''}:{kind:'RANGE',from:event.target.value,to:'to'in range?range.to:'',...(metric.currency?{currency:metric.currency}:{})})}/><input aria-label={t('contest.field.to')} type={metric.kind==='DATE'?'date':'text'} inputMode={metric.kind==='DATE'?undefined:'decimal'} value={'to'in range?range.to:''} onChange={event=>onChange(metric.kind==='DATE'?{kind:'DATE_RANGE',from:'from'in range?range.from:'',to:event.target.value}:{kind:'RANGE',from:'from'in range?range.from:'',to:event.target.value,...(metric.currency?{currency:metric.currency}:{})})}/></div>}
  if(metric.kind==='BOOLEAN')return <select aria-label={t('contest.field.value')} value={operand?.kind==='BOOLEAN'?String(operand.value):'true'} onChange={event=>onChange({kind:'BOOLEAN',value:event.target.value==='true'})}><option value="true">{t('contest.boolean.true')}</option><option value="false">{t('contest.boolean.false')}</option></select>;
  if(metric.kind==='DATE')return <input aria-label={t('contest.field.value')} type="date" value={operand?.kind==='DATE'?operand.value:''} onChange={event=>onChange({kind:'DATE',value:event.target.value})}/>;
  if(metric.kind==='COUNT')return <input aria-label={t('contest.field.value')} type="number" step="1" value={operand?.kind==='INTEGER'?operand.value:0} onChange={event=>onChange({kind:'INTEGER',value:Number(event.target.value)})}/>;
  const value=operand&&'value'in operand?String(operand.value):'';return <input aria-label={t('contest.field.value')} inputMode="decimal" value={value} onChange={event=>onChange({...defaultOperand(metric),value:event.target.value} as OperandVM)}/>;
}

function operandLayout(metric:MetricDefinitionVM,operator:RuleOperator):string {
  if(operator==='EXISTS')return'is-exists';
  if(operator==='BETWEEN')return'is-range';
  if(metric.operandLovKey)return ['IN','NOT_IN'].includes(operator)?'is-multi-lov':'is-single-lov';
  if(metric.kind==='BOOLEAN')return'is-boolean';
  if(metric.kind==='DATE')return'is-date';
  return'is-scalar';
}

type UpdateRuleNode = (nodeId:string,replace:(node:RuleExpressionVM)=>RuleExpressionVM|null)=>void;

interface RuleNodeProps {
  node:RuleExpressionVM;
  depth:number;
  catalogue:ContestCatalogueVM;
  issues:ValidationIssueVM[];
  updateNode:UpdateRuleNode;
}

function RuleNode({node,depth,catalogue,issues,updateNode}:RuleNodeProps){
  const nodeIssues=issues.filter(issue=>issue.path.includes(node.nodeId));
  if(node.type==='PREDICATE'){
    const metric=catalogue.metrics.find(item=>item.code===node.metricCode)??catalogue.metrics[0]!;
    const layout=operandLayout(metric,node.operator);
    return <article className={`ca-rule-node ca-predicate ${layout}`} data-depth={depth}>
      <header className="ca-predicate-meta"><span>{t('contest.ruleEditor.condition')}</span><code title={node.nodeId}>{node.nodeId}</code>{node.sourceCitationIds?.length&&<small>{t('contest.ruleEditor.sources',{count:node.sourceCitationIds.length})}</small>}<button className="ca-node-remove" aria-label={t('contest.action.removeCondition')} onClick={()=>updateNode(node.nodeId,()=>null)}>×</button></header>
      <div className="ca-predicate-fields">
        <label className="ca-field-metric"><span>{t('contest.field.metric')}</span><select value={node.metricCode} onChange={event=>{const nextMetric=catalogue.metrics.find(item=>item.code===event.target.value)!;updateNode(node.nodeId,current=>({...current as typeof node,metricCode:nextMetric.code,operator:nextMetric.operators[0]!,operand:defaultOperand(nextMetric)}));}}>{catalogue.metrics.map(item=><option key={item.code} value={item.code}>{t(item.labelKey)}</option>)}</select></label>
        <label className="ca-field-operator"><span>{t('contest.field.operator')}</span><select value={node.operator} onChange={event=>{const operator=event.target.value as RuleOperator;updateNode(node.nodeId,current=>({...current as typeof node,operator,operand:operator==='EXISTS'?undefined:defaultOperand(metric,operator)}));}}>{metric.operators.map(operator=><option key={operator} value={operator}>{t(`contest.operator.${operator}`)}</option>)}</select></label>
        <div className="ca-field-operand"><span>{t('contest.field.value')}</span><OperandEditor metric={metric} operator={node.operator} operand={node.operand} catalogue={catalogue} onChange={operand=>updateNode(node.nodeId,current=>({...current as typeof node,operand}))}/></div>
      </div>
      {nodeIssues.map(issue=><p role="alert" key={issue.issueId}>{t(issue.messageKey)}</p>)}
    </article>;
  }
  const children=node.type==='NOT'?[node.child]:node.children;
  return <fieldset className="ca-rule-node ca-rule-group" data-depth={depth}><legend><span>{t('contest.ruleEditor.group')}</span>{node.type==='NOT'?<strong>{t('contest.logic.NOT')}</strong>:<select aria-label={t('contest.ruleEditor.logic')} value={node.type} onChange={event=>updateNode(node.nodeId,current=>(current.type==='ALL'||current.type==='ANY')?{...current,type:event.target.value as 'ALL'|'ANY'}:current)}><option value="ALL">{t('contest.logic.ALL')}</option><option value="ANY">{t('contest.logic.ANY')}</option></select>}<code>{node.nodeId}</code>{depth>1&&<button aria-label={t('contest.action.removeGroup')} onClick={()=>updateNode(node.nodeId,()=>null)}>×</button>}</legend><div className="ca-group-children">{children.map(child=><RuleNode key={child.nodeId} node={child} depth={depth+1} catalogue={catalogue} issues={issues} updateNode={updateNode}/>)}</div>{node.type!=='NOT'&&<div className="ca-group-actions"><button onClick={()=>updateNode(node.nodeId,current=>({...current as typeof node,children:[...(current as typeof node).children,newPredicate(catalogue)]}))}>{t('contest.action.addCondition')}</button><button onClick={()=>updateNode(node.nodeId,current=>({...current as typeof node,children:[...(current as typeof node).children,{nodeId:newId(),type:'ALL',children:[newPredicate(catalogue)]}]}))}>{t('contest.action.addGroup')}</button><button onClick={()=>updateNode(node.nodeId,current=>({...current as typeof node,children:[...(current as typeof node).children,{nodeId:newId(),type:'NOT',child:newPredicate(catalogue)}]}))}>{t('contest.action.addNot')}</button></div>}</fieldset>;
}

export function RuleExpressionEditor({expression,catalogue,issues,onChange}:{expression:RuleExpressionVM;catalogue:ContestCatalogueVM;issues:ValidationIssueVM[];onChange:(value:RuleExpressionVM)=>void}){
  const updateNode=useCallback<UpdateRuleNode>((nodeId,replace)=>{const next=mapRule(expression,nodeId,replace);if(next)onChange(next);},[expression,onChange]);
  return <RuleNode node={expression} depth={1} catalogue={catalogue} issues={issues} updateNode={updateNode}/>;
}