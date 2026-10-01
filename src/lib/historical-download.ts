/**
 * Historical Data download (S-P4-03 §D, ARVIJ-1450-SP02) — the pure parts: file
 * name, password rule, the request plan for "All Metrics", the bounded-parallel
 * runner and the PDF content model (the desktop table's headers and formatting
 * as plain strings). No React, no fetching, no PDF library, so
 * `tests/unit/historical-download.spec.ts` can lock them without a browser.
 * The password is a parameter of the PDF call only — nothing here stores,
 * logs or transmits it.
 */
import type { HistoricalComparison, HistoricalDataVM, Scope } from '@spec/performance-vm';
import { formatScalar, toneFor } from './format';
import {
  changeHeader, formatHistoricalChange, historicalDataParams, historicalMetricLabel, isRenderableChange,
  totalChangeCell, type HistoricalQuery,
} from './historical-data';
import { t } from './i18n';

export type DownloadMode = 'SELECTED' | 'ALL';

/** D.1.2: "required, at least 6 characters". */
export const MIN_PASSWORD_LENGTH = 6;
/** The standard security handler uses at most 127 UTF-8 bytes of a password; the field stops well short of that. */
export const MAX_PASSWORD_LENGTH = 64;
/** Concurrent `historical-data` requests when downloading all metrics. */
export const ALL_METRICS_CONCURRENCY = 3;

export type PasswordCheck = { ok: true } | { ok: false; error: 'TOO_SHORT' };

/** Counts characters (code points), not UTF-16 units; the password is never trimmed or altered. */
export function validateDownloadPassword(password: string): PasswordCheck {
  return Array.from(password).length >= MIN_PASSWORD_LENGTH ? { ok: true } : { ok: false, error: 'TOO_SHORT' };
}

/**
 * `historical-data-{selected|all-metrics}-{comparison}-{YYYYMMDD}.pdf`, lower-case. Nothing else goes in the
 * name: no metric amounts, no agent code or name (D.1.5).
 */
export function downloadFileName(mode: DownloadMode, comparison: HistoricalComparison, now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}`;
  const scope = mode === 'ALL' ? 'all-metrics' : 'selected';
  return `historical-data-${scope}-${comparison.toLowerCase().replaceAll('_', '-')}-${stamp}.pdf`;
}

/** One `historical-data` query per metric/variant of the scope's filter list, in filter order, for the applied comparison. */
export function allMetricQueries(
  metrics: HistoricalDataVM['filter']['metrics'],
  query: HistoricalQuery,
  comparison: HistoricalComparison,
  scope: Scope,
): URLSearchParams[] {
  return metrics.map((m) => historicalDataParams(query, { metricCode: m.metricCode, variant: m.variant, comparison }, scope));
}

/** `fn` over `items` with at most `limit` in flight; results keep the input order; the first failure rejects and stops new work. */
export async function mapLimit<T, R>(items: readonly T[], limit: number, fn: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  let failed = false;
  const worker = async (): Promise<void> => {
    while (!failed && next < items.length) {
      const index = next++;
      try {
        results[index] = await fn(items[index] as T, index);
      } catch (error) {
        failed = true;
        throw error;
      }
    }
  };
  await Promise.all(Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, worker));
  return results;
}

/** A table cell of the PDF; `tone` colours a change value (success/danger/muted), absent for plain text. */
export interface PdfCell {
  text: string;
  tone?: 'success' | 'danger' | 'muted';
}

export interface PdfSection {
  metricLabel: string;
  /** Month · year value(s) · change column(s) — the desktop table's headers. */
  headers: string[];
  /** 12 rows, January first. */
  rows: PdfCell[][];
  /** The Total row, present only when the VM carries `totals`; empty text in a LAST_MONTH column. */
  total?: PdfCell[];
}

export interface PdfModel {
  title: string;
  scopeLabel: string;
  /** "Business line" / "Metric" / "Comparison" captions. */
  captions: { businessLine: string; metric: string; comparison: string };
  businessLineLabel: string;
  comparisonLabel: string;
  asOf: string;
  generatedOn: string;
  sections: PdfSection[];
}

/** 2026-09-03 → "03/09/2026" (the screen's As-of format). */
export function formatPdfDate(iso: string): string {
  const [y = '', m = '', d = ''] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

function localIsoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** "Current Year" · "Current Year vs Last Year" · "Current Year vs Last 2 Years" (D.1.5). */
export function pdfComparisonLabel(comparison: HistoricalComparison): string {
  return t(`insights.historicalData.pdf.context.${comparison}`);
}

export function pageLabel(n: number, total: number): string {
  return t('insights.historicalData.pdf.page', { n, total });
}

/**
 * One PDF section from a loaded VM: the same headers, "RM" values, signs, "-" and "N/A" as the desktop table,
 * plus the Total row where `totals` is present (the cell of a LAST_MONTH column left empty).
 */
export function buildPdfSection(vm: HistoricalDataVM): PdfSection {
  const changeCell = (delta: Parameters<typeof isRenderableChange>[0]): PdfCell => (isRenderableChange(delta)
    ? { text: formatHistoricalChange(delta), tone: toneFor(delta.sentiment) }
    : { text: t('insights.common.na'), tone: 'muted' });
  const section: PdfSection = {
    metricLabel: historicalMetricLabel(vm.selection.metricCode, vm.selection.variant),
    headers: [
      t('insights.history.month'),
      ...vm.years.map(String),
      ...vm.changeColumns.map((c) => changeHeader(c.basis)),
    ],
    rows: vm.rows.map((row) => [
      { text: t(`insights.month.${row.month}.short`) },
      ...vm.years.map((_, i) => ({ text: formatScalar(row.values[i]) })),
      ...vm.changeColumns.map((_, i) => changeCell(row.changes[i])),
    ]),
  };
  const totals = vm.totals;
  if (totals) {
    section.total = [
      { text: t('insights.historicalData.total') },
      ...vm.years.map((_, i) => ({ text: formatScalar(totals.values[i]) })),
      ...vm.changeColumns.map((column, i): PdfCell => {
        const kind = totalChangeCell(column.basis, totals.changes[i]);
        return kind === 'empty' ? { text: '' } : changeCell(kind === 'value' ? totals.changes[i] : null);
      }),
    ];
  }
  return section;
}

/**
 * The whole document model from the loaded VM(s). Header facts come from the first VM (they are the same for
 * every metric of one download); "As of" is the newest data watermark among them. No identifier of any agent
 * is read or written anywhere in the model.
 */
export function buildPdfModel(vms: readonly HistoricalDataVM[], scope: Scope, comparison: HistoricalComparison, now: Date): PdfModel {
  const first = vms[0];
  const asOf = vms.map((vm) => vm.meta.asOfDate).sort().at(-1) ?? localIsoDate(now);
  return {
    title: t('insights.historicalData.pdf.title'),
    scopeLabel: t(`insights.historicalData.pdf.scope.${scope}`),
    captions: {
      businessLine: t('insights.historicalData.pdf.businessLine'),
      metric: t('insights.historicalData.pdf.metric'),
      comparison: t('insights.historicalData.pdf.comparison'),
    },
    businessLineLabel: t(`insights.businessLine.${first?.context.businessLine ?? 'ALL'}`),
    comparisonLabel: pdfComparisonLabel(comparison),
    asOf: t('insights.historicalData.pdf.asOf', { date: formatPdfDate(asOf) }),
    generatedOn: t('insights.historicalData.pdf.generatedOn', { date: formatPdfDate(localIsoDate(now)) }),
    sections: vms.map(buildPdfSection),
  };
}
