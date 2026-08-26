/**
 * Deployment-scoped market context (docs/architecture/frontend-architecture.md §1).
 *
 * `LBU_CODE` is a deployment constant — never resolved per request. It selects
 * the feature manifest, locale and (later) BFF base URL + DLS theme token set.
 * This app vendors the Malaysia Performance spec, so `my` is the only market
 * that exists today; an unrecognised code fails closed (docs/security/security-standard.md §10).
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
  contestApiUrl?: string;
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
    contestApiUrl: process.env.CONTESTS_API_URL,
    features: Object.freeze(allFeatures()),
  }),
});

/**
 * Resolve the deployment's market context. Defaults to `my` when `LBU_CODE`
 * is unset (local dev); throws for any configured value we cannot serve.
 */
export function getLbuContext(lbuCode: string | undefined = process.env.LBU_CODE): LbuContext {
  const code = (lbuCode ?? 'my').toLowerCase();
  if (!(LBU_CODES as readonly string[]).includes(code)) {
    throw new Error(`Unsupported LBU_CODE: ${code}`);
  }
  return CONTEXTS[code as LbuCode];
}

export function isFeatureEnabled(feature: Feature, context: LbuContext = getLbuContext()): boolean {
  return context.features[feature] === true;
}
