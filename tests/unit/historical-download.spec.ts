import { expect, test } from '@playwright/test';
import {
  ALL_METRICS_CONCURRENCY, MIN_PASSWORD_LENGTH, allMetricQueries, buildPdfModel, buildPdfSection, downloadFileName,
  formatPdfDate, mapLimit, pageLabel, pdfComparisonLabel, validateDownloadPassword,
} from '@/lib/historical-download';
import { historicalVm, emptyHistoricalVm } from '../support/historical-data';

/** 2026-10-01, local time (the file name stamps the user's own date). */
const NOW = new Date(2026, 9, 1, 14, 30);

test.describe('Download — password rule (AC-P4-03-36, AC-P4-03-39)', () => {
  test('required, at least 6 characters, counted as characters; never trimmed or altered', () => {
    expect(MIN_PASSWORD_LENGTH).toBe(6);
    expect(validateDownloadPassword('')).toEqual({ ok: false, error: 'TOO_SHORT' });
    expect(validateDownloadPassword('abcde')).toEqual({ ok: false, error: 'TOO_SHORT' });
    expect(validateDownloadPassword('abcdef')).toEqual({ ok: true });
    expect(validateDownloadPassword('      ')).toEqual({ ok: true }); // six spaces are six characters: the rule is a length, not a content check
    expect(validateDownloadPassword('pässwörd')).toEqual({ ok: true });
    expect(validateDownloadPassword('😀😀😀😀😀')).toEqual({ ok: false, error: 'TOO_SHORT' }); // 5 code points although 10 UTF-16 units
    expect(validateDownloadPassword('😀😀😀😀😀😀')).toEqual({ ok: true });
  });
});

test.describe('Download — file name (AC-P4-03-37)', () => {
  test('historical-data-{selected|all-metrics}-{comparison}-{YYYYMMDD}.pdf, lower-case', () => {
    expect(downloadFileName('SELECTED', 'CURRENT_YEAR', NOW)).toBe('historical-data-selected-current-year-20261001.pdf');
    expect(downloadFileName('SELECTED', 'VS_LAST_YEAR', NOW)).toBe('historical-data-selected-vs-last-year-20261001.pdf');
    expect(downloadFileName('ALL', 'VS_LAST_2_YEARS', NOW)).toBe('historical-data-all-metrics-vs-last-2-years-20261001.pdf');
  });

  test('zero-pads the date and carries nothing but mode, comparison and date (no metric, amount, agent)', () => {
    const name = downloadFileName('ALL', 'CURRENT_YEAR', new Date(2027, 0, 5));
    expect(name).toBe('historical-data-all-metrics-current-year-20270105.pdf');
    for (const mode of ['SELECTED', 'ALL'] as const) {
      for (const comparison of ['CURRENT_YEAR', 'VS_LAST_YEAR', 'VS_LAST_2_YEARS'] as const) {
        expect(downloadFileName(mode, comparison, NOW)).toMatch(/^historical-data-(selected|all-metrics)-[a-z0-9-]+-\d{8}\.pdf$/);
      }
    }
  });
});

test.describe('Download — All Metrics request plan (AC-P4-03-37)', () => {
  test('TEAM: one query per filter metric, in order, for the applied comparison, with scope + teamView + businessLine', () => {
    const vm = historicalVm({ scope: 'TEAM', comparison: 'VS_LAST_YEAR' });
    const queries = allMetricQueries(vm.filter.metrics, { businessLine: 'TAKAFUL', teamView: 'GROUP' }, 'VS_LAST_YEAR', 'TEAM');
    expect(queries).toHaveLength(8);
    expect(queries.map((q) => `${q.get('metricCode')}|${q.get('variant') ?? ''}`)).toEqual([
      'TPC|WITHOUT_REPRICING', 'TPC|WITH_REPRICING', 'CASE_COUNT|', 'MANPOWER|', 'ACTIVITY_RATIO|', 'PRODUCTIVITY|', 'AVERAGE_CASE_SIZE|', 'NEW_RECRUIT_CONTRACTED|',
    ]);
    for (const q of queries) {
      expect(q.get('scope')).toBe('TEAM');
      expect(q.get('comparison')).toBe('VS_LAST_YEAR');
      expect(q.get('businessLine')).toBe('TAKAFUL');
      expect(q.get('teamView')).toBe('GROUP');
    }
  });

  test('SELF: the five self metrics, scope=SELF, never teamView; a variant only on TPC', () => {
    const vm = historicalVm({ scope: 'SELF' });
    const queries = allMetricQueries(vm.filter.metrics, { businessLine: 'ALL', teamView: 'GROUP' }, 'CURRENT_YEAR', 'SELF');
    expect(queries.map((q) => `${q.get('metricCode')}|${q.get('variant') ?? ''}`)).toEqual([
      'TPC|WITHOUT_REPRICING', 'TPC|WITH_REPRICING', 'CASE_COUNT|', 'FYP|', 'FYC|',
    ]);
    for (const q of queries) {
      expect(q.get('scope')).toBe('SELF');
      expect(q.has('teamView')).toBe(false);
    }
  });
});

test.describe('Download — bounded parallelism (AC-P4-03-37)', () => {
  test('never more than `limit` in flight, results keep input order', async () => {
    let inFlight = 0;
    let peak = 0;
    const results = await mapLimit([5, 1, 4, 2, 3, 6, 7, 8], ALL_METRICS_CONCURRENCY, async (n) => {
      inFlight++;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, n * 3));
      inFlight--;
      return n * 10;
    });
    expect(results).toEqual([50, 10, 40, 20, 30, 60, 70, 80]);
    expect(peak).toBe(3);
  });

  test('the first failure rejects the whole run and stops starting new work', async () => {
    const started: number[] = [];
    await expect(mapLimit([1, 2, 3, 4, 5, 6, 7, 8], 3, async (n) => {
      started.push(n);
      await new Promise((resolve) => setTimeout(resolve, 5));
      if (n === 2) throw new Error('boom');
      return n;
    })).rejects.toThrow('boom');
    expect(started.length).toBeLessThan(8);
  });

  test('empty input and a limit larger than the list are fine', async () => {
    expect(await mapLimit([], 3, async (n: number) => n)).toEqual([]);
    expect(await mapLimit([1, 2], 10, async (n) => n + 1)).toEqual([2, 3]);
  });
});

test.describe('Download — PDF section model matches the desktop table (AC-P4-03-37)', () => {
  test('Vs Last 2 Years: headers, "RM" values, signs, "-" and "N/A", and the Total row', () => {
    const section = buildPdfSection(historicalVm({ comparison: 'VS_LAST_2_YEARS' }));
    expect(section.metricLabel).toBe('TPC without Repricing');
    expect(section.headers).toEqual(['Month', '2026', '2025', '2024', '% Change vs LY', '% Change vs L2Y']);
    expect(section.rows).toHaveLength(12);
    expect(section.rows[0]!.map((c) => c.text)).toEqual(['Jan', 'RM 25,246', 'RM 24,890', 'RM 34,900', '+1.4%', '-27.7%']);
    expect(section.rows[0]!.map((c) => c.tone)).toEqual([undefined, undefined, undefined, undefined, 'success', 'danger']);
    expect(section.rows[9]!.map((c) => c.text)).toEqual(['Oct', '-', 'RM 32,400', 'RM 34,900', 'N/A', 'N/A']);
    expect(section.rows[9]![4]!.tone).toBe('muted');
    expect(section.total!.map((c) => c.text)).toEqual(['Total', 'RM 270,116', 'RM 255,330', 'RM 314,100', '+5.8%', '-14.0%']);
  });

  test('Current Year: "MoM % Change" header, and the Total row leaves the MoM cell empty (not "N/A")', () => {
    const section = buildPdfSection(historicalVm({ comparison: 'CURRENT_YEAR' }));
    expect(section.headers).toEqual(['Month', '2026', 'MoM % Change']);
    expect(section.rows[0]!.map((c) => c.text)).toEqual(['Jan', 'RM 25,246', '-30.5%']);
    expect(section.rows[1]!.map((c) => c.text)).toEqual(['Feb', 'RM 27,120', '+7.4%']);
    expect(section.total!.map((c) => c.text)).toEqual(['Total', 'RM 270,116', '']);
  });

  test('a metric without totals has no Total row; non-money values keep their own format (no RM)', () => {
    const manpower = buildPdfSection(historicalVm({ metricCode: 'MANPOWER', kind: 'COUNT', comparison: 'VS_LAST_YEAR' }));
    expect(manpower.metricLabel).toBe('Manpower (M)');
    expect(manpower.total).toBeUndefined();
    expect(manpower.headers).toEqual(['Month', '2026', '2025', '% Change vs LY']);
    expect(manpower.rows[0]!.map((c) => c.text)[1]).toBe('25,246');
  });

  test('EMPTY keeps all 12 rows with "-" and "N/A"; a null total change reads "N/A" in a year column', () => {
    const section = buildPdfSection(emptyHistoricalVm({ comparison: 'VS_LAST_YEAR' }));
    expect(section.rows).toHaveLength(12);
    expect(section.rows.every((r) => r.slice(1, 3).every((c) => c.text === '-') && r[3]!.text === 'N/A')).toBe(true);
    expect(section.total!.map((c) => c.text)).toEqual(['Total', '-', '-', 'N/A']);
  });
});

test.describe('Download — document header and labels (AC-P4-03-37)', () => {
  test('Team document: scope, business line, comparison context, As of, Generated on, one section', () => {
    const vm = historicalVm({ scope: 'TEAM', comparison: 'VS_LAST_YEAR' });
    const model = buildPdfModel([vm], 'TEAM', 'VS_LAST_YEAR', NOW);
    expect(model.title).toBe('Historical Data');
    expect(model.scopeLabel).toBe('Team');
    expect(model.businessLineLabel).toBe('Insurance');
    expect(model.comparisonLabel).toBe('Current Year vs Last Year');
    expect(model.captions).toEqual({ businessLine: 'Business line', metric: 'Metric', comparison: 'Comparison' });
    expect(model.asOf).toBe('As of 03/09/2026');
    expect(model.generatedOn).toBe('Generated on 01/10/2026');
    expect(model.sections).toHaveLength(1);
  });

  test('Self document is "Personal"; All Metrics = one section per VM in order; As of is the newest watermark', () => {
    const vms = [historicalVm({ scope: 'SELF', metricCode: 'FYP', asOfDate: '2026-08-31' }), historicalVm({ scope: 'SELF', metricCode: 'FYC', asOfDate: '2026-09-03' })];
    const model = buildPdfModel(vms, 'SELF', 'CURRENT_YEAR', NOW);
    expect(model.scopeLabel).toBe('Personal');
    expect(model.sections.map((s) => s.metricLabel)).toEqual(['FYP', 'FYC']);
    expect(model.asOf).toBe('As of 03/09/2026');
  });

  test('comparison context, dates and the page footer', () => {
    expect(pdfComparisonLabel('CURRENT_YEAR')).toBe('Current Year');
    expect(pdfComparisonLabel('VS_LAST_YEAR')).toBe('Current Year vs Last Year');
    expect(pdfComparisonLabel('VS_LAST_2_YEARS')).toBe('Current Year vs Last 2 Years');
    expect(formatPdfDate('2026-09-03')).toBe('03/09/2026');
    expect(pageLabel(2, 5)).toBe('Page 2 of 5');
  });

  test('the model carries no agent identifier: only labels, headers and formatted cells', () => {
    const json = JSON.stringify(buildPdfModel([historicalVm()], 'TEAM', 'CURRENT_YEAR', NOW));
    expect(json).not.toMatch(/agent|traceId|x-persona|password/i);
  });
});
