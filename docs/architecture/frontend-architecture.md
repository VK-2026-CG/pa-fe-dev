# PRUAction Webapp — Composable Multi-LBU Structure (Next.js + Fastify)

> ## Status in this repository
>
> This document is the **platform target** for the PRUAction webapp monorepo. This
> repository is a focused single-market implementation of the Performance module,
> so read it as direction, not as a description of current code.
>
> **Adopted here:** routing-only `src/app`; `src/cdk/<feature>/` as the page layer
> with LBU-first + `common` fallback resolution (`src/cdk/registry.ts`); a
> validated, fail-closed deployment `LBU_CODE` with a route/feature manifest
> (`src/config/lbu.ts`); shared components; a replaceable DLS layer.
>
> **Not adopted yet:** the `packages/*` monorepo split, `middleware.ts` route
> gating and device-shell rewrites, `(mobile)`/`(desktop)`/`(auth)` route groups,
> P1 desktop pages, server-side `data-access/` with Next Data Cache, next-intl,
> Recharts/TanStack, OpenAPI-generated clients, and `deploy/helm`. Only `my` is
> registered, because only the MY spec is vendored.
>
> Current layering and known gaps: [`README.md`](README.md). Decisions actually
> taken: [`decisions/`](decisions/README.md).

**One codebase, built once. `LBU_CODE` is fixed per deployment and selects routes, pages (CDKs), and BFF endpoints.**
The same image is deployed into **each LBU's own infrastructure** (own cloud tenancy, AKS, Cosmos, Postgres, Redis, IdP) — `LBU_CODE` is set per environment, not resolved per request across a shared runtime. Components are shared; pages are LBU-specific; a few pages are common to all LBUs. Persona tier picks the device shell (P2/P3/P4 → mobile, P1 → tablet/desktop).

> Mirrors the **Front-End Architecture** slide in `pruaction-arch-deck-v3.pptx`. Section 2 is the layer diagram from that slide; Section 3 is the on-disk realisation of it.

---

## 1. The resolution model (how one codebase behaves per-LBU)

`LBU_CODE` is a **deployment constant** — set once in each country's environment, the same for every request to that deployment. It governs which routes/pages/BFF/theme/locale that build uses. Only **persona** (and optionally a sub-brand subdomain, e.g. PAMB vs PBTB within MY) is resolved per request from the auth claim.

Three things vary by LBU, all keyed off the deployment's `LBU_CODE` and resolved server-side so the browser only ever receives the correct HTML:

| Varies by LBU | Resolved by | Mechanism |
|---|---|---|
| **Which routes exist** | `middleware.ts` + route manifest | `LBU_CODE` → allowed route manifest; unknown routes 404 before render |
| **Which page implementation renders** | per-route **CDK registry** | physical `app/` route is a thin shell that looks up the LBU's page CDK (falls back to `common` CDK if the route is shared) |
| **Which BFF + theme + locale** | `lib/lbu/context.ts` | `LBU_CODE` → BFF base URL (in-country), DLS theme tokens, locale bundle, feature flags |

Persona tier (P1–P4) comes from the **auth claim** — one deployment serves all tiers for its country. The tier selects the **device shell** (`(mobile)` vs `(desktop)` layout group) and the persona's allowed CDK variant.

```
Request → middleware.ts   (LBU_CODE already fixed for this deployment)
  ├─ resolve persona   (auth claim → P1 | P2 | P3 | P4)
  ├─ resolve entity    (auth claim / subdomain → e.g. PAMB | PBTB, MY only)
  ├─ check route manifest for LBU_CODE (404 if not allowed)
  └─ rewrite to device shell:  P1 → /(desktop)/…   P2|P3|P4 → /(mobile)/…
        → App Router renders thin route shell
            → CDK registry returns <LbuPage> (or <CommonPage>)
                → composed from shared <Components> + DLS, hydrated minimally
```

---

## 2. Layered architecture (request path, top to bottom)

The same view as the FE architecture slide in the deck — what each layer does as a request flows from browser to BFF.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ BROWSER     Web channel (Chrome · Safari · Edge), inside PRUForce WebView      │
│             (mobile) or desktop browser. Receives streamed HTML, hydrates      │
│             minimal Client Components. Holds only an opaque HttpOnly session    │
│             cookie — no tokens ever reach the browser.                          │
│             Persona → device shell (from auth claim):                          │
│               P2 · P3 · P4 → (mobile)    |    P1 → (desktop)                    │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ EDGE        middleware.ts — runs before render (LBU_CODE already fixed for     │
│             this deployment): resolve persona · resolve entity PAMB|PBTB (MY)  │
│             · gate vs route-manifest[LBU_CODE] → 404 · rewrite → (mobile)|      │
│             (desktop) · negotiate locale.                                       │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ app/ ROUTES Routing layer ONLY. Every page.tsx is a thin shell that resolves   │
│             a CDK. No business logic, no data fetching here.                    │
│             (auth) · (mobile)/(protected) · (desktop)/(protected) · (common)   │
│             · api/* route handlers                                              │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ COMPOSE     cdk/ — LBU-specific PAGES          packages/ — SHARED (never forked)│
│             registry: feature × LBU ×    ──▶   dls/   · charts/                  │
│             persona → page                     api-client/ (OpenAPI) · i18n/     │
│             HomeMY · HomePH · HomeCommon        primitives · patterns · tokens    │
└───────────────────────────────────┬─────────────────────────────────────────┘
                                     ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│ SERVER DATA Server Components (RSC) fetch + render server-side · streaming +    │
│             Suspense. data-access/ + caching (Next Data Cache, revalidateTag,   │
│             keys scoped by lbu + persona, TTL per resource).                     │
│             BFF boundary (server-only): api-client → in-country Fastify BFF      │
│             over HTTPS, session cookie carried, no CORS, OpenAPI-typed.          │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Rule of thumb per layer:** `app/` routes, `cdk/` decides *which page*, `packages/` provides *the parts*, RSC does *the fetching*, the BFF owns *the data and derivation*. Nothing fetches data above the SERVER DATA layer; nothing renders LBU-specific markup above COMPOSE.

---

## 3. Folder structure

```
pruaction-webapp/                      # ONE Next.js monorepo app (App Router, SSR)
│
├── app/                               # ROUTING LAYER ONLY — thin shells, no business logic
│   │                                  # every page.tsx just resolves a CDK from the registry
│   ├── layout.tsx                     # root: <html>, providers, DLS theme injection, i18n root
│   ├── middleware.ts                  # LBU + persona resolution, route-manifest gate, shell rewrite
│   ├── not-found.tsx                  # shared 404
│   ├── error.tsx                      # shared error boundary
│   ├── global-error.tsx
│   │
│   ├── (auth)/                        # PUBLIC route group — login / callback (common to all LBUs)
│   │   ├── layout.tsx
│   │   ├── login/page.tsx
│   │   └── callback/page.tsx          # OIDC return → sets HttpOnly session cookie
│   │
│   ├── (mobile)/                      # DEVICE SHELL — P2/P3/P4 (agents & leaders). Mobile-first.
│   │   ├── layout.tsx                 # mobile chrome: WebView app-bar, bottom nav, safe-area insets
│   │   └── (protected)/
│   │       ├── home/page.tsx          # → registry.resolve('home', lbu, persona)
│   │       ├── metrics/
│   │       │   └── [metric]/page.tsx  # → registry.resolve('metric-drilldown', …)
│   │       ├── pacing/page.tsx        # MDRT / MAPA / TPC pacing (LBU-specific CDK)
│   │       ├── leaderboard/page.tsx
│   │       ├── milestones/page.tsx
│   │       ├── contests/page.tsx
│   │       └── profile/page.tsx
│   │
│   ├── (desktop)/                     # DEVICE SHELL — P1 (LBU / Head Office). Tablet/desktop.
│   │   ├── layout.tsx                 # desktop chrome: top nav, side rail, wide grid
│   │   └── (protected)/
│   │       ├── overview/page.tsx      # P1 agency/branch/region overview
│   │       ├── metrics/
│   │       │   └── [metric]/page.tsx  # P1 drilldown (TPC-method / APE-method twins)
│   │       ├── contest-admin/         # MY contest administration routes (P1)
│   │       └── goals/page.tsx
│   │
│   ├── (common)/                      # PAGES IDENTICAL ACROSS ALL LBUs (no CDK variation)
│   │   ├── settings/page.tsx          # language, theme, notifications
│   │   └── help/page.tsx
│   │
│   └── api/                           # Next.js Route Handlers — thin carve-out ONLY
│       ├── auth/
│       │   ├── login/route.ts
│       │   └── callback/route.ts      # code exchange → BFF → session cookie
│       ├── config/me/route.ts         # current LBU + persona + flags for client
│       ├── csrf/route.ts
│       ├── upload/route.ts
│       └── bff/[...path]/route.ts     # server-only proxy to LBU BFF (carries session cookie)
│
├── cdk/                               # ⭐ PAGE CDKs — the LBU-specific page implementations
│   │                                  # "Component Development Kit": one folder per feature,
│   │                                  # each with per-LBU page + a registry entry.
│   ├── registry.ts                    # featureKey × LBU × persona → page component (+ common fallback)
│   ├── types.ts                       # CdkPageProps, CdkContext (lbu, persona, locale)
│   │
│   ├── home/
│   │   ├── index.ts                   # registers variants below into registry
│   │   ├── HomeMY.tsx                 # MY: Insurance/Takaful/Both toggle, Scheme/Non-Scheme, MYR
│   │   ├── HomePH.tsx                 # PH: rank banner, PHP, tab nav
│   │   ├── HomeCommon.tsx             # default if an LBU has no override
│   │   └── parts/                     # page-local (non-shared) building blocks
│   │       ├── MetricTrackingSection.tsx
│   │       └── PriorityMetricsSection.tsx
│   │
│   ├── metric-drilldown/
│   │   ├── index.ts
│   │   ├── MetricDrilldownMY.tsx      # MY: APE/ACE twins, Collected/Penders, product split
│   │   ├── MetricDrilldownPH.tsx
│   │   └── parts/
│   │
│   ├── pacing/                        # MDRT · MAPA · TPC pacing (cdk-mapa-tpc for MY)
│   │   ├── index.ts
│   │   ├── PacingMY.tsx
│   │   └── PacingPH.tsx
│   │
│   ├── contest-admin/                 # MY contest administration command centre
│   │   ├── ContestAdminMY.tsx
│   │   └── parts/                     # page-local editors and panels
│   │
│   ├── leaderboard/   ├── milestones/   ├── goals/   └── overview/
│       (same pattern: index.ts + <Feature><LBU>.tsx + parts/)
│
├── packages/                         # ⭐ SHARED — reused across every LBU & persona
│   │
│   ├── dls/                           # Design Language System (Symphony DLS)
│   │   ├── tokens/                    # color, type, spacing — base + per-LBU theme overrides
│   │   │   ├── base.ts
│   │   │   ├── theme.my.ts            # charcoal 36454F · red C8102E · teal 0F6E56
│   │   │   └── theme.ph.ts
│   │   ├── primitives/                # Button, Card, Tag, Sheet, Tabs, Toggle…
│   │   ├── patterns/                  # MetricTile, PacingBar, RankRow, DrilldownTable…
│   │   ├── ThemeProvider.tsx          # injects LBU theme tokens (set server-side)
│   │   └── widgetbook/                # component catalogue / visual QA
│   │
│   ├── charts/                        # graphs — shared, themed via DLS tokens
│   │   ├── LineTrend.tsx
│   │   ├── BarComparison.tsx
│   │   ├── GaugePacing.tsx            # MDRT→ERT style pacing gauge
│   │   ├── DonutSplit.tsx             # product / case-status split
│   │   └── ChartTheme.ts
│   │
│   ├── api-client/                    # ⭐ generated from OpenAPI contract (company standard)
│   │   ├── generated/                 # codegen output — DO NOT edit
│   │   ├── client.ts                  # server-only fetcher (session cookie, error envelope)
│   │   └── hooks.ts                   # typed query/mutation hooks for client components
│   │
│   ├── i18n/                          # language localisation
│   │   ├── config.ts                  # locales per LBU (en, ms, zh, …)
│   │   ├── request.ts                 # server-side locale negotiation
│   │   └── messages/
│   │       ├── en/{common,home,metrics,contest}.json
│   │       ├── ms/…
│   │       └── zh/…
│   │
│   ├── data-access/                   # server-side data layer (RSC fetchers + caching)
│   │   ├── fetchers/                  # one per domain: metrics, pacing, contests, hierarchy
│   │   ├── cache.ts                   # unstable_cache / revalidateTag wrappers, TTL per resource
│   │   └── keys.ts                    # cache key + tag conventions (lbu + persona scoped)
│   │
│   ├── auth/                          # session helpers, RBAC guards, persona resolver
│   │   ├── session.ts                 # read/verify HttpOnly cookie
│   │   ├── persona.ts                 # claim → P1|P2|P3|P4
│   │   └── rbac.ts
│   │
│   ├── feature-flags/                 # per-LBU flag reads (scheme toggle, rank banner…)
│   ├── analytics/                     # Mixpanel/GA4 events + Dynatrace beacons
│   └── utils/                         # formatters (currency by LBU), dates, guards
│
├── lib/                               # app-level wiring (small, app-specific)
│   ├── lbu/
│   │   ├── context.ts                 # LBU_CODE → { bffBaseUrl, theme, locales, flags }
│   │   ├── manifest.ts                # selects config/routes/<LBU_CODE> → the middleware gate (see §4)
│   │   └── resolve.ts                 # subdomain / prefix / claim → LBU_CODE
│   └── providers.tsx                  # React Query, theme, i18n providers (client)
│
├── public/                            # static assets, per-LBU logos under /lbu/<code>/
├── config/
│   ├── env.ts                         # typed env schema (zod) — LBU_CODE, BFF_BASE_URL, …
│   ├── routes/                        # ⭐ per-region ROUTE MANIFESTS (which routes are reachable, by LBU)
│   │   ├── types.ts                   # RouteEntry { enabled, personas, entities?, flag? }
│   │   ├── my.ts                      # MY manifest — home/metrics/pacing/scheme/overview/contest-admin…
│   │   ├── ph.ts                      # PH manifest — no scheme, no PAMB/PBTB split
│   │   └── index.ts                   # LBU_CODE → that region's manifest (selected at boot)
│   └── lbu/                           # static per-LBU config (non-secret)
│       ├── my.ts                      # entities [PAMB, PBTB], currency MYR, locales [en, ms, zh]
│       ├── ph.ts
│       └── index.ts
│
├── .env.example                       # documents per-deployment vars; real values live in each LBU's key vault
│                                       #   LBU_CODE (fixed per env), BFF_BASE_URL (in-country), locale default…
├── deploy/                            # per-LBU deployment config (no secrets — those come from each LBU vault)
│   ├── helm/                          # one chart; values-<lbu>.yaml per country (image tag, endpoints, flags)
│   │   ├── values-my.yaml             # LBU_CODE=my, entities [PAMB, PBTB], MY BFF/Cosmos/IdP endpoints
│   │   ├── values-ph.yaml
│   │   └── values-base.yaml
│   └── pipelines/                     # per-LBU release pipeline defs (deploy same image into each subscription)
├── next.config.js                     # output: standalone (one image, deployed per-LBU infra); optional subdomain rewrites for sub-brands
├── middleware.ts                      # (or app/middleware.ts) edge LBU/persona resolution
├── tsconfig.json                      # path aliases: @cdk/* @dls/* @charts/* @api/* @i18n/*
└── package.json
```

---

## 4. How routes are stored per region

The route **files** ship in every region's image (it's one build), but **which routes are reachable** in a region is *data* — a typed **route manifest keyed by `LBU_CODE`**, stored in the repo and selected at boot. You fork the manifest data per region, never the `app/` tree.

Why static + in-repo (not a DB or central remote config): `LBU_CODE` is a deployment constant, so the manifest never changes per request; and keeping it next to the code avoids (a) a cross-border config dependency — bad under in-country/residency rules — and (b) drift between "manifest says route exists" and "image actually contains the page."

**A route is not a boolean** — each entry carries who/what can reach it:

```ts
// config/routes/types.ts
export type RouteEntry = {
  enabled: boolean;
  personas: Persona[];     // P1 | P2 | P3 | P4 — who may see it
  entities?: Entity[];     // optional: PAMB | PBTB (MY sub-brands)
  flag?: string;           // optional: only reachable when this flag is on
};
export type RouteManifest = Record<string /* route key */, RouteEntry>;
```

```ts
// config/routes/my.ts — Malaysia
export const my: RouteManifest = {
  'home':          { enabled: true, personas: ['P2','P3','P4'] },
  'metrics':       { enabled: true, personas: ['P2','P3','P4'] },
  'pacing':        { enabled: true, personas: ['P2','P3','P4'] },
  'scheme':        { enabled: true, personas: ['P2','P3','P4'], flag: 'schemeView' },
  'overview':      { enabled: true, personas: ['P1'] },
  'contest-admin': { enabled: true, personas: ['P1'] },
  'settings':      { enabled: true, personas: ['P1','P2','P3','P4'] },   // common page
};

// config/routes/ph.ts — Philippines (no scheme, no PAMB/PBTB split)
export const ph: RouteManifest = {
  'home':        { enabled: true, personas: ['P2','P3','P4'] },
  'metrics':     { enabled: true, personas: ['P2','P3','P4'] },
  'leaderboard': { enabled: true, personas: ['P2','P3','P4'] },
  'overview':    { enabled: true, personas: ['P1'] },
  'settings':    { enabled: true, personas: ['P1','P2','P3','P4'] },
};
```

**Resolver — one region selected at boot off `LBU_CODE`:**

```ts
// lib/lbu/manifest.ts
import { my } from '@/config/routes/my';
import { ph } from '@/config/routes/ph';
const MANIFESTS: Record<string, RouteManifest> = { my, ph /* , id, vn, sg */ };

export const routeManifest = MANIFESTS[process.env.LBU_CODE!]
  ?? (() => { throw new Error(`No route manifest for LBU_CODE=${process.env.LBU_CODE}`); })();
```

**Gate — middleware reads only this region's manifest:**

```ts
// middleware.ts
const entry = routeManifest[routeKey(pathname)];
if (!entry?.enabled)                       return notFound();   // route off for this LBU
if (!entry.personas.includes(persona))     return notFound();   // wrong tier
if (entry.entities && !entry.entities.includes(entity)) return notFound();
if (entry.flag && !flags[entry.flag])      return notFound();   // gated feature
// allowed → rewrite to (mobile)|(desktop) → route shell → CDK registry
```

The same `routeManifest` feeds the **navigation**, so a region's menu and its reachable routes can never disagree — both read one source.

**Drift guard (CI).** Because a route's page code is compiled into the image, a manifest can only gate routes that exist. Add a build check: every `enabled` route in every region's manifest has a matching CDK registration, and every CDK-registered feature appears in at least one manifest. Catches "enabled a route with no page" / "shipped a page nothing points to" at build time, not in production.

**Hard constraint.** Config can never *add* a route — it only makes a route that is **already in the build** reachable or not. A new route = new `app/` shell + CDK + manifest entry, shipped in the next image.

**If you must flip routes without redeploying** (e.g. ops enabling `leaderboard` for PH with no release): move only the `enabled`/`flag` values out to the feature-flag service and have the manifest read flags at request time — keep the route *list* and persona/entity scoping static in-repo. The page still has to be in the image; you're toggling visibility of shipped routes, not creating them. This is the only reason to leave static config, and it trades away the drift-safety above.

---

## 5. How the pieces connect (concise)

**Route shell → CDK (LBU-specific page):**
```tsx
// app/(mobile)/(protected)/home/page.tsx  — thin, identical for every LBU
import { resolveCdk } from '@/cdk/registry';
import { getLbuContext, getPersona } from '@/lib/lbu/context';

export default async function HomeRoute() {
  const { lbu } = getLbuContext();      // from LBU_CODE (server)
  const persona = await getPersona();   // from auth claim
  const Page = resolveCdk('home', lbu, persona);   // HomeMY | HomePH | HomeCommon
  return <Page lbu={lbu} persona={persona} />;
}
```

**Registry with common fallback:**
```ts
// cdk/registry.ts
const reg = new Map<string, Map<string, React.FC<CdkPageProps>>>();
export function register(feature: string, lbu: string, comp: React.FC<CdkPageProps>) { … }
export function resolveCdk(feature: string, lbu: string, _persona: Persona) {
  const byLbu = reg.get(feature);
  return byLbu?.get(lbu) ?? byLbu?.get('common')   // ← page common to all LBUs
       ?? (() => { throw new Error(`No CDK for ${feature}`); })();
}
```

**Shared component, used by every CDK (never forked):**
```tsx
// packages/dls/patterns/MetricTile.tsx — one implementation, themed by tokens
export function MetricTile({ label, value, deltaPct, currency }: MetricTileProps) { … }
// HomeMY and HomePH both import this; only the data/config differs.
```

**Common page (no variation):** lives in `app/(common)/…` and imports shared components directly — it never touches the CDK registry.

---

## 6. Modules / libraries to use

| Concern | Library | Notes |
|---|---|---|
| **Framework / SSR** | **Next.js (App Router)** | RSC + streaming + Suspense; `output: 'standalone'` for one container image. Server Components do all data fetching. |
| **Routing per LBU** | Next.js **route groups** `(mobile)`/`(desktop)`/`(common)` + **`middleware.ts`** | Env-driven gating via route manifest; rewrite to device shell by persona. No extra router needed. |
| **Charts / graphs** | **Recharts** (fast to theme) or **visx** (lower-level, more control); **ECharts** if you need large datasets / richer interactions | Wrap in `packages/charts`, theme from DLS tokens so every LBU matches. Render client-side under Suspense; keep SSR fallback skeletons. |
| **Localisation (i18n)** | **next-intl** (App-Router-native, server + client) — or **i18next/react-i18next** if you already standardise on it | Locale negotiated in middleware; messages split per feature in `packages/i18n/messages`. |
| **Server-state / caching (client)** | **TanStack Query (React Query)** | Dedupe + cache for client components calling Route Handlers. |
| **Server-side caching** | Next.js **Data Cache** (`unstable_cache`, `revalidateTag`, `fetch` cache) + **Redis** at the BFF | Per-resource TTL, tag-based invalidation; cache keys scoped by `lbu + persona` (see `data-access/cache.ts`). |
| **API contract / typing** | **OpenAPI** + **openapi-typescript** / **orval** codegen | Generates `packages/api-client` — the company-standard contract; FE never hand-writes BFF types. |
| **Styling / tokens** | **Tailwind** (with DLS token preset) or **CSS variables** from `dls/tokens` | LBU theme = swap token set via `ThemeProvider`, injected server-side. |
| **Forms / validation** | **React Hook Form** + **Zod** | Contest setup wizard, goal setting. Zod also validates `env` in `config/env.ts`. |
| **Auth (client side of it)** | session cookie + **`@org` auth helpers** | Tokens never reach the browser; only an opaque HttpOnly `session_id`. Exchange handled in `app/api/auth/*`. |
| **Tables / drilldowns** | **TanStack Table** | P1 metric drilldowns, hierarchy grids. |
| **Observability** | **Dynatrace** (RUM) + **Mixpanel/GA4** | Beacons/events in `packages/analytics`. |
| **Monorepo tooling** | **Turborepo** or **Nx** + **pnpm workspaces** | Affected-only builds; one lockfile; path aliases in `tsconfig`. |

**BFF side (Fastify), for reference** — separate repo, same contract: Fastify + `@fastify/helmet`/`cookie`/`jwt`/`rate-limit`, Mercurius (in-process GraphQL orchestration, never public), `@azure/cosmos` SDK (primary read store), Drizzle ORM (Postgres), Redis (session/token/cache/idempotency), domain libraries (TPC/MAPA/MDRT/Persistency) selected per-LBU via Strategy + Registry. Derivation rule: read pre-computed values from Cosmos; only compute in a domain library when Cosmos lacks the field — behind the same OpenAPI response shape.

---

## 7. Deployment model — built once, deployed into each LBU's own infra

The codebase stays single; the **deployment is per-country**. One image, N isolated targets.

- **Build once, centrally** — one pipeline builds + publishes the image (`webapp:1.x`) and runs the contract/test gates. `output: 'standalone'` → one container image.
- **Deploy per LBU** — each country runs **its own deployment of that same image** inside its own cloud tenancy: own AKS, own Cosmos, own Postgres, own Redis, own PingID/Azure AD tenant, own key vault. `LBU_CODE` and all endpoints are injected per environment via `deploy/helm/values-<lbu>.yaml`.
- **Data residency** — each LBU's Cosmos/Postgres are in-country; "Cosmos is the primary store" means *that LBU's* Cosmos. No cross-border data movement. (Usually the reason for per-LBU infra: BNM in Malaysia and equivalents.)
- **Config, not code, per market** — the only per-country deltas are Helm values / env (`LBU_CODE`, BFF base URL, IdP tenant, Cosmos/Postgres/Redis endpoints, feature flags, theme/locale). Secrets never sit in the repo — they're read from each LBU's vault at deploy time.
- **Image distribution** — either a central registry that each LBU's AKS pulls from cross-tenant, or the image is mirrored into each LBU's **own** registry (ACR) and pulled locally. The mirror model fits "own infrastructure / full isolation" better. *(Decision pending platform team.)*
- **Isolation** — a bad MY deploy cannot affect PH; they're different subscriptions. Blast radius is a single country.
- **Honest caveat on "one change everywhere"** — a PR lands the *code* for every market at once, but each country deploys on **its own schedule**, so running versions can legitimately differ across LBUs at any moment. The monorepo guarantees one *source of truth*, not synchronized *releases*.

```
                    ┌─────────────────────────────────────────┐
   one PR ─▶ CI ─▶  │  build webapp:1.x  +  contract/test gates │  (central)
                    └───────────────────┬─────────────────────┘
                                        │  same image, promoted into each country
        ┌───────────────────────────────┼───────────────────────────────┐
        ▼                               ▼                                ▼
  MY infra (own sub)             PH infra (own sub)              … per LBU
  AKS + Cosmos + PG + Redis      AKS + Cosmos + PG + Redis
  values-my.yaml (LBU_CODE=my)   values-ph.yaml (LBU_CODE=ph)
  serves PAMB + PBTB             serves PH
```

---

## 8. Why this satisfies your constraints

- **Single codebase** — one `app/`, one `packages/`, one lockfile; LBUs differ only in `cdk/<feature>/<Feature><LBU>.tsx`, `config/lbu/*`, and theme/locale token sets.
- **LBU-specific routing & pages** — `app/` route shells resolve a per-LBU CDK; per-region **route manifests** (`config/routes/<lbu>.ts`, selected by `LBU_CODE` — see §4) make routes appear/disappear and scope them by persona/entity/flag. Manifest data is forked per region; the `app/` tree is not.
- **Components reused across** — all primitives/patterns/charts live in `packages/`; CDK pages compose them, never copy them.
- **A page or two common to all** — `app/(common)/…` (and the `'common'` registry fallback) cover shared pages with zero variation.
- **Env-variable driven** — `LBU_CODE` is fixed per deployment (the single switch for routes, pages, BFF endpoint, theme, locale, flags); the auth claim resolves persona and entity per request.
- **Deployed in each LBU's own infra** — one built image is shipped into each country's isolated cloud tenancy with per-environment config; data stays in-country, blast radius is one market, and the codebase stays single.
- **Persona device split** — P2/P3/P4 → `(mobile)` shell; P1 → `(desktop)` shell, chosen in middleware from the auth claim.
