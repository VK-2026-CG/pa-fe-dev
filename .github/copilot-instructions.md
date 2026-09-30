# GitHub Copilot instructions — pruaction-app

**Read `AGENTS.md` in the repository root first — it is the shared contract and
it wins over this file.** These notes only describe how Copilot should apply it.
Path-scoped additions live in `.github/instructions/*.instructions.md`.

## Project

Next.js 15 (App Router, React 19, TypeScript strict) implementing the PRUAction
Performance module: the UI **and** the BFF route handlers under
`src/app/api/bff/v1/*`. The domain service is a separate Fastify app on
`http://localhost:4600`.

Contracts are **vendored** in `vendor/spec/` (`@spec/performance-vm`, `en.json`,
MY screen config). Specs win over code. Never redeclare a view-model type and
never hand-write contract shapes — import them.

## Specs

Read canonical contract files from the accessible `pa-spec-dev` working tree and
run `npm run sync:specs` to refresh vendored artifacts, including uncommitted
spec edits. Handoffs and receipts are historical records, not development gates.
Do not hand-edit generated vendored contracts; update the spec source and record
meaningful frontend changes in `CHANGELOG.md`.

Use `/develop-frontend <SPEC-ID-or-JIRA-ID>` and
`/fix-frontend-bug <BUG-JIRA-ID> [SPEC-ID]`. Shared workflows under
`docs/agent-workflows/` resolve the Spec workspace and run synchronization,
receipts and validation internally. Bug localization follows UI -> BFF ->
backend -> data/config and must not assume a browser symptom is a UI defect.

## Layer direction (never invert)

```
src/app/**/page.tsx   routing only: read route inputs, resolveCdk(), render
src/cdk/<feature>/    the page itself: state, data loading, layout
src/components/       reusable widgets
src/dls-stub/         the only styled layer (DLS swap target)
src/headless/         behavior + accessibility, zero styling
```

- Do not put fetching, composition or market branching in a route file.
- Do not create `src/screens/` — pages belong in `src/cdk/`.
- Do not import `@/cdk` or `@/app` from `components`, `dls-stub`, `headless` or
  `lib`.

## Non-negotiables

- **i18n:** every user-visible string goes through `t('insights.…')`. New copy
  requires the key in `vendor/spec/en.json` *and* the spec repo, in lockstep.
  `tests/unit/i18n.spec.ts` fails the build on unknown keys.
- **Styling:** raw colors and sizes live only in `src/dls-stub/dls.css`.
- **Money:** decimal strings end to end; format with `src/lib/format.ts`.
  `parseFloat` on money is rejected in review.
- **Entitlement:** enforce D-14 in `src/lib/bff.ts` (TEAM ⇒ leader, GROUP ⇒ P2,
  else 403). UI gating is advisory; the BFF decides. Never weaken a guard to make
  a screen or test pass.
- **Security claims:** auth here is a stub `pa_persona` cookie. CSRF, CSP, rate
  limiting and IdP integration are **not** implemented — see
  `docs/security/README.md` before asserting anything about security.

## Testing (Playwright only)

| Suite | Purpose |
|---|---|
| `tests/unit/` | Pure modules — composers, formatters, config, i18n scan. No servers. |
| `tests/api/` | BFF contract, lens validation, entitlement guards. |
| `tests/e2e/` | Browser journeys, 375-base mobile shell, console-error checks. |

- Never suggest `vitest`, Jest, React Testing Library or a shell smoke script.
- Name tests after the AC id they lock.
- Assert i18n **values from `vendor/spec/en.json`** — period chips are `MTD`,
  `QTD`, `YTD`.
- Use `test.describe.serial` for suites that mutate stub preferences.
- Prefer `getByRole`/`getByText`; `data-testid` only when unavoidable.

## Validate before proposing completion

```bash
npm run typecheck
npm run test:unit
npm run test:api
npm run test:e2e
npm run build
```

`test:api`/`test:e2e` need `../pruaction-insights-service/dist` built. Generated
code is a reviewed scaffold: never auto-merge it, and state anything you could
not verify.

## Reference

`docs/architecture/README.md` · `docs/architecture/decisions/` ·
`docs/security/README.md` · `docs/testing/playwright.md` ·
`docs/design/figma-measurements.md`
