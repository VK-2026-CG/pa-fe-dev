# CA-01 — Contest Portfolio

| | |
|---|---|
| Screen ID / Version | `CA-01` (legacy alias `CA-DRAFT-01`) · `0.1.0` · **Draft** (OQ-CA-01) |
| Route | `/contest-admin/contests` |
| BFF | `GET /api/bff/v1/contest-admin/portfolio` → `ContestPortfolioVM` |
| Domain | `getContestOverview`, `listContests` |
| Design | configurator source `app/page.tsx:70-95`; Figma/DLS mapping OQ-CA-02/03 |
| Fixture | `domains/contests/common/fixtures/portfolio.json` |

## 1. Purpose
Find, filter, create and open governed contests; surface review, validation,
publication and daily-calculation attention without deriving counts in the UI.

## 2. Traceability
| # | UI | VM | API | Mongo |
|---|---|---|---|---|
| 1 | cycle metrics | `metrics[]` | `ContestOverview.metrics` | aggregated `contests`/approvals/runs |
| 2 | attention | `attentionItems[]` | `attentionItems` | validation/approval/run state |
| 3 | contest rows | `contests[]` | `ContestPage.items[]` | `contests` |
| 4 | status/search/page | `filters`, `page` | query + `PageMeta` | list indexes |

## 3. Interactions & states
Search name/code/owner after debounce; filters and cursor live in URL. Opening a
row carries its own IDs. Create offers a blank draft or, when C4
`aiBrochureDraftImport=true`, the AI POC brochure flow from `CA-DRAFT-10`; reuse
of a prior contest is Historic contests → Reactivate, never a template. States: skeleton,
empty-filter, no contests, partial attention, stale/error with trace ID, denied,
and mobile semantic cards. Unknown status uses generic label and preserves row.

## 4. Acceptance criteria
- **AC-CA-01-01** Search/filter/page values round-trip through URL and domain query.
- **AC-CA-01-02** Opening a row uses that row's contest/version IDs.
- **AC-CA-01-03** API metrics—not visible-row counts—drive summary cards.
- **AC-CA-01-04** Partial attention failure leaves contest list usable.
- **AC-CA-01-05** Unknown status renders safely and remains filterable by raw code.
- **AC-CA-01-06** Search is case-insensitive over the authorized code/name/owner projection; filtered page count changes but overview metrics remain portfolio-wide.
- **AC-CA-01-07** Create distinguishes blank from brochure import; disabling the C4 capability removes only brochure import.

## 5. Analytics / 6. NFR
`contest_portfolio_viewed {resultCount}` · `contest_row_opened {status}` ·
`contest_create_started {origin}`. Never agent/policy data, amounts, owner names
or search text. BFF p95 target is OQ-CA-16; WCAG 2.2 AA; cursor page ≤100.

## 7. Open questions
OQ-CA-01 IDs; OQ-CA-02 Figma; OQ-CA-03 DLS; OQ-CA-16 volumes/SLO.
