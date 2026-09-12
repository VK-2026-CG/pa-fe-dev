import type { ComponentType } from 'react';
import {
  createBrowserRouter, Navigate, useParams, useSearchParams,
} from 'react-router-dom';
import App from '@/App';
import { resolveCdk } from '@/cdk/registry';
import type { CdkFeature, CdkPageProps } from '@/cdk/types';
import { usePersona } from '@/lib/usePersona';
import NotFoundPage from '@/routes/NotFoundPage';

function queryFromSearchParams(searchParams: URLSearchParams): Record<string, string | undefined> {
  return Object.fromEntries(searchParams.entries());
}

/**
 * The 13 flat `src/app/insights/<feature>/page.tsx` routes were each just
 * `resolveCdk('<feature>')`, optionally forwarding `searchParams` (and, for
 * `performance` only, the persona). Collapsed into one data-driven table
 * mapped to a single shared route element instead of 13 near-identical files.
 */
interface InsightsRouteConfig {
  path: string;
  feature: Exclude<CdkFeature, 'contest-admin'>;
  withQuery?: boolean;
  withPersona?: boolean;
}

const INSIGHTS_ROUTES: InsightsRouteConfig[] = [
  { path: 'performance', feature: 'performance', withQuery: true, withPersona: true },
  { path: 'metric-detail', feature: 'metric-detail', withQuery: true },
  { path: 'history', feature: 'history', withQuery: true },
  { path: 'customize-metrics', feature: 'customize-metrics', withQuery: true },
  { path: 'milestones', feature: 'milestones' },
  { path: 'comp-ben', feature: 'comp-ben' },
  { path: 'introducer-drilldown', feature: 'introducer-drilldown' },
  { path: 'leaderboard', feature: 'leaderboard' },
  { path: 'moc', feature: 'moc' },
  { path: 'placeholder', feature: 'placeholder' },
  { path: 'recommendations', feature: 'recommendations' },
  { path: 'set-goals', feature: 'set-goals' },
  { path: 'team-drilldown', feature: 'team-drilldown' },
];

function InsightsRoute({ feature, withQuery, withPersona }: InsightsRouteConfig) {
  const [searchParams] = useSearchParams();
  const { personaId } = usePersona();
  // `INSIGHTS_ROUTES` keeps each feature's flags aligned with its actual
  // `CdkPageProps` entry, so this cast is safe — a generic per-feature prop
  // union isn't expressible without it.
  const Cdk = resolveCdk(feature, import.meta.env.VITE_LBU_CODE) as ComponentType<Record<string, unknown>>;
  const props: Record<string, unknown> = {};
  if (withQuery) props.query = queryFromSearchParams(searchParams);
  if (withPersona) props.persona = personaId;
  return <Cdk {...props} />;
}

/**
 * `src/app/contest-admin/**` nested dynamic routes, converted to React
 * Router routes with `:contestId`/`:versionId`/`:step`/`:ruleId`/`:assetId`/
 * `:ruleVersionId`/`:importId` params. Every leaf ultimately renders the same
 * `ContestAdminMY` page keyed by `page`, so — same as insights — one
 * data-driven table replaces the 11 near-identical `page.tsx` files.
 */
type ContestAdminPage = CdkPageProps['contest-admin']['page'];
interface ContestAdminRouteConfig {
  path: string;
  page: ContestAdminPage;
  withParams?: boolean;
  withQuery?: boolean;
  /** Static params merged in alongside the route's own (e.g. reusable rule editor context). */
  extraParams?: Record<string, string>;
}

const CONTEST_ADMIN_ROUTES: ContestAdminRouteConfig[] = [
  { path: 'contests', page: 'portfolio', withQuery: true },
  { path: 'historic-contests', page: 'historic-contests', withQuery: true },
  { path: 'rules', page: 'rules' },
  { path: 'approvals', page: 'approvals', withQuery: true },
  { path: 'audit', page: 'audit' },
  { path: 'contest-imports/:importId', page: 'contest-import', withParams: true },
  { path: 'contests/:contestId/versions/:versionId/edit/:step', page: 'builder', withParams: true },
  { path: 'contests/:contestId/versions/:versionId/review', page: 'review', withParams: true },
  { path: 'contests/:contestId/versions/:versionId/rules/:ruleId', page: 'rule-editor', withParams: true },
  { path: 'contests/:contestId/versions/:versionId/simulations', page: 'simulation', withParams: true },
  {
    path: 'rules/:assetId/versions/:ruleVersionId', page: 'rule-editor', withParams: true,
    extraParams: { editorContext: 'REUSABLE_RULE' },
  },
];

function ContestAdminRoute({
  page, withParams, withQuery, extraParams,
}: ContestAdminRouteConfig) {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const Cdk = resolveCdk('contest-admin', import.meta.env.VITE_LBU_CODE) as ComponentType<Record<string, unknown>>;
  const props: Record<string, unknown> = { page };
  if (withParams) props.params = { ...params, ...extraParams };
  if (withQuery) props.query = queryFromSearchParams(searchParams);
  return <Cdk {...props} />;
}

export const router = createBrowserRouter([
  {
    element: <App />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <Navigate to="/insights/performance" replace /> },
      ...INSIGHTS_ROUTES.map((config) => ({
        path: `insights/${config.path}`,
        element: <InsightsRoute {...config} />,
      })),
      ...CONTEST_ADMIN_ROUTES.map((config) => ({
        path: `contest-admin/${config.path}`,
        element: <ContestAdminRoute {...config} />,
      })),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
