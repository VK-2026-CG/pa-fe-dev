/**
 * Fetch wrapper for every BFF call (`/api/bff/v1/...`). Now that pa-be-dev
 * hosts the BFF on its own origin (:4600) instead of same-origin Next.js
 * routes, every call must:
 *  - target the BFF's base URL (`VITE_BFF_URL`, default the local dev port),
 *  - carry `x-persona` for the offline fixture mode,
 *  - carry a configured `x-agent-id`/`x-tenant` for Performance Mongo mode,
 *  - and, for Contest Admin routes, `x-contest-actor`/`x-contest-tenant`
 *    (same unverified pair the app already sent, mirrored from
 *    tests/support/personas.ts's persona catalogue).
 */
import { getStoredPersonaId } from "@/lib/usePersona";
import { personaById, type PersonaId } from "@/lib/persona";
import { getPerformanceSample } from "@/lib/performanceMock";

/**
 * Injected by `vite.config.ts`'s `define` from the `VITE_BFF_URL` env var —
 * not read via `import.meta.env` directly, because this module is also
 * reachable from `tests/unit/architecture.spec.ts` (via the CDK pages),
 * which Playwright runs under plain Node where `import.meta` is a syntax
 * error. `typeof` on an undeclared identifier is always safe, so this stays
 * inert (falls through to the default) outside a Vite build.
 */
declare const __BFF_URL__: string | undefined;
declare const __PERFORMANCE_AGENT_ID__: string | undefined;
declare const __PERFORMANCE_TENANT__: string | undefined;
const BFF_BASE_URL: string =
  (typeof __BFF_URL__ !== "undefined" && __BFF_URL__) ||
  "http://localhost:4600";
const CONTEST_ADMIN_PREFIX = "/api/bff/v1/contest-admin";
const PERFORMANCE_PREFIX = "/api/bff/v1/performance";
const PERFORMANCE_AGENT_ID =
  (typeof __PERFORMANCE_AGENT_ID__ !== "undefined" && __PERFORMANCE_AGENT_ID__) ||
  "";
const PERFORMANCE_TENANT =
  (typeof __PERFORMANCE_TENANT__ !== "undefined" && __PERFORMANCE_TENANT__) ||
  "MY";

/** Unverified fallback identity for Contest Admin — unchanged from the pre-migration BFF route handlers. */
const CONTEST_ACTOR_FALLBACK = "A1001";
const CONTEST_TENANT_FALLBACK = "MY";

export function bffHeaders(
  path: string,
  initial: HeadersInit | undefined,
  personaId: PersonaId,
  performanceAgentId = PERFORMANCE_AGENT_ID,
  performanceTenant = PERFORMANCE_TENANT,
): Headers {
  const headers = new Headers(initial);
  headers.set("x-persona", personaId);
  if (path.startsWith(PERFORMANCE_PREFIX) && performanceAgentId) {
    if (!headers.has("x-agent-id"))
      headers.set("x-agent-id", performanceAgentId);
    if (!headers.has("x-tenant"))
      headers.set("x-tenant", performanceTenant);
  }
  if (path.startsWith(CONTEST_ADMIN_PREFIX)) {
    if (!headers.has("x-contest-actor"))
      headers.set("x-contest-actor", CONTEST_ACTOR_FALLBACK);
    if (!headers.has("x-contest-tenant"))
      headers.set("x-contest-tenant", CONTEST_TENANT_FALLBACK);
  }
  return headers;
}

/**
 * Fetch a BFF path (e.g. `/api/bff/v1/performance/dashboard?...`). Behaves
 * like `fetch`, but resolves against the BFF's base URL and attaches the
 * identity headers every BFF route expects.
 */
export function apiFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const headers = bffHeaders(
    path,
    init.headers,
    personaById(getStoredPersonaId()).id,
    getPerformanceSample()?.agentId ?? PERFORMANCE_AGENT_ID,
  );
  return fetch(`${BFF_BASE_URL}${path}`, { ...init, headers });
}
