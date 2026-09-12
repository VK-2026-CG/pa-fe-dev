/**
 * Deployment-scoped market context (docs/architecture/frontend-architecture.md §1).
 *
 * `LBU_CODE` is a deployment constant — never resolved per request. It selects
 * the feature manifest, locale and (later) DLS theme token set. This app
 * vendors the Malaysia Performance spec, so `my` is the only market that
 * exists today; an unrecognised code fails closed (docs/security/security-standard.md §10).
 *
 * Client-safe only: this module must never read a server-only env var (only
 * `VITE_*`-prefixed vars reach the browser bundle at all — Vite's own
 * enforcement, not just convention). `CONTESTS_API_URL`/`INSIGHTS_API_URL`
 * belong to pa-be-dev exclusively now that the BFF lives there.
 *
 * This module also stays free of `import.meta.env` on purpose: it's imported
 * directly by `tests/unit/architecture.spec.ts`, which Playwright runs under
 * plain Node (no Vite transform), where `import.meta` is a syntax error. The
 * one call site that needs the build-time `VITE_LBU_CODE` override — the
 * router — reads it and passes it in explicitly (see `src/router.tsx`).
 */
export const LBU_CODES = ['my'] as const;
export type LbuCode = (typeof LBU_CODES)[number];

/** Route/feature manifest keys — one per physical route under `src/app/insights`. */
export const FEATURES = [
  'performance',
  'metric-detail',
  'history',
  'customize-metrics',
  'milestones',
  'comp-ben',
  'introducer-drilldown',
  'leaderboard',
  'moc',
  'placeholder',
  'recommendations',
  'set-goals',
  'team-drilldown',
  'contest-admin',
] as const;
export type Feature = (typeof FEATURES)[number];

export interface LbuContext {
  lbu: LbuCode;
  country: string;
  locale: string;
  /** Route manifest: a feature absent or false 404s before render. */
  features: Readonly<Record<Feature, boolean>>;
}

const allFeatures = (): Record<Feature, boolean> =>
  Object.fromEntries(FEATURES.map((f) => [f, true])) as Record<Feature, boolean>;

const CONTEXTS: Readonly<Record<LbuCode, LbuContext>> = Object.freeze({
  my: Object.freeze({
    lbu: 'my',
    country: 'MY',
    locale: 'en-MY',
    features: Object.freeze(allFeatures()),
  }),
});

/**
 * Resolve the deployment's market context. Defaults to `my` when no code is
 * given (local dev, and every test); throws for any configured value we
 * cannot serve.
 */
export function getLbuContext(lbuCode: string | undefined = 'my'): LbuContext {
  const code = (lbuCode ?? 'my').toLowerCase();
  if (!(LBU_CODES as readonly string[]).includes(code)) {
    throw new Error(`Unsupported LBU_CODE: ${code}`);
  }
  return CONTEXTS[code as LbuCode];
}

export function isFeatureEnabled(feature: Feature, context: LbuContext = getLbuContext()): boolean {
  return context.features[feature] === true;
}
