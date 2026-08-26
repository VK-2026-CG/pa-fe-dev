/**
 * CDK registry — resolves *which* page composition renders for the deployment's
 * LBU (docs/architecture/frontend-architecture.md §5). Route shells call this and
 * nothing else. This repository vendors only the MY spec, so every current page
 * is explicitly registered as a Malaysia CDK. The `common` fallback remains for
 * future pages proven identical across multiple supported markets.
 * The pages themselves live in `src/cdk/<feature>/<Feature><LBU|Common>.tsx`.
 */
import { notFound } from 'next/navigation';
import { getLbuContext, isFeatureEnabled, type LbuCode } from '@/config/lbu';
import PerformanceMY from './performance/PerformanceMY';
import MetricDetailMY from './metric-detail/MetricDetailMY';
import HistoryMY from './history/HistoryMY';
import CustomizeMetricsMY from './customize-metrics/CustomizeMetricsMY';
import MilestonesMY from './milestones/MilestonesMY';
import CompBenMY from './comp-ben/CompBenMY';
import IntroducerDrilldownMY from './introducer-drilldown/IntroducerDrilldownMY';
import LeaderboardMY from './leaderboard/LeaderboardMY';
import TeamDrilldownMY from './team-drilldown/TeamDrilldownMY';
import MocMY from './moc/MocMY';
import PlaceholderMY from './placeholder/PlaceholderMY';
import RecommendationsMY from './recommendations/RecommendationsMY';
import SetGoalsMY from './set-goals/SetGoalsMY';
import ContestAdminMY from './contest-admin/ContestAdminMY';
import type { CdkFeature, CdkPage } from './types';

type Registration<F extends CdkFeature> = Partial<Record<LbuCode | 'common', CdkPage<F>>>;
type Registry = { [F in CdkFeature]: Registration<F> };

const REGISTRY: Registry = {
  'performance': { my: PerformanceMY },
  'metric-detail': { my: MetricDetailMY },
  'history': { my: HistoryMY },
  'customize-metrics': { my: CustomizeMetricsMY },
  'milestones': { my: MilestonesMY },
  'comp-ben': { my: CompBenMY },
  'introducer-drilldown': { my: IntroducerDrilldownMY },
  'leaderboard': { my: LeaderboardMY },
  'moc': { my: MocMY },
  'placeholder': { my: PlaceholderMY },
  'recommendations': { my: RecommendationsMY },
  'set-goals': { my: SetGoalsMY },
  'team-drilldown': { my: TeamDrilldownMY },
  'contest-admin': { my: ContestAdminMY },
};

/**
 * Resolve a feature's page for this deployment. Disabled in the LBU's route
 * manifest → 404 before render; registered nowhere → a loud configuration error.
 */
export function resolveCdk<F extends CdkFeature>(feature: F, lbu?: LbuCode): CdkPage<F> {
  const context = getLbuContext(lbu);
  if (!isFeatureEnabled(feature, context)) notFound();
  const registration: Registration<F> = REGISTRY[feature];
  const page = registration[context.lbu] ?? registration.common;
  if (!page) throw new Error(`No CDK registered for feature=${feature}, lbu=${context.lbu}`);
  return page;
}
