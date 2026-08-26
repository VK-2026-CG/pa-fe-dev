import type { ContestCatalogueVM, RuleExpressionVM } from '@spec/contest-admin-vm';
import { t } from '@/lib/i18n';
import { explainRule, type RuleExplanationNode } from '@/lib/contest-admin/rule-explanation';

function LogicNode({node,position}:{node:RuleExplanationNode;position?:number}){
  if(node.type==='PREDICATE')return <li className="ca-logic-condition"><span aria-hidden="true">{position}</span><p>{node.sentence}</p></li>;
  return <li className="ca-logic-group-item"><section className={`ca-logic-group is-${node.type.toLowerCase()}`} aria-label={`${node.badge}. ${node.description}`}>
    <header><strong>{node.badge}</strong><span>{node.description}</span></header>
    {node.children.length>0&&<ol>{node.children.map((child,index)=><LogicNode key={child.nodeId} node={child} position={index+1}/>)}</ol>}
  </section></li>;
}

export function RuleLogicPreview({expression,catalogue}:{expression:RuleExpressionVM;catalogue:ContestCatalogueVM}){
  const explanation=explainRule(expression,catalogue);
  return <section className="ca-logic-preview" aria-labelledby="rule-logic-preview-title" aria-live="polite">
    <header><div><p>{t('contest.ruleExplanation.eyebrow')}</p><h2 id="rule-logic-preview-title">{t('contest.ruleExplanation.title')}</h2></div><span>{t('contest.ruleExplanation.live')}</span></header>
    <p className="ca-logic-intro">{t('contest.ruleExplanation.body')}</p>
    <ol className="ca-logic-tree"><LogicNode node={explanation}/></ol>
  </section>;
}