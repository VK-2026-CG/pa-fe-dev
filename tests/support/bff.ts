/**
 * The BFF now runs on pa-be-dev's own origin, so direct API calls in e2e specs
 * must be absolute: a relative `/api/bff/...` resolves against `baseURL` (the
 * SPA) and silently returns the SPA's HTML fallback instead of JSON.
 */
export const bffUrl = (path: string): string =>
  `${process.env.BFF_URL ?? `http://127.0.0.1:${process.env.SVC_PORT ?? 4600}`}${path}`;
