# ADR 0003 — Playwright is the only test runner

**Status:** Accepted

## Context

Testing was split across two tools: Vitest for module tests and
`scripts/smoke.sh` (Bash + `curl` + inline Python) for end-to-end checks. The
shell suite asserted JSON with Python expressions, required Python on every
machine, aborted at the first failure, and never exercised the UI — it only
checked that pages returned HTTP 200.

## Decision

Playwright Test is the single runner, with three projects in
`playwright.config.ts`.

| Project | Location | Purpose |
|---|---|---|
| `unit` | `tests/unit/` | Pure modules: composers, formatters, MoM, LBU config, CDK registry, i18n key scan. No browser, no servers. |
| `api` | `tests/api/` | BFF contract + D-14 entitlement guards via the `request` fixture. Replaces the shell smoke. |
| `e2e` | `tests/e2e/` | Browser journeys on the 375-base mobile shell, with console-error assertions. |

Helpers live in `tests/support/` (persona cookies/headers, API helpers, console
watcher).

Rules:

- **Never reintroduce `vitest` or `scripts/smoke.sh`.**
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
