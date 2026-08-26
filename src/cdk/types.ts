import type { ComponentType } from 'react';
import type { Feature } from '@/config/lbu';
import type { PersonaId } from '@/lib/persona';

/** Search params handed down by the App Router shell (already awaited). */
export type RouteQuery = Record<string, string | undefined>;

/**
 * Props each feature's CDK page receives — typed per feature, never `any`.
 * Route shells supply exactly these; the page owns everything below.
 */
export interface CdkPageProps extends Record<Feature, object> {
  'performance': { query: RouteQuery; persona: PersonaId };
  'metric-detail': { query: RouteQuery };
  'history': { query: RouteQuery };
  'customize-metrics': { query: RouteQuery };
  'milestones': Record<string, never>;
  'comp-ben': Record<string, never>;
  'introducer-drilldown': Record<string, never>;
  'leaderboard': Record<string, never>;
  'moc': Record<string, never>;
  /** Shared Coming-Soon page; the title key is the only variation. */
  'placeholder': { titleKey?: string };
  'recommendations': Record<string, never>;
  'set-goals': Record<string, never>;
  'team-drilldown': Record<string, never>;
  'contest-admin': {
    page: 'portfolio' | 'contest-import' | 'builder' | 'rule-editor' | 'review' | 'historic-contests' | 'rules' | 'approvals' | 'audit' | 'simulation';
    params?: Record<string, string>;
    query?: RouteQuery;
  };
}

export type CdkFeature = Feature;
export type CdkPage<F extends CdkFeature> = ComponentType<CdkPageProps[F]>;
