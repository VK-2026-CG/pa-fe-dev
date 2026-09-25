import type { MetricScalar, DeltaVM } from '@spec/performance-vm';
import { t } from './i18n';

/** Group an integer digit string with commas (no float math on money — D-04). */
function group(intPart: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

const CURRENCY_PREFIX: Record<string, string> = { MYR: 'RM' };

/** "100000.00" MYR → "RM 100,000" · "33495.70" → "RM 33,495.70". String-based, never parseFloat. */
export function formatMoney(amount: string, currency: string): string {
  const neg = amount.startsWith('-');
  const [i = '0', f = ''] = (neg ? amount.slice(1) : amount).split('.');
  const cents = (f + '00').slice(0, 2);
  const frac = cents === '00' ? '' : cents;      // "RM 100,000" but "RM 33,495.70"
  const prefix = CURRENCY_PREFIX[currency] ?? `${currency} `;
  return `${neg ? '-' : ''}${prefix} ${group(i)}${frac ? `.${frac}` : ''}`.replace(`${prefix}  `, `${prefix} `);
}
export function formatCount(value: number): string { return group(String(Math.trunc(value))); }

/**
 * Compact abbreviation for MONEY/COUNT card values (S-P4-01 v1.5.9,
 * `MetricCardVM.valueDisplay='COMPACT'`, widget-contracts.md §2): below 1,000
 * renders the plain integer; 1,000+ → "{n}K"; 1,000,000+ → "{n}M". One
 * decimal place, half-up rounding, trailing ".0" dropped. No currency prefix.
 */
function formatCompactNumber(value: number): string {
  const neg = value < 0;
  const abs = Math.abs(value);
  const round1 = (n: number) => (Math.round(n * 10) / 10).toString().replace(/\.0$/, '');
  const compact = abs >= 1_000_000
    ? `${round1(abs / 1_000_000)}M`
    : abs >= 1_000
      ? `${round1(abs / 1_000)}K`
      : group(String(Math.trunc(abs)));
  return `${neg ? '-' : ''}${compact}`;
}

/** "100000.00" → "980K" (compact mode) — string parsed once, no currency prefix. */
export function formatMoneyCompact(amount: string): string {
  return formatCompactNumber(Number(amount));
}
/** "24690.00" → "24,690" · "4250.70" → "4,250.70": `formatMoney` without the currency prefix. */
export function formatMoneyPlain(amount: string): string {
  const neg = amount.startsWith('-');
  const [i = '0', f = ''] = (neg ? amount.slice(1) : amount).split('.');
  const cents = (f + '00').slice(0, 2);
  return `${neg ? '-' : ''}${group(i)}${cents === '00' ? '' : `.${cents}`}`;
}

/**
 * Metric Detail money display (S-P4-02 v1.17.0/v1.18.0, widget-contracts §2
 * `R-MONEY-COMPACT`). For these metrics only, every MONEY value renders
 * compact with no currency prefix (AC-P4-02-54), except breakdown product
 * rows, which render the plain value (AC-P4-02-55). No VM field carries this
 * choice, so it is keyed on `context.metricCode`.
 */
const COMPACT_MONEY_DETAIL_METRICS: ReadonlySet<string> = new Set(['TPC', 'PTPC', 'FYC', 'FYP', 'AVERAGE_CASE_SIZE']);

/** `role: 'row'` = a breakdown product row; `'value'` = every other detail value, incl. the breakdown Total. */
export function formatDetailScalar(
  v: MetricScalar | null | undefined, metricCode: string | undefined, role: 'value' | 'row' = 'value',
): string {
  if (!v || v.kind !== 'MONEY' || !metricCode || !COMPACT_MONEY_DETAIL_METRICS.has(metricCode)) return formatScalar(v);
  return role === 'row' ? formatMoneyPlain(v.amount) : formatMoneyCompact(v.amount);
}

export function formatPercent(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}%`;
}
export function formatDecimal(value: number, precision = 1): string { return value.toFixed(precision); }
export function formatPp(pp: number): string { return `${pp > 0 ? '+' : ''}${pp}pp`; }
export function formatPct(pct: number): string { return `${pct > 0 ? '+' : ''}${pct}%`; }

/** Placeholder for a value the pipeline has not supplied — matches the table cells' existing convention. */
export const NO_VALUE = '-';

/**
 * Accepts a missing scalar because a metric can now be sourced-but-unpopulated
 * (`dataState` PROCESSING/EMPTY), rather than throwing on `.kind` at every call site.
 */
export function formatScalar(v: MetricScalar | null | undefined, compact = false): string {
  if (!v) return NO_VALUE;
  switch (v.kind) {
    case 'MONEY': return compact ? formatMoneyCompact(v.amount) : formatMoney(v.amount, v.currency);
    case 'COUNT': return compact ? formatCompactNumber(v.value) : formatCount(v.value);
    case 'PERCENT': return formatPercent(v.value);
    case 'DECIMAL': return formatDecimal(v.value, v.precision ?? 1);
  }
}

/** Signed absolute delta per scalar kind: "+RM 20,000" / "+7" / "+0.4" / "+2pp". */
export function formatAbs(v: MetricScalar): string {
  const sign = (n: number) => (n > 0 ? '+' : '');
  switch (v.kind) {
    case 'MONEY': return `${v.amount.startsWith('-') ? '' : '+'}${formatMoney(v.amount, v.currency)}`;
    case 'COUNT': return `${sign(v.value)}${formatCount(v.value)}`;
    case 'PERCENT': return formatPp(v.value);
    case 'DECIMAL': return `${sign(v.value)}${formatDecimal(v.value, v.precision ?? 1)}`;
  }
}

/** Render a delta badge per DeltaVM.display (D-10) — widgets never infer units. */
export function formatDelta(d: DeltaVM): string {
  if (d.display === 'PP' && d.pp !== undefined) return formatPp(d.pp);
  if (d.display === 'ABS' && d.abs !== undefined) return formatAbs(d.abs);
  if (d.pct !== undefined) return formatPct(d.pct);
  if (d.pp !== undefined) return formatPp(d.pp);
  if (d.abs !== undefined) return formatAbs(d.abs);
  return '';
}

/**
 * MoM column header key — follows the deltas' `display`, never the value type
 * (widget-contracts §2, AC-P4-03-13): PCT → "MoM % Change", PP/ABS → "MoM Delta".
 * All-null columns fall back to the pre-existing MONEY ⇒ PCT reading.
 */
export function momHeaderKey(momDeltas: Array<DeltaVM | null>, valueType: string): string {
  const display = momDeltas.find((d) => d != null)?.display;
  const pct = display ? display === 'PCT' : valueType === 'MONEY';
  return pct ? 'insights.history.momPctChange' : 'insights.history.momDelta';
}

export function toneFor(sentiment: DeltaVM['sentiment']): 'success' | 'danger' | 'muted' {
  return sentiment === 'POSITIVE' ? 'success' : sentiment === 'NEGATIVE' ? 'danger' : 'muted';
}
export function formatDateAsOf(iso: string): string {
  const [y = '', m = '', d = ''] = iso.split('-');
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return t('insights.detail.asOf', { date: `${Number(d)} ${months[Number(m)] ?? m} ${y}` });
}
export function formatShortDate(iso: string): string {
  const [y = '', m = '', d = ''] = iso.split('-');
  const months = ['', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${Number(d)} ${months[Number(m)] ?? m} ${y}`;
}
