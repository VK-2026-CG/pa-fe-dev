import { expect, test } from '@playwright/test';
import { formatAbs, formatDelta, formatDetailScalar, formatMoney, formatMoneyPlain, formatPercent, formatScalar, momHeaderKey } from '@/lib/format';
import { t } from '@/lib/i18n';
import { comparisonLabelKey } from '@/components/metrics';

test.describe('formatMoney (D-04: string-based, no parseFloat)', () => {
  test('groups and drops zero cents: "100000.00" → "RM 100,000"', () => {
    expect(formatMoney('100000.00', 'MYR')).toBe('RM 100,000');
  });
  test('keeps significant cents: "33495.70" → "RM 33,495.70" (AC-P4-06-04)', () => {
    expect(formatMoney('33495.70', 'MYR')).toBe('RM 33,495.70');
  });
  test('handles negatives and big ints beyond float precision', () => {
    expect(formatMoney('-1234.50', 'MYR')).toBe('-RM 1,234.50');
    expect(formatMoney('900719925474099312.00', 'MYR')).toBe('RM 900,719,925,474,099,312');
  });
});

test.describe('delta rendering follows DeltaVM.display (D-10 / AC-P4-01-18)', () => {
  const base = { comparisonBasis: 'LAST_YEAR', direction: 'UP', sentiment: 'POSITIVE' } as const;
  test('PCT → "+27%"', () => {
    expect(formatDelta({ ...base, display: 'PCT', pct: 27 })).toBe('+27%');
  });
  test('PP → "+2pp"', () => {
    expect(formatDelta({ ...base, display: 'PP', pp: 2 })).toBe('+2pp');
  });
  test('ABS money → "+RM 20,000"; count → "+7"; decimal → "+0.4"', () => {
    expect(formatDelta({ ...base, display: 'ABS', abs: { kind: 'MONEY', amount: '20000.00', currency: 'MYR' } })).toBe('+RM 20,000');
    expect(formatDelta({ ...base, display: 'ABS', abs: { kind: 'COUNT', value: 7 } })).toBe('+7');
    expect(formatDelta({ ...base, display: 'ABS', abs: { kind: 'DECIMAL', value: 0.4, precision: 1 } })).toBe('+0.4');
  });
  test('ACTIVITY_RATIO PCT delta renders the producer integer as-is: "+18%", never pp (AC-P4-02-48/49)', () => {
    expect(formatDelta({ ...base, display: 'PCT', pct: 18 })).toBe('+18%');
  });
  test('PRODUCTIVITY PCT delta renders "+5%" as-is even when a stale abs is present (AC-P4-02-50/51)', () => {
    expect(formatDelta({ ...base, display: 'PCT', pct: 5, abs: { kind: 'DECIMAL', value: 0.4, precision: 1 } })).toBe('+5%');
  });
  test('AVERAGE_CASE_SIZE PCT delta renders "+9%" as-is, never the stale "+RM 400" abs (AC-P4-02-52/53)', () => {
    expect(formatDelta({ ...base, display: 'PCT', pct: 9, abs: { kind: 'MONEY', amount: '400.00', currency: 'MYR' } })).toBe('+9%');
  });
});

test.describe('comparison label per metric (S-P4-02 A1)', () => {
  test('AVERAGE_CASE_SIZE uses "Average Case Size Change", not "Absolute Change" (AC-P4-02-52)', () => {
    const key = comparisonLabelKey('AVERAGE_CASE_SIZE', 'PCT');
    expect(key).toBe('insights.comparison.averageCaseSizeChange');
    expect(t(key)).toBe('Average Case Size Change');
  });
});

test.describe('MoM header follows DeltaVM.display, not valueType (AC-P4-03-13, AC-P4-02-48)', () => {
  const d = (display: 'PCT' | 'PP' | 'ABS') => ({ comparisonBasis: 'LAST_MONTH', direction: 'UP', sentiment: 'POSITIVE', display } as const);
  test('PERCENT metric with PCT deltas (ACTIVITY_RATIO) → momPctChange', () => {
    expect(momHeaderKey([null, d('PCT')], 'PERCENT')).toBe('insights.history.momPctChange');
  });
  test('PERCENT metric with PP deltas (persistency) → momDelta', () => {
    expect(momHeaderKey([null, d('PP')], 'PERCENT')).toBe('insights.history.momDelta');
  });
  test('all-null column falls back to MONEY ⇒ % change', () => {
    expect(momHeaderKey([null, null], 'MONEY')).toBe('insights.history.momPctChange');
    expect(momHeaderKey([null, null], 'PERCENT')).toBe('insights.history.momDelta');
  });
});

test.describe('scalars', () => {
  test('DECIMAL formats with precision, never a percent (AC-P4-02-14)', () => {
    expect(formatScalar({ kind: 'DECIMAL', value: 9.7, precision: 1 })).toBe('9.7');
  });
  test('PERCENT and formatAbs on PERCENT → pp', () => {
    expect(formatPercent(95)).toBe('95%');
    expect(formatAbs({ kind: 'PERCENT', value: 2 })).toBe('+2pp');
  });
});

test.describe('Metric Detail money display (S-P4-02 v1.17.0/v1.18.0)', () => {
  const money = (amount: string) => ({ kind: 'MONEY', amount, currency: 'MYR' }) as const;

  test('compact, no currency prefix for TPC/PTPC/FYC/FYP/AVERAGE_CASE_SIZE values incl. the breakdown Total (AC-P4-02-54)', () => {
    for (const code of ['TPC', 'PTPC', 'FYC', 'FYP', 'AVERAGE_CASE_SIZE']) {
      expect(formatDetailScalar(money('100000.00'), code)).toBe('100K');
    }
    expect(formatDetailScalar(money('78740.00'), 'TPC')).toBe('78.7K');
    expect(formatDetailScalar(money('80102.70'), 'TPC')).toBe('80.1K');
    expect(formatDetailScalar(money('5200.00'), 'AVERAGE_CASE_SIZE')).toBe('5.2K');
    expect(formatDetailScalar(money('1250000.00'), 'FYP')).toBe('1.3M');
    expect(formatDetailScalar(money('980.40'), 'FYC')).toBe('980');
  });

  test('breakdown product rows show the plain value: no prefix, no K/M, formatMoney cents rule (AC-P4-02-55)', () => {
    expect(formatMoneyPlain('24690.00')).toBe('24,690');
    expect(formatMoneyPlain('4250.70')).toBe('4,250.70');
    expect(formatMoneyPlain('-1234.50')).toBe('-1,234.50');
    expect(formatDetailScalar(money('15345.00'), 'TPC', 'row')).toBe('15,345');
    expect(formatDetailScalar(money('4250.70'), 'FYP', 'row')).toBe('4,250.70');
  });

  test('other metrics, non-MONEY scalars and a missing metric code are unchanged (AC-P4-02-54)', () => {
    expect(formatDetailScalar(money('100000.00'), 'APE')).toBe('RM 100,000');
    expect(formatDetailScalar(money('15345.00'), 'APE', 'row')).toBe('RM 15,345');
    expect(formatDetailScalar(money('100000.00'), undefined)).toBe('RM 100,000');
    expect(formatDetailScalar({ kind: 'COUNT', value: 6 }, 'TPC')).toBe('6');
    expect(formatDetailScalar({ kind: 'COUNT', value: 1200 }, 'TPC', 'row')).toBe('1,200');
    expect(formatDetailScalar(undefined, 'TPC')).toBe('-');
  });
});

test.describe('S-P4-07 compact formatting (D-P4-07-05)', () => {
  test('member TPC/PTPC compact without currency; KPI money keeps prefix', async () => {
    const { formatScalarCompact, formatDateAsOfNumeric } = await import('@/lib/format');
    expect(formatScalarCompact({ kind: 'MONEY', amount: '172000.00', currency: 'MYR' }, false)).toBe('172K');
    expect(formatScalarCompact({ kind: 'MONEY', amount: '560000.00', currency: 'MYR' }, true)).toBe('RM 560K');
    expect(formatScalarCompact({ kind: 'COUNT', value: 100 }, true)).toBe('100');
    expect(formatScalarCompact({ kind: 'PERCENT', value: 98 }, true)).toBe('98%');
    expect(formatScalarCompact({ kind: 'DECIMAL', value: 8.9, precision: 1 }, true)).toBe('8.9');
    expect(formatScalarCompact(undefined, true)).toBe('-');
    expect(formatDateAsOfNumeric('2026-09-03')).toBe('As of 03/09/2026');
  });
});
