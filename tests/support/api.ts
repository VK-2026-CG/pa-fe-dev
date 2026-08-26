import { expect, type APIRequestContext } from '@playwright/test';
import { personaHeaders, type PersonaKey } from './personas';

export const BFF = '/api/bff/v1';

/** GET a BFF endpoint as a persona, asserting 200 and returning the parsed payload. */
export async function getJson<T = any>(
  request: APIRequestContext, persona: PersonaKey, url: string,
): Promise<T> {
  const res = await request.get(url, { headers: personaHeaders(persona) });
  expect(res.status(), `GET ${url} as ${persona}`).toBe(200);
  return (await res.json()) as T;
}

/** GET expecting a specific status (entitlement guards, D-14). */
export async function getStatus(
  request: APIRequestContext, persona: PersonaKey, url: string,
): Promise<number> {
  const res = await request.get(url, { headers: personaHeaders(persona) });
  return res.status();
}

export async function putJson<T = any>(
  request: APIRequestContext, persona: PersonaKey, url: string, data: unknown,
) {
  const res = await request.put(url, { headers: personaHeaders(persona), data });
  return { status: res.status(), body: (await res.json().catch(() => ({}))) as T };
}

export async function postJson(
  request: APIRequestContext, persona: PersonaKey, url: string, data: unknown,
) {
  const res = await request.post(url, { headers: personaHeaders(persona), data });
  return { status: res.status() };
}

export const metricCodes = (items: Array<{ metricCode: string }>): string[] =>
  items.map((i) => i.metricCode);
