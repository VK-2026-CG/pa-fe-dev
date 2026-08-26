# PRUAction — Project Overview & Development Approach

> ## Status in this repository
>
> Platform-wide context for the whole PRUAction programme: product, markets, BFF,
> data platform, delivery approach and deployment. Most of it describes systems
> **outside** this repository.
>
> **In scope here:** the Next.js UI for the Performance module and the BFF route
> handlers under `src/app/api/bff/v1/*` that compose vendored view-models from the
> Insights domain service.
>
> **Out of scope here:** the Fastify BFF repo, Symphony DDD domain libraries,
> Cosmos DB, Databricks pipelines, `agent-kit`, and per-market cloud
> infrastructure. Contracts arrive vendored under `vendor/spec/` rather than via
> OpenAPI codegen.
>
> Frontend target structure: [`frontend-architecture.md`](frontend-architecture.md).
> What is actually implemented: [`README.md`](README.md).

## 1. What PRUAction is

PRUAction is a **sales-performance application** for insurance agents and agency leaders, delivered across multiple markets from a **single codebase**. Agents see their KPIs, pacing toward recognition programmes (MDRT, MAPA, TPC), leaderboards, and contests on **mobile**; agency and head-office leaders get agency/branch views on **tablet/desktop**.

It runs for several Lines of Business (LBUs):

| LBU | Market | Entities |
|---|---|---|
| `my` | Malaysia | PAMB + PBTB (one app serves both) |
| `ph` | Philippines | PLUK |
| `sg` / `id` / `vn` | Singapore / Indonesia / Vietnam | (roadmap) |

The same product, the same code, the same API contract — each market gets its minor variations through configuration, not forks.

### The shape of it
- **Front end** — Next.js (App Router, server-side rendered).
- **Back end** — a Fastify **BFF** (Backend-for-Frontend) with a Domain-Driven Design core.
- **Joined by** — a versioned **OpenAPI contract** that is the company standard.
- **Data** — Cosmos DB as the primary read store, projected nightly from a Databricks metric store.
- **Deployed** — into **each LBU's own cloud infrastructure**, one built image per market.

---

## 2. Architecture at a glance

```
Browser (mobile WebView / desktop)
        │  HTML streamed, opaque session cookie only
Next.js webapp  ── one app, LBU resolved per deployment ──┐
   app/ (routing only) → CDK pages (per LBU) → packages/  │  OpenAPI
   server components fetch + render server-side           │  contract
        │  HTTPS, session cookie, no CORS                  │  (company
Fastify BFF  ── Symphony DDD, internal-only ──────────────┘  standard)
   domain services · metric libraries (Strategy + Registry per LBU)
   reads Cosmos first; derives only what Cosmos lacks
        │
Cosmos DB (primary read store)  ←  Databricks Gold (metric store)
                                    16 daily pipelines, owned by LBU data team
```

Two monorepos — **webapp** and **BFF** — each built once, joined only by the contract. The BFF's domain layer is designed to be **reusable by other applications**, and its contract becomes the standard other teams build against.

---

## 3. Core principles (the non-negotiables)

**Contract-first.** Every story produces an **OpenAPI contract before code**. The front end consumes generated types; it never hand-writes a contract. A breaking change fails every consumer at PR time, so the standard enforces itself.

**Data resides in Cosmos; the BFF derives only what's missing.** Pre-computed values (MTD/QTD/YTD, goal twins, catch-up, ranks, TPC with its 25% cap, MAPA roll-up) are read from Cosmos and **never re-derived** in the front end or BFF. When a value isn't yet in Cosmos, the LBU-aware domain library computes it **behind the same contract** — and switches to read-through later when the pipeline lands the field, with zero front-end impact.

**One codebase, variation by configuration.** Markets differ only in LBU-specific CDK pages, registry entries, route manifests, and config/theme/locale. There is no per-market fork of the app.

**Reuse over rebuild.** Components, design tokens, and domain logic are shared. New work composes existing parts; it doesn't copy them. We sustained ~75–80% reuse across early sprints.

**Reusable DDD.** The BFF domain layer (Symphony DDD: Agent, Hierarchy, KpiSnapshot, Goal, Case, Award, …) is built to be lifted into other applications. LBU differences live behind a **Strategy + Registry** pattern, not in the core.

---

## 4. Development approach — the Build Factory

We build with a **contract-first, agentic squad model**: one funnel, parallel streams, one contract.

```
User Story → Architect defines the CONTRACT (FE↔BE) → Gate G sign-off
                          │
        ┌─────────────┬───┴────────┬──────────────┐
     FE stream     BE stream     Data stream     QA stream
     CDK pages     domain +      Cosmos doc +    AC → tests
     + widgets     contract impl pipeline spec   against contract
        └─────────────┴────────────┴──────────────┘
                  integrate against the one contract
```

- **The contract is the gate.** Nothing starts building until the FE↔BE contract is signed off (Gate G). The streams then work in parallel against that fixed interface.
- **Parallel streams, one source of truth.** Front end, back end, data, and QA proceed simultaneously because the contract decouples them. The release list — not backlog flags — is the ground truth for sequencing.
- **Roles and their artifacts.** Each user story is specified across four architect roles, and each maps to concrete output:

| Role | Defines | Produces |
|---|---|---|
| **Architect** | Domain contract (FE↔BE), functional + non-functional (Mixpanel, edge cases, exceptions), DFD, acceptance criteria, DoD, Figma link | the OpenAPI contract + cross-cutting requirements |
| **BE Architect** | Technical requirements, object models, contracts, sequence diagram, API contract | BFF domain services, metric libraries, OpenAPI schema |
| **FE Architect** | Technical requirements, object models, integration, CDK/widget structure | CDK pages, route shells, manifest entries, shared widgets |
| **Data Architect** | DFD, Cosmos + metric-store data model, pipeline design, execution sequence + triggers | Cosmos doc types, metric-store manifest, pipeline design (runtime owned by the LBU data team) |

- **Validate against the market schema.** Assumptions from one market are not portable. Graph nodes and code are validated against each market's physical schema before building — this caught systematically wrong V2 assumptions for MY.
- **Catalogue derived values explicitly.** Every derivation (APE = api_regular + 10% api_single, TPC 25% cap, NQA 12-month rule, contest catch-up, …) is documented so no layer silently re-derives it.

---

## 5. How a user story becomes code

We drive generation from JIRA with an **AI-assisted agent**, so a well-specified story scaffolds itself into the exact project structure.

```
JIRA user story ──(JIRA MCP server)──▶ story + attachments + Figma link
        │
   extract the user-story schema (Architect / BE / FE / Data fields)
        │   record what's present, flag what's missing
   read the structure doc to resolve target paths
        │
   generate ONLY the supported artifacts, each with a traceability header
        │
   FE: cdk/<feature>/<Feature><LBU>.tsx + route shell + manifest entry + i18n + events
   BE: OpenAPI schema + domain service + metric impls (Strategy + Registry)
   Data: Cosmos doc types + metric-store manifest + pipeline design (spec)
   Tests: one stub per acceptance criterion
        │
   coverage report: found / missing / files / data gaps + DoD checklist
```

- A story **rarely has every field** — the agent extracts as many as exist, generates what's supported, and explicitly lists assumptions and gaps. It never invents inputs.
- The agent is stored in **both AI ecosystems** the team uses — Claude and GitHub Copilot — and pulls the JIRA MCP server straight from VS Code. Generated files carry a "review before merge" header; output is a reviewed scaffold, not final code.

---

## 6. The composable model in practice

**Routing is per-LBU; pages are per-LBU; components are shared.**

- **`app/` is routing only.** Every `page.tsx` is a thin shell that resolves a page from the CDK registry — no business logic, no data fetching there.
- **CDK pages** (`cdk/<feature>/<Feature><LBU>.tsx`) are the LBU-specific page implementations, chosen at runtime by a registry keyed `feature × LBU × persona`, with a `common` fallback for pages shared across all markets.
- **Shared packages** (`packages/dls`, `packages/charts`, `packages/api-client`, `packages/i18n`, …) hold everything reused — design tokens, primitives, patterns, charts, the generated client, localisation. CDK pages compose these; they never copy them.
- **Route manifests** (`config/routes/<lbu>.ts`) declare which routes are reachable in each market, scoped by persona, entity, and feature flag. The manifest data is forked per region; the `app/` tree is not. A route the manifest disables 404s before render.
- **Persona device shells.** `LBU_CODE` is fixed per deployment; the persona (from the auth claim) selects the shell — P1 → desktop, P2/P3/P4 → mobile — and middleware rewrites the clean URL to the right shell.

The result: adding a market is a thin BFF shell + registry implementations + config and manifest entries — no new screens, no new repo, no fork.

---

## 7. Deployment model — built once, deployed per market

- **Build once, centrally.** One pipeline builds and publishes one image per monorepo, running the contract and test gates.
- **Deploy into each LBU's own infrastructure.** Every market runs its own deployment of that same image in its own cloud tenancy — own AKS, Cosmos, Postgres, Redis, identity provider, and key vault. `LBU_CODE` and all endpoints are injected per environment.
- **Data stays in-country.** Each market's Cosmos/Postgres are in-region (regulatory residency); "Cosmos is the primary store" means *that market's* Cosmos.
- **Isolation.** A bad deploy in one market cannot affect another — they are different subscriptions.
- **Honest caveat.** A PR lands the *code* for every market at once, but each market deploys on **its own schedule**, so running versions can differ at any moment. The monorepo guarantees one source of truth, not synchronised releases.

---

## 8. Tooling & AI-assisted development

- **Front end** — Next.js App Router (SSR, streaming), next-intl (localisation), Recharts (graphs), Next Data Cache + Redis-at-BFF (caching), DLS design tokens, OpenAPI codegen for the typed client.
- **Back end** — Fastify, in-process GraphQL orchestration (never public), `@azure/cosmos`, Postgres via Drizzle, Redis for session/cache/idempotency, domain libraries per LBU via Strategy + Registry.
- **Data** — Databricks (Gold metric store) projected nightly to Cosmos; 16 daily pipelines owned by the LBU data team (PRUAction scope starts at Gold).
- **AI-assisted delivery** — a JIRA MCP server + a code-generation agent stored for both Claude and Copilot, run from VS Code, scaffolding stories into the project structure.
- **Observability** — Dynatrace (RUM + APM), Mixpanel/GA4 (front-end analytics).
- **Decks & knowledge artifacts** — architecture and sprint decks plus parallel JSON/Markdown knowledge graphs, accumulated incrementally rather than rebuilt.

---

## 9. Ways of working

- **Terse, incremental, artifact-driven.** Source documents in, structured artifacts out; deliverables accumulate, they aren't rebuilt from scratch.
- **Release list is ground truth** for sequencing — cross-checked against the actual release file, not backlog MVP flags alone.
- **Sprint cadence** — R1 development compresses to five two-week sprints, then SIT and UAT; capacity rules govern the R1/R2 overlap.
- **Feature-flagged delivery** — work that isn't ready (e.g. AI insights for R1) ships behind a flag, reserved but inactive.
- **Definition of Done** travels with each story and lands in the generated PR checklist.

---

## 10. Repository map

```
pruaction-webapp/            Next.js front end (this repo)
├── app/                     routing layer only (route shells, middleware)
├── cdk/                     LBU-specific pages + registry
├── packages/                shared: dls, charts, api-client, i18n, data-access, auth, …
├── lib/lbu/                 LBU context + route-manifest gate
├── config/                  env, per-LBU config, route manifests
└── agent-kit/               JIRA MCP server + code-generation agent (Claude + Copilot)

pruaction-bff/               Fastify BFF (separate repo)
└── libs/domain · libs/metrics · apps/bff-<lbu> thin shells

@org/api-contract            the OpenAPI contract — the company standard
```

See `agent-kit/pruaction-webapp-structure.md` for the full folder structure and resolution model, and `agent-kit/docs/user-story-schema.md` for the user-story field contract.
