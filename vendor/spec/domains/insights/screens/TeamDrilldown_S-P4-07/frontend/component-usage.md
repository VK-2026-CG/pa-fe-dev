# S-P4-07 component usage

## Team Drilldown reusable components

- `component.insights.team-drilldown-member-list`
  - screen placement: page body (main list) and subteam drawer body
  - input contract: `TeamDrilldownVM`
  - behavior: search + sort + badge filter + KPI tiles + member cards
- `component.insights.team-drilldown-member-card` *(0.2.0)*
  - input contract: `TeamMemberVM`; shared by main list and subteam drawer
- `component.insights.team-drilldown-filters` *(0.2.0)*
  - input contract: `TeamDrilldownFilterOptionsVM`
- `component.insights.dashboard-viewing-banner` *(0.2.0, rendered by S-P4-01)*
  - input contract: `DashboardViewingVM`
- ~~`component.insights.team-drilldown-member-summary`~~ — superseded (0.2.0)

## Backing widget references

- `w.team-drilldown.member-list`, `w.team-drilldown.member-card`,
  `w.team-drilldown.summary-tile`, `w.team-drilldown.filters`,
  `w.team-drilldown.subteam-drawer`, `w.dashboard.viewing-banner`
