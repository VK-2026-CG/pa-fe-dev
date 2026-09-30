# CA-10 — Brochure Import

| | |
|---|---|
| Screen | `CA-10` (legacy alias `CA-DRAFT-10`) · `0.1.0` · **AI POC** |
| Route | `/contest-admin/contest-imports/:importId` |
| BFF | `POST /api/bff/v1/contest-admin/contest-imports`; `GET .../contest-imports/:importId` |
| Domain | `startContestBrochureImport`, `getContestBrochureImport` |
| Fixtures | `brochure-import-processing.json`, `brochure-import-completed.json` |
| Algorithm/security | `domains/contests/import/brochure-ai-draft.md` |

## 1. Purpose

Upload an approved PDF brochure, follow server-owned extraction/validation
progress through reload, and open the complete generated contest `DRAFT` for
mandatory business review. The screen never parses the PDF, calls an inference
provider, or receives raw extraction/model content.

## 2. Traceability

| UI | VM | C2 | Storage |
|---|---|---|---|
| upload result | `StartContestImportResultVM` | `ContestBrochureImport` | private object + `contest_import_jobs` |
| status/stage/progress | `ContestImportVM` | import status/stage | import job |
| issue counts | `issueSummary` | safe counts | validation/import job |
| generated draft | `result`, `result.nav` | result refs | `contests`, `contest_versions` |
| brochure view | `brochure.downloadNav` after completion | existing brochure GET | private object |

The BFF streams multipart bytes without JSON/base64 conversion, applies its own
body limit, forwards the server-resolved identity and idempotency key, and never
logs the filename/body. Only domain-returned `downloadNav` is rendered.

## 3. Interactions and states

The Portfolio Create dialog offers two explicit starts: Blank contest and Create
from brochure. Brochure mode accepts one PDF, displays selected filename/size,
the configured limit and an AI POC/data-processing notice, then POSTs multipart.
Success navigates to this route using `statusNav`; refresh/back/forward reload the
same import. Upload cannot be silently converted to blank creation.

The screen maps `stageCode` to an ordered stepper: Upload, Inspection,
Extraction, Validation, Draft creation and Complete. `progressPct` and stage come
only from the BFF. Polling uses bounded backoff, pauses when the document is
hidden, stops in terminal state and offers a manual retry of polling after a
network error. Unknown status/stage renders a safe processing fallback with the
trace ID; it never assumes completion.

`COMPLETED` shows DRAFT status, business-review warning, errors/warnings/
unresolved counts, Review draft (primary) and View brochure when downloadNav is
present. Review uses `result.nav`. The generated builder displays source/review
provenance and the existing nested plain-English rule boxes.

Terminal states:

- `NEEDS_SECURITY_REVIEW`: explain automatic creation stopped; no contest link;
- `NEEDS_INPUT`: explain brochure terms need correction/clarification;
- `FAILED`: stable `problem.messageKey`, trace ID and retryability; no raw provider error;
- `CANCELLED`: terminal, no implied draft;
- denied/not found: standard Contest state without leaking cross-tenant existence.

The POC copy must not claim malware scanning, Azure OpenAI, in-country residency,
production auth, CSRF, DLP, rate limiting, automatic correctness or approval.

## 4. Accessibility and analytics

Upload control has associated label/help/error. Progress uses a named `<progress>`
and polite status region; terminal failure uses alert focus. The stepper does not
use color alone. Buttons retain focus across state updates. WCAG 2.2 AA applies.

Events: `contest_import_started`, `contest_import_status_viewed`,
`contest_import_draft_opened`; safe properties are status/stage, issue counts and
duration bucket only. Never send filename, PDF/model text, codes from the
brochure, thresholds, rewards, rule expressions or object/provider identifiers.

## 5. Acceptance criteria

- **AC-CA-AI-UI-01** Create offers blank and brochure paths without changing blank semantics.
- **AC-CA-AI-UI-02** PDF multipart bytes round-trip through the BFF and success navigates to the import route.
- **AC-CA-AI-UI-03** Processing state survives reload and displays only server-owned status/progress.
- **AC-CA-AI-UI-04** Completed import opens the returned DRAFT route and exposes authorized brochure view.
- **AC-CA-AI-UI-05** Generated nested rule logic renders in bracketed English groups in the builder/editor.
- **AC-CA-AI-UI-06** Security-review/refusal/incomplete/provider failure creates no implied contest action.
- **AC-CA-AI-UI-07** Unknown states fail safely and zero console/missing-i18n errors occur in all flows.
- **AC-CA-AI-UI-08** No provider secret, raw candidate, prompt, PDF content or object coordinate reaches browser state/telemetry.