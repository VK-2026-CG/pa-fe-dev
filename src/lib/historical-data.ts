/**
 * Historical Data (S-P4-03 §B, ARVIJ-1450-SP01) — the pure rules behind the
 * one Historical Data page, which serves SELF and TEAM alike: URL ⇄ scope +
 * selection, request params, cell/pill formatting, caption + header
 * derivation and the placeholder frame. No React, no fetching, so
 * `tests/unit/historical-data.spec.ts` can lock them without a browser.
 */
import type {
  DashboardFiltersVM, DeltaVM, HistoricalComparison, HistoricalDataRowVM,
  HistoricalDataVM, MetricScalar, MoreActionVM, Scope, Variant,
} from '@spec/performance-vm';
import { hasKey, t } from './i18n';
import { NO_VALUE, formatDelta, formatMoneyPlain, formatScalar } from './format';

export const HISTORICAL_COMPARISONS: readonly HistoricalComparison[] = ['CURRENT_YEAR', 'VS_LAST_YEAR', 'VS_LAST_2_YEARS'];
/** Jira AC4: first load is "TPC without Repricing" for the current year. */
export const DEFAULT_HISTORICAL_METRIC = 'TPC';
export const DEFAULT_HISTORICAL_VARIANT: Variant = 'WITHOUT_REPRICING';
export const DEFAULT_HISTORICAL_COMPARISON: HistoricalComparison = 'CURRENT_YEAR';

const VARIANTS: readonly Variant[] = ['WITHOUT_REPRICING', 'WITH_REPRICING'];

export type HistoricalQuery = Record<string, string | undefined>;

export interface HistoricalSelection {
  metricCode: string;
  /** Only TPC carries a variant; the BFF answers 400 for a variant on any other metric. */
  variant?: Variant;
  comparison: HistoricalComparison;
}

/** Read the user-facing selection from the URL, applying the AC4 defaults and dropping anything the BFF would reject. */
export function parseHistoricalSelection(query: HistoricalQuery): HistoricalSelection {
  const metricCode = query.metricCode?.trim() || DEFAULT_HISTORICAL_METRIC;
  const comparison = HISTORICAL_COMPARISONS.find((c) => c === query.comparison) ?? DEFAULT_HISTORICAL_COMPARISON;
  if (metricCode !== 'TPC') return { metricCode, comparison };
  const variant = VARIANTS.find((v) => v === query.variant) ?? DEFAULT_HISTORICAL_VARIANT;
  return { metricCode, variant, comparison };
}

/** The page's scope: `TEAM` only when the URL says so; everything else (no param, junk) is the agent's own SELF data. */
export function parseHistoricalScope(query: HistoricalQuery): Scope {
  return query.scope === 'TEAM' ? 'TEAM' : 'SELF';
}

/**
 * Lens params carried through from the dashboard and forwarded to the BFF untouched.
 * `teamView` only means something for TEAM, so a SELF request never sends it.
 */
function lensKeys(scope: Scope): readonly string[] {
  return scope === 'TEAM' ? ['businessLine', 'teamView', 'basis'] : ['businessLine', 'basis'];
}

/** `GET /api/bff/v1/performance/historical-data` query for a scope + selection. */
export function historicalDataParams(query: HistoricalQuery, selection: HistoricalSelection, scope: Scope = parseHistoricalScope(query)): URLSearchParams {
  const params = new URLSearchParams({ scope, metricCode: selection.metricCode });
  if (selection.variant) params.set('variant', selection.variant);
  params.set('comparison', selection.comparison);
  for (const key of lensKeys(scope)) if (query[key]) params.set(key, query[key]!);
  return params;
}

/** Page URL query after Apply: the scope and lens stay, only the selection changes. */
export function applySelectionToQuery(current: URLSearchParams, selection: HistoricalSelection, scope: Scope = parseHistoricalScope(Object.fromEntries(current))): URLSearchParams {
  const next = new URLSearchParams(current);
  next.set('scope', scope);
  next.set('metricCode', selection.metricCode);
  if (selection.variant) next.set('variant', selection.variant);
  else next.delete('variant');
  next.set('comparison', selection.comparison);
  return next;
}

export function sameSelection(a: HistoricalSelection, b: HistoricalSelection): boolean {
  return a.metricCode === b.metricCode && a.variant === b.variant && a.comparison === b.comparison;
}

/** Stable id of a metric radio row: "TPC|WITHOUT_REPRICING", "CASE_COUNT|". */
export function metricOptionId(metricCode: string, variant?: Variant): string {
  return `${metricCode}|${variant ?? ''}`;
}

export function metricFromOptionId(id: string): { metricCode: string; variant?: Variant } {
  const [metricCode = '', variant = ''] = id.split('|');
  const v = VARIANTS.find((x) => x === variant);
  return v ? { metricCode, variant: v } : { metricCode };
}

/** "TPC without Repricing" · "Case Count" — falls back to the dashboard title for a metric the screen has no label for yet. */
export function historicalMetricLabel(metricCode: string, variant?: Variant): string {
  const key = `insights.historicalData.metric.${metricCode}${variant ? `.${variant}` : ''}`;
  if (hasKey(key)) return t(key);
  const base = `insights.metric.${metricCode}.title`;
  if (!hasKey(base)) return metricCode;
  return variant && hasKey(`insights.variant.${variant}`) ? `${t(base)} ${t(`insights.variant.${variant}`)}` : t(base);
}

export function historicalComparisonLabel(comparison: HistoricalComparison): string {
  return t(`insights.historicalData.comparison.${comparison}`);
}

export function historicalComparisonOptionLabel(comparison: HistoricalComparison): string {
  return t(`insights.historicalData.comparison.option.${comparison}`);
}

/**
 * "+65.0%" / "-70.2%" / "0%": one decimal with an explicit sign, round half
 * away from zero, exact zero without a decimal. The BFF already rounds
 * (S-P4-03 §B.4) — this keeps the display rule identical if a value slips
 * through unrounded. Never the integer R-PCT-ROUNDUP rule.
 */
export function formatHistoricalPct(pct: number): string {
  const magnitude = Math.round(Math.abs(pct) * 10) / 10;
  if (magnitude === 0) return '0%';
  return `${pct < 0 ? '-' : '+'}${magnitude.toFixed(1)}%`;
}

/** A change cell is a pill only when it carries a finite number; anything else is "N/A". */
export function isRenderableChange(delta: DeltaVM | null | undefined): delta is DeltaVM {
  if (!delta) return false;
  if (delta.pct !== undefined) return Number.isFinite(delta.pct);
  return formatDelta(delta) !== '';
}

export function formatHistoricalChange(delta: DeltaVM): string {
  return delta.pct !== undefined ? formatHistoricalPct(delta.pct) : formatDelta(delta);
}

/** Mobile-card value: MONEY without the currency prefix (Figma), "-" when the month has no value. The desktop table keeps the prefix via `formatScalar`. */
export function formatHistoricalValue(value: MetricScalar | null | undefined): string {
  if (!value) return NO_VALUE;
  return value.kind === 'MONEY' ? formatMoneyPlain(value.amount) : formatScalar(value);
}

type ChangeBasis = DeltaVM['comparisonBasis'];

/**
 * Caption beside a change pill on a month card: "vs last month" (Current Year, month-over-month per Jira AC7 —
 * January against the previous December) · "vs 2025" · "vs 2024" (Vs Last Year / Vs Last 2 Years, the same month
 * of that year). A basis the UI does not know gets no caption, never a wrong one.
 */
export function changeCaption(basis: ChangeBasis, anchorYear: number): string {
  switch (basis) {
    case 'LAST_MONTH': return t('insights.historicalData.card.vsLastMonth');
    case 'LAST_YEAR': return t('insights.historicalData.card.vsYear', { year: anchorYear - 1 });
    case 'LAST_2_YEARS': return t('insights.historicalData.card.vsYear', { year: anchorYear - 2 });
    default: return '';
  }
}

/** Desktop column header: "MoM % Change" · "% Change vs LY" · "% Change vs L2Y" (Figma desktop — not year-specific). */
export function changeHeader(basis: ChangeBasis): string {
  switch (basis) {
    case 'LAST_MONTH': return t('insights.history.momPctChange');
    case 'LAST_YEAR': return t('insights.historicalData.column.change.LAST_YEAR');
    case 'LAST_2_YEARS': return t('insights.historicalData.column.change.LAST_2_YEARS');
    default: return '';
  }
}

/**
 * How a Total-row change cell renders (AC-P4-03-32): a month-over-month change of a total is undefined, so a
 * LAST_MONTH column stays EMPTY whatever the VM carries (it is always null there, and never reads "N/A");
 * any other column is a toned value, or "N/A" when the BFF sent null.
 */
export function totalChangeCell(basis: ChangeBasis, delta: DeltaVM | null | undefined): 'empty' | 'na' | 'value' {
  if (basis === 'LAST_MONTH') return 'empty';
  return isRenderableChange(delta) ? 'value' : 'na';
}

/** What the grid components render — a `HistoricalDataVM` or a placeholder with the same shape. */
export type HistoricalGrid = Pick<HistoricalDataVM, 'anchorYear' | 'years' | 'changeColumns' | 'rows' | 'totals'>;

/** Column model of each comparison (VM contract); used to keep the frame intact when no VM is available. */
export function columnModel(comparison: HistoricalComparison, anchorYear: number): Pick<HistoricalGrid, 'years' | 'changeColumns'> {
  switch (comparison) {
    case 'VS_LAST_YEAR':
      return { years: [anchorYear, anchorYear - 1], changeColumns: [{ basis: 'LAST_YEAR' }] };
    case 'VS_LAST_2_YEARS':
      return {
        years: [anchorYear, anchorYear - 1, anchorYear - 2],
        changeColumns: [{ basis: 'LAST_YEAR' }, { basis: 'LAST_2_YEARS' }],
      };
    default:
      return { years: [anchorYear], changeColumns: [{ basis: 'LAST_MONTH' }] };
  }
}

/** Twelve empty months ("-" / "N/A" everywhere) for the error frame and the skeleton. */
export function placeholderGrid(comparison: HistoricalComparison, anchorYear: number): HistoricalGrid {
  const { years, changeColumns } = columnModel(comparison, anchorYear);
  const rows: HistoricalDataRowVM[] = Array.from({ length: 12 }, (_, i) => ({
    month: i + 1,
    values: years.map(() => null),
    changes: changeColumns.map(() => null),
  }));
  return { anchorYear, years, changeColumns, rows };
}

/** Defensive check on the BFF body: a payload without the grid is treated as a failed load, not rendered half-way. */
export function isHistoricalDataVM(body: unknown): body is HistoricalDataVM {
  if (!body || typeof body !== 'object') return false;
  const vm = body as Partial<HistoricalDataVM>;
  return Array.isArray(vm.rows) && Array.isArray(vm.years) && Array.isArray(vm.changeColumns)
    && typeof vm.anchorYear === 'number' && !!vm.selection && !!vm.filter
    && Array.isArray(vm.filter.metrics) && Array.isArray(vm.filter.comparisons);
}

/**
 * The dashboard's "Historical Data" row opens the one Historical Data page. The
 * BFF config nav is only `insights/history`, so the row has to carry the
 * dashboard's scope (SELF or TEAM) and `businessLine` — plus `teamView`, TEAM
 * only. Params the BFF already supplies win. Every other action is returned
 * untouched.
 */
export function withHistoricalNav(
  actions: MoreActionVM[],
  filters: Pick<DashboardFiltersVM, 'scope' | 'businessLine' | 'teamView'>,
): MoreActionVM[] {
  const lens: Record<string, string> = { scope: filters.scope, businessLine: filters.businessLine };
  if (filters.scope === 'TEAM' && filters.teamView) lens.teamView = filters.teamView;
  return actions.map((action) =>
    action.id === 'HISTORICAL_DATA' && action.nav.route === 'insights/history'
      ? { ...action, nav: { ...action.nav, params: { ...lens, ...action.nav.params } } }
      : action,
  );
}
