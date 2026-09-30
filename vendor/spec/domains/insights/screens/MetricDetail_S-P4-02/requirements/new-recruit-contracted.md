# New Recruit Contracted — S-P4-02 example

This document is a screen-specific specification addendum for the `NEW_RECRUIT_CONTRACTED` metric detail route in the existing `MetricDetail_S-P4-02` package.

## Identity

- Screen ID: `S-P4-02`
- Package: `MetricDetail_S-P4-02`
- Metric code: `NEW_RECRUIT_CONTRACTED`
- Route: `insights/metric-detail?metricCode=NEW_RECRUIT_CONTRACTED`
- Context params: `period=YTD`, `businessLine=ALL`, `basis=STANDARD`
- Status: `DRAFT` (screen-specific example, pending UX approval)

## Purpose

The screen presents the `New Recruit Contracted` metric in a compact mobile detail view. It allows the user to understand the current YTD result, compare the current and prior year, and identify the contribution split between `PV` and `Non PV` for the selected window.

## Layout

1. Header chrome
   - back control
   - current date label (`As of 2026-09-09`)
   - page title: `New Recruits Contracted`
2. Filter bar
   - Product segmented control with `Both` selected
   - Time segmented control with `YTD` selected
3. Chart region
   - grouped bar comparison for the selected metric
   - legend: `Non PV`, `PV`
   - x-axis labels: `2025`, `2026`
4. Comparison summary
   - current year value: `8`
   - prior year value: `6`
   - delta badge: `+25% vs last year`

## Traceability

| UI element | Widget | VM field (`MetricDetailVM`) | Notes |
|---|---|---|---|
| Page title | `w.screen.title` | `context.metricCode` → `insights.metric.NEW_RECRUIT_CONTRACTED.title` | resolved in UI from i18n |
| Product selector | `w.filter.segmented` | `context.businessLine` | value path carries `ALL` |
| Time selector | `w.filter.segmented` | `context.period` | value path carries `YTD` |
| Bar chart | `w.metric-detail.bar-comparison` | `sections[]` (`type=BAR_COMPARISON`) | `measures[].measureCode` = `NON_PV`, `PV` |
| Comparison row | `w.metric-detail.comparison` | `sections[]` (`type=COMPARISON`) | current/previous-year summary |
| Delta badge | `w.metric-detail.comparison` | `sections[].change` | `display=PCT`, `pct=25` |

## Data contract

Canonical fixture:

- `fixtures/metric-detail-new-recruit-contracted.json`

The payload should be consistent with `domains/insights/bff/performance-vm.ts`:

- `sections[]` contains a `BAR_COMPARISON` section with `years: [2025, 2026]`
- `axisUnitCode` is `AGENTS` or equivalent measure axis marker
- `measures` contains the split dimensions (`NON_PV`, `PV`)
- a `COMPARISON` section carries the summary values and `change` semantics

## Interactions

- `I-01`: Changing the Product selector refetches the metric detail with the new `businessLine` context.
- `I-02`: Changing the Time selector refetches the metric detail with the new `period` context.
- `I-03`: Tapping the back control returns to the prior screen and preserves the dashboard context.
- `I-04`: The chart remains read-only in this screen; no drilldown or toggling is available from the chart itself.

## States

- `Loading`: per-section skeletons in configured order.
- `Partial`: inline retry slot for failed sections, with the rest of the screen still rendered.
- `Processing`: full-screen processing state when the metric is temporarily unavailable.
- `Empty`: empty-state copy when no data exists for this metric in the selected window.
- `Error`: not-available state when the metric is missing from the tenant catalog.

## Acceptance criteria

- `AC-P4-02-21` The page shows the metric title `New Recruits Contracted` and the `As of` date from the VM metadata.
- `AC-P4-02-22` The Product selector renders the configured options in order; `Both` is selected by default for this screen example.
- `AC-P4-02-23` The Time selector renders the available options and defaults to `YTD` when no explicit period is supplied.
- `AC-P4-02-24` The chart renders a grouped `BAR_COMPARISON` section with `PV` and `Non PV` legend items and the active year labels `2025` and `2026`.
- `AC-P4-02-25` The summary comparison section shows `2026 = 8`, `2025 = 6`, and a delta badge of `+25% vs last year`.
- `AC-P4-02-26` The comparison badge tone follows `change.sentiment` and not the raw sign of the value.
- `AC-P4-02-27` If the API returns an unknown metric or missing comparison payload, the screen degrades gracefully and does not crash.

## Analytics

- `insights_metric_detail_viewed {metricCode, period, businessLine, basis}`
- `insights_period_changed {from,to}`
- `insights_business_line_changed {from,to}`

## Notes

This addendum deliberately preserves the existing S-P4-02 contract model. It is a concrete example of how `NEW_RECRUIT_CONTRACTED` is represented in the detail view for the mobile screenshot supplied by the user.
