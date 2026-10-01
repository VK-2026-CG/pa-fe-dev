import { expect, test } from '@playwright/test';
import type { DeltaVM, MoreActionVM } from '@spec/performance-vm';
import {
  applySelectionToQuery, changeCaption, changeHeader, columnModel, formatHistoricalChange, formatHistoricalPct,
  formatHistoricalValue, historicalComparisonLabel, historicalComparisonOptionLabel, historicalDataParams,
  historicalMetricLabel, isHistoricalDataVM, isRenderableChange, metricFromOptionId, metricOptionId,
  parseHistoricalScope, parseHistoricalSelection, placeholderGrid, sameSelection, totalChangeCell, withHistoricalNav,
} from '@/lib/historical-data';
import { historicalVm } from '../support/historical-data';

const delta = (over: Partial<DeltaVM>): DeltaVM => ({
  comparisonBasis: 'LAST_YEAR', direction: 'UP', sentiment: 'POSITIVE', display: 'PCT', ...over,
});

test.describe('Team Historical Data — % formatting (AC-P4-03-19)', () => {
  test('one decimal with an explicit sign; exact zero is "0%"', () => {
    expect(formatHistoricalPct(65)).toBe('+65.0%');
    expect(formatHistoricalPct(-70.2)).toBe('-70.2%');
    expect(formatHistoricalPct(5)).toBe('+5.0%');
    expect(formatHistoricalPct(0)).toBe('0%');
    expect(formatHistoricalPct(-0)).toBe('0%');
  });

  test('rounds half away from zero, never to an integer (contract §2.6, not R-PCT-ROUNDUP)', () => {
    expect(formatHistoricalPct(12.34)).toBe('+12.3%');
    expect(formatHistoricalPct(12.36)).toBe('+12.4%');
    expect(formatHistoricalPct(-12.36)).toBe('-12.4%');
    expect(formatHistoricalPct(0.04)).toBe('0%');
    expect(formatHistoricalPct(-0.04)).toBe('0%');
    expect(formatHistoricalPct(100)).toBe('+100.0%');
  });

  test('a change cell without a finite pct is "N/A" (AC-P4-03-25)', () => {
    expect(isRenderableChange(null)).toBe(false);
    expect(isRenderableChange(undefined)).toBe(false);
    expect(isRenderableChange(delta({ pct: Number.NaN }))).toBe(false);
    expect(isRenderableChange(delta({ pct: Number.POSITIVE_INFINITY }))).toBe(false);
    expect(isRenderableChange(delta({ pct: 5 }))).toBe(true);
    expect(isRenderableChange(delta({ pct: 0 }))).toBe(true);
    expect(formatHistoricalChange(delta({ pct: -70.2 }))).toBe('-70.2%');
  });
});

test.describe('Team Historical Data — cell values (AC-P4-03-19, AC-P4-03-25)', () => {
  test('MONEY drops the currency prefix and keeps grouping; null is "-"', () => {
    expect(formatHistoricalValue({ kind: 'MONEY', amount: '25246.00', currency: 'MYR' })).toBe('25,246');
    expect(formatHistoricalValue({ kind: 'MONEY', amount: '1234567.00', currency: 'MYR' })).toBe('1,234,567');
    expect(formatHistoricalValue({ kind: 'MONEY', amount: '4250.70', currency: 'MYR' })).toBe('4,250.70');
    expect(formatHistoricalValue(null)).toBe('-');
    expect(formatHistoricalValue(undefined)).toBe('-');
  });

  test('other scalar kinds use the shared formatter', () => {
    expect(formatHistoricalValue({ kind: 'COUNT', value: 1240 })).toBe('1,240');
    expect(formatHistoricalValue({ kind: 'PERCENT', value: 78 })).toBe('78%');
    expect(formatHistoricalValue({ kind: 'DECIMAL', value: 9.7, precision: 1 })).toBe('9.7');
  });
});

test.describe('Team Historical Data — captions and headers derive from anchorYear + basis (AC-P4-03-20..22)', () => {
  test('captions: "vs last month" (Current Year, MoM), "vs {A-1}" / "vs {A-2}" (the same month of that year)', () => {
    expect(changeCaption('LAST_MONTH', 2026)).toBe('vs last month');
    expect(changeCaption('LAST_YEAR', 2026)).toBe('vs 2025');
    expect(changeCaption('LAST_2_YEARS', 2026)).toBe('vs 2024');
    // an unknown basis gets no caption and cannot crash
    expect(changeCaption('SOMETHING_NEW' as DeltaVM['comparisonBasis'], 2026)).toBe('');
  });

  test('desktop headers: "MoM % Change" (Current Year), "% Change vs LY" / "% Change vs L2Y" (not year-specific)', () => {
    expect(changeHeader('LAST_MONTH')).toBe('MoM % Change');
    expect(changeHeader('LAST_YEAR')).toBe('% Change vs LY');
    expect(changeHeader('LAST_2_YEARS')).toBe('% Change vs L2Y');
    expect(changeHeader('SOMETHING_NEW' as DeltaVM['comparisonBasis'])).toBe('');
  });

  test('column model of the three comparisons', () => {
    expect(columnModel('CURRENT_YEAR', 2026)).toEqual({ years: [2026], changeColumns: [{ basis: 'LAST_MONTH' }] });
    expect(columnModel('VS_LAST_YEAR', 2026)).toEqual({ years: [2026, 2025], changeColumns: [{ basis: 'LAST_YEAR' }] });
    expect(columnModel('VS_LAST_2_YEARS', 2026)).toEqual({
      years: [2026, 2025, 2024], changeColumns: [{ basis: 'LAST_YEAR' }, { basis: 'LAST_2_YEARS' }],
    });
  });

  test('placeholder grid keeps the 12-month frame with empty cells (AC-P4-03-26/27)', () => {
    const grid = placeholderGrid('VS_LAST_2_YEARS', 2026);
    expect(grid.rows).toHaveLength(12);
    expect(grid.rows.map((r) => r.month)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    for (const row of grid.rows) {
      expect(row.values).toEqual([null, null, null]);
      expect(row.changes).toEqual([null, null]);
    }
  });
});

test.describe('Team Historical Data — Total row (AC-P4-03-32)', () => {
  test('the placeholder frame and a payload without totals carry no Total row', () => {
    expect(placeholderGrid('VS_LAST_2_YEARS', 2026).totals).toBeUndefined();
    expect(historicalVm({ metricCode: 'MANPOWER' }).totals).toBeUndefined();
    expect(isHistoricalDataVM(historicalVm({ metricCode: 'MANPOWER' }))).toBe(true);
    expect(isHistoricalDataVM(historicalVm({ metricCode: 'CASE_COUNT', kind: 'COUNT' }))).toBe(true);
  });

  test('Current Year fixture: one value column, month-over-month rows (January vs the previous December), null total change', () => {
    const vm = historicalVm({ comparison: 'CURRENT_YEAR' });
    expect(vm.years).toEqual([2026]);
    expect(vm.changeColumns).toEqual([{ basis: 'LAST_MONTH' }]);
    expect(vm.rows[0]!.changes[0]).toMatchObject({ comparisonBasis: 'LAST_MONTH', pct: -30.5 }); // Jan 2026 vs Dec 2025
    expect(vm.rows[1]!.changes[0]).toMatchObject({ comparisonBasis: 'LAST_MONTH', pct: 7.4 }); // Feb vs Jan
    expect(vm.totals!.changes).toEqual([null]);
  });
});

test.describe('Team Historical Data — Total row cells (AC-P4-03-32)', () => {
  test('a LAST_MONTH column is always empty (never "N/A"); other columns are a value or "N/A"', () => {
    expect(totalChangeCell('LAST_MONTH', null)).toBe('empty');
    expect(totalChangeCell('LAST_MONTH', delta({ pct: 3, comparisonBasis: 'LAST_MONTH' }))).toBe('empty'); // never rendered, even if sent
    expect(totalChangeCell('LAST_YEAR', delta({ pct: 10.5 }))).toBe('value');
    expect(totalChangeCell('LAST_YEAR', delta({ pct: 0, direction: 'FLAT', sentiment: 'NEUTRAL' }))).toBe('value');
    expect(totalChangeCell('LAST_2_YEARS', null)).toBe('na');
    expect(totalChangeCell('LAST_2_YEARS', undefined)).toBe('na');
    expect(totalChangeCell('LAST_YEAR', delta({ pct: Number.NaN }))).toBe('na');
  });
});

test.describe('Team Historical Data — selection ⇄ URL (AC-P4-03-16/17/18/23)', () => {
  test('defaults to TPC without Repricing + Current Year (AC4)', () => {
    expect(parseHistoricalSelection({})).toEqual({ metricCode: 'TPC', variant: 'WITHOUT_REPRICING', comparison: 'CURRENT_YEAR' });
  });

  test('keeps a valid selection and drops what the BFF would reject', () => {
    expect(parseHistoricalSelection({ metricCode: 'TPC', variant: 'WITH_REPRICING', comparison: 'VS_LAST_YEAR' }))
      .toEqual({ metricCode: 'TPC', variant: 'WITH_REPRICING', comparison: 'VS_LAST_YEAR' });
    // a variant on any other metric is a 400, so it is never sent
    expect(parseHistoricalSelection({ metricCode: 'CASE_COUNT', variant: 'WITH_REPRICING', comparison: 'VS_LAST_2_YEARS' }))
      .toEqual({ metricCode: 'CASE_COUNT', comparison: 'VS_LAST_2_YEARS' });
    // unknown comparison / variant fall back to the defaults instead of becoming a 400
    expect(parseHistoricalSelection({ comparison: 'LAST_DECADE', variant: 'NOPE' }))
      .toEqual({ metricCode: 'TPC', variant: 'WITHOUT_REPRICING', comparison: 'CURRENT_YEAR' });
    expect(parseHistoricalSelection({ metricCode: '  ' }).metricCode).toBe('TPC');
  });

  test('scope is TEAM only when the URL says so; no param (or junk) is SELF (AC-P4-03-33)', () => {
    expect(parseHistoricalScope({})).toBe('SELF');
    expect(parseHistoricalScope({ scope: 'SELF' })).toBe('SELF');
    expect(parseHistoricalScope({ scope: 'TEAM' })).toBe('TEAM');
    expect(parseHistoricalScope({ scope: 'GROUP' })).toBe('SELF');
    expect(parseHistoricalScope({ scope: 'team' })).toBe('SELF');
  });

  test('TEAM request carries scope=TEAM and the dashboard lens (businessLine, teamView) only', () => {
    const sel = parseHistoricalSelection({ metricCode: 'MANPOWER', comparison: 'VS_LAST_YEAR' });
    const params = historicalDataParams({ scope: 'TEAM', businessLine: 'TAKAFUL', teamView: 'GROUP', window: 'CURRENT_YEAR', agentId: 'X1' }, sel, 'TEAM');
    expect(Object.fromEntries(params)).toEqual({
      scope: 'TEAM', metricCode: 'MANPOWER', comparison: 'VS_LAST_YEAR', businessLine: 'TAKAFUL', teamView: 'GROUP',
    });
    expect(historicalDataParams({ scope: 'TEAM' }, parseHistoricalSelection({})).toString())
      .toBe('scope=TEAM&metricCode=TPC&variant=WITHOUT_REPRICING&comparison=CURRENT_YEAR');
  });

  test('SELF request carries scope=SELF and businessLine, never teamView (AC-P4-03-33)', () => {
    const sel = parseHistoricalSelection({ metricCode: 'FYP', comparison: 'VS_LAST_2_YEARS' });
    const params = historicalDataParams({ businessLine: 'INSURANCE', teamView: 'GROUP', basis: 'STANDARD', agentId: 'X1' }, sel);
    expect(Object.fromEntries(params)).toEqual({
      scope: 'SELF', metricCode: 'FYP', comparison: 'VS_LAST_2_YEARS', businessLine: 'INSURANCE', basis: 'STANDARD',
    });
    expect(params.has('teamView')).toBe(false);
    expect(historicalDataParams({}, parseHistoricalSelection({})).toString())
      .toBe('scope=SELF&metricCode=TPC&variant=WITHOUT_REPRICING&comparison=CURRENT_YEAR');
  });

  test('Apply rewrites the selection and keeps scope + lens; variant disappears for non-TPC', () => {
    const current = new URLSearchParams('scope=TEAM&metricCode=TPC&variant=WITH_REPRICING&comparison=CURRENT_YEAR&businessLine=ALL&teamView=GROUP');
    const next = applySelectionToQuery(current, { metricCode: 'CASE_COUNT', comparison: 'VS_LAST_2_YEARS' });
    expect(Object.fromEntries(next)).toEqual({
      scope: 'TEAM', metricCode: 'CASE_COUNT', comparison: 'VS_LAST_2_YEARS', businessLine: 'ALL', teamView: 'GROUP',
    });
    expect(Object.fromEntries(applySelectionToQuery(next, { metricCode: 'TPC', variant: 'WITHOUT_REPRICING', comparison: 'CURRENT_YEAR' })))
      .toMatchObject({ metricCode: 'TPC', variant: 'WITHOUT_REPRICING', comparison: 'CURRENT_YEAR' });
    // SELF: a URL with no scope param becomes explicit scope=SELF, businessLine kept
    expect(Object.fromEntries(applySelectionToQuery(new URLSearchParams('metricCode=TPC&businessLine=INSURANCE'), { metricCode: 'FYC', comparison: 'VS_LAST_YEAR' })))
      .toEqual({ scope: 'SELF', metricCode: 'FYC', comparison: 'VS_LAST_YEAR', businessLine: 'INSURANCE' });
  });

  test('sameSelection compares metric, variant and comparison', () => {
    const a = { metricCode: 'TPC', variant: 'WITHOUT_REPRICING' as const, comparison: 'CURRENT_YEAR' as const };
    expect(sameSelection(a, { ...a })).toBe(true);
    expect(sameSelection(a, { ...a, variant: 'WITH_REPRICING' })).toBe(false);
    expect(sameSelection(a, { ...a, comparison: 'VS_LAST_YEAR' })).toBe(false);
  });

  test('metric radio ids round-trip', () => {
    expect(metricOptionId('TPC', 'WITH_REPRICING')).toBe('TPC|WITH_REPRICING');
    expect(metricOptionId('CASE_COUNT')).toBe('CASE_COUNT|');
    expect(metricFromOptionId('TPC|WITH_REPRICING')).toEqual({ metricCode: 'TPC', variant: 'WITH_REPRICING' });
    expect(metricFromOptionId('CASE_COUNT|')).toEqual({ metricCode: 'CASE_COUNT' });
  });
});

test.describe('Team Historical Data — copy comes from the bundle (AC-P4-03-16/17)', () => {
  test('metric labels, in Figma filter order', () => {
    const labels = [
      ['TPC', 'WITHOUT_REPRICING'], ['TPC', 'WITH_REPRICING'], ['CASE_COUNT'], ['MANPOWER'], ['ACTIVITY_RATIO'],
      ['PRODUCTIVITY'], ['AVERAGE_CASE_SIZE'], ['NEW_RECRUIT_CONTRACTED'],
    ].map(([code, variant]) => historicalMetricLabel(code!, variant as 'WITH_REPRICING' | undefined));
    expect(labels).toEqual([
      'TPC without Repricing', 'TPC with Repricing', 'Case Count', 'Manpower (M)', 'Activity Ratio (A)',
      'Productivity (P)', 'Average Case Size (A)', 'New Recruit Contracted',
    ]);
  });

  test('a metric the screen has no label for falls back to the dashboard title, then the code', () => {
    expect(historicalMetricLabel('PTPC')).toBe('PTPC');
    expect(historicalMetricLabel('UNKNOWN_METRIC')).toBe('UNKNOWN_METRIC');
  });

  test('chip vs sheet comparison labels', () => {
    expect(historicalComparisonLabel('CURRENT_YEAR')).toBe('Current Year');
    expect(historicalComparisonLabel('VS_LAST_YEAR')).toBe('vs Last Year');
    expect(historicalComparisonLabel('VS_LAST_2_YEARS')).toBe('vs Last 2 Years');
    expect(historicalComparisonOptionLabel('CURRENT_YEAR')).toBe('Current');
  });
});

test.describe('Team Historical Data — payload guard (AC-P4-03-26/27)', () => {
  test('accepts a contract-shaped VM and rejects a body without the grid', () => {
    expect(isHistoricalDataVM(historicalVm())).toBe(true);
    expect(isHistoricalDataVM(null)).toBe(false);
    expect(isHistoricalDataVM({})).toBe(false);
    expect(isHistoricalDataVM({ ...historicalVm(), rows: undefined })).toBe(false);
    expect(isHistoricalDataVM({ ...historicalVm(), filter: undefined })).toBe(false);
  });
});

test.describe('Dashboard → Historical Data entry (AC-P4-03-15, AC-P4-03-33)', () => {
  const actions: MoreActionVM[] = [
    { id: 'SET_GOALS', iconToken: 'icon.insights.flag', nav: { route: 'insights/set-goals' }, order: 1 },
    { id: 'HISTORICAL_DATA', iconToken: 'icon.insights.history', nav: { route: 'insights/history' }, order: 3 },
  ];

  test('TEAM adds scope + the dashboard lens (businessLine, teamView) to the history entry only', () => {
    const out = withHistoricalNav(actions, { scope: 'TEAM', businessLine: 'TAKAFUL', teamView: 'GROUP' });
    expect(out[0]).toBe(actions[0]);
    expect(out[1]!.nav).toEqual({ route: 'insights/history', params: { scope: 'TEAM', businessLine: 'TAKAFUL', teamView: 'GROUP' } });
  });

  test('SELF adds scope=SELF + businessLine and never teamView, even if the filters carry one', () => {
    const out = withHistoricalNav(actions, { scope: 'SELF', businessLine: 'ALL' });
    expect(out[0]).toBe(actions[0]);
    expect(out[1]!.nav).toEqual({ route: 'insights/history', params: { scope: 'SELF', businessLine: 'ALL' } });
    expect(withHistoricalNav(actions, { scope: 'SELF', businessLine: 'INSURANCE', teamView: 'DIRECT' })[1]!.nav.params)
      .toEqual({ scope: 'SELF', businessLine: 'INSURANCE' });
  });

  test('params the BFF already supplies win; other routes are untouched', () => {
    const withParams: MoreActionVM[] = [{ ...actions[1]!, nav: { route: 'insights/history', params: { scope: 'TEAM', teamView: 'DIRECT' } } }];
    expect(withHistoricalNav(withParams, { scope: 'TEAM', businessLine: 'ALL', teamView: 'GROUP' })[0]!.nav.params)
      .toEqual({ scope: 'TEAM', teamView: 'DIRECT', businessLine: 'ALL' });
    const other: MoreActionVM[] = [{ ...actions[1]!, nav: { route: 'insights/somewhere-else' } }];
    expect(withHistoricalNav(other, { scope: 'SELF', businessLine: 'ALL' })[0]).toBe(other[0]);
  });
});

test.describe('SELF Historical Data VM (AC-P4-03-33, AC-P4-03-34)', () => {
  test('the SELF fixture has the five self metrics, no teamView, and a Total row for every one of them', () => {
    const vm = historicalVm({ scope: 'SELF', comparison: 'VS_LAST_YEAR' });
    expect(vm.context.scope).toBe('SELF');
    expect('teamView' in vm.context).toBe(false);
    expect(vm.filter.metrics.map((m) => `${m.metricCode}${m.variant ? `|${m.variant}` : ''}`)).toEqual([
      'TPC|WITHOUT_REPRICING', 'TPC|WITH_REPRICING', 'CASE_COUNT', 'FYP', 'FYC',
    ]);
    for (const metricCode of ['TPC', 'CASE_COUNT', 'FYP', 'FYC']) {
      expect(historicalVm({ scope: 'SELF', metricCode }).totals, metricCode).toBeDefined();
    }
    expect(isHistoricalDataVM(vm)).toBe(true);
  });

  test('the five labels resolve from the bundle; FYP/FYC use the screen keys', () => {
    expect(historicalMetricLabel('FYP')).toBe('FYP');
    expect(historicalMetricLabel('FYC')).toBe('FYC');
    expect(historicalMetricLabel('CASE_COUNT')).toBe('Case Count');
  });
});
