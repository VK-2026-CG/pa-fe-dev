# CLAUDE.md — pruaction-app

Claude Code entry point. The engineering rules live in `AGENTS.md`; this file
adds only orientation and Claude-specific workflow. Path-scoped rules load from
`.claude/rules/`.

@AGENTS.md

## What this repo is

Vite + React Router SPA (React 19, TS strict) implementing the PRUAction
**Performance module** UI. The BFF (`/api/bff/v1/...`) and the domain are both
the separate `pa-be-dev` repo (`pruaction-insights-service`, Fastify)
expected on **http://localhost:4600** (`VITE_BFF_URL` to point this app
elsewhere — see [ADR 0004](docs/architecture/decisions/0004-vite-spa-and-bff-extraction.md)).

**Specs are reference, not gates.** Contracts are vendored under
`vendor/spec/` from the separate `pa-spec-dev` repo — VM types
(`@spec/performance-vm`), i18n bundle, MY screen config — see the policy below.

Stack (fixed): no state library (page-local fetch), no Tailwind — one global
stylesheet that imports the DLS stub, **Playwright for all testing** (unit +
browser; Vitest and the old shell smoke are gone — BFF contract tests live in
pa-be-dev now).

## Commands

| Task | Command |
|---|---|
| Dev server (:3600, needs pa-be-dev running) | `npm run dev` |
| Dev server on stub data (pa-be-dev `npm run dev:mock` first) | `npm run dev:mock` |
| All tests | `npm test` |
| Pure module tests (no servers) | `npm run test:unit` |
| Browser journeys (mobile + desktop) | `npm run test:e2e` |
| Debug browser tests | `npm run test:headed` · `npm run test:ui` |
| Last report | `npm run test:report` |
| Types | `npm run typecheck` |
| Build / start | `npm run build` · `npm start` |
| Re-vendor specs | `npm run sync:specs` |

## Where things live

| Layer | Path |
|---|---|
| Routing only | `src/router.tsx` |
| Pages (the screens) | `src/cdk/<feature>/<Feature><LBU\|Common>.tsx` |
| Deployment/market context | `src/config/lbu.ts` |
| Shared widgets | `src/components/` |
| Styled DLS (swap target) | `src/dls-stub/` |
| Behavior + a11y | `src/headless/` |
| Persona context/storage | `src/lib/usePersona.tsx` |
| BFF fetch wrapper | `src/lib/apiClient.ts` |

BFF composition, guards, and route handlers moved to pa-be-dev's `src/bff/**`
— see ADR 0004.

Docs: `docs/architecture/README.md` · `docs/architecture/decisions/` ·
`docs/security/README.md` · `docs/testing/playwright.md`

## Personas

Client-side persona in `localStorage`, switchable from the header dropdown —
LEADER_P2 (default, sees everything incl. Group toggle), LEADER_P3 (Direct
only), AGENT_P4, plus AGENT_EMPTY / AGENT_PROCESSING which force the designed
metric-detail states. It travels to pa-be-dev as an `x-persona` header on
every BFF call. This is **not** real authentication; see
`docs/security/README.md`.

To see mock data for every persona / scope / period with no Mongo or local
`.env`, run `npm run dev:mock` in pa-be-dev, then `npm run dev:mock` here
(`.env.mock` blanks `VITE_PERSONA`/`VITE_PERFORMANCE_AGENT_ID` so the dropdown
drives persona).

## Specs policy

Specs (`pa-spec-dev`, vendored in `vendor/spec/`) are reference material —
requirements, contracts, copy and designs to consult and trace against. They do
not gate work. No READY/approval/handoff/receipt status is needed to implement,
change or ship behavior. When code and spec differ, decide on the merits; update
the spec afterwards if it helps others. Security, authorization, data-privacy
and environment safeguards are engineering rules independent of the spec and
still apply. `handoffs/` is a retired, historical protocol.

Use `/develop-frontend <SPEC-ID-or-JIRA-ID>` and `/fix-frontend-bug
<BUG-JIRA-ID> [SPEC-ID]` in Claude Code. Skills under `.claude/skills/` execute
the same shared workflows as Copilot and run the lower-level npm commands
internally.

## Working agreements for Claude in this repo

- Read `AGENTS.md` before changing anything; it is the contract.
- Prefer editing an existing layer over introducing a new one.
- Don't add dependencies without saying why; the stack is deliberately small.
- Before claiming done, run the gate in `AGENTS.md` — typecheck, the three test
  projects, and build — and report anything you could not verify.
- Kill stray servers on 4600/3600 rather than reusing them.
