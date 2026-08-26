/** Typed client for the Insights domain service (Fastify). Server-side only. */
const BASE = process.env.INSIGHTS_API_URL ?? 'http://localhost:4600/insights/v1';

export class DomainError extends Error {
  constructor(public status: number, public code: string, public title: string) {
    super(`${status} ${code} ${title}`);
  }
}

async function call<T>(agentHeaderId: string, path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'content-type': 'application/json', 'x-agent-id': agentHeaderId, ...(init?.headers ?? {}) },
    cache: 'no-store',
  });
  if (res.status === 204) return undefined as T;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new DomainError(res.status, body.code ?? 'UNKNOWN', body.title ?? res.statusText);
  return body as T;
}

const qs = (params: object): string => {
  const entries = Object.entries(params as Record<string, string | number | undefined>)
    .filter(([, v]) => v !== undefined) as Array<[string, string | number]>;
  return entries.length ? `?${entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')}` : '';
};

export interface LensParams {
  period?: string; businessLine?: string; basis?: string; scope?: string; teamView?: string;
}
export const domain = {
  metrics: (agent: string, agentId: string, p: LensParams & { listScope?: string; codes?: string }) =>
    call<any>(agent, `/agents/${agentId}/metrics${qs(p)}`),
  metricDetail: (agent: string, agentId: string, code: string, p: LensParams) =>
    call<any>(agent, `/agents/${agentId}/metrics/${code}${qs(p)}`),
  series: (agent: string, agentId: string, code: string, p: LensParams & { anchorYear?: number; yearsBack?: number }) =>
    call<any>(agent, `/agents/${agentId}/metrics/${code}/series${qs(p)}`),
  milestones: (agent: string, agentId: string) => call<any>(agent, `/agents/${agentId}/milestones`),
  definitions: (agent: string) => call<any>(agent, `/metric-definitions`),
  preferences: (agent: string, agentId: string, scope: string) =>
    call<any>(agent, `/agents/${agentId}/metric-preferences${qs({ scope })}`),
  putPreferences: (agent: string, agentId: string, scope: string, body: unknown) =>
    call<any>(agent, `/agents/${agentId}/metric-preferences${qs({ scope })}`, { method: 'PUT', body: JSON.stringify(body) }),
  recommendations: (agent: string, agentId: string, scope: string) =>
    call<any>(agent, `/agents/${agentId}/recommendations${qs({ scope })}`),
  feedback: (agent: string, agentId: string, recommendationId: string, rating: 'UP' | 'DOWN') =>
    call<void>(agent, `/agents/${agentId}/recommendations/${recommendationId}/feedback`, {
      method: 'POST', body: JSON.stringify({ rating }),
    }),
};
export type DomainApi = typeof domain;
