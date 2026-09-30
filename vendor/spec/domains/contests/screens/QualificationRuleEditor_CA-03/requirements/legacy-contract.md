# CA-03 — Qualification Rule Editor

| | |
|---|---|
| Screen | `CA-03` (legacy alias `CA-DRAFT-03`) · `0.1.0` · **Draft** |
| Route | `/contest-admin/contests/:contestId/versions/:versionId/rules/:ruleId` |
| BFF | builder mutation + `RuleEditorVM` |
| Domain | `patchContestVersion`, `startContestSimulation` |
| Design | `app/page.tsx:233-240` |

## 1. Purpose
Author typed ANY/ALL/NOT production and quality rules, options and test cases
without executable code. Catalog constrains metrics/operators/value types.

## 2. Traceability
Expression/option fields map `RuleEditorVM.expression/options` →
`ContestConfiguration.qualification` → `contest_versions.configuration`;
test metrics/node outcomes map `Simulation` → `simulation_runs/results`.

## 3. Interactions & states
Accessible modal/page traps focus and restores it. Add/remove/reorder conditions;
validate depth/node limits; save only a draft. Test displays each node, selected
tier, rejected routes and engine/config checksum. Unknown metric blocks save.

The editor recursively renders `ALL`, `ANY`, and `NOT` groups and typed
predicates. Metric catalogue metadata controls the available operators and
operand control. Server issues use `/expression/nodes/{nodeId}/…` paths so
errors survive reorder and can focus the exact control. Analytics may contain
node counts and catalogue codes, never operand values or rule text.

## 4. Acceptance criteria
- **AC-CA-03-01** ANY threshold plus ALL gates serializes to the canonical AST.
- **AC-CA-03-02** Invalid operator/type and limit overflow block save with field paths.
- **AC-CA-03-03** Test result explains every node and pinned versions.
- **AC-CA-03-04** Cancel restores prior draft with no mutation.
- **AC-CA-03-05** No rule text/value appears in analytics or logs.

Events: viewed, condition-added/removed, test-started/completed, save outcome;
codes/counts only. OQ-CA-06–09/12 apply.
