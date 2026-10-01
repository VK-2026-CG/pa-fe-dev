import type { Page, Route } from '@playwright/test';
import type {
  DeltaVM, HistoricalComparison, HistoricalDataTotalsVM, HistoricalDataVM, MetricScalar, Scope, Variant,
} from '@spec/performance-vm';

/**
 * Fixture HistoricalDataVMs shaped exactly like contract §2 for the states the
 * pa-be-dev memory source cannot produce (EMPTY, N/A cells, errors). The
 * numbers mirror the Figma frame (TPC, 2026 vs 2025 vs 2024) so a failing
 * assertion reads against the design. The % maths here is the BFF rule of
 * contract §2.6 (one decimal, half away from zero) written independently of
 * `src/lib/historical-data.ts` so the UI is checked against it, not itself.
 */

/** Jan..Dec per year; `null` = no data for that month (2026 stops in September). */
export const SERIES: Record<number, Array<number | null>> = {
  2026: [25246, 27120, 30000, 29500, 31200, 32800, 30450, 34000, 29800, null, null, null],
  2025: [24890, 25640, 28400, 27800, 29900, 30100, 28600, 31800, 28200, 32400, 34600, 36300],
  2024: Array.from({ length: 12 }, () => 34900),
};

/** TEAM filter-sheet metrics, Figma order (C4 `screens.historicalData.metrics`). */
export const METRICS: Array<{ metricCode: string; variant?: Variant }> = [
  { metricCode: 'TPC', variant: 'WITHOUT_REPRICING' },
  { metricCode: 'TPC', variant: 'WITH_REPRICING' },
  { metricCode: 'CASE_COUNT' },
  { metricCode: 'MANPOWER' },
  { metricCode: 'ACTIVITY_RATIO' },
  { metricCode: 'PRODUCTIVITY' },
  { metricCode: 'AVERAGE_CASE_SIZE' },
  { metricCode: 'NEW_RECRUIT_CONTRACTED' },
];

/** Metrics whose months can be summed (contract: C4 `metrics[].total`). */
const ADDITIVE = new Set(['TPC', 'CASE_COUNT', 'NEW_RECRUIT_CONTRACTED', 'FYP', 'FYC']);

/** SELF filter-sheet metrics — the VM carries them, the UI hard-codes nothing. */
export const SELF_METRICS: Array<{ metricCode: string; variant?: Variant }> = [
  { metricCode: 'TPC', variant: 'WITHOUT_REPRICING' },
  { metricCode: 'TPC', variant: 'WITH_REPRICING' },
  { metricCode: 'CASE_COUNT' },
  { metricCode: 'FYP' },
  { metricCode: 'FYC' },
];

const COMPARISONS: HistoricalComparison[] = ['CURRENT_YEAR', 'VS_LAST_YEAR', 'VS_LAST_2_YEARS'];

/** Half away from zero to one decimal. */
function round1(n: number): number {
  return Math.sign(n) * Math.round(Math.abs(n) * 10) / 10;
}

export type FixtureKind = MetricScalar['kind'];

function scalar(kind: FixtureKind, n: number | null): MetricScalar | null {
  if (n === null) return null;
  switch (kind) {
    case 'MONEY': return { kind, amount: `${n}.00`, currency: 'MYR' };
    case 'DECIMAL': return { kind, value: n, precision: 1 };
    default: return { kind, value: n };
  }
}

function change(basis: DeltaVM['comparisonBasis'], cur: number | null, prior: number | null): DeltaVM | null {
  if (cur === null || prior === null || prior === 0) return null;
  const pct = round1(((cur - prior) / prior) * 100);
  return {
    comparisonBasis: basis,
    direction: pct > 0 ? 'UP' : pct < 0 ? 'DOWN' : 'FLAT',
    sentiment: pct > 0 ? 'POSITIVE' : pct < 0 ? 'NEGATIVE' : 'NEUTRAL',
    display: 'PCT',
    pct,
  };
}

export interface HistoricalFixtureOptions {
  /** TEAM (default): 8 metrics + `context.teamView`. SELF: the agent's five metrics and no `teamView`. */
  scope?: Scope;
  comparison?: HistoricalComparison;
  metricCode?: string;
  variant?: Variant;
  anchorYear?: number;
  /**
   * Total row: `'auto'` (default) mirrors the BFF — present for the additive metrics only (TPC, CASE_COUNT,
   * NEW_RECRUIT_CONTRACTED) — `false` omits it, or pass the VM totals to force a specific shape.
   */
  totals?: 'auto' | false | HistoricalDataTotalsVM;
  /** Scalar kind of the values (default MONEY, the TPC fixture). */
  kind?: FixtureKind;
  /** Replace the series (e.g. all-null for EMPTY). */
  series?: Record<number, Array<number | null>>;
  asOfDate?: string;
}

export function historicalVm(opts: HistoricalFixtureOptions = {}): HistoricalDataVM {
  const comparison = opts.comparison ?? 'CURRENT_YEAR';
  const scope = opts.scope ?? 'TEAM';
  const metricCode = opts.metricCode ?? 'TPC';
  const variant = metricCode === 'TPC' ? (opts.variant ?? 'WITHOUT_REPRICING') : undefined;
  const A = opts.anchorYear ?? 2026;
  const kind = opts.kind ?? 'MONEY';
  const series = opts.series ?? SERIES;
  const at = (year: number, m: number): number | null => series[year]?.[m - 1] ?? null;

  const years = comparison === 'CURRENT_YEAR' ? [A] : comparison === 'VS_LAST_YEAR' ? [A, A - 1] : [A, A - 1, A - 2];
  // Jira AC7/AC8/AC9 (requester: "go as per the user story", 2026-10-01): Current Year is month-over-month
  // (January against the previous December); Vs Last Year / Vs Last 2 Years compare the same month of
  // the previous year(s).
  const changeColumns: HistoricalDataVM['changeColumns'] = comparison === 'VS_LAST_2_YEARS'
    ? [{ basis: 'LAST_YEAR' }, { basis: 'LAST_2_YEARS' }]
    : comparison === 'VS_LAST_YEAR' ? [{ basis: 'LAST_YEAR' }] : [{ basis: 'LAST_MONTH' }];

  const rows = Array.from({ length: 12 }, (_, i) => {
    const m = i + 1;
    const cur = at(A, m);
    const changes: Array<DeltaVM | null> = comparison === 'VS_LAST_2_YEARS'
      ? [change('LAST_YEAR', cur, at(A - 1, m)), change('LAST_2_YEARS', cur, at(A - 2, m))]
      : comparison === 'VS_LAST_YEAR'
        ? [change('LAST_YEAR', cur, at(A - 1, m))]
        : [change('LAST_MONTH', cur, m === 1 ? at(A - 1, 12) : at(A, m - 1))];
    return { month: m, values: years.map((y) => scalar(kind, at(y, m))), changes };
  });

  // Total row (AC-P4-03-32): like-for-like — only the months the anchor year has a value for; a year
  // that misses any of those months is null. A LAST_MONTH column's total change is always null (undefined).
  const anchorMonths = Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => at(A, m) !== null);
  const sum = (year: number): number | null => {
    if (anchorMonths.length === 0) return null;
    let total = 0;
    for (const m of anchorMonths) {
      const v = at(year, m);
      if (v === null) return null;
      total += v;
    }
    return total;
  };
  const yearTotals = years.map((y) => sum(y));
  const computedTotals: HistoricalDataTotalsVM = {
    values: yearTotals.map((n) => scalar(kind, n)),
    changes: changeColumns.map((column) => {
      if (column.basis === 'LAST_MONTH') return null;
      return change(column.basis, sum(A), sum(column.basis === 'LAST_YEAR' ? A - 1 : A - 2));
    }),
  };
  const totals = opts.totals === undefined || opts.totals === 'auto'
    ? (ADDITIVE.has(metricCode) ? computedTotals : undefined)
    : opts.totals === false ? undefined : opts.totals;

  return {
    meta: {
      screenId: 'S-P4-03', specVersion: '2.0.0', configVersion: 'test', country: 'MY',
      asOfDate: opts.asOfDate ?? '2026-09-03', generatedAt: '2026-09-03T08:00:00.000Z', traceId: 'test-trace', partial: false,
    },
    dataState: rows.every((r) => r.values.every((v) => v === null)) ? 'EMPTY' : 'OK',
    context: { businessLine: 'INSURANCE', basis: 'STANDARD', scope, ...(scope === 'TEAM' ? { teamView: 'DIRECT' as const } : {}) },
    selection: { metricCode, ...(variant ? { variant } : {}), comparison },
    filter: {
      metrics: (scope === 'SELF' ? SELF_METRICS : METRICS).map((m) => ({ ...m, selected: m.metricCode === metricCode && m.variant === variant })),
      comparisons: COMPARISONS.map((c) => ({ comparison: c, selected: c === comparison })),
    },
    valueType: kind,
    anchorYear: A,
    years,
    changeColumns,
    rows,
    ...(totals ? { totals } : {}),
  };
}

/** The same VM with every cell blanked — the BFF's EMPTY response (layout intact). */
export function emptyHistoricalVm(opts: HistoricalFixtureOptions = {}): HistoricalDataVM {
  return historicalVm({ ...opts, series: { [opts.anchorYear ?? 2026]: Array.from({ length: 12 }, () => null) } });
}

export const HISTORICAL_DATA_URL = '**/api/bff/v1/performance/historical-data**';

/** Cross-origin BFF: a fulfilled response needs CORS headers (the app is on another port). */
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' };

export interface HistoricalMock {
  /** Query strings of every request the page made, in order. */
  requests: URLSearchParams[];
}

/**
 * Serve `GET .../historical-data` from the fixture builder, honouring the
 * `metricCode` / `variant` / `comparison` the page asks for. `respond` lets a
 * test override one response (error, EMPTY, slow).
 */
export async function mockHistoricalData(
  page: Page,
  respond?: (query: URLSearchParams, route: Route, nth: number) => Promise<boolean | void> | boolean | void,
): Promise<HistoricalMock> {
  const mock: HistoricalMock = { requests: [] };
  await page.route(HISTORICAL_DATA_URL, async (route) => {
    const request = route.request();
    if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: CORS });
    const query = new URL(request.url()).searchParams;
    mock.requests.push(query);
    if (respond && (await respond(query, route, mock.requests.length)) === true) return;
    const vm = historicalVm({
      scope: query.get('scope') === 'SELF' ? 'SELF' : 'TEAM',
      comparison: (query.get('comparison') as HistoricalComparison | null) ?? 'CURRENT_YEAR',
      metricCode: query.get('metricCode') ?? 'TPC',
      variant: (query.get('variant') as Variant | null) ?? undefined,
    });
    await route.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(vm) });
  });
  return mock;
}

export function fulfillJson(route: Route, body: unknown, status = 200): Promise<void> {
  return route.fulfill({ status, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });
}
