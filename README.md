# pruaction-app

Vite + React Router SPA implementing the PRUAction **Performance module** —
all P4 screens (Dashboard S-P4-01, Metric Detail S-P4-02, Historical Data
S-P4-03, Customize Metrics S-P4-04), the S-P23-01 AI recommendations panel,
Contest Administration, and the two **draft** packs (Milestones & Benefits
S-P4-05, Comp & Ben S-P4-06). The BFF that composes spec view-models from the
Insights and Contest domain services now lives in the sibling `pa-be-dev`
repo (see [ADR 0004](docs/architecture/decisions/0004-vite-spa-and-bff-extraction.md));
this app calls it over HTTP at `/api/bff/v1/...`. Specs live in the separate
`pruaction-spec` repo (vendored under `vendor/spec/`, v1.3.0).

## Agent workflow

Add `pa-spec-dev` to the VS Code workspace or make it accessible to Claude
Code, then use:

```text
/develop-frontend PRU-1234-SP02
/fix-frontend-bug PRU-5682 PRU-1234-SP02
```

The same commands work in Copilot and Claude. Agents resolve canonical Spec
Markdown/contracts, sync directly from the spec working tree, and report AC plus
visual/accessibility evidence. Bug commands trace UI, BFF, backend, data
and configuration and redirect ownership rather than hiding upstream defects.
See `docs/agent-workflows/`.

## Run it
```bash
# 1) domain service + BFF (sibling repo — pa-be-dev, pruaction-insights-service)
cd ../pa-be-dev && npm install
MONGODB_URI='' HOST=127.0.0.1 PORT=4600 npm run dev              # :4600

# 2) this app (SPA only — no server-side pieces)
npm install
npm run dev                                                      # :3600
open http://localhost:3600                                       # → /insights/performance
```
Switch personas from the header dropdown: **P2 Leader** (default — scope
switcher, Direct/Group toggle), **P3 Leader** (Group blocked, 403 by
design), **P4 Agent**, and the **EMPTY / PROCESSING** demo agents that force
the designed metric-detail states. The selection lives in `localStorage`
(`src/lib/usePersona.tsx`) and travels to pa-be-dev as an `x-persona` request
header on every BFF call (`src/lib/apiClient.ts`) — set `VITE_BFF_URL` if
pa-be-dev isn't at the default `http://localhost:4600`.

When pa-be-dev uses `INSIGHTS_DATA_SOURCE=performance`, configure this SPA with
an agent from the backend's `INSIGHTS_MOCK_AGENTS_FILE` allowlist. These values
are a development mock identity, not credentials:

```dotenv
VITE_PERFORMANCE_AGENT_ID=1000096
VITE_PERFORMANCE_TENANT=MY
```

Restart Vite after changing either value. Performance BFF requests will then
carry `x-agent-id` and `x-tenant`. Direct navigation to port 4600 cannot supply
those headers and is expected to return 401.

### Browse the imported source samples

The reported "No Data Available" dashboard was caused by requesting ALL while
the imported mock profile supports INSURANCE. A configured fixed identity now
starts the dashboard with SELF/INSURANCE/STANDARD/YTD rather than ALL.

For explicit switching between the supplied production, MAPA and persistency
agents, set `VITE_PERFORMANCE_MOCK_SAMPLES_FILE` to a local JSON array of
`{ id, kind, agentId }` profiles (`kind`: PRODUCTION, MAPA or PERSISTENCY).
The configured file is ignored under `data/performance-mocks/`; raw source data
is never copied into the frontend. Restart Vite after changing configuration.

The **Development data sample** selector appears in the dashboard header in the
development server only. Production starts SELF/INSURANCE/YTD; MAPA/persistency
start TEAM/GROUP/INSURANCE/YTD. Selection survives reload and detail navigation.
Profiles select different agents; missing metrics stay unavailable. No backend
authorization, ALL semantics or metric values are changed by the browser.
Contest requests never carry the selected Performance identity.

`npm run test:mock` runs mobile/desktop browser tests against the running Mongo
API on port 4600, using a separately owned Vite process on port 3602. Standard
browser tests run against isolated offline fixtures with mock settings disabled;
`APP_PORT`/`SVC_PORT` can use spare ports without replacing running dev servers.
Production builds exclude the development sample list/selector configuration.

A `BFF-5020` response with `detail: "fetch failed"` means pa-be-dev can't
reach the Insights domain data; check `http://localhost:4600/healthz` before
debugging the dashboard route. `INSIGHTS_API_URL`/`CONTESTS_API_URL` are
pa-be-dev's env vars now — this app never reads them.

Contest Administration calls pa-be-dev's BFF routes the same way Performance
does, carrying `x-contest-actor`/`x-contest-tenant` headers alongside
`x-persona` (unverified — see ADR 0004). Portfolio, contest creation and
version editing, validation/review/submission, approvals, simulations,
historic contests, audit reads, and reusable-rule flows all go through the
BFF; the browser never calls a domain-service URL directly. Audit export is
not exposed because Contest API `0.2.0-draft` does not define that operation.

The six reviewed MY 2026 circular definitions and the `export:contests`
tooling that regenerates their checksum-pinned import file now live in
pa-be-dev (`src/bff/contest-admin/imported-contests.ts`) — this app only
keeps the pure, client-rendered pieces of Contest Admin config
(`src/lib/contest-admin/config.ts`, `src/lib/contest-admin/rule-explanation.ts`).

## Verify
```bash
npm run typecheck
npm run test:unit    # pure module tests: formatters, contest config/rule-explanation, LBU/CDK, i18n scan
npm run test:e2e     # mobile and desktop browser journeys, including console-error checks
npm test             # both Playwright projects (unit needs no servers; e2e boots pa-be-dev + this app)
npm run build
```
BFF contract, Contest-domain integration, and entitlement tests now live in
`pa-be-dev`'s own Vitest suite (`cd ../pa-be-dev && npm test`) — see
[ADR 0004](docs/architecture/decisions/0004-vite-spa-and-bff-extraction.md).

`test:e2e` needs the sibling domain service built (`cd ../pa-be-dev && npm run
build`) — Playwright boots it and this app's Vite dev server. Browsers: `npx
playwright install chromium`. Debug with `npm run test:headed`, `npm run
test:ui`, `npm run test:report`.

## Documentation

| Topic | Where |
|---|---|
| Architecture (current layering + gaps) | [`docs/architecture/README.md`](docs/architecture/README.md) |
| Decisions (ADRs) | [`docs/architecture/decisions/`](docs/architecture/decisions/README.md) |
| Security | [`SECURITY.md`](SECURITY.md) · [`docs/security/`](docs/security/README.md) |
| Testing | [`docs/testing/playwright.md`](docs/testing/playwright.md) |
| Design measurements | [`docs/design/figma-measurements.md`](docs/design/figma-measurements.md) |
| Agent rules (shared) | [`AGENTS.md`](AGENTS.md) |
| Claude / Copilot entry points | [`CLAUDE.md`](CLAUDE.md) · [`.github/copilot-instructions.md`](.github/copilot-instructions.md) |

## Layout
`src/router.tsx` is the **routing layer only** — a data-driven route table
(insights features flat, Contest Admin nested with `:contestId`-style params)
that resolves a page from `src/cdk` and forwards `useSearchParams()`/
`useParams()` plus the client-side persona. `src/config/lbu.ts` validates the
deployment-scoped `VITE_LBU_CODE` and owns the per-market route/feature
manifest (unknown code → fail closed; disabled feature → `resolveCdk` throws,
caught by the router's `errorElement` as a 404).
**`src/cdk` is the page layer**: one folder per feature holding the screen
itself. This repository currently vendors only MY specs, so every registered
page is named `<Feature>MY.tsx` and registered under `my`; the registry retains
a `Common` fallback for future pages proven identical across supported LBUs.
`src/lib` (i18n · string-money formatters · typed config · persona
catalogue/context · `apiClient` BFF fetch wrapper) · `src/components` (widget
library: cards, gauges, bars, breakdown table, reco panel, sheets). The BFF
route handlers, entitlement guards, and view-model composers now live in
`pa-be-dev`'s `src/bff/**` — see
[ADR 0004](docs/architecture/decisions/0004-vite-spa-and-bff-extraction.md).
`src/dls-stub/dls.css` holds the DLS tokens — the only file with raw values;
`src/globals.css` just imports it.

Layer order: `router` → `cdk` → `components` → `dls-stub` → `headless`. Adding a
market = a `config/lbu.ts` entry + its CDKs + spec — no fork of `src/router.tsx`,
`src/components`, `src/headless` or `src/dls-stub`. Full picture and known gaps:
[`docs/architecture/README.md`](docs/architecture/README.md).

## UI layering: headless/ vs dls-stub/ (DLS swap contract)

- `src/headless/` — behavior-only primitives (Carousel, Collapse, Tabs, Switch,
  Checkbox, Layer, RadioGroup). No colors, sizes, or classes of their own.
- `src/dls-stub/` — **the only styled layer**: `dls.css` holds every raw value
  (color tokens ⚠ screenshot-derived; geometry tokens measured from Figma —
  see `docs/design/figma-measurements.md` with node ids), `index.tsx` exports the
  skinned primitives (Icon, Tag, ProgressBar, CarouselRow, BottomSheet, SheetRow,
  ScopePill, ToggleRow, …).
- CDK pages and `src/components/*` compose those two; **to adopt the real
  Prudential DLS, replace `src/dls-stub/` (keeping export names/props) and
  swap the SVGs in `public/icons/` — nothing else changes.**

## Icons

`public/icons/{token}.svg`, rendered by `dls-stub`'s `Icon` (CSS-mask tint).
The Figma layer names identify the glyphs literally (Remix Icon + Material
ids: `trophy-fill`, `hourglass-2-line`, `arrow-right-up-line`, `More Horiz`,
`Thumb Up`, …) — `scripts/copy-icons.mjs` copies exactly those glyphs from
the `remixicon` / `@material-design-icons/svg` dev-deps. To replace with DLS
exports: `public/icons/MANIFEST.json` maps each token to its Figma node id
for `Figma:download_assets`; drop the exported SVG over the file, same name.

## Mobile & carousels (measured)

375-base fluid shell (≤480). Priority cards 308×166 / focus 280×80 /
milestones 308×238 render in scroll-snap carousels (one card + peek, 16 gap)
per the uplifted Figma frames. The AI recommendations bar ships collapsed
(44 h) by default. Full measurements: `docs/design/figma-measurements.md`.

## Country isolation

Each country is deployed independently with its own frontend, backend, MongoDB instance, storage, credentials and hostnames. `LBU_CODE` and server-only domain URLs are deployment configuration. Browser requests cannot select a country or backend, and BFF identity uses the country from `getLbuContext()`. See `.env.example`.

## Screen-ID specifications and assets

Detailed frontend requirements are vendored from Spec under
`vendor/spec/domains/<domain>/screens/`, with reusable catalogs under `vendor/spec/common/`.
Physical approved assets are synced to `public/spec-assets/` and exposed by
`src/generated/spec-assets.ts`. Run `npm run assets:validate`; never edit
these generated assets locally.

## Agent handoffs

Spec and application agents communicate through [`handoffs/`](handoffs/README.md). Use `SPEC_REF=<contract-commit> HANDOFF_REF=<handoff-commit> npm run sync:specs`, then `npm run handoff:validate`. The Web agent owns only `handoffs/outbox/receipts/`; inbound handoffs are immutable. Production builds require explicit country-specific server URLs.
