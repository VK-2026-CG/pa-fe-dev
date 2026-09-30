# Contest Administration Widget Contracts

`specVersion: 0.1.0` · Props: `domains/contests/bff/contest-admin-vm.ts` · Status: Draft

| Widget ID | Props | Purpose / states |
|---|---|---|
| `w.contest.portfolio-metrics` | `ContestPortfolioVM.metrics` | loading, partial, ready |
| `w.contest.table` | `ContestSummaryVM[]` | loading, empty, error, overflow, unknown status |
| `w.contest.stepper` | `BuilderStepVM[]` | not-started, progress, valid, warning, error |
| `w.contest.health` | `ContestBuilderVM.validation` | pass, warning, blocking |
| `w.contest.form-section` | step configuration | edit, saving, saved, read-only, conflict, offline |
| `w.contest.period-editor` | qualification configuration | full, monthly, cumulative, custom routes |
| `w.contest.tier-table` | qualification tiers | empty, selected, invalid, overflow |
| `w.contest.rule-builder` | `RuleEditorVM` | edit, invalid AST, testing, explained result |
| `w.contest.credit-matrix` | calculation configuration | mapped, unknown LOV, invalid decimal |
| `w.contest.reward-card` | reward configuration | configured, missing, deprecated |
| `w.contest.validation` | `ValidationIssueVM[]` | pass, acknowledged warning, blocking |
| `w.contest.diff` | `ReviewVM.changes` | added, modified, removed, empty |
| `w.contest.approval-route` | approval stages | pending, assigned, approved, returned, rejected |
| `w.contest.approval-card` | `ApprovalVM` | due, overdue, stale, no-action |
| `w.contest.audit-timeline` | `AuditLogVM.items` | empty, loading, restricted detail |
| `w.contest.simulation` | `SimulationVM` | queued, running, completed, failed, cancelled |
| `w.contest.agent-result` | `AgentContestResultVM` | progress, qualified, failed gate, tracking, final |
| `w.contest.run-status` | `CalculationRunVM` | source wait through published/failure |

All copy uses `contest.*` i18n keys; all visuals use DLS tokens/variants. Tables
are semantic tables. Rule dialogs trap/restore focus. Unknown enum values use a
generic code label and never expose raw untrusted text. Status never relies on
colour. Touch targets and focus meet WCAG 2.2 AA.