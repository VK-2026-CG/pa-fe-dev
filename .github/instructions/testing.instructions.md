---
applyTo: "{tests/**/*.ts,playwright.config.ts}"
---

# Testing instructions

Canonical contract: `AGENTS.md`. Full guide: `docs/testing/playwright.md`.
Rationale: ADR 0003.

## Playwright is the only test runner

| Suite | Servers | Scope |
|---|---|---|
| `tests/unit/` | none | Pure modules: composers, formatters, MoM, LBU config, CDK registry, i18n scan |
| `tests/api/` | yes | BFF contract, lens validation, D-14 entitlement guards |
| `tests/e2e/` | yes | Browser journeys, 375-base mobile shell, console assertions |
| `tests/support/` | — | Persona helpers, API helpers, console watcher |

Never suggest `vitest`, Jest, Mocha, React Testing Library, Cypress, or a shell
smoke script. Never suggest converting a pure module test into a browser test.

## Conventions

- `import { expect, test } from '@playwright/test';` and group with
  `test.describe`.
- Include the AC id in the test title: `(AC-P4-03-09)`, `(D-11)`, `(D-14)`.
- Assert i18n **values from `vendor/spec/en.json`** — period chips are `MTD`,
  `QTD`, `YTD`. Never invent copy to make an assertion pass.
- Use `getByRole` / `getByText` first; `data-testid` only when repeated cards
  cannot be addressed by role or name.
- Scope locators inside overlays (`page.locator('.sheet').getByRole(...)`) — a
  backdrop intercepts clicks and produces misleading timeouts.
- `test.describe.serial` for suites that mutate stub preferences.
- Assert the console watcher's `errors` and `warnings` arrays are empty.

## Servers

Playwright starts the domain service (4600) and the app (3600).
`reuseExistingServer` is deliberately `false`; on a port clash, kill the stale
process instead of changing the flag. `tests/api` and `tests/e2e` require
`../pruaction-insights-service/dist`.
