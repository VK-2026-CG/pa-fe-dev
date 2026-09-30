# Customize Metrics — S-P4-04

| Property | Value |
|---|---|
| Screen ID | `S-P4-04` |
| Package | `CustomizeMetrics_S-P4-04` |
| Status | **DRAFT after structural migration** |
| Version | `2.1.0` |
| Route | `insights/customize-metrics` |

## Purpose and existing contract

The complete behavior, traceability, states, acceptance criteria, analytics and non-functional requirements are preserved in [requirements/legacy-contract.md](requirements/legacy-contract.md).

The previous document's build-status wording predates the stricter UX package readiness gates. The package remains DRAFT until approved assets, typography, complete responsive/state contracts, reuse decisions and visual baselines are attached.

The v1.4.0 addendum adds the overlay's first responsive geometry contract
(bottom sheet on mobile, side sheet on tablet/desktop — new widget
`w.customize.overlay`), superseding the prior unversioned full-height page
treatment. v1.4.1 corrects two visual details (selected-row border color,
Priority Metrics shaded section header) against a production PRUForce
screenshot. v1.5.0 closes `OQ-26` (that same screenshot evidence confirms
the tablet geometry) and adds the persistent-overlay requirement: at
tablet/desktop the overlay now renders in place over the still-mounted
Performance Dashboard rather than through a route navigation — mobile is
unaffected and keeps its existing route-based bottom sheet. v2.0.0
(`SPEC-2026-003`, breaking) makes New Recruit Contracted an Other Focus
Metric at TEAM too, so MY TEAM has 8 locked priority rows instead of 9
(AC-P4-04-38–40; AC-P4-04-08 superseded). v2.1.0 removes both sections'
subheading copy (`AC-P4-04-42`); the Priority Metrics `shaded` band's
removal is unconfirmed and flagged as `OQ-87`.

## Domain dependencies

- `domains/insights/api/insights.v1.yaml`
- `domains/insights/bff/performance-vm.ts`
- `domains/insights/config/countries/MY/performance.config.json`
- `domains/insights/common/frontend/widget-contracts.md`
- `domains/insights/data/mongodb.md`
