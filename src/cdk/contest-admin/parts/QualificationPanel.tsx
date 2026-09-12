import { Link } from 'react-router-dom';
import type { QualificationConfigurationVM, RuleExpressionVM } from '@spec/contest-admin-vm';
import { t } from '@/lib/i18n';

function countNodes(node:RuleExpressionVM):number {
  if (node.type === 'PREDICATE') return 1;
  if (node.type === 'NOT') return 1 + countNodes(node.child);
  return 1 + node.children.reduce((total, child) => total + countNodes(child), 0);
}

export function QualificationPanel({ qualification, ruleBaseHref, onAddRoute }:{ qualification?:QualificationConfigurationVM; ruleBaseHref:string;onAddRoute?:()=>void }) {
  if (!qualification) return <div className="ca-config-placeholder"><strong>{t('contest.qualification.empty')}</strong><p>{t('contest.qualification.emptyHelp')}</p><button className="ca-primary" onClick={onAddRoute}>{t('contest.action.addRoute')}</button></div>;
  const tiers = [...qualification.tiers].sort((a,b) => a.order - b.order);
  const periods = [...qualification.periods].sort((a,b) => a.order - b.order);
  return <div className="ca-qualification">
    <section className="ca-route-stack" aria-labelledby="qualification-routes-title">
      <header><div><p>{t('contest.qualification.routesEyebrow')}</p><h3 id="qualification-routes-title">{t('contest.qualification.routes')}</h3></div><button className="ca-secondary" onClick={onAddRoute}>{t('contest.action.addRoute')}</button></header>
      {[...qualification.routes].sort((a,b) => a.order - b.order).map((route,index) => <article key={route.routeId}>
        <div className="ca-route-index">{index + 1}</div><div><span>{route.audienceCode?t(`contest.audience.${route.audienceCode}`):t('contest.qualification.alternativeRoute')}</span><h4>{route.name??t(route.labelKey)}</h4><p>{t('contest.qualification.nodeSummary',{count:countNodes(route.expression),tiers:route.tierIds.length})}</p><div className="ca-route-policies">{route.selectionPolicy?.mode==='TOP_N'&&<small>{t('contest.routePolicy.topN',{count:route.selectionPolicy.topN??0,metric:route.selectionPolicy.rankByMetricCode??''})}</small>}{route.rewardPolicy&&<small>{t('contest.routePolicy.rewards',{values:route.rewardPolicy.rewardCodes.join(' · ')})}</small>}{route.sourceCitationIds?.length&&<small>{t('contest.routePolicy.sources',{count:route.sourceCitationIds.length})}</small>}</div></div><span className="ca-logic-chip">{t(`contest.logic.${route.expression.type}`)}</span><Link className="ca-secondary" to={`${ruleBaseHref}/${route.routeId}`}>{t('contest.action.editRule')}</Link>
      </article>)}
    </section>
    <section className="ca-tier-matrix" aria-labelledby="tier-matrix-title">
      <header><div><p>{t('contest.qualification.targetsEyebrow')}</p><h3 id="tier-matrix-title">{t('contest.qualification.targets')}</h3></div><span>{t('contest.qualification.precedence',{code:qualification.rewardPrecedenceCode})}</span></header>
      <div className="ca-matrix-scroll"><table><caption>{t('contest.qualification.matrixCaption')}</caption><thead><tr><th scope="col">{t('contest.qualification.tier')}</th>{periods.map(period => <th scope="col" key={period.periodId}>{t(period.labelKey)}</th>)}<th scope="col">{t('contest.qualification.reward')}</th></tr></thead><tbody>{tiers.map(tier => <tr key={tier.tierId}><th scope="row"><span>{tier.order}</span>{t(tier.labelKey)}</th>{periods.map(period => {const cell=qualification.targets.find(target => target.tierId===tier.tierId&&target.periodId===period.periodId);return <td key={period.periodId} data-state={cell?.state??'NOT_CONFIGURED'}>{cell?.value??(cell?.state==='NOT_APPLICABLE'?t('contest.qualification.notApplicable'):t('contest.qualification.notConfigured'))}<small>{cell&&t(`contest.matrixState.${cell.state}`)}</small></td>;})}<td><code>{tier.rewardCode}</code></td></tr>)}</tbody></table></div>
    </section>
  </div>;
}