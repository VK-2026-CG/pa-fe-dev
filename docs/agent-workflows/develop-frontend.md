# Frontend and BFF development workflow

Invocation: `/develop-frontend <spec-id-or-jira-id> [context]`

1. Locate the accessible `pa-spec-dev` workspace. Resolve the relevant canonical
   screen/contracts from an explicit Spec ID, route or supplied Jira context. If
   several plausible specs remain, show them and ask the user to choose.
2. Read all linked canonical screen, C2-C5, content, fixture, config, design and
   asset contracts. Handoff readiness and commit state are not prerequisites.
3. Read `AGENTS.md`, path-scoped frontend/security/testing instructions,
   architecture, code and tests. Inventory reusable components, DLS primitives,
   assets, BFF helpers, composers and fixtures before planning edits.
4. Run `npm run sync:specs` when vendored artifacts need refresh. Never ask the
   user to type orchestration commands; prefer sync over hand-editing generated
   vendored files.
5. Implement the requested UI behavior, using the spec as reference. Where
   fields, copy, tokens, assets, states or behavior are missing or differ,
   decide on the merits and update the spec afterwards if it helps others.
6. Preserve VM imports, i18n-only visible copy, DLS boundaries, country
   isolation, entitlement and accessibility.
7. Add AC-named unit/API/E2E coverage as required. Run focused checks, then
   typecheck, all applicable Playwright suites, asset/design validation and
   build. Update `CHANGELOG.md` with meaningful changes and checks.
8. Report changed files, UI/BFF operation and AC coverage, visual/responsive/
   accessibility evidence, validation, gaps and anything not verified.