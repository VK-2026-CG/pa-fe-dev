# Frontend and BFF development workflow

Invocation: `/develop-frontend <spec-id-or-jira-id> [context]`

1. Locate an accessible `PruactionSpec` repository. Resolve the exact Spec ID
   from `work-items/`; for an ambiguous Jira ID, show applicable frontend specs
   and ask the user to choose.
2. Read the entrypoint and all linked canonical screen, C2-C5, content, fixture,
   config, design and asset contracts. Verify `READY`, frontend required, no
   blocking question, and immutable handoff/spec revision consistency.
3. Read `AGENTS.md`, path-scoped frontend/security/testing instructions,
   architecture, code and tests. Inventory reusable components, DLS primitives,
   assets, BFF helpers, composers and fixtures before planning edits.
4. Run existing spec synchronization and asset/handoff automation internally.
   Never ask the user to type orchestration npm commands or edit vendored files.
5. Implement only `consumers.frontend.requiredActions` across the Next.js BFF
   and UI. Missing fields, copy, tokens, assets, states or behavior produce a
   `BLOCKED` receipt and `/update-spec`, not local invention.
6. Preserve VM imports, i18n-only visible copy, DLS boundaries, country
   isolation, entitlement, accessibility and Spec-owned asset checksums.
7. Add AC-named unit/API/E2E coverage as required. Run focused checks, then
   typecheck, all applicable Playwright suites, asset/design validation and
   build. Update the frontend receipt with exact evidence.
8. Report changed files, UI/BFF operation and AC coverage, visual/responsive/
   accessibility evidence, validation, gaps and anything not verified.