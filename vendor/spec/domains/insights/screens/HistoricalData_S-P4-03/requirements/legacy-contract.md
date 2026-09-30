# S-P4-03 — Historical Data

| | |
|---|---|
| Screen ID / Version | `S-P4-03` · `specVersion 1.2.0` · Status: **Ready for build** |
| Route | `insights/history?metricCode=…` (context: businessLine, basis) |
| BFF endpoint | `GET /api/bff/v1/performance/metrics/:metricCode/history?businessLine&basis&anchorYear&yearsBack` → `MetricHistoryVM` |
| Domain op | `getMetricSeries` |
| Config | `screens.history` (tabs, defaultYearsBack, maxYearsBack) |
| Mock | Image 4 (TPC, Vs Last 2 Years) |

## 1. Purpose
Month × year matrix per metric for trend inspection. Tab set is config-driven
(MY: TPC, CASE_COUNT, FYP, FYC); switching tabs refetches the same contract for
the new metric — one widget, one VM shape for money and count metrics alike.

## 2. Traceability

| # | UI element | VM field (`MetricHistoryVM`) | Domain API field | Mongo (`metric_series`) |
|---|---|---|---|---|
| 1 | Metric pills TPC/Case Count/FYP/FYC | `tabs[].{metricCode,selected}` | — (config `history.tabs`) | — |
| 2 | "Vs Last 2 Years" | `comparison.yearsBack` → i18n `history.vsLastYears` | request `yearsBack` | series docs fetched |
| 3 | ‹ › pager | `comparison.{canGoOlder,canGoNewer}` | request `anchorYear` shift | availability of `year` docs |
| 4 | Column headers 2026 · 2025 · (2024) | `years[]` (anchor first) | `series[].year` | `year` |
| 5 | Row label "Jan…Dec" | `rows[].month` → i18n `month.{n}.short` | `points[].month` | `points[].month` |
| 6 | Cell "RM 25,246" / "-" | `rows[].values[i]` (`MetricScalar \| null`) | `points[].value` | `points[].value` (null = open month) |

## 3. Behaviour
- Entry from the dashboard overflow menu only (S-P4-02's `historyNav` deep link was retired); falls back to first config tab.
- Tab switch and pager refetch; horizontal scroll when `years.length ≥ 3` with sticky Month column; 12 rows always render.
- `canGoOlder=false` when `anchorYear − yearsBack` would precede earliest materialized year; `canGoNewer=false` at current cycle year.
- Period (QTD/YTD) and goal concepts do **not** apply here — monthly actuals only.

## 4. Acceptance criteria
- **AC-P4-03-01** Cells with `null` render "-" (mock: Aug–Dec 2026), never 0.
- **AC-P4-03-02** Formatting follows `valueType`: MONEY via `formatMoney` ("RM 25,246"), COUNT plain integer — same widget, no per-metric code.
- **AC-P4-03-03** Column order = `years[]` exactly (anchor year leftmost, descending).
- **AC-P4-03-04** Pager ‹ shifts window older by 1 year (anchorYear−1) and re-renders headers + cells; disabled states per §3.
- **AC-P4-03-05** Tabs render only `config.history.tabs`, in order; selecting a tab preserves `businessLine`/`basis` context.
- **AC-P4-03-06** `yearsBack` never exceeds `config.history.maxYearsBack` (BFF clamps; API caps at 4).

## 5. Analytics
`insights_history_viewed {metricCode, yearsBack}` · `insights_history_tab_changed {to}` · `insights_history_window_shifted {anchorYear}`.

## 6. NFR
BFF p95 ≤ 500 ms; payload ≤ 15 KB; ETag 5 min (historical data is stable intraday).


---

# v1.1.0 addendum — windows, MoM, team tabs (P2/P3)

Figma frames 6588:17261/17314/17369/17430 + More Metrics 6588:17483.

## A1. Window model

`config.history.windows` (MY: `CURRENT_YEAR` · `VS_LAST_YEAR` ·
`VS_LAST_2_YEARS`; default `VS_LAST_2_YEARS`). The ‹ › pager **cycles
windows** (supersedes v1.0.0 §3's anchor-year shift — anchor stays the
current cycle year in P2/P3; OQ-16 tracks whether older anchors return).
BFF maps windows → `yearsBack` 0/1/2.

**CURRENT_YEAR** table: `Month · {anchor} · MoM Delta`. `momDeltas` computed
by the BFF from consecutive series points (D-11): value = pp for PERCENT,
abs for ABS-display metrics, pct otherwise; sentiment from catalog
`favourability`; Jan and any month adjacent to a null value ⇒ `null` → "N/A".

## A2. Tabs per scope

`config.history.tabs.SELF|TEAM`. TEAM (MY) lists 9 metrics; pills that
overflow the row fold into `w.history.more-tabs` ("More Metrics" dropdown) —
`moreTabs` in the VM. Selecting an overflow metric swaps it into view.

## A3. Added traceability

| # | UI element | VM field | Domain API | Mongo |
|---|---|---|---|---|
| 7 | Window label ("Current Year") | `comparison.window` → i18n | derived (`yearsBack`) | — |
| 8 | MoM Delta cells | `momDeltas[]` | BFF-computed from `points[]` + catalog `favourability` | `metric_series.points`, `metric_definitions.favourability` |
| 9 | "More Metrics" dropdown | `moreTabs[]` | — | config `history.tabs.{scope}` |

## A4. Added acceptance criteria

- **AC-P4-03-07** Pager cycles exactly `windowOptions` in order with wrap-around disabled at the ends (chevrons disable).
- **AC-P4-03-08** CURRENT_YEAR renders the MoM Delta column; other windows never do.
- **AC-P4-03-09** `momDeltas[0]` (Jan) renders "N/A"; months whose own or previous value is null render "N/A"; zero deltas render as a neutral/positive chip per `sentiment` (never "N/A").
- **AC-P4-03-10** MoM chip unit follows the metric (`pp` for ACTIVITY_RATIO — "-0.50", abs for MANPOWER — "+3"); ties to `display`.
- **AC-P4-03-11** Tab set follows the entry scope; scope is inherited from the navigation context, not switchable in-screen.
- **AC-P4-03-12** Overflow metrics appear once — in the dropdown, not as a clipped pill; selection round-trips correctly.

## A5. Added analytics
`insights_history_window_changed {to}` · `insights_history_more_metrics_opened`.


---

# v1.2.0 addendum — P4 uplift

The window model (A1) is confirmed for **SELF** scope (TPC frames show
Current Year / Vs Last Year / Vs Last 2 Years). MoM specifics:

- Column header follows `display`: **"MoM % Change"** for PCT metrics
  (`insights.history.momPctChange`), "MoM Delta" otherwise. TPC MoM values are
  percentages (−70.2%, +65.0% …).
- **AC-P4-03-13** MoM header key switches per the metric's `display`; values render per AC-P4-03-10.
- **AC-P4-03-14** Chip tone strictly follows `sentiment` (design shows one
  positive-red artifact at Jul; sentiment rule wins — logged, not replicated).
