# Testing (Playwright)

One runner, three projects (`unit`, `e2e`, `desktop`), configured in
[`../../playwright.config.ts`](../../playwright.config.ts).
Rationale: [ADR 0003](../architecture/decisions/0003-playwright-test-platform.md),
[ADR 0004](../architecture/decisions/0004-vite-spa-and-bff-extraction.md).

| Project | Location | Needs servers | What belongs here |
|---|---|---|---|
| `unit` | `tests/unit/` | No | Pure modules: formatters, LBU config, CDK registry, i18n key scan, contest-admin rule-explanation |
| `e2e` | `tests/e2e/` | Yes | Mobile-shell (375) browser journeys + console-error assertions |
| `desktop` | `tests/e2e/` | Yes | Contest Admin + desktop-shell (1440) browser journeys |
| — | `tests/support/` | — | Persona `localStorage` seeding, BFF base URL (`bff.ts`), console watcher |

The BFF contract, lens validation, and D-14 entitlement guard tests (formerly
the `api` project here) now live in `pa-be-dev`'s own Vitest suite — the BFF
is a separate cross-origin service now, not a same-process Next.js route
(ADR 0004).

## Commands

```bash
npm run test:unit     # PW_SKIP_WEBSERVER=1 — no browser, no servers
npm run test:e2e      # e2e + desktop
npm run test:desktop  # desktop only
npm test              # all three projects
npm run test:headed   # watch the browser
npm run test:ui       # Playwright UI mode
npm run test:report   # open the last HTML report
```

Prerequisites for `e2e` / `desktop`:

```bash
npx playwright install chromium          # CI: --with-deps chromium
cd ../pa-be-dev && npm run build
```

Playwright starts the domain+BFF service (pa-be-dev, :4600) and this app's
Vite dev server (:3600) itself.

## Conventions

- **Name tests after the AC id** they lock: `(AC-P4-01-16)`, `(D-11)`, `(D-14)`.
- **Assert i18n values from the resolved bundle** (`t()` output). Period chips are
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
exactly the failure mode this setting prevents. Never leave `vite` or the
domain service running after a task.

## Never

- Reintroduce `vitest` or `scripts/smoke.sh`.
- Convert pure formatter/composer tests into browser journeys.
- Weaken an entitlement guard to make a test pass.
