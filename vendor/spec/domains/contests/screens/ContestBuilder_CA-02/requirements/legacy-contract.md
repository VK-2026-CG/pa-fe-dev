# CA-02 — Contest Builder

| | |
|---|---|
| Screen | `CA-02` (legacy alias `CA-DRAFT-02`) · `0.1.0` · **Draft** |
| Route | `/contest-admin/contests/:contestId/versions/:versionId/edit/:step` |
| BFF | `GET/PATCH .../contest-admin/contests/:contestId/versions/:versionId` → `ContestBuilderVM` |
| Domain | `getContestVersion`, `patchContestVersion`, `validateContestVersion` |
| Design | `app/page.tsx:98-230` |

## 1. Purpose and step matrix
Configure Basics, Audience, Qualification, Calculation, Rewards, Governance and
Review in one deep-linkable shell. Visited is not valid; status is domain
validation. Country config controls capabilities/order, never business values.

## 2. Traceability
| UI | VM | API | Mongo |
|---|---|---|---|
| heading/version/status | `contest`, `versionId`, `revision` | `ContestVersion` | `contests`, `contest_versions` |
| step state | `steps[]` | validation issues by path | `validation_runs` |
| fields | `configuration` | `ContestConfiguration.*` | `contest_versions.configuration` |
| health | `validation` | `ValidationReport` | `validation_runs` |
| autosave | `etag`, `autosave` | `If-Match` | version revision |
| qualification paths | `configuration.qualification.routes[]` | `RuleExpression` | `contest_versions.configuration` |
| tier ladder | `configuration.qualification.tiers[]` | ordered tiers | `contest_versions.configuration` |
| target matrix | `configuration.qualification.targets[]` | explicit cell state | `contest_versions.configuration` |
| AI import provenance/review | `configuration.provenance`, validation issues | import result + validation | `contest_import_jobs`, `contest_versions` |

The BFF command request/response types are imported from
`domains/contests/bff/contest-admin-vm.ts`; browser code must not redeclare request shapes.
Create carries only the OpenAPI fields (`code`, `nameKey`, `country`, `timezone`).
Display copy is resolved from `nameKey`, never an
undocumented `displayName` request field.

## 3. Interactions & states
Controlled schema form, autosave after idle and before navigation. Conflict
preserves local edits and offers reload/compare; never last-write-wins. Submitted
or published versions are read-only. Navigation warns on unsaved/error state.
Every field has label, required indicator, inline error and summary link.
Basics exposes optional brochure metadata and draft-only Upload/Replace PDF.
The browser never receives an object-store URL; read-only snapshots expose View
only when an `AVAILABLE` brochure is pinned.
AI-generated drafts show a persistent generated-source/business-review banner,
section review state and unresolved issue links. Extracted, server-pinned,
unresolved and subsequently user-edited values are distinguishable. Generated
nested qualification rules use the ordinary editor and bracketed English logic.
Submission remains blocked by import review issues; completion never implies
approval or provider correctness.

## 4. Acceptance criteria
- **AC-CA-02-01** All seven step URLs survive reload/back/forward.
- **AC-CA-02-02** Save sends current ETag and handles `CON-4121` without data loss.
- **AC-CA-02-03** Read-only snapshots expose no enabled mutation control.
- **AC-CA-02-04** Step status comes from issue paths, not visit history.
- **AC-CA-02-05** Required values/configured periods remain tenant data, never FE constants.
- **AC-CA-02-06** Unknown config capability is skipped with telemetry, not fatal.
- **AC-CA-02-07** Brochure upload/replace is draft-only, uses current ETag, and renders returned checksum metadata without reading PDF content.
- **AC-CA-02-08** AI-generated draft provenance and blocking review state survive reload and generated nested rules use the ordinary editor/explanation.

Qualification routes, tiers, periods, and matrix cells are tenant/version data.
The UI must preserve BFF order. A blank target is not zero: every cell carries
`EXPLICIT`, `INHERITED`, `NOT_APPLICABLE`, or `NOT_CONFIGURED`. The catalogue
shown by the current MY stub is a governed preview only; it does not change
`lovWorkbookReconciled=false` or resolve OQ-CA-09.

## 5–7
Events: `contest_builder_viewed`, `contest_step_changed`, `contest_draft_saved`,
`contest_save_conflicted`; properties IDs/status only. No configuration values.
AA keyboard/error focus; offline edits are not claimed saved. OQs 01–08 apply.
