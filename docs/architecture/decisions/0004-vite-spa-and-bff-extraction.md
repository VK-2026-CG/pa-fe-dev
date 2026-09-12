# ADR 0004 — Vite SPA + BFF extraction to pa-be-dev

**Status:** Accepted

## Context

`pa-fe-dev` was a Next.js 15 App Router app doing two jobs at once: rendering
the UI (~25 routes under `src/app`) and hosting a server-only BFF layer
(`src/app/api/bff/v1/**`, ~20 route handlers) that composed spec view-models,
enforced entitlement guards, and called the Insights and Contest domain
services over HTTP. Next.js itself added nothing this app used beyond that
BFF hosting — no SSR-dependent pages, no `next/image`, no route groups or
parallel/intercepting routes — so removing it meant relocating the BFF
somewhere with a real server runtime, not replacing Next with another
framework.

The sibling `pa-be-dev` (`pruaction-insights-service`) already runs a single
Fastify process hosting both domain areas (`src/data/*` for Insights,
`src/contest/*` for Contest Admin). Standing up the empty `pa-bff-dev` repo as
a third process was considered and rejected — folding the BFF into the
already-running Fastify app is one fewer moving part for local dev and
deploys, and the domain calls become in-process instead of another network
hop.

## Decision

- `pa-fe-dev` becomes a plain **Vite + React Router** SPA, in place. Routing
  moved from `src/app/**/page.tsx` + `layout.tsx` to a data-driven route table
  (`src/router.tsx`) using `createBrowserRouter`/`RouterProvider`, so the 13
  near-identical `insights/*/page.tsx` files and 11 near-identical
  `contest-admin/**/page.tsx` files collapse into two small config arrays
  instead of being hand-copied.
- The BFF route handlers, `src/lib/bff.ts`, `src/lib/compose/**`, and the
  BFF-only parts of `src/lib/contest-admin/**` moved verbatim into
  `pa-be-dev` (`src/bff/**`), mounted alongside its existing domain routes at
  the same URL shape (`/api/bff/v1/...`) — only the host/port changed, so
  call-site paths stayed stable.
- **Persona identity**: the `pa_persona` cookie is gone. The SPA keeps the
  persona selection in `localStorage` (`src/lib/usePersona.tsx`) and sends it
  as an `x-persona` request header on every BFF call
  (`src/lib/apiClient.ts`) — pa-be-dev's `getPersona()` reads that header,
  falling back to the same default persona the cookie used to. This mirrors
  the existing `x-contest-actor`/`x-contest-tenant` header pair already used
  for Contest Admin identity, which is unchanged.
- `resolveCdk()` (`src/cdk/registry.ts`) keeps its pure, deployment-config-driven
  logic; it now throws `CdkFeatureDisabledError` instead of calling Next's
  `notFound()`, which the route tree's `errorElement` renders as an actual 404
  view.
- `INSIGHTS_API_URL`, `CONTESTS_API_URL` and `LBU_CODE` (as a *runtime* env
  var) now belong to pa-be-dev exclusively. The SPA never reads them; its own
  `LBU_CODE`-equivalent is `VITE_LBU_CODE`, a Vite build-time constant, and
  `src/config/lbu.ts` no longer carries a `contestApiUrl` field at all.
- Two files under `src/lib/contest-admin/**` did **not** move to pa-be-dev
  only — `config.ts` (vendored builder step order / period modes) and
  `rule-explanation.ts` (human-readable rule descriptions) are pure,
  zero-server-dependency modules that `ContestAdminMY.tsx` and
  `RuleLogicPreview.tsx` import directly for client-side rendering. They also
  exist in pa-be-dev (for composing BFF responses), which is an accepted, small
  duplication of pure vendored-spec logic rather than a client/server split
  that would need its own contract.

## Consequences

- Two processes instead of three: pa-be-dev (:4600, domain + BFF) and the
  Vite SPA (:3600). `npm run dev` in each, in either order.
- The BFF is now a genuine cross-origin call (CORS, `@fastify/cors` with
  `origin: true`) instead of same-process Next.js routes. `x-persona` and
  `x-contest-actor`/`x-contest-tenant` remain **unverified** — this widens the
  trust boundary slightly (a real network hop can now be replayed/spoofed by
  anything that can reach :4600, not just same-origin code) but does not
  change what was actually verified before, which was nothing. This is a
  carried-forward known gap, not something this migration fixes; it should be
  tracked as a follow-up security item with Security/Compliance, not solved
  here.
- `tests/api/**` and the unit specs for modules that moved
  (`tests/unit/compose.spec.ts`, `tests/unit/contest-admin.spec.ts`,
  `tests/unit/mom.spec.ts`) moved to pa-be-dev's Vitest suite; `tests/e2e/**`
  stay here as full browser journeys against the Vite-served SPA calling
  pa-be-dev directly. `tests/support/personas.ts` seeds `localStorage` via a
  Playwright `addInitScript` instead of a cookie.
- `npm run build` (Vite) is the backstop that no server-only env var or
  Node-only import leaked into the client bundle — only `VITE_*`-prefixed
  vars reach the browser at all, which is Vite's own enforcement, not just a
  convention this app follows.

## Alternatives considered

- **Stand up `pa-bff-dev` as its own process.** Rejected: a third process to
  run and deploy for no isolation benefit pa-be-dev doesn't already give it
  (same trust boundary, same team, same repo lifecycle).
- **Next.js API routes talking to pa-be-dev over HTTP, keep the UI in Next.**
  Rejected by the user up front — the goal was to remove Next.js from this
  app entirely, not just its BFF usage.
- **Keep the persona cookie, add a reverse proxy so the SPA and BFF share an
  origin.** Rejected: adds an operational component (the proxy) purely to
  avoid a one-header change, and the cookie's trust level was already
  unverified — a header carries the same information with less
  infrastructure.
