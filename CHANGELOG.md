# Changelog

## 2026-10-01
- Specs are reference material, not gates: rewrote AGENTS.md, CLAUDE.md, Copilot/rules/skills/workflow and handoff docs; spec asset/sync integrity mismatches now warn instead of failing (unsafe-SVG checks still fail). Security, authorization and environment safeguards unchanged.
- Filter & Selection sheet: restored the Group toggle (AC-P4-01-57) at tablet/desktop for leaders whose VM has `teamViewToggleVisible` (P2). Before, an AM could not reach the Group view above mobile. Mobile keeps its View-sheet Direct/Group selector, and the Scheme toggle stays hidden.

## 2026-09-30
- Replaced READY-handoff development requirements with direct sync from the
  canonical spec working tree; changelog and application checks remain the local
  development record.
- Validation: `npm run sync:specs` passed; typecheck/tests/build could not run
  because this checkout has no `node_modules` (`tsc` unavailable).