# ADR 0003 — Playwright is the only test runner

**Status:** Accepted

## Context

Testing was split across two tools: Vitest for module tests and
`scripts/smoke.sh` (Bash + `curl` + inline Python) for end-to-end checks. The
shell suite asserted JSON with Python expressions, required Python on every
machine, aborted at the first failure, and never exercised the UI — it only
checked that pages returned HTTP 200.

## Decision

Playwright Test is the single runner in `playwright.config.ts`.

| Project | Location | Purpose |
|---|---|---|
| `unit` | `tests/unit/` | Pure modules: formatters, LBU config, CDK registry, i18n key scan, rule explanation. No browser, no servers. |
| `e2e` | `tests/e2e/` | Browser journeys on the 375-base mobile shell, with console-error assertions. |
| `desktop` | `tests/e2e/` | Contest Admin + desktop-shell journeys at the 1440 breakpoint. |

Helpers live in `tests/support/` (persona `localStorage` seeding, console
watcher).

> Since ADR 0004, the BFF contract/entitlement suite (formerly the `api`
> project, `tests/api/`) and the unit specs for the modules that moved with it
> (`compose`, `contest-admin` domain plumbing) live in **pa-be-dev**'s own
> Vitest suite — the BFF is no longer same-process with this app, so it can no
> longer be exercised as a Playwright project here. See
> [0004](0004-vite-spa-and-bff-extraction.md).

Rules:

- **Never reintroduce `vitest` or `scripts/smoke.sh` _in this repo_.** (pa-be-dev
  runs its own Vitest suite, including the BFF specs that moved there under
  ADR 0004 — that is not a violation of this rule.)
- Unit tests run without servers: `npm run test:unit` sets `PW_SKIP_WEBSERVER=1`.
- Playwright owns service orchestration and boots both the domain service (4600)
  and the app (3600).
- `webServer.reuseExistingServer` is **false on purpose**. A stale process must
  fail loudly instead of serving a different build. Kill the squatter; do not
  flip the flag.
- Assert i18n **values from `vendor/spec/en.json`** — period chips are
  `MTD`/`QTD`/`YTD`, not "Month to Date".
- Suites that mutate stub state (customize, feedback) use
  `test.describe.serial`.
- Prefer semantic locators; add `data-testid` only when repeated cards cannot be
  addressed by role or name.

## Consequences

- One runner, one reporter, traces/screenshots/video on failure, no Python.
- Every AC id from the old shell suite is preserved in a test title, plus new
  lens-validation cases the shell suite never covered.
- Real interaction coverage: period sheet, tabs, reco panel, sheets, persona
  entitlements, empty/processing states, history paging, customize save.
- Unit tests stay pure module tests. Converting them to browser journeys would
  be slower and would lose edge cases such as decimal money strings beyond
  `Number.MAX_SAFE_INTEGER`.
- `test:api` and `test:e2e` need the sibling service built at
  `../pruaction-insights-service/dist`.

## Alternatives considered

- **Keep Vitest for units, Playwright for E2E.** Workable, but two runners and
  two reporters for one small app.
- **Browser-only testing.** Rejected: it would lose precise formatter and
  composer coverage and make failures harder to localise.
