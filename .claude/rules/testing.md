---
paths:
  - "tests/**"
  - "playwright.config.ts"
---

# Testing rules

Canonical contract: `AGENTS.md`. Full guide: `docs/testing/playwright.md`.
Rationale: ADR 0003.

## Playwright is the only runner

| Suite | Servers | Scope |
|---|---|---|
| `tests/unit/` | none | Pure modules: composers, formatters, MoM, LBU config, CDK registry, i18n scan |
| `tests/api/` | yes | BFF contract, lens validation, D-14 entitlement guards |
| `tests/e2e/` | yes | Browser journeys, 375-base mobile shell, console assertions |
| `tests/support/` | — | Persona helpers, API helpers, console watcher |

Never reintroduce `vitest`, Jest, React Testing Library or `scripts/smoke.sh`.

## Writing tests

- Import from `@playwright/test`; group with `test.describe`.
- Put the AC id in the title: `(AC-P4-01-16)`, `(D-11)`, `(D-14)`.
- Assert i18n **values from `vendor/spec/en.json`** — period chips are `MTD`,
  `QTD`, `YTD`, never "Month to Date". Do not invent copy to make a test pass.
- Prefer `getByRole` / `getByText`; add `data-testid` only when repeated cards
  cannot be addressed by role or name.
- Scope locators inside overlays: a sheet backdrop intercepts clicks, so query
  within `.sheet` rather than page-wide.
- Use `test.describe.serial` when the suite mutates stub preferences (customize,
  feedback).
- Assert the console watcher's `errors` and `warnings` arrays are empty for flows
  you touch.

## Servers

Playwright boots the domain service (4600) and the app (3600).
`reuseExistingServer` is **false on purpose**. On "port is already used", kill the
stale process — do not flip the flag:

```bash
lsof -ti tcp:4600 | xargs kill
lsof -ti tcp:3600 | xargs kill
```

Never leave servers running after a task. `tests/api` and `tests/e2e` require
`../pruaction-insights-service/dist`.
