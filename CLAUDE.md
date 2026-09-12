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

**Specs win over code.** Contracts are vendored under `vendor/spec/` from the
separate `pruaction-spec` repo — VM types (`@spec/performance-vm`), i18n
bundle, MY screen config.

Stack (fixed): no state library (page-local fetch), no Tailwind — one global
stylesheet that imports the DLS stub, **Playwright for all testing** (unit +
browser; Vitest and the old shell smoke are gone — BFF contract tests live in
pa-be-dev now).

## Commands

| Task | Command |
|---|---|
| Dev server (:3600, needs pa-be-dev running) | `npm run dev` |
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

## Spec handoff workflow

Read `handoffs/README.md` and the matching inbound handoff before contract work. Sync its exact commit, validate it, implement only frontend actions, and update the frontend receipt. Never edit an inbound handoff or vendored contract directly.

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
