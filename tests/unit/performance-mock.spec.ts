import { expect, test } from '@playwright/test';
import { bffHeaders } from '@/lib/apiClient';
import {
  developmentSamplesEnabled, getPerformanceSample, initialPerformanceLens, parsePerformanceSamples,
} from '@/lib/performanceMock';

const samples = parsePerformanceSamples([
  { id: 'production', kind: 'PRODUCTION', agentId: 'MOCK_PRODUCTION' },
  { id: 'mapa', kind: 'MAPA', agentId: 'MOCK_MAPA' },
  { id: 'persistency', kind: 'PERSISTENCY', agentId: 'MOCK_PERSISTENCY' },
]);

test('AC-PA-DIRECT-12 configured production starts on INSURANCE/SELF/YTD, including fixed-agent mode', () => {
  const expected = { scope: 'SELF', period: 'YTD', businessLine: 'INSURANCE', basis: 'STANDARD' };
  expect(initialPerformanceLens(samples[0], '')).toEqual(expected);
  expect(initialPerformanceLens(undefined, 'MOCK_PRODUCTION')).toEqual(expected);
});

test('AC-PA-DIRECT-13 AC-PA-DIRECT-14 Group samples select their own identity and exact lens', () => {
  for (const id of ['mapa', 'persistency']) {
    const sample = getPerformanceSample(samples, id)!;
    expect(sample.id).toBe(id);
    expect(initialPerformanceLens(sample, '')).toEqual({ scope: 'TEAM', teamView: 'GROUP', period: 'YTD', businessLine: 'INSURANCE', basis: 'STANDARD' });
    const headers = bffHeaders('/api/bff/v1/performance/dashboard', undefined, 'LEADER_P2', sample.agentId);
    expect(headers.get('x-agent-id')).toBe(sample.agentId);
  }
});

test('AC-PA-DIRECT-15 selected profile persists by ID and cannot inject an arbitrary identity', () => {
  expect(getPerformanceSample(samples, 'persistency')).toEqual(samples[2]);
  expect(getPerformanceSample(samples, 'unknown-agent')).toEqual(samples[0]);
  expect(getPerformanceSample(samples, null)).toEqual(samples[0]);
  expect(getPerformanceSample([], 'persistency')).toBeUndefined();
});

test('AC-PA-DIRECT-15 Performance identity never leaks into Contest requests', () => {
  const sample = samples[2]!;
  const headers = bffHeaders('/api/bff/v1/contest-admin/portfolio', undefined, 'LEADER_P2', sample.agentId);
  expect(headers.has('x-agent-id')).toBe(false);
  expect(headers.has('x-tenant')).toBe(false);
  expect(headers.get('x-contest-actor')).toBe('A1001');
});

test('AC-PA-DIRECT-16 no mock configuration preserves offline defaults and persona headers', () => {
  expect(initialPerformanceLens(undefined, '')).toEqual({ scope: 'SELF', businessLine: 'ALL', basis: 'STANDARD' });
  const headers = bffHeaders('/api/bff/v1/performance/dashboard', undefined, 'AGENT_P4', '');
  expect(headers.has('x-agent-id')).toBe(false);
  expect(headers.get('x-persona')).toBe('AGENT_P4');
});

test('AC-PA-DIRECT-17 development sample configuration is excluded from every build', () => {
  expect(developmentSamplesEnabled('serve', 'development')).toBe(true);
  expect(developmentSamplesEnabled('build', 'production')).toBe(false);
  expect(developmentSamplesEnabled('build', 'development')).toBe(false);
  expect(developmentSamplesEnabled('serve', 'production')).toBe(false);
});

test('AC-PA-DIRECT-15 invalid sample profiles fail closed; values cannot be supplied as profiles', () => {
  expect(() => parsePerformanceSamples({})).toThrow();
  expect(() => parsePerformanceSamples([{ id: 'bad', agentId: 'x', kind: 'UNKNOWN' }])).toThrow();
  expect(() => parsePerformanceSamples([samples[0], samples[0]])).toThrow();
  expect(() => parsePerformanceSamples([{ id: 'production', agentId: '../../x', kind: 'PRODUCTION' }])).toThrow();
  expect(parsePerformanceSamples([{ ...samples[0], value: 123 }])).toEqual([samples[0]]);
});