# Team Drilldown ("My Team") — S-P4-07

| Property | Value |
|---|---|
| Screen ID | `S-P4-07` |
| Package | `TeamDrilldown_S-P4-07` |
| Version | 0.3.0 (SPEC-2026-004) |
| Status | **DRAFT** |
| Route | `insights/team-drilldown` |

## Purpose and existing contract

"My Team" for Agent Leaders (AM/P2, UM/P3): direct reports with badges, goal
status and TPC/PTPC, team KPI tiles, Sort By and badge filtering, a subteam
drawer for member-leaders, and read-only viewing of any member's Performance
dashboard (S-P4-01 viewing mode). 0.2.0 supersedes the 0.1.0 Direct/Group and
hierarchy-basis selectors and the selected-member preview in the UI; their API
behaviour is retained.

The complete behavior, traceability, acceptance criteria, decisions,
telemetry, and open questions are in
[requirements/legacy-contract.md](requirements/legacy-contract.md).

0.3.0 pins the header Back action to always exit directly to
`insights/performance` via history replace (not browser back), and makes
in-screen filter/search/subteam state changes replace rather than push
(`AC-P4-07-16`) — a previously-unspecified navigation detail, additive and
UI-only.

## Domain dependencies

- `domains/insights/api/insights.v1.yaml` (1.6.0)
- `domains/insights/bff/performance-vm.ts` (1.8.0)
- `domains/insights/common/frontend/widget-contracts.md`
- `domains/insights/data/mongodb.md`
- `domains/insights/content/en.json`
- `domains/insights/config/countries/MY/team-drilldown.config.json` (0.2.0)
- `domains/insights/screens/PerformanceDashboard_S-P4-01` (viewing mode, 2.1.0)
