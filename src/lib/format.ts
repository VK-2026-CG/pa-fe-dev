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
export function formatPercent(value: number): string {
  return `${Number.isInteger(value) ? value : value.toFixed(2).replace(/0+$/, '').replace(/\.$/, '')}%`;
}
export function formatDecimal(value: number, precision = 1): string { return value.toFixed(precision); }
export function formatPp(pp: number): string { return `${pp > 0 ? '+' : ''}${pp}pp`; }
export function formatPct(pct: number): string { return `${pct > 0 ? '+' : ''}${pct}%`; }

export function formatScalar(v: MetricScalar): string {
  switch (v.kind) {
    case 'MONEY': return formatMoney(v.amount, v.currency);
    case 'COUNT': return formatCount(v.value);
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
