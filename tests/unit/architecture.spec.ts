import { expect, test } from '@playwright/test';
import { FEATURES, getLbuContext, isFeatureEnabled } from '@/config/lbu';
import { resolveCdk } from '@/cdk/registry';
import PerformanceMY from '@/cdk/performance/PerformanceMY';
import HistoryMY from '@/cdk/history/HistoryMY';
import MetricDetailMY from '@/cdk/metric-detail/MetricDetailMY';

test.describe('LBU deployment context (learning §1: LBU_CODE is a deployment constant)', () => {
  test('defaults to the Malaysia deployment when LBU_CODE is unset', () => {
    expect(getLbuContext(undefined)).toMatchObject({ lbu: 'my', country: 'MY', locale: 'en-MY' });
  });

  test('fails closed on an unsupported configured market (docs/security/security-standard.md §10)', () => {
    expect(() => getLbuContext('ph')).toThrow('Unsupported LBU_CODE: ph');
    expect(() => getLbuContext('nope')).toThrow('Unsupported LBU_CODE: nope');
  });

  test('carries a complete route manifest — every feature is declared', () => {
    const context = getLbuContext('my');
    for (const feature of FEATURES) expect(isFeatureEnabled(feature, context)).toBe(true);
  });
});

test.describe('CDK registry (learning §5: explicit MY page registrations)', () => {
  test('resolves the LBU-specific composition when one is registered', () => {
    expect(resolveCdk('performance', 'my')).toBe(PerformanceMY);
  });

  test('resolves MY compositions explicitly for the single vendored market', () => {
    expect(resolveCdk('history', 'my')).toBe(HistoryMY);
    expect(resolveCdk('metric-detail', 'my')).toBe(MetricDetailMY);
  });

  test('resolves every manifest feature to a page — no route can 500 on lookup', () => {
    for (const feature of FEATURES) expect(typeof resolveCdk(feature, 'my')).toBe('function');
  });
});
