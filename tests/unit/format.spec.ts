import { expect, test } from '@playwright/test';
import { formatAbs, formatDelta, formatMoney, formatPercent, formatScalar } from '@/lib/format';

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
