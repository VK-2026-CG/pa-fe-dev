# Team Drilldown fixtures

- `team-drilldown-ready.json` — 0.1.0 leader view with a selected-member
  preview (kept for compatibility; preview is superseded in the UI).
- `team-drilldown-my-team.json` — 0.2.0 AM (P2) "My Team": UMs and agents,
  badges, goal status, TPC/PTPC, subteam counts, KPI tiles, filter options
  (frames f06/f15).
- `team-drilldown-filtered.json` — `badges=MDRT,TOT,PV` (ANY-match) with
  KPI tiles recomputed over the filtered set (frame f10, D-P4-07-02).
- `team-drilldown-subteam.json` — `parentAgentId` drawer for Marcus Lee
  (frame f12).
- S-P4-01 `dashboard-viewing-member.json` — viewing mode for an agent (SELF).

Fixtures are contract-only, derived from the frames' placeholder names with
distinct agent codes; they do not claim production hierarchy provenance or
upstream badge/goal sources (OQ-79).
