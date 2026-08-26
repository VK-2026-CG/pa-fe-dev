# pruaction-app

Next.js 15 implementation of the PRUAction **Performance module** — all P4
screens (Dashboard S-P4-01, Metric Detail S-P4-02, Historical Data S-P4-03,
Customize Metrics S-P4-04), the S-P23-01 AI recommendations panel, and the
two **draft** packs (Milestones & Benefits S-P4-05, Comp & Ben S-P4-06) —
plus the BFF that composes spec view-models from the Insights domain
service. Specs live in the separate `pruaction-spec` repo (vendored under
`vendor/spec/`, v1.3.0).

## Agent workflow

Add `PruactionSpec` to the VS Code workspace or make it accessible to Claude
Code, then use:

```text
/develop-frontend PRU-1234-SP02
/fix-frontend-bug PRU-5682 PRU-1234-SP02
```

The same commands work in Copilot and Claude. Agents resolve canonical Spec
Markdown/contracts, run synchronization and validation internally, and report
AC plus visual/accessibility evidence. Bug commands trace UI, BFF, backend, data
and configuration and redirect ownership rather than hiding upstream defects.
See `docs/agent-workflows/`.

## Run it
```bash
# 1) domain service (sibling repo)
cd ../PruactionBackend && npm install
MONGODB_URI='' HOST=127.0.0.1 PORT=4600 npm run dev              # :4600

# 2) this app
npm install
npm run dev                                                      # :3600
open http://localhost:3600                                       # → /insights/performance
```
Switch personas from the header dropdown: **P2 Leader** (default — scope
switcher, Direct/Group toggle), **P3 Leader** (Group blocked, 403 by
design), **P4 Agent**, and the **EMPTY / PROCESSING** demo agents that force
the designed metric-detail states. `INSIGHTS_API_URL` overrides the service
URL.

The Performance BFF defaults to `http://localhost:4600/insights/v1`. A
`BFF-5020` response with `detail: "fetch failed"` means the domain service is
not reachable; check `http://localhost:4600/healthz` before debugging the
dashboard route. Use `INSIGHTS_API_URL` only when the service is bound to a
different host or port.

Contest Administration uses a separate server-only client. `CONTESTS_API_URL` is required by that client and must be the country-specific backend URL; there is no shared production or localhost fallback. Portfolio, contest creation and
version editing, validation/review/submission, approvals, simulations, historic contests,
audit reads, and reusable-rule flows call Fastify through the BFF; the browser
never receives or calls the domain-service URL. Audit export is not exposed
because Contest API `0.2.0-draft` does not define that operation.

The six reviewed MY 2026 circular definitions are maintained in
`src/lib/contest-admin/imported-contests.ts`. Regenerate the backend-owned,
checksum-pinned import file after changing a definition or governed LOV:

```bash
npm run export:contests
cd ../PruactionBackend
npm run db:import:contests -- --dry-run # validates every nested route and LOV
npm run db:import:contests              # requires MONGODB_URI; idempotent upsert
```

The importer creates contest drafts for governed review; it does not publish
them or fabricate agent progress. Agent results remain source-lineage-backed
outputs of calculation runs.

## Verify
```bash
npm run typecheck
npm run test:unit    # pure module tests: formatters, composers, contest config, LBU/CDK, i18n scan
npm run test:api     # BFF contract, Contest-domain integration, and entitlement tests
npm run test:e2e     # mobile and desktop browser journeys, including console-error checks
npm test             # all three Playwright projects
npm run build
```
`test:api` / `test:e2e` need the sibling domain service built
(`cd ../PruactionBackend && npm run build`) — Playwright boots it and
the app itself. Browsers: `npx playwright install chromium`. Debug with
`npm run test:headed`, `npm run test:ui`, `npm run test:report`.

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
`src/app/insights/*` is the **routing layer only** — each `page.tsx` reads its
route inputs (search params, persona cookie) and resolves a page from
`src/cdk`. `src/config/lbu.ts` validates the deployment-scoped `LBU_CODE`
and owns the per-market route/feature manifest (unknown code → fail closed).
**`src/cdk` is the page layer**: one folder per feature holding the screen
itself. This repository currently vendors only MY specs, so every registered
page is named `<Feature>MY.tsx` and registered under `my`; the registry retains
a `Common` fallback for future pages proven identical across supported LBUs.
`src/lib` (i18n ·
string-money formatters · typed config · persona stub · domain client) ·
`src/lib/compose` (dashboard / metric-detail / history / customize — pure,
VM-typed) · `src/app/api/bff/v1` (route handlers + entitlement guards + draft
stubs) · `src/components` (widget library: cards, gauges, bars, breakdown
table, reco panel, sheets). `src/dls-stub/dls.css` holds the DLS tokens — the
only file with raw values; `src/app/globals.css` just imports it.

Layer order: `app` → `cdk` → `components` → `dls-stub` → `headless`. Adding a
market = a `config/lbu.ts` entry + its CDKs + spec — no fork of `src/app`,
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
