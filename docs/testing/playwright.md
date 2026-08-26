# Testing (Playwright)

One runner, three projects, configured in [`../../playwright.config.ts`](../../playwright.config.ts).
Rationale: [ADR 0003](../architecture/decisions/0003-playwright-test-platform.md).

| Project | Location | Needs servers | What belongs here |
|---|---|---|---|
| `unit` | `tests/unit/` | No | Pure modules: composers, formatters, MoM (D-11), LBU config, CDK registry, i18n key scan |
| `api` | `tests/api/` | Yes | BFF contract, lens validation, D-14 entitlement guards |
| `e2e` | `tests/e2e/` | Yes | Browser journeys on the 375-base mobile shell + console-error assertions |
| — | `tests/support/` | — | Persona cookies/headers, API helpers, console watcher |

## Commands

```bash
npm run test:unit     # PW_SKIP_WEBSERVER=1 — no browser, no servers
npm run test:api
npm run test:e2e
npm test              # all three projects
npm run test:headed   # watch the browser
npm run test:ui       # Playwright UI mode
npm run test:report   # open the last HTML report
```

Prerequisites for `api` / `e2e`:

```bash
npx playwright install chromium          # CI: --with-deps chromium
cd ../pruaction-insights-service && npm run build
```

Playwright starts the domain service (4600) and the app (3600) itself.

## Conventions

- **Name tests after the AC id** they lock: `(AC-P4-01-16)`, `(D-11)`, `(D-14)`.
- **Assert i18n values from `vendor/spec/en.json`.** Period chips are
  `MTD`/`QTD`/`YTD` — not "Month to Date". Inventing copy is how these tests go
  green against the wrong UI.
- **Semantic locators first:** `getByRole`, `getByText`, `getByRole('tab', …)`.
  Add `data-testid` only when repeated cards cannot be addressed by role or name.
- **Scope locators inside overlays.** A sheet backdrop intercepts clicks, so
  target `page.locator('.sheet').getByRole('link', …)` rather than a page-wide
  match that may resolve to an element behind the overlay.
- **Serial for stateful suites.** The stub domain service holds mutable
  preferences, so customize and feedback suites use `test.describe.serial`.
- **Console must stay clean.** `watchConsole(page)` collects `console.error`,
  page errors and `[i18n] missing key` warnings; assert both arrays are empty in
  flows you touch.

## Ports

`webServer.reuseExistingServer` is **false deliberately**. If you see
`http://127.0.0.1:4600/healthz is already used`, a stale process is squatting the
port — kill it:

```bash
lsof -ti tcp:4600 | xargs kill
lsof -ti tcp:3600 | xargs kill
```

Do not flip the flag to `true`. Silently testing against a different build is
exactly the failure mode this setting prevents. Never leave `next dev` or the
domain service running after a task.

## Never

- Reintroduce `vitest` or `scripts/smoke.sh`.
- Convert pure formatter/composer tests into browser journeys.
- Weaken an entitlement guard to make a test pass.
