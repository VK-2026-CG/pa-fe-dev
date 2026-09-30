# Performance Dashboard — S-P4-01

| Property  | Value                                |
| --------- | ------------------------------------ |
| Screen ID | `S-P4-01`                            |
| Package   | `PerformanceDashboard_S-P4-01`       |
| Status    | **DRAFT after structural migration** |
| Version   | `2.2.0`                              |
| Route     | `insights/performance`               |

## Purpose and existing contract

The complete behavior, traceability, states, acceptance criteria, analytics and non-functional requirements are preserved in [requirements/legacy-contract.md](requirements/legacy-contract.md).

The previous document's build-status wording predates the stricter UX package readiness gates. The package remains DRAFT until approved assets, typography, complete responsive/state contracts, reuse decisions and visual baselines are attached.

## Domain dependencies

- `domains/insights/api/insights.v1.yaml`
- `domains/insights/bff/performance-vm.ts`
- `domains/insights/config/countries/MY/performance.config.json`
- `domains/insights/common/frontend/widget-contracts.md`
- `domains/insights/data/mongodb.md`

## Three-source onboarding — SPEC-2026-001

The 1.5.0 addendum records `my_production`, `my_mapa` and `my_persistency` as
upstream schema evidence only. Pipelines retain the canonical Insights read
models; public API/VM shapes and country composition are unchanged. Exact
candidate mappings and owned blockers are in
[source-mapping.md](../../data/source-mapping.md). The data availability addendum
does not approve sources, resolve UX blockers, or enable new metrics.

See [fixture provenance](fixtures/README.md) and the
[work item](../../../../work-items/SPEC-2026-001/README.md). New acceptance IDs
AC-P4-01-89–96 cover the existing optional-value/data-state VM contract.

## Viewing mode — SPEC-2026-004 (2.1.0)

A leader opening a member from S-P4-07 sees that member's dashboard read-only
with a "Viewing {name}" banner and Exit View. See the v2.1.0 addendum in
[requirements/legacy-contract.md](requirements/legacy-contract.md)
(AC-P4-01-82–87).

## Filter copy + quick-link `disabled` field — v2.2.0

Filter section labels move from "Product"/"Time" to "Business"/"Period"
(content-only). `QuickLinkVM` gains an optional `disabled` field so a tile
can render visible-but-inert (AC-P4-01-88/88b) — not yet populated by the
BFF; the frontend's current per-scope disabling is tracked as OQ-85. The
AI Recommendations overlay's removal from the frontend render is flagged as
OQ-86, unconfirmed, ACs unchanged. See the v2.2.0 addenda in
[requirements/legacy-contract.md](requirements/legacy-contract.md).
