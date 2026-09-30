# S-P4-07 widget contract usage

## Widgets

- `w.team-drilldown.member-list`
  - input: `TeamDrilldownVM`
  - renders header, search, Filter action, filter/sort chips, KPI tiles and
    the member grid (§3.3 of the requirements)
- `w.team-drilldown.member-card` *(0.2.0)*
  - input: `TeamMemberVM`
  - badge row · goal status · avatar/name/role/agent code · compact
    TPC/PTPC · subteam button (`directReportCount > 0`); tap → `nav`
- `w.team-drilldown.summary-tile` *(0.2.0)*
  - input: `TeamDrilldownSummaryTileVM`
  - label `insights.teamDrilldown.summary.{metricCode}` + compact value
- `w.team-drilldown.filters` *(0.2.0)*
  - input: `TeamDrilldownFilterOptionsVM` + current `filters`
  - staged Sort By radio + grouped badge checkboxes; Cancel/Confirm
- `w.team-drilldown.subteam-drawer` *(0.2.0)*
  - input: `TeamDrilldownVM` with `parent`
- `w.team-drilldown.member-summary` — **superseded (0.2.0)** by S-P4-01
  viewing mode (`w.dashboard.viewing-banner`)

## Reused widgets

- `w.sheet.filter` chrome (bottom sheet < 768, side drawer ≥ 768)
- Summary pills (S-P4-01 Product/Time chips) for the filter/sort chips
- `w.state.empty` (no search/filter results)
- `w.state.processing` (loading)

## Measured tokens (screenshot-derived, px at 1× — ÷1.3 from frames)

| Token | Value | Evidence |
|---|---|---|
| Card radius / border | 16 / 1px `#EDEDED` | f06 |
| Card padding | 16 | f06 |
| Grid gap (desktop) and panel padding | 16 | f06 |
| Avatar | 36 circle | f01, f06 |
| Badge | height 24, bg violet `#F5F3FF` text `#8B5CF6`; bg blue `#DBEAFE` text `#1D4ED8` | f06 |
| Goal status icon | check `#22C55E` · info `#F59E0B`; label `#52525B` | f06 |
| Name / secondary text | `#1A1A1A` / `#71717A`; inline divider `#E4E4E7` | f06 |
| Subteam button | 70×28, 1px `#DFDFE1`, radius 8, text `#3F3F46` | f06 |
| Search field | height 40, bg `#FCFCFC`, border `#D4D4D8` | f01, f06 |
| KPI tile | height 65, 1px `#E4E4E7`, label `#52525B`, value `#18181B` bold | f01, f06 |
| Filters/subteam drawer width (desktop) | 608 | f08, f12, f16 |
| Page background | `#F4F4F5` | f01, f06 |
