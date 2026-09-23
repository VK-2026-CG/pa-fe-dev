import type { PeriodType, Scope } from '@spec/performance-vm';

export interface PerformanceMockSample {
  id: string;
  kind: 'PRODUCTION' | 'MAPA' | 'PERSISTENCY';
  agentId: string;
}
export interface PerformanceLens {
  scope: Scope;
  period?: PeriodType;
  businessLine: string;
  basis: string;
  teamView?: string;
}

/** Supplied only by the development Vite server; never a production identity mechanism. */
declare const __PERFORMANCE_SAMPLES__: unknown;
declare const __PERFORMANCE_AGENT_ID__: string | undefined;
export const PERFORMANCE_SAMPLE_STORAGE_KEY = 'pa_performance_sample';

export function developmentSamplesEnabled(command: string, mode: string): boolean {
  return command === 'serve' && mode === 'development';
}

export function parsePerformanceSamples(value: unknown): PerformanceMockSample[] {
  if (!Array.isArray(value)) throw new Error('Performance mock samples must be an array');
  const ids = new Set<string>();
  return value.map(item => {
    if (!item || typeof item !== 'object') throw new Error('Invalid Performance mock sample');
    const sample = item as Record<string, unknown>;
    if (typeof sample.id !== 'string' || !/^[a-z][a-z0-9-]{0,39}$/.test(sample.id)
      || typeof sample.agentId !== 'string' || !/^[A-Za-z0-9_-]{1,40}$/.test(sample.agentId)
      || !['PRODUCTION', 'MAPA', 'PERSISTENCY'].includes(String(sample.kind)) || ids.has(sample.id)) {
      throw new Error('Invalid or duplicate Performance mock sample');
    }
    ids.add(sample.id);
    return { id: sample.id, kind: sample.kind as PerformanceMockSample['kind'], agentId: sample.agentId };
  });
}

export const PERFORMANCE_SAMPLES = parsePerformanceSamples(
  typeof __PERFORMANCE_SAMPLES__ !== 'undefined' ? __PERFORMANCE_SAMPLES__ : [],
);

function storedSample(): string | null {
  try { return typeof window === 'undefined' ? null : window.localStorage.getItem(PERFORMANCE_SAMPLE_STORAGE_KEY); }
  catch { return null; }
}

export function getPerformanceSample(
  samples: PerformanceMockSample[] = PERFORMANCE_SAMPLES,
  selectedId: string | null = storedSample(),
): PerformanceMockSample | undefined {
  return samples.find(sample => sample.id === selectedId) ?? samples[0];
}

export function selectPerformanceSample(id: string): void {
  if (!PERFORMANCE_SAMPLES.some(sample => sample.id === id)) throw new Error('Unknown configured Performance sample');
  window.localStorage.setItem(PERFORMANCE_SAMPLE_STORAGE_KEY, id);
}

/** Initial request defaults, not hidden query rewriting or source-value composition. */
export function initialPerformanceLens(
  sample = getPerformanceSample(),
  fixedAgentId = typeof __PERFORMANCE_AGENT_ID__ !== 'undefined' ? __PERFORMANCE_AGENT_ID__ : '',
): PerformanceLens {
  if (sample) {
    const group = sample.kind !== 'PRODUCTION';
    return { scope: group ? 'TEAM' : 'SELF', period: 'YTD', businessLine: 'INSURANCE', basis: 'STANDARD',
      ...(group ? { teamView: 'GROUP' } : {}) };
  }
  if (fixedAgentId) return { scope: 'SELF', period: 'YTD', businessLine: 'ALL', basis: 'STANDARD' };
  return { scope: 'SELF', businessLine: 'ALL', basis: 'STANDARD' };
}