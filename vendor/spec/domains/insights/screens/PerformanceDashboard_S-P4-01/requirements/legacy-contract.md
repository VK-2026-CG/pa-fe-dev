# S-P4-01 — Performance Dashboard

|                     |                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Screen ID / Version | `S-P4-01` · `specVersion 1.5.18` · Status: **DRAFT** (source mappings and package UX approvals pending)                                    |
| Route               | `insights/performance` (module home)                                                                                                        |
| Platforms           | iOS · Android · responsive web — mobile (<768px, unchanged), tablet (768–1023px, shell reflow only), desktop (≥1024px, see v1.4.0 addendum) |
| BFF endpoint        | `GET /api/bff/v1/performance/dashboard?period&businessLine&basis` → `PerformanceDashboardVM`                                                |
| Domain ops          | `listAgentMetrics`, `listMilestoneProgress`, `listRecommendations` (parallel fan-out)                                                       |
| Config              | `screens.dashboard` in `performance.config.json` (C4)                                                                                       |
| Mocks               | P4 images 1–3 · Figma `P2, P3 – Uplifted Screens` frames 6588:16550 (Self), 6588:16929 (Team), 6588:17499 (focus row), 6588:16896 (sheet)   |
|                     |                                                                                                                                             |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Screen ID / Version | `S-P4-01` · `specVersion 1.5.8` · Status: **Ready for build**                                                                               |
| Route               | `insights/performance` (module home)                                                                                                        |
| Platforms           | iOS · Android · responsive web — mobile (<768px, unchanged), tablet (768–1023px, shell reflow only), desktop (≥1024px, see v1.4.0 addendum) |
| BFF endpoint        | `GET /api/bff/v1/performance/dashboard?period&businessLine&basis` → `PerformanceDashboardVM`                                                |
| Domain ops          | `listAgentMetrics`, `listMilestoneProgress`, `listRecommendations` (parallel fan-out)                                                       |
| Config              | `screens.dashboard` in `performance.config.json` (C4)                                                                                       |
| Mocks               | P4 images 1–3 · Figma `P2, P3 – Uplifted Screens` frames 6588:16550 (Self), 6588:16929 (Team), 6588:17499 (focus row), 6588:16896 (sheet)   |

## 1. Purpose

Agent's performance home: quick links, filterable priority metric cards, milestone
progress, recommendations entry. All child screens (S-P4-02/03/04) launch from here
carrying the active filter context.

## 2. Layout & regions

```
┌ Header (App Title · w.scope.switcher, leaders only) ┐
│ R1 Quick-link rail            w.quicklink.rail   │
│ R2 "Metric Tracking" · Filter action · ⋯ ·       │
│    summary pills (Product/Time)  w.filter.sheet  │
│ R4 Priority Metrics panel (title·count·collapse) │
│    w.metric.card ×N — overflow → S-P4-04/S-P4-03 │
│ R6 Priority: 1-col list <1024, grid ≥1024; Focus:│
│    1-col list <1024, grid ≥1024 (v1.5.10/-12)    │
│ R7 Priority Milestones — hidden by MY config      │
│    default since v1.5.12 (visible=true still OK) │
│ R8 Footer link "View MOC" — hidden by MY config  │
│    default since v1.5.18 (visible=true still OK) │
├──────────────────────────────────────────────────┤
│ R3 Recommendations overlay    w.reco.banner      │ ← sticky, pinned to
└──────────────────────────────────────────────────┘   viewport bottom (v1.5.5)
```

R2/R4 are unified across every breakpoint since v1.5.6 — see that
addendum (R5's standalone business-line tabs are retired, folded into the
Filter sheet). R3 is no longer part of the scroll order above the metric
tracking header —
see the v1.5.5 addendum. R6's Priority Metrics card layout below 1024px
changed from a horizontal carousel to a single-column list in v1.5.10;
Other Focus Metrics adopted the same below-1024px single-column layout in
v1.5.12 (`AC-P4-01-47`) — both rows behave identically now but remain
independently specified. R7 (Priority Milestones) is hidden by the MY
config default since v1.5.12 (`AC-P4-01-45`) — the region and its
traceability/ACs are otherwise unchanged and re-enable via config. R8
(Footer link "View MOC") is likewise hidden by the MY config default
since v1.5.18 — `footerLinks[]` and its route/VM plumbing are unchanged
and the row re-enables via config (`footerLinks[].visible`).

## 3. Traceability (UI → VM → Domain API → Mongo)

| #   | UI element                          | Widget                  | VM field (`PerformanceDashboardVM`)                 | Domain API (op · field)                | Mongo (`insights.*`)                      |
| --- | ----------------------------------- | ----------------------- | --------------------------------------------------- | -------------------------------------- | ----------------------------------------- |
| 1   | Quick-link icons + labels           | `w.quicklink.rail`      | `quickLinks[]`                                      | — (config-only)                        | —                                         |
| 2   | Scheme toggle                       | `w.filter.basis-toggle` | `filters.basis`, `filters.basisToggleVisible`       | request param `basis`                  | `metric_snapshots.basis` (key)            |
| 3   | Recommendations banner              | `w.reco.banner`         | `recommendations.{visible,count,nav}`               | `listRecommendations` · `items.length` | `recommendations.items`                   |
| 4   | "Priority Metrics (4)" count        | header                  | `priorityMetrics.length`                            | `listAgentMetrics` · `items.length`    | `metric_preferences.priorityMetricCodes`  |
| 5   | Period dropdown QTD/YTD             | `w.filter.period`       | `filters.period`, `filters.periodOptions`           | request param `period`                 | `metric_snapshots.period.type` (key)      |
| 6   | Both/Insurance/Takaful tabs         | `w.filter.segmented`    | `filters.businessLine(+Options)`                    | request param `businessLine`           | `metric_snapshots.businessLine` (key)     |
| 7   | Card title ("TPC")                  | `w.metric.card`         | `priorityMetrics[].metricCode` → i18n               | `items[].metricCode`                   | `metric_snapshots.metricCode`             |
| 8   | Card subtitle "(Without Repricing)" | `w.metric.card`         | `priorityMetrics[].variant` → i18n                  | `items[].variant`                      | derived (repricing capability)            |
| 9   | Card value "RM 60,000" / "5"        | `w.metric.card`         | `priorityMetrics[].value` (`MetricScalar`)          | `items[].collected`                    | `metric_snapshots.values.collected`       |
| 10  | "/ No Goal Set" or "/ target"       | `w.metric.card`         | `priorityMetrics[].goal.{state,target}`             | `items[].goal`                         | `metric_snapshots.goal`                   |
| 11  | Progress bar + %                    | `w.metric.card`         | `priorityMetrics[].goal.progressPct`                | `items[].goal.progressPct`             | `metric_snapshots.goal.progressPct`       |
| 12  | Delta badge "+27% vs LY"            | `w.metric.card`         | `priorityMetrics[].delta.{pct,direction,sentiment}` | `items[].comparison`                   | `metric_snapshots.comparison.*`           |
| 13  | PTPC card without goal row          | `w.metric.card`         | `priorityMetrics[].showGoal=false`                  | —                                      | config `cardOverrides.PTPC.showGoal`      |
| 14  | Milestone card title/subtitle       | `w.milestone.card`      | `milestones.items[].programCode/variant`            | `listMilestoneProgress` · `items[]`    | `milestone_progress.programCode/variant`  |
| 15  | "Current status MDRT / Next COT"    | `w.milestone.card`      | `currentTierCode`, `nextTierCode`                   | `currentTier.code`, `nextTier.code`    | `milestone_progress.currentTier/nextTier` |
| 16  | Green progress bar                  | `w.milestone.card`      | `progressPct`                                       | `progressPct`                          | `milestone_progress.progressPct`          |
| 17  | "FYP 600,000 /798,400" ×3           | `w.milestone.card`      | `measures[].{measureCode,achieved,target}`          | `measures[]`                           | `milestone_progress.measures[]`           |
| 18  | "+" add milestone                   | header R7               | `milestones.addEnabled`                             | —                                      | config `milestones.addEnabled`            |
| 19  | "View MOC" row — hidden by MY config default (v1.5.18) | `w.nav.footer-link`     | `footerLinks[]`                                     | —                                      | config `footerLinks`                      |
| 20  | (implicit) data freshness           | —                       | `meta.asOfDate`                                     | list `context.asOfDate`                | `metric_snapshots.asOfDate`               |

## 4. Interactions

| ID   | Trigger                      | Behaviour                                                                                                                                         |
| ---- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| I-01 | Change period / tab / toggle | BFF refetch with new params; card row shows skeletons; selection persists for session (not saved server-side).                                    |
| I-02 | Tap metric card              | Navigate `priorityMetrics[].nav` → S-P4-02 with `{metricCode, period, businessLine, basis}` — **context carries over** (detail chips reflect it). |
| I-03 | Tap ⋯ overflow               | Menu: "Customize Metrics" → S-P4-04 · "Historical Data" → S-P4-03.                                                                                |
| I-04 | Tap milestone ↗              | Navigate `milestones.items[].nav`.                                                                                                                |
| I-05 | Tap recommendations banner   | Navigate `recommendations.nav`.                                                                                                                   |
| I-06 | Pull-to-refresh              | Refetch dashboard; `ETag` respected.                                                                                                              |

## 5. States

- **Loading:** skeletons for R3, R6, R7 (widget skeleton variants); filters disabled.
- **Partial (degraded):** `meta.partial=true` + `meta.failedSections` (e.g. `["milestones"]`) ⇒ inline retry slot in that region; rest renders. Recommendations failure ⇒ banner hidden silently (`visible:false`).
- **Empty milestones:** section hidden when `items=[]` and `addEnabled=false`; else show add affordance only.
- **Hard error (metrics fan-out fails):** full-screen DLS error with retry.
- **Offline:** last-cached VM with `meta.asOfDate` surfaced; interactions queued off.

## 6. Acceptance criteria (traceable)

- **AC-P4-01-01** Given `goal.state=NOT_SET`, card renders value + `insights.goal.notSet`, empty progress track, no computed %.
- **AC-P4-01-02** Given `delta.sentiment=NEGATIVE`, badge uses `tone.danger`; `POSITIVE` ⇒ `tone.success` — regardless of sign (D-05).
- **AC-P4-01-03** Switching business-line tab refetches with `businessLine` and re-renders **all** priority cards; values may differ per tab (mocks 1→3).
- **AC-P4-01-04** Period dropdown offers exactly `config.metricTracking.periodOptions`; default = `defaultPeriod` on first load.
- **AC-P4-01-05** Card order = agent preferences order; fallback country `defaultOrder` when `source=DEFAULT`.
- **AC-P4-01-06** `PTPC` card renders no goal row and no progress bar in MY (`showGoal=false`).
- **AC-P4-01-07** Basis toggle hidden when `features.basisToggle.visible=false`; toggling refetches with `basis=SCHEME`. (MY config sets this `false` for both scopes since v1.5.0 — see A9.)
- **AC-P4-01-08** Card tap passes the current `{period,businessLine,basis}` to S-P4-02.
- **AC-P4-01-09** Money renders via DLS `formatMoney` from the decimal string; no client rounding drift (`"60000.00", MYR` ⇒ "RM 60,000").
- **AC-P4-01-10** Milestone card shows `min 3` measures in MY variant with `achieved`/`target` from VM, target prefixed "/".
- **AC-P4-01-11** Unknown `metricCode` or extra enum value from the API renders the card generically (code-derived fallback label) and never crashes.
- **AC-P4-01-12** Milestone cards do **not** change when period/business-line filters change (program-cycle scoped).
- **AC-P4-01-13** Recommendations banner hidden (not errored) when `recommendations.visible=false`.

## 7. Analytics

`insights_dashboard_viewed {period, businessLine, basis}` · `insights_metric_card_tapped {metricCode}` ·
`insights_period_changed {from,to}` · `insights_business_line_changed {from,to}` ·
`insights_basis_toggled {to}` · `insights_milestone_card_tapped {programCode}` ·
`insights_reco_banner_tapped {count}`.

## 8. NFR

BFF p95 ≤ 800 ms (parallel fan-out, per-op timeout 600 ms → degrade per §5);
payload ≤ 30 KB gzipped; dashboard cacheable 60 s via ETag; WCAG 2.1 AA per widget contracts §4.

## 9. Open questions → README §7 (OQ-1 Scheme semantics, OQ-3 MOC, OQ-5 milestone filtering confirmed as assumed).

---

# v1.1.0 addendum — Agent Leader (P2/P3)

The dashboard is now **scope-parameterized**: one screen, two compositions
(`config.screens.dashboard.scopes.SELF|TEAM`). Everything in v1.0.0 above
describes the SELF composition; deltas below.

## A1. New chrome & regions

| Region                                   | Widget                           | VM                                                  | Notes                                                                                                                                                                                                                                                                                                                                                           |
| ---------------------------------------- | -------------------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header persona switcher                  | `w.scope.switcher`               | `scopeSwitcher`                                     | Leader entitlement only (`scopeSwitcherEnabled` ∧ token has `insights:read:downline`). Switching scope refetches the dashboard with `scope=` and resets `teamView` to config default. Renders in the header title row, alongside the App Title and above R1 (`w.quicklink.rail`) — same header row for both SELF and TEAM, absent (title-only) for non-leaders. |
| "Group" toggle (replaces Scheme in TEAM) | `w.filter.team-view-toggle`      | `filters.teamView`, `filters.teamViewToggleVisible` | Off=DIRECT, on=GROUP → refetch. SELF keeps the Scheme toggle per v1.0.0.                                                                                                                                                                                                                                                                                        |
| AI Recommendations panel                 | `w.reco.panel`                   | `recommendations.panel`                             | Expanded panel spec: **S-P23-01**. Banner-only fallback when `panel` absent.                                                                                                                                                                                                                                                                                    |
| "Other Focus Metrics (n)" row            | `w.metric.card` variant `simple` | `focusMetrics.items[]`                              | Selected focus metrics as value+delta cards; **never** renders goals. Empty state superseded by AC-P4-01-26 (v1.4.0) — header stays visible with a "+" add affordance rather than hiding.                                                                                                                                                                       |
| ⋯ → More Action sheet                    | `w.sheet.more-action`            | `moreActions[]`                                     | MY: Set Goals · Customize Metrics · Historical Data (replaces the v1.0.0 two-item menu, supersedes I-03).                                                                                                                                                                                                                                                       |
| Milestones "Set Goal" header action      | —                                | `milestones.setGoalEnabled`                         | Alongside "+" (OQ-15: same flow?).                                                                                                                                                                                                                                                                                                                              |

## A2. TEAM composition (MY)

Quick links: MILESTONES · TEAM_DRILLDOWN · LEADERBOARD (no Introducer, no
Comp & Ben — OQ-9). Priority cards: **9** (TPC, PTPC, CASE_COUNT, FYP,
MANPOWER, ACTIVITY_RATIO, PRODUCTIVITY, AVERAGE_CASE_SIZE,
NEW_RECRUIT_CONTRACTED). *Superseded in v2.0.0: **8** priority cards —
NEW_RECRUIT_CONTRACTED moves to Other Focus Metrics (AC-P4-01-78).* No footer VIEW_MOC. Milestones remain the
**leader's own** (OQ-10). `defaultPeriod` YTD.

## A3. Added traceability

| #   | UI element                      | Widget                      | VM field                        | Domain API                                     | Mongo                                 |
| --- | ------------------------------- | --------------------------- | ------------------------------- | ---------------------------------------------- | ------------------------------------- |
| 21  | Persona menu (Self/Team)        | `w.scope.switcher`          | `scopeSwitcher`                 | request `scope`                                | `metric_snapshots.scope` (key)        |
| 22  | Group toggle                    | `w.filter.team-view-toggle` | `filters.teamView`              | request `teamView`                             | `metric_snapshots.teamView` (key)     |
| 23  | "Other Focus Metrics (2)" count | header                      | `focusMetrics.items.length`     | `listAgentMetrics scope=FOCUS` (selected only) | `metric_preferences.focusMetricCodes` |
| 24  | Focus card value/delta          | `w.metric.card` `simple`    | `focusMetrics[]`                | `items[]`                                      | `metric_snapshots`                    |
| 25  | Manpower/… team cards           | `w.metric.card`             | `priorityMetrics[]` (ABS delta) | `items[].comparison.abs`                       | `comparison.changeAbs`                |
| 26  | Sheet rows                      | `w.sheet.more-action`       | `moreActions[]`                 | —                                              | config `moreActions`                  |
| 27  | AI panel (all elements)         | `w.reco.panel`              | `recommendations.panel`         | `listRecommendations.panel`                    | `recommendations.panel`               |

## A4. Added acceptance criteria

- **AC-P4-01-14** Scope switch refetches with the new `scope`; TEAM applies its own config block (quick links, card count, toggles) and its own saved preferences (`?scope=TEAM`).
- **AC-P4-01-15** `teamView` toggle is visible only in TEAM scope; toggling refetches; DIRECT is the default on every fresh TEAM entry.
- **AC-P4-01-16** SELF never sends `teamView`; TEAM never shows the Scheme toggle (MY config). (Since v1.5.0, MY config also hides the Scheme toggle in SELF — see A9.)
- **AC-P4-01-17** (superseded by AC-P4-01-26, v1.4.0) Focus row renders metrics in `focusMetrics.items[]`, capped by `focusCards.maxCount`; the section (header included) hides only when `focusMetrics.visible=false` (config `focusCards.visible`) — an empty `items[]` with `visible=true` renders the header with a "+" add affordance instead of hiding (see A6).
- **AC-P4-01-18** Cards whose delta `display=ABS` render the formatted absolute change ("+RM 20,000", "+7", "+0.4") — never a % — with tone from `sentiment`.
- **AC-P4-01-19** Non-leaders get no switcher and `scope=SELF` behavior identical to v1.0.0 (regression guard).
- **AC-P4-01-20** Milestone cards are identical across SELF/TEAM and across the Group toggle (extends AC-P4-01-12).
- **AC-P4-01-21** ⋯ opens the More Action sheet with exactly the configured rows in order; each navigates and dismisses.

## A5. Added analytics

`insights_scope_changed {to}` · `insights_team_view_toggled {to}` ·
`insights_more_actions_opened` · `insights_more_action_tapped {id}` ·
`insights_focus_card_tapped {metricCode}` (+ S-P23-01 panel events).

---

# v1.2.0 addendum — P4 uplift

- **Period selector is a "Time Period" bottom sheet** (`w.filter.period` variant `bottom-sheet`): MTD/QTD/YTD radios with window subtitles from `filters.periodOptionsMeta` ("1 Jul 2026 – Today"), Select applies, X cancels. **MTD joins MY periodOptions** (both scopes, config 2.1.0).
- ⋯ actions render as a **popover menu** (X to close) — same `moreActions` VM, DLS variant `menu`.
- Focus-row cards can carry deltas (FYC "+27% vs LY"); PERCENT focus cards render the bare value (98%).
- Post-customize success shows the green toast `insights.toast.focusMetricsAdded` on return (pairs with AC-P4-04-10).

**Added ACs**

- **AC-P4-01-22** Opening the period control presents the sheet with the active period pre-selected; Select refetches; dismissing applies nothing.
- **AC-P4-01-23** Sheet subtitles come from `periodOptionsMeta` verbatim through the DLS date formatter — the client performs no fiscal-calendar math.

---

# v1.3.0 addendum — rulings applied

- **Scheme toggle (D-13/D-14):** toggling to SCHEME refetches `basis=SCHEME`; the BFF re-composes `priorityMetrics`/`focusMetrics` from catalog `segmentOverrides` (a smaller/different/re-ordered set) with segment goals — card lists MAY differ from STANDARD, and widgets must not assume stable card identity across the toggle. Visibility = config ∧ segment entitlement (OQ-20).
- **Group toggle (D-14):** rendered only for P2-level leaders; P3 leaders get TEAM locked to DIRECT (no toggle). BFF computes `teamViewToggleVisible`; the API independently 403s `teamView=GROUP` for P3.
- **AC-P4-01-24** For a P3 leader, TEAM scope shows no Group toggle and all team requests carry `teamView=DIRECT`.
- **AC-P4-01-25** Toggling Scheme re-renders the card rows from the new payload without diffing against the STANDARD set (full row swap; skeletons during refetch).

---

# v1.4.0 addendum — Desktop layout (screenshot-derived, DRAFT)

⚠ Sourced from reviewed screenshots ("Homepage Desktop - Self/Team"), not a
Figma export — geometry/spacing are approximate, same convention as
screenshot-derived DLS tokens (`dls.css`). This addendum does not change or
supersede mobile (<768px) behavior; every control below is additive at the
desktop breakpoint only, per `common/ux/tokens/breakpoint.tokens.json`
(`breakpoint.desktop`, minWidth 1024px). Tablet (768–1023px) gets the wider
shell only — no control changes yet (open gap, tracked in `blockers`).

## A6. Focus metrics empty state (supersedes AC-P4-01-17)

`focusMetrics` becomes an object (breaking VM change, `performance-vm.ts`
v1.4.0): `{ visible: boolean; addEnabled: boolean; items: MetricCardVM[] }`,
driven by new config `metricTracking.focusCards.addEnabled`.

- **AC-P4-01-26** When `focusMetrics.visible=true` and `items=[]`, the "Other
  Focus Metrics" header still renders (count "0") with a "+" add affordance
  (visible only when `addEnabled=true`) navigating to `insights/customize-metrics`
  *(superseded at every breakpoint by AC-P4-01-80, v2.0.0: opens in place instead)*
  — mirrors the existing milestones "+" pattern (traceability #18). The
  section hides entirely only when `visible=false`.
- **AC-P4-01-27** Applies identically to SELF and TEAM — the empty-state
  affordance is not scope-gated, only `focusCards.visible`/`addEnabled`
  (config) gated.

## A7. Desktop chrome (≥1024px only)

| Region                                 | Mobile (<1024px, unchanged)                                                                                     | Desktop (≥1024px)                                                                                                                                                                                                                      |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Metric Tracking header controls        | Period bottom-sheet button + ⋯ more-actions, business-line segmented tabs, Scheme/Group toggle rows, all inline | Single **Filter** action (funnel icon + label) opening one combined sheet (business line + period + basis/team-view); two read-only summary pills below the header ("Product {value}", "Time {value}") reflecting the active selection |
| Priority Metrics / Other Focus Metrics | Horizontal scroll-snap carousel of cards                                                                        | Same cards reflow into a 2-column grid, wrapped in a collapsible panel (title + count badge + collapse chevron; the focus panel's chevron is replaced by the "+" add affordance per A6 when empty)                                     |

- **AC-P4-01-28** At ≥1024px, the business-line tabs, period button, and
  basis/team-view toggle rows are visually replaced by the Filter action +
  summary pills; opening the Filter sheet and applying a change refetches the
  dashboard exactly as the mobile controls do today (same `refetch` params,
  no new BFF contract). Below 1024px, mobile controls are unchanged and the
  Filter action is not shown.
- **AC-P4-01-29** At ≥1024px, Priority Metrics and Other Focus Metrics render
  as a 2-column grid inside a panel with a collapse toggle; collapsing hides
  the grid but keeps the header (title + count) visible. Below 1024px, the
  panel is visually transparent (no border/shadow/collapse) and behavior is
  identical to v1.3.0.

## A8. Added analytics

`insights_filter_opened` · `insights_filter_applied {period,businessLine,basis,teamView}` ·
`insights_focus_panel_add_tapped` · `insights_metric_panel_toggled {panel,open}`.

---

# v1.5.0 addendum — Three-source onboarding (DRAFT)

Work item: `SPEC-2026-001`. The schema export adds evidence for MAPA and
persistency alongside production; it does not approve business mappings.
Canonical C1 read models, C2 API 1.4.0 and C3 VM 1.5.0 remain the boundary.
This addendum introduces no new controls, metric codes, card selections,
thresholds, endpoints, analytics events or visual tokens. Existing package UX
blockers remain. The earlier build-ready wording is superseded by the manifest.

## A9. Source traceability and reusable contracts

The C0 mapping table is authoritative for exact candidate paths and approval
status. The UI and BFF do not read source collections or implement source LOVs.

| UI/VM                                                                          | C2 → C1                                                   | Candidate upstream evidence                                                          | Status / rendering constraint                                                                      |
| ------------------------------------------------------------------------------ | --------------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `priorityMetrics[].value`, `focusMetrics.items[].value` for production metrics | `items[].collected` → `metric_snapshots.values.collected` | `my_production.ptd` paths in C0 §2.1                                                 | Approved mapping required; source null does not become zero                                        |
| TEAM `priorityMetrics[].value`, `focusMetrics.items[].value` for MAPA          | `items[].collected` → `metric_snapshots.values.collected` | `my_mapa.ptd` / `snapshot` alternatives in C0 §2.2                                   | Unit/scale, manpower and recruitment semantics unresolved; no type or scope change                 |
| `focusMetrics.items[].value` for persistency                                   | `items[].collected` → `metric_snapshots.values.collected` | `my_persistency.metrics` candidates in C0 §2.3                                       | Field precedence, percentage scale and period rules unresolved                                     |
| Card `dataState`, optional `value`, retained `metricCode`/`nav`                | `items[].dataState` → C1 §7.7/§7.13 read-time derivation  | Approved usable canonical value and relevant batch evidence, not source-row presence | `OK`/`PROCESSING`/`EMPTY` reuse existing C3; readiness is not a wire field                         |
| `meta.asOfDate`                                                                | Existing canonical business watermark                     | Collection-specific dates; C0 OQ-PA-15/16                                            | Preserve supplied watermark; no browser computation or freshness claim from newest audit timestamp |
| Goal/delta/milestone/recommendation fields                                     | Existing respective C2/C1 contracts                       | Not supplied by this export                                                          | No fallback from bonus, CPD or monthly fields                                                      |

Reuse decisions: `REUSE_AS_IS` for C2 operations, C3 types, `w.metric.card`,
formatters, i18n, scope guards and C4 selections; `EXTEND_COMMON` for the widget
documentation of already-defined card data states; `CREATE_SCREEN_LOCAL` for a
mixed-availability fixture because the existing fixture covers populated cards
only. No new component, source-derived card selection or asset is authorized.

## A10. Availability and shared-screen behavior

- A successful metrics response may mix usable and unavailable cards. Do not
  treat card `EMPTY`/`PROCESSING` as a full-screen transport failure. Hard API
  failures and `meta.partial` retain §5 behavior; these states are not equivalent.
- Non-OK cards keep their title, configured position and navigation. Do not
  display a numeric value, computed goal progress or delta for a missing measure.
- `PROCESSING` requires approved relevant in-flight evidence; absence of a
  source or mapping alone is not proof of processing. Without that evidence,
  the existing EMPTY fallback applies.
- A source's later date does not advance the whole dashboard's watermark. The
  cross-source reconciliation rule is a Data/Architecture blocker, not UI logic.
- Detail, History and Customize keep their current contracts. A card remains
  navigable to the corresponding detail state. No annual history is manufactured
  from current data; no new customizable metric is inferred from a source field.
- Per-card notices reuse the existing `NoticeVM` contract. The UI does not
  construct notices by inspecting this schema export.

## A11. Added acceptance criteria

The new `fixtures/dashboard-mixed-availability.json` is synthetic canonical VM
test data, not evidence of approved source mappings. Existing fixture values
are reused solely to test already-defined formatting; see `fixtures/README.md`.

- **AC-P4-01-89** Given the mixed fixture, the `FYC` EMPTY focus card remains visible in its payload position.
- **AC-P4-01-90** Given the mixed fixture, the EMPTY `FYC` card displays no numeric metric value.
- **AC-P4-01-91** Tapping that EMPTY `FYC` card navigates using its supplied `nav`.
- **AC-P4-01-92** Given the mixed fixture, the `CASE_COUNT` card displays its PROCESSING state rather than a numeric value.
- **AC-P4-01-93** Given the mixed fixture, the usable `TPC` card still renders via `formatMoney` while other cards are unavailable.
- **AC-P4-01-94** Given the mixed fixture, the dashboard watermark uses `meta.asOfDate` (`2026-07-27`), not the later `generatedAt` date.
- **AC-P4-01-95** Given a canonical `CASE_COUNT` card with `dataState=OK` and `value={kind:COUNT,value:0}`, the UI renders zero rather than EMPTY.
- **AC-P4-01-96** Given a canonical TEAM `PRODUCTIVITY` card with `dataState=OK` and `value={kind:DECIMAL,value:9.7,precision:1}`, the rendered value has no percent suffix.

Source-processing tests are separately named AC-PA-SRC-01–11 in C0. No new
telemetry payloads are added; source names, source identifiers, monetary values
and source personal fields must not leak into events or logs.

# v1.5.6 addendum — Filter chrome unified across every breakpoint (supersedes A7's mobile/desktop split)

**AC-P4-01-28 and AC-P4-01-29 are superseded** by AC-P4-01-38/39 below. The
"Mobile (<1024px, unchanged)" column of A7's table no longer applies: the
Metric Tracking header, business-line/period/basis/team-view controls, and
the Priority Metrics / Other Focus Metrics panel headers now render
identically at every breakpoint. `basis`/`teamView`/`businessLine`/`period`
selection is exclusively via the combined Filter sheet everywhere — the
mobile-only period bottom-sheet button and inline business-line tabs are
retired (their standalone components, `PeriodSheet`/`Tabs` usage, and
`ToggleRow` usage on this screen are removed from the codebase, not just
hidden). No VM or BFF contract change; `refetch` params are unchanged.

- **AC-P4-01-38** At every breakpoint, "Metric Tracking" renders with a
  single **Filter** action (funnel icon + label) and a "⋯" more-actions
  button, plus two read-only summary pills ("Product {value}", "Time
  {value}") that open the same combined Filter sheet (business line +
  period + basis/team-view). There is no other way to change these filters.
- **AC-P4-01-39** At every breakpoint, Priority Metrics and Other Focus
  Metrics render inside a collapsible panel (title + count badge + collapse
  chevron; the focus panel's chevron is replaced by the "+" add affordance
  per A6 when empty). This supersedes A7's "panel is visually transparent
  below 1024px" rule. **Not in scope:** the card layout itself (horizontal
  carousel vs 2-column grid) remains a CSS-only, viewport-driven reflow — A7's
  card-layout row is unchanged and still breakpoint-specific. Other Focus
  Metrics' card layout is still governed entirely by this clause and A7's
  table, unchanged. Priority Metrics' below-1024px card layout is further
  specified by `AC-P4-01-43` (v1.5.10) — see that addendum; Priority Metrics'
  ≥1024px 2-column grid is unchanged and still governed by this clause.

---

# v1.5.0 addendum — Scheme toggle hidden pending OQ-20 (config-only)

The Scheme (`basis`) toggle mechanism from v1.0.0/v1.3.0 (D-13/D-14) is
unchanged — visibility is still `config ∧ entitlement`, and the underlying
`basis` dimension (catalog `segmentOverrides`, per-basis goals, `basis=SCHEME`
request param) is untouched. Only the MY config default changes: with
entitlement still unresolved (`OQ-20` — real Scheme-segment membership data is
unbacked upstream), showing the toggle to every SELF agent was itself
misleading, since toggling produced an unbacked `SCHEME` payload for agents
who may not be in that segment. Pending `OQ-20`, MY config now defaults the
toggle off everywhere rather than exposing an unqualified switch.

- **AC-P4-01-30** MY config (`performance.config.json`) sets
  `scopes.SELF.features.basisToggle.visible=false` (`scopes.TEAM` was already
  `false`). The Scheme toggle therefore does not render for any scope, at any
  breakpoint — mobile inline `ToggleRow` (A1) and desktop `FilterSheet` (A7)
  both already gate on the same `filters.basisToggleVisible` VM field, so no
  widget or VM change is required; this is a config-value change only.
- **AC-P4-01-31** With the toggle hidden, every MY dashboard request implicitly
  stays on `basis=STANDARD` (the existing default — see `AC-P4-01-25` scope
  reset behavior, unchanged). The `basis=SCHEME` request param, catalog
  `segmentOverrides`, and per-basis goal resolution (D-13) remain valid and
  reachable by direct API call; this addendum does not retire them, only the
  UI entry point.
- This is reversible: re-enabling for a future country/segment rollout is a
  config flip (`visible=true`) once `OQ-20` resolves, not a spec or code
  change.

# v1.5.1 addendum — Scope switcher copy (content-only)

Shortened the header persona switcher's item labels. No VM, API, or config
change; `ScopeSwitcherVM`/`Scope` (`SELF`/`TEAM`) codes and behavior (D-14,
A1-A5) are unchanged — only the resolved i18n string differs.

- **AC-P4-01-32** `insights.scope.SELF` renders "Self" (was "My Performance")
  and `insights.scope.TEAM` renders "Team" (was "Team Performance") in the
  header switcher (A1) and any surface reusing `w.scope.switcher`
  (widget-contracts.md §3). No other copy in the switcher (sub-values, group
  toggle labels) changes.

# v1.5.2 addendum — Header placement clarified (documentation-only)

Formalizes header composition already shown in v1.0.0's layout diagram and
implemented in code: no VM, API, config, or behavior change.

- **AC-P4-01-33** The App Title and, for leaders, the scope switcher
  (`w.scope.switcher`) render together in the header row, positioned above
  the quick-link rail (R1, `w.quicklink.rail`) at every breakpoint. Order is
  identical for `SELF` and `TEAM`; non-leaders render the title only (no
  reserved space for the switcher).

# v1.5.3 addendum — Scope switcher trigger restyled as avatar icon

The header persona switcher's trigger changes from a text pill ("Self ▾" /
"Team ▾") to a small person-icon avatar button, matching the app Homepage
(R1) header pattern. `ScopeSwitcherVM` is unchanged — same `current`/`options`
shape, same Self/Team menu contents and behavior (A1, D-14); only the trigger
button's appearance changes. The quick-link rail (R1 region, `w.quicklink.rail`)
is explicitly **out of scope** and unaffected.

- **AC-P4-01-34** The scope switcher (leaders only) renders as an avatar/
  person-icon button beside the App Title (not a text label); tapping it opens
  the same Self/Team menu as before. Non-leaders are unaffected (no switcher
  rendered, per A1).
- Icon token `icon.insights.scope-avatar` is sourced from Remix Icon
  (`user-line`) as an **unapproved placeholder** — see README §7 open
  questions (new OQ) — pending a Figma-exported avatar asset from UX. Replace
  the icon file only; no VM/prop change is anticipated when it's approved.

# v1.5.4 addendum — Scope switcher trigger is a native select (supersedes v1.5.3)

Reverts the v1.5.3 avatar-icon trigger. `AC-P4-01-34` is **superseded** by
`AC-P4-01-35` below; the avatar icon and its OQ are dropped as moot rather
than resolved. `ScopeSwitcherVM` is still unchanged — only the trigger
control differs.

- **AC-P4-01-35** The scope switcher (leaders only) renders as a native
  `<select>` beside the App Title, styled identically to the dev-only Persona
  Picker control (same chrome; not a separate visual pattern). Options are
  `insights.scope.SELF` / `insights.scope.TEAM`; selecting one refetches per
  A1. Non-leaders are unaffected (no switcher rendered). No icon asset is
  required — this closes README §7 OQ-23 as moot (never shipped).

# v1.5.5 addendum — R3 Recommendations moved to a sticky bottom overlay

R3 leaves the scroll order between R2 and R4 and becomes a sticky bar pinned
to the bottom of the viewport, present at every scroll position of the
dashboard (not just above the fold). `RecommendationsEntryVM`/
`RecommendationsPanelVM` are unchanged — collapsed-bar-by-default and the
expanded panel contents (A1, S-P23-01) behave exactly as before; only the
region's position and stacking changes.

- **AC-P4-01-36** The recommendations bar/panel renders pinned to the bottom
  of the screen (sticky, not scrolled away with R1/R2/R4-R8) at every
  breakpoint. `recommendations.visible=false` still hides the region entirely
  (AC-P4-01-13, unchanged) rather than reserving empty space at the bottom.
- **AC-P4-01-37** Expanding the panel grows the overlay upward from the
  bottom edge; it must never obscure R8's footer link or block scrolling of
  R1-R7 while collapsed.

# v1.5.7 addendum — Quick-link rail icons and COMP_BEN label (asset/content-only)

Repoints the R1 quick-link rail (`w.quicklink.rail`) icon assets for
MILESTONES, INTRODUCER_DRILLDOWN, COMP_BEN and LEADERBOARD to requester-
provided final SVGs, and corrects the COMP_BEN label copy. `QuickLinkVM`
shape, `iconToken`/`assetId` names, `quickLinks[]` config, order and nav
routes are unchanged (D-16) — only the manifest's underlying asset file per
token and one i18n value move.

- **AC-P4-01-40** The R1 quick-link rail renders, for MY: MILESTONES using
  `icon.quick.MILESTONES` → `common/assets/MY/icons/Milestone.svg` with label
  "Milestones"; INTRODUCER_DRILLDOWN using `icon.quick.INTRODUCER_DRILLDOWN`
  → `Introducer.svg` with label "Introducer Drilldown"; COMP_BEN using
  `icon.quick.COMP_BEN` → `Subtract.svg` with label "Compensation & Benefits"
  (`insights.quicklink.COMP_BEN`); LEADERBOARD using `icon.quick.LEADERBOARD`
  → `Union.svg` with label "Leaderboard". Icon geometry/order/nav destinations
  are otherwise unchanged from v1.0.0.

# v1.5.8 addendum — Quick-link rail tile spacing at tablet/desktop (layout-only)

⚠ Value supplied directly by requester, not a Figma export or measured
screenshot — same screenshot/direct-instruction convention as the v1.4.0
Desktop addendum and D-16; tracked under the existing "Strict UX source
approval is incomplete" blocker rather than a new one. `QuickLinkVM` and
`quickLinks[]` config are unchanged — this is a CSS layout rule only.

- **AC-P4-01-41** At `breakpoint.tablet` (768-1023px) and `breakpoint.desktop`
  (≥1024px), the R1 quick-link rail (`w.quicklink.rail`) lays out its tiles
  left-aligned (`justify-content: flex-start`) with a fixed `space.quicklink.gap`
  (64px) between adjacent tiles; any leftover container width past the last
  tile is trailing whitespace, not redistributed. Below `breakpoint.tablet`
  (<768px, mobile), the rail is unchanged from v1.0.0: tiles distribute
  edge-to-edge (`justify-content: space-between`, no fixed gap).

# v1.5.9 addendum — Scope switcher becomes a responsive icon+label pill (supersedes v1.5.4)

Reverts the v1.5.4 native `<select>` trigger back to a custom anchored-pill
trigger (`w.scope.switcher` variant `icon-pill`) — closer in spirit to the
v1.5.3 avatar attempt, but with the label retained (not replaced) and made
responsive rather than dropped. `AC-P4-01-35` is **superseded** by
`AC-P4-01-42` below. `ScopeSwitcherVM` (`current`/`options`) is unchanged —
this is a trigger-rendering, interaction-model and breakpoint rule only; no
VM, API, or config change. Reuses the existing tablet/desktop breakpoint
tokens introduced for the R1 rail in `AC-P4-01-41`, and the pill geometry
already reserved for this control (Figma node 6588:16960, 108×38) rather
than defining new tokens — except corner radius, called out below.

- **AC-P4-01-42** The scope switcher (leaders only) renders as a pill-shaped
  button (8px corner radius ⚠ value supplied directly by requester, not the
  Figma node's fully-rounded rendering or a Figma export — same
  direct-instruction convention as the v1.4.0 Desktop chrome and v1.5.8
  quick-link gap, tracked under the existing "Strict UX source approval is
  incomplete" blocker rather than a new one; bordered, Figma 6588:16960)
  beside the App Title,
  prefixed with `icon.insights.scope-avatar` (single-person icon, used at
  every breakpoint and for every scope — the icon does not change between
  SELF and TEAM) and suffixed with a trailing down-chevron, the same generic
  dropdown-affordance glyph already used elsewhere in this screen's chrome
  (e.g. the period picker) — no new chevron token is introduced by this
  addendum. Below `breakpoint.tablet` (<768px) the switcher shows the icon
  and chevron
  only — the current scope's label (`insights.scope.SELF`/
  `insights.scope.TEAM`) is visually hidden while the control keeps its
  accessible name (`aria-label="Scope switcher"`). At `breakpoint.tablet`
  (768-1023px) and `breakpoint.desktop` (≥1024px) the icon, label and
  chevron all render. Tapping/clicking the pill opens an anchored menu
  listing `insights.scope.SELF`/`insights.scope.TEAM` (current scope
  check-marked); selecting an option behaves exactly as `AC-P4-01-35`/A1
  (refetch, `teamView` reset) and closes the menu. Non-leaders are
  unaffected (no switcher rendered, per A1).
- Icon token `icon.insights.scope-avatar` is sourced from Remix Icon
  (`user-line`) as an **unapproved placeholder** — see README §7 `OQ-24` —
  pending a Figma-exported avatar asset from UX, exactly as the dropped
  v1.5.3 attempt. Replace the icon file only when approved; no VM/prop
  change is anticipated. **Superseded by `AC-P4-01-76` (v1.5.20):** the
  "single-person icon ... does not change between SELF and TEAM" clause
  above no longer applies to the trigger or anchored menu.

# v1.5.10 addendum — Priority Metrics card layout below desktop becomes a single column

Amends the "below 1024px" half of A7's card-layout row (line 236: "Priority
Metrics / Other Focus Metrics: Horizontal scroll-snap carousel") and the
`AC-P4-01-39` "Not in scope" carve-out, but **only for Priority Metrics**.
Other Focus Metrics is explicitly out of scope for this addendum and keeps
its current horizontal scroll-snap carousel (<1024px) / 2-column grid
(≥1024px) behavior, unchanged, per A7 and `AC-P4-01-39`. Priority Metrics'
`≥1024px` 2-column grid is also unchanged — only its below-1024px layout
changes. `PerformanceDashboardVM.priorityMetrics[]`, `w.metric.card`
(variant `compact`), and config `metricTracking.priorityCards` (including
`maxCount`: 4 for SELF, 9 for TEAM) are all unchanged — this is a CSS-only,
viewport-driven reflow, the same kind of change A7/AC-P4-01-39 already
describe for the 1024px split, just narrowing where the carousel applies.

Because Priority Metrics and Other Focus Metrics now have genuinely
different below-1024px layouts, they are no longer one shared reflow
description — implementers must treat `w.metric.card` (compact, Priority
Metrics) and `w.metric.card` (simple, Other Focus Metrics) as independently
laid out at every breakpoint, even though both remain the same widget id.

- **AC-P4-01-43** Below `breakpoint.desktop` (<1024px, covering both mobile
  and tablet — there is no separate tablet-specific rule), the Priority
  Metrics row renders as a static, vertically stacked single-column list:
  each card is full width, stacked top to bottom in `priorityMetrics[]`
  order, wrapping to as many rows as there are cards. There is no horizontal
  scroll, no scroll-snap, and no pagination-dots affordance for this row
  below `breakpoint.desktop`. At `breakpoint.desktop` (≥1024px) the row is
  unchanged: it keeps the existing 2-column CSS grid inside the collapsible
  panel per `AC-P4-01-39`. Other Focus Metrics is unaffected by this AC at
  any breakpoint.
- ⚠ Design source is three requester-supplied screenshots, not a Figma
  export or an approved asset — same direct-instruction convention as the
  v1.4.0 desktop chrome and the v1.5.8 quick-link gap. Tracked under the
  existing "Strict UX source approval is incomplete" blocker, not a new one.
  The differing priority-card counts visible across the three screenshots
  (8 vs 4) come from different scope demos (`priorityCards.maxCount` is 4 for
  SELF, 9 for TEAM) — this addendum does not change that config or introduce
  a per-breakpoint count rule.

# v1.5.11 addendum — Priority Metric card face simplified

Changes the priority metric card's (`w.metric.card`, `compact` variant —
implemented in code as `variant="priority"`; this spec-vs-code naming
mismatch is pre-existing and not resolved by this addendum, no rename is
authorized here) face composition on **S-P4-01 only**. Amends
`AC-P4-01-01` and `AC-P4-01-06`'s goal-line clauses as they describe this
card's face; `AC-P4-01-02` (delta tone), `AC-P4-01-08` (card-tap
navigation), and `AC-P4-01-09` (money via `formatMoney`) are unchanged. No
VM, API, or config change — `priorityMetrics[].goal.{state,target,
progressPct}` remain valid fields, still consumed by Metric Detail
(S-P4-02), which is unaffected and out of scope. Value-format abbreviation
is explicitly **not** part of this addendum — see `OQ-25` below.

- **AC-P4-01-44** The priority metric card renders:
  - Title and subtitle on one line, e.g. "TPC (Without Repricing)": the
    subtitle (`priorityMetrics[].variant` → `insights.variant.*`) renders
    inline immediately after the title, parenthesized, in the existing
    muted/caption text style. Cards with no `variant` render the title
    alone, unchanged.
  - No goal row and no progress bar, for **every** card regardless of
    `goal.state` — this supersedes `AC-P4-01-01`'s NOT_SET rendering
    ("card renders value + `insights.goal.notSet`, empty progress track")
    as a description of this face: goal is never shown on this face now,
    SET or not. `AC-P4-01-06`'s PTPC-specific "no goal row" carve-out
    becomes the default for every card on this face rather than a
    PTPC-only exception; `cardOverrides.PTPC.showGoal=false` remains valid
    config (a harmless no-op here) and is not removed.
  - No visible nav/arrow icon. `AC-P4-01-08` is unchanged — the entire
    card remains the tap target to S-P4-02; only the icon glyph is removed.
  - The delta badge on the **same row** as the value, right-aligned,
    instead of a separate row below it. `AC-P4-01-02`/`AC-P4-01-09` are
    unchanged — this is a position-only change.
- `widget-contracts.md`'s `w.metric.card` row is updated to note the
  `compact`(spec)/`priority`(code) naming mismatch.

## OQ-25 (new, 🔴 blocking value-format only — does not block AC-P4-01-44)

The requester also asked to drop the currency prefix and abbreviate large
money values for this metric wherever they render (e.g. "RM 80,000" →
"800K"), citing a reference screenshot of TPC. This directly conflicts
with an earlier, already-referenced mockup for this same screen (the
v1.5.10 priority-row layout change) that showed **FYP as "RM 420K"** —
abbreviated but **with** the currency prefix kept. It also conflicts with
`AC-P4-01-09` ("Money renders via DLS `formatMoney` from the decimal
string; no client rounding drift") and D-04 (money is a decimal string,
formatted only via `formatMoney`; no abbreviated mode exists today). Not
resolved by this addendum — no VM/formatter change is authorized until
this is answered. See README §7 `OQ-25`.

# v1.5.12 addendum — four independent chrome/layout changes

Four unrelated changes, each its own AC. No VM, API, or domain-data change
in any of them — config, CSS and markup only.

- **AC-P4-01-45** Priority Milestones (R7) is **hidden by default**, not
  removed: MY config now sets `scopes.SELF.milestones.visible=false` and
  `scopes.TEAM.milestones.visible=false` (was `true` for both since
  v1.0.0), same pattern as the v1.5.0 Scheme-toggle hide. Traceability rows
  #14-18, `AC-P4-01-10`, `AC-P4-01-12`, `AC-P4-01-20`, and the
  `milestones.*` VM fields/i18n keys are **unchanged and remain valid** —
  they simply aren't exercised by the shipped MY default; setting
  `visible=true` still renders R7 exactly as those rows/ACs describe. The
  README §7b Goal-Setting roadmap item (which names R7's "Set Goal" header
  as a future landing zone) is unaffected — the region still exists in the
  contract, only its default visibility changed. The separate
  `insights/milestones` screen/route (reachable via the R1 quick-link
  rail) is a different screen entirely and is untouched.
- **AC-P4-01-46** The priority metric card (`compact`/`priority` face,
  `AC-P4-01-44`/v1.5.11) tightens three spacing values to reduce its
  height further: card padding `12px`→`8px`, the title row's reserved
  `min-height:24px` is removed (sizes to actual text instead), and the
  gap before the value+delta row narrows from `8px` to `4px`. ⚠ These are
  direct-instruction estimates, not a measured value or Figma export —
  same convention as the v1.4.0 desktop chrome and v1.5.8 quick-link gap;
  tracked under the existing "Strict UX source approval is incomplete"
  blocker. No other content or behavior changes to this card face.
- **AC-P4-01-47** Other Focus Metrics adopts Priority Metrics' below-
  `breakpoint.desktop` single-column layout: below `breakpoint.desktop`
  (<1024px, mobile and tablet alike), Other Focus Metrics renders as a
  static, vertically stacked single-column list — full-width cards, no
  horizontal scroll, no scroll-snap, no pagination dots — identically to
  `AC-P4-01-43`'s rule for Priority Metrics. At `breakpoint.desktop`
  (≥1024px) Other Focus Metrics is unchanged: the existing 2-column CSS
  grid inside the collapsible panel. This supersedes the "Other Focus
  Metrics is unaffected/unchanged" carve-outs in `AC-P4-01-39` and
  `AC-P4-01-43`. Although Other Focus Metrics' resulting behavior is now
  identical to Priority Metrics', it remains its **own independently-
  specified** AC/widget instance (not merged with `AC-P4-01-43`) so the
  two rows can diverge again later without another spec change.
- **AC-P4-01-48** The "Product {value}" / "Time {value}" read-only
  summary pills (`AC-P4-01-38`) render with an `8px` corner radius instead
  of their current fully-rounded shape — border, background and padding
  unchanged, same convention as the scope switcher's pill radius
  (`AC-P4-01-42`/v1.5.9). Purely visual: `AC-P4-01-38`'s behavior (opening
  the combined Filter sheet) is unchanged and its wording is not amended.
  These two summary pills have no dedicated widget id in
  `widget-contracts.md` (unlike `w.filter.period`/`w.filter.segmented`,
  which drive the Filter sheet's own controls, not these read-only
  pills) — this AC is their sole record; no `widget-contracts.md` entry is
  added. These two pills must use their **own** dedicated
  class/variant, not a change to the shared `.pill` class also used by the
  History screen's (S-P4-03) filter-chip tabs, which are explicitly
  unaffected by this AC.

# v1.5.13 addendum — frontend-only metric tracking chrome + asset-registration patch

This update is an S-P4-01 frontend UI/layout and asset-registration patch
only. It does not change the route, VM/API/BFF contracts, filter options or
apply behavior, metric data, analytics payloads, navigation destinations, or
breakpoint tokens. The existing default `milestones.visible=false` config remains
unchanged; this addendum does not re-enable or alter R7. No backend,
BFF, API, VM, data-model, migration, or analytics changes are required.

- **AC-P4-01-49** On mobile (<768px), the unified Filter action renders as a
  single icon-only button with the provided `icon.filter` MY asset and an
  accessible name of `Filter`; the visible `Filter` label is hidden at this
  breakpoint but the action still opens the same Filter sheet, preserves the
  same hit target and surface treatment, and remains the same control as the
  tablet/desktop variant. Below 768px only, the icon is tinted `#ED1B2D`
  (direct-instruction value, not yet a DLS token); at ≥768px it keeps its
  existing neutral tone.
- **AC-P4-01-50** The overflow trigger uses the provided vertical more icon
  (`icon.more-vert`, `more-vert.svg` / `more_vert.svg`) and remains the same
  sheet-opening trigger and surface treatment as the Filter action; the
  previous horizontal `more-horiz` token remains unchanged for other screens
  and is not repurposed or replaced in the shared icon set.
- **AC-P4-01-51** The Product and Time read-only summary pills are static
  labels, not interactive buttons. They continue to show the current product and
  time values, but the control semantics are removed while keeping the same
  pill treatment and layout; opening the combined Filter sheet remains the only
  filter entry point for the user.
- **AC-P4-01-52** Priority Metrics and Other Focus Metrics keep their visible
  bordered panel surfaces at every breakpoint, with the same panel styling and
  stacked list behavior below `breakpoint.desktop` and the same 2-column grid at
  `breakpoint.desktop` and above. This is a presentation fix only; the metric
  row and VM contracts remain unchanged.
- **AC-P4-01-53** The provided MY assets are registered in
  `common/assets/MY/manifest.json` as `icon.filter` and `icon.more-vert` using
  their exact file names, hashes, intrinsic `viewBox` values, and supplied-asset
  metadata. The frontend icon registry exposes distinct `filter` and `more-vert`
  tokens in `public/icons/MANIFEST.json`; the existing `more-horiz` token remains
  intact and is not repurposed for this layout.

This addendum is the authoritative v1.5.13 frontend-only patch record for
S-P4-01. The screen remains draft pending the broader package UX approval
status, but the requested frontend-only change set is explicitly scoped and
non-breaking for the existing VM, BFF, route, analytics, and data contracts.

# v1.5.14 addendum — Combined Filter sheet redesign ("Filter & Selection")

Gives the combined Filter sheet (opened by the unified Filter action,
`AC-P4-01-38`) an explicit internal layout for the first time — previously
its contents were only described as reusing `w.filter.period` (bottom-sheet
variant) and `w.filter.segmented` with no dedicated widget id
(`AC-P4-01-48`). Introduces widget `w.filter.sheet` (`grouped-radio` variant,
`widget-contracts.md` §1). No VM, API, or BFF contract change — the sheet
still composes existing `DashboardFiltersVM` fields (`period`,
`businessLine`, `basis`, `teamView` + their `*Options`/`*Visible` siblings);
only the sheet's internal composition, its outer commit interaction, and one
retired per-control CTA are affected. AC-P4-01-38's trigger description
(Filter action + summary pills, opening one combined sheet) is unchanged;
only the sheet's own contents are redefined below.

⚠ Design source is a single requester-supplied screenshot, not a Figma
export or measured asset — same direct-instruction convention as the v1.4.0
desktop chrome, v1.5.8 quick-link gap and v1.5.10 priority-row layout,
tracked under the existing "Strict UX source approval is incomplete"
blocker, not a new one.

- **AC-P4-01-54** The sheet renders with title `insights.filter.title`
  ("Filter & Selection") and an X close control in the header (no back
  arrow). On open, each section pre-selects the sheet's current `filters.*`
  values into local (staged) state; opening the sheet and selecting a radio
  do **not** refetch — this supersedes I-01 for this control surface, which
  described refetch-on-change. Dismissing via X (or a backdrop tap) discards
  all staged changes and leaves `filters.*` unchanged, mirroring the
  existing period-sheet cancel semantics (`AC-P4-01-22`).
- **AC-P4-01-55** The body renders two vertically stacked, independently
  bordered/rounded card sections: "Product" (label
  `insights.filter.sectionProduct`, options from `filters.businessLineOptions`,
  i18n `insights.businessLine.{code}`) and "Time Period" (label
  `insights.period.sheetTitle`, options from `filters.periodOptions`, i18n
  `insights.period.{code}`). Each option renders as a full-width radio row
  with a divider rule between rows (no divider after the last row). This
  supersedes, **within this sheet only**: the segmented-tab rendering of
  business line (`w.filter.segmented` remains valid and unchanged wherever
  else it's used, e.g. S-P4-02's Product/Time selectors) and the per-option
  date-range subtitle under period rows (`periodOptionsMeta`,
  `AC-P4-01-23`) — subtitles are **not** rendered in this layout;
  `periodOptionsMeta` remains a valid, BFF-supplied VM field, simply
  unconsumed by this sheet going forward.
- **AC-P4-01-56** A full-width primary button labelled `insights.common.apply`
  ("Apply") renders pinned to the sheet's bottom edge. Tapping it commits
  every staged section's selection in a single refetch carrying all changed
  `filters.*` params together (`period`, `businessLine`, and — when its
  section is present — `basis`/`teamView`, per `AC-P4-01-57`) and closes the
  sheet; card rows show skeletons during the refetch, per the existing
  loading state (§5). This supersedes the standalone period sheet's
  `insights.common.select` ("Select") CTA (`AC-P4-01-22`) as the commit
  action for this sheet; `insights.common.select` remains a valid key, just
  unused by this sheet going forward, and no other screen's CTA copy
  changes.
- **AC-P4-01-57** When `basisToggleVisible` and/or `teamViewToggleVisible` is
  true, a third card section renders below "Time Period" containing the
  Scheme toggle row (`insights.basis.SCHEME.toggle`) and/or the Group toggle
  row (`insights.teamView.toggle`) — same rounded-card/divider convention as
  Product/Time Period, but rendered as switch rows (per their existing
  `w.filter.basis-toggle`/`w.filter.team-view-toggle` contracts) rather than
  radios, since these remain binary controls. Only the switch(es) whose
  visibility flag is true render; the section is omitted entirely when both
  are false — the current MY default (`AC-P4-01-16`, `AC-P4-01-30`), so this
  section is not exercised by the shipped MY config today. Toggling a switch
  here also stages locally, applied together with Product/Time Period on the
  same Apply tap (`AC-P4-01-56`).

No analytics change: `insights_filter_applied {period,businessLine,basis,teamView}`
(§7) still fires once, on the now-single Apply commit, with the same payload
shape.

---

# v1.5.15 addendum — Customize Metrics opens in place at tablet/desktop (correlated with S-P4-04 v1.5.0)

Amends `I-03`/`AC-P4-01-21`'s "each navigates and dismisses" description of
the "⋯ More Action sheet" (A1). At `breakpoint.tablet` and
`breakpoint.desktop`, the **"Customize Metrics" row is now an exception**:
it opens the S-P4-04 overlay in place over the still-mounted dashboard
(S-P4-04 `AC-P4-04-33`) instead of navigating to
`insights/customize-metrics`; "Set Goals" and "Historical Data" are
unaffected and still navigate normally at every breakpoint. Below
`breakpoint.tablet` (mobile), all three rows — including "Customize
Metrics" — still navigate exactly as `AC-P4-01-21` already describes; no
mobile behavior changes. Same exception applies to the "+ add focus metric"
affordance (traceability, `focusMetrics.addEnabled`) wherever it links to
`insights/customize-metrics`. No VM, API, BFF, or config change — this is
purely which control mechanism (navigation vs. in-place overlay) fires for
one specific row, at two of three breakpoints.

- **AC-P4-01-58** (extended to every breakpoint by AC-P4-01-80, v2.0.0) At
  `breakpoint.tablet` and `breakpoint.desktop`, tapping "Customize Metrics" in
  the More Action sheet (or the "+ add focus metric" icon) opens S-P4-04's
  overlay without navigating away from S-P4-01; the dashboard's filters,
  scope, scroll position, and rendered card data are unchanged by opening or
  closing it. Below `breakpoint.tablet`, both affordances still navigate to
  `insights/customize-metrics` as before.

---

# v1.5.16 addendum — "⋯" renders as an anchored popover at tablet/desktop

Completes a declaration v1.2.0 made but never finished: that addendum said
"⋯ actions render as a **popover menu** (X to close) — same `moreActions`
VM, DLS variant `menu`" and `widget-contracts.md` has listed a `menu`
variant of `w.sheet.more-action` ever since — but **which breakpoint uses
the sheet vs. the menu was never defined**, so the shipped control has
always rendered the full-width, dimmed-backdrop `bottom-sheet` variant at
every breakpoint. A production PRUForce screenshot ("Tablet (4).png",
requester-supplied) supplies that missing definition and corrects one
detail of the original wording.

⚠ Screenshot-derived evidence, not a Figma export — tracked under the
existing "Strict UX source approval is incomplete" blocker, not a new one.

No VM, API, BFF, or config change: `moreActions[]`/`MoreActionVM` and each
row's own destination/behavior are unchanged — "Set Goals" and "Historical
Data" still navigate; "Customize Metrics" still follows the in-place
overlay behavior from `AC-P4-01-58` (S-P4-04 v1.5.0). This addendum governs
only the "⋯" trigger's own chrome — which of `w.sheet.more-action`'s two
already-named variants renders, and that `menu` variant's exact geometry
and dismissal.

- **AC-P4-01-59** Below `breakpoint.tablet` (<768px, mobile), "⋯" still
  opens `w.sheet.more-action`'s `bottom-sheet` variant exactly as today:
  full-width, dimmed backdrop, X close. At `breakpoint.tablet` and
  `breakpoint.desktop` (≥768px), "⋯" instead opens the `menu` variant: an
  anchored popover card, right-edge-aligned directly below the "⋯" trigger,
  white surface with rounded corners and shadow. The dashboard beneath it
  is **not** dimmed by a backdrop (unlike the bottom-sheet and unlike
  S-P4-04's Customize Metrics overlay) — it stays fully visible, overlapped
  rather than obscured, matching the header persona switcher's existing
  anchored-menu treatment (`w.scope.switcher`, A1).
- **AC-P4-01-60** The `menu` variant has **no visible X control** —
  corrects v1.2.0's "X to close" wording for this variant specifically
  (mobile's `bottom-sheet` X close, `AC-P4-01-21`, is unaffected). It
  dismisses via an outside click, Escape, or selecting a row — the same
  three dismissal paths the header persona switcher's anchored menu already
  uses.
- **AC-P4-01-61** Row content is identical between the two variants: same
  order, icons, and labels (`insights.action.{id}.title`) driven by the
  same `moreActions[]` config — this addendum changes only the surrounding
  chrome (sheet vs. anchored menu), never which rows appear or what each
  one does.
- **AC-P4-01-62** Opening the `menu` variant traps focus within it and
  returns focus to the "⋯" trigger on close, and blocks background
  keyboard focus while open — reaffirms the shared sheet/overlay focus
  contract (formalized S-P4-04 v1.4.0, `widget-contracts.md` §4) for this
  control now that it has a second, non-sheet chrome.

`widget-contracts.md`'s `w.sheet.more-action` `menu`-variant row is updated
to state this breakpoint split plainly and drop the "with X" detail.

# v1.5.17 addendum — Remove Introducer Drilldown from the SELF quick-link rail

The MY `SELF` dashboard composition no longer exposes the Introducer Drilldown
quick link in R1. This is a scope-specific configuration change only: the
Introducer Drilldown route, page, icon asset, i18n label, and `QuickLinkVM`
shape remain valid for other entry points. The MY `TEAM` composition is
unchanged and continues to expose Team Drilldown.

- **AC-P4-01-63** In MY `SELF` scope, the R1 quick-link rail renders exactly
  `MILESTONES`, `COMP_BEN`, and `LEADERBOARD`, in that order. It must not emit
  or render `INTRODUCER_DRILLDOWN` / "Introducer Drilldown". The BFF composes
  this result from `screens.dashboard.scopes.SELF.quickLinks`; the frontend
  continues to render the supplied `quickLinks[]` without hard-coded scope
  filtering.
- **AC-P4-01-64** In MY `TEAM` scope, the R1 quick-link rail remains exactly
  `MILESTONES`, `TEAM_DRILLDOWN`, and `LEADERBOARD`, in that order. This change
  does not remove the Team Drilldown link or alter its route.

# v1.5.18 addendum — Mobile P2 Team View selector

Source: requester-attached Figma PNG (750px wide, interpreted at 2x density).
Geometry is screenshot-derived, not measured Figma metadata; existing package
readiness blockers remain. This supersedes the mobile anchored menu in
AC-P4-01-42 and the mobile Group-toggle surface in AC-P4-01-57 only.
Tablet/desktop keep their existing scope menu. Domain API and D-14 authorization
are unchanged; C3 adds optional `ScopeSwitcherVM.teamViewOptions`.

- **AC-P4-01-65** The BFF supplies `scopeSwitcher.teamViewOptions=[DIRECT,GROUP]`
  for resolved P2 users when TEAM config enables `teamViewToggle`, in both SELF
  and TEAM responses. P3 omits it; P4 has no scope switcher. Missing capability
  hides the selector. Frontend persona labels never override resolved identity.
  `filters.teamViewToggleVisible` keeps its existing TEAM-only semantics.
- **AC-P4-01-66** Below 768px the View sheet shows leading Self/Team radios
  in one rounded bordered card. With staged Team selected and P2 capability,
  a Direct/Group trigger appears below Team inside the card. It opens a white,
  rounded, shadowed radio panel below the trigger, matching the attached PNG.
  Fresh TEAM entry defaults to Direct; reopening TEAM preserves the applied
  team view. Selecting Self hides the dropdown and removes teamView on Apply.
  (P3's staged-Team trigger is the disabled variant in `AC-P4-01-70`, not
  hidden.)
- **AC-P4-01-67** Radio and dropdown changes are staged without requests.
  Apply commits scope and teamView in one dashboard request, including
  SELF -> TEAM/GROUP; the existing scope-reset logic must not overwrite GROUP.
  A teamView-only change preserves period/businessLine/basis. Actual scope
  changes retain existing period/basis default rules. Unchanged Apply closes
  without refetch. SELF never sends teamView. P3 TEAM remains DIRECT-only.
- **AC-P4-01-68** Cancel, X, backdrop and sheet Escape discard the full draft.
  Reopening restores applied values. Dropdown selection closes only the menu;
  outside click or Escape can also close only the menu without applying.
- **AC-P4-01-69** Dropdown radios support keyboard operation; Escape from the
  open menu restores focus to its trigger without closing the sheet. The
  parent sheet retains its focus trap. Dropdown content must not be clipped
  by the option card or overlap Cancel/Apply; small heights allow sheet scroll.
  At 768px and above, scope menus and immediate selection stay unchanged.
- **AC-P4-01-70** For P3 (no `teamViewOptions` capability), staged Team still
  renders the same trigger below Team inside the card, showing "Direct" —
  disabled (no press/keyboard interaction, no menu, muted styling), not
  hidden. This is presentational only: it does not grant Group access and
  does not alter the DIRECT-only Apply/refetch behavior already required by
  `AC-P4-01-67`.

# v1.5.19 addendum — Filter & Selection responsive chrome

Source: direct instruction, referencing the already-approved Customize
Metrics (S-P4-04) responsive split as the pattern to reuse. No VM, API, or
staged/Apply contract change — `w.filter.sheet` keeps the exact prop shape
and behavior from `AC-P4-01-54`–`57`; only the chrome around it responds to
viewport width.

- **AC-P4-01-71** Below 768px, "Filter & Selection" renders exactly as
  before v1.5.19: a bottom-anchored sheet, full width, rounded top corners,
  opened by the Filter action.
- **AC-P4-01-72** At 768px and above, "Filter & Selection" renders as a
  right-anchored, full-height side drawer (`width: min(420px,100vw)`, no
  rounded corners, a left border, header height 72px) over the still-mounted
  dashboard — the same responsive geometry `w.customize.overlay` already
  uses at this breakpoint. Opening/closing, staged Product/Time selection,
  and the single Apply commit are unchanged from mobile; focus trap,
  Escape-to-close and backdrop dismissal are unchanged from the existing
  sheet/overlay contract (`AC-P4-04-27`/`28`/`30`).
- **AC-P4-01-73** The Other Focus Metrics `simple` face no longer renders the
  `arrow-right-up-line` nav icon in its head row (title + value + delta only,
  as already specified) — matching the `compact` face's existing icon-less
  treatment. The whole card remains the tap target; `AC-P4-01-08` navigation
  is unaffected. No VM/API change.
- **AC-P4-01-74** Every `w.metric.card` face (`compact` priority cards and the
  `simple` Other Focus Metrics face) renders a `1px solid #E4E4E7` border —
  a direct-instruction value, distinct from the shared `--color-border`
  token, not yet a DLS token. No VM/API change; existing shadow, radius and
  padding per face are unchanged.
- **AC-P4-01-75** Whenever `filters.scope=TEAM`, the "Performance" heading
  appends a muted, regular-weight suffix `(Direct View)` or `(Group View)`
  from `filters.teamView` — data-driven from the resolved filter, not a
  persona check, so it renders identically for a P2 viewing Team/Direct, a
  P2 viewing Team/Group, and a P3 (always Team/Direct). `SELF` renders no
  suffix. No VM/API change; reuses the existing `insights.teamView.{DIRECT,
  GROUP}` labels via the new `insights.dashboard.teamViewSuffix` template.

# v1.5.20 addendum — Scope switcher icon resolution + dashboard delta copy (closes OQ-24, partially resolves OQ-32)

Source: direct instruction with two requester-provided final SVG assets
(`Self.svg`, `Team.svg`). No VM, API, or config change — `ScopeSwitcherVM`
and `MetricCardVM` are unchanged; this addendum only replaces an icon asset
and picks between two already-vendored i18n keys.

- **AC-P4-01-76** The scope switcher's single generic
  `icon.insights.scope-avatar` is replaced by two distinct, DLS_APPROVED
  assets, `icon.insights.scope-self` and `icon.insights.scope-team`,
  selected by the relevant scope. Applies to the trigger (`AC-P4-01-42`,
  every breakpoint — icon-only below `breakpoint.tablet`, icon+label at
  and above it) and to the tablet/desktop anchored menu rows, which now
  render the scope's icon beside its name. The mobile View sheet's
  Self/Team radios (`AC-P4-01-66`) are explicitly **unaffected** — they
  remain text-only, no icon, per direct instruction. Same asset provenance
  as the v1.5.7 quick-link icon swap: requester-provided final files, not a
  Figma export trail. **Closes `OQ-24`.**
- **AC-P4-01-77** The Dashboard's `w.metric.card` delta line (both the
  `compact` priority-card face and the `simple` Other Focus Metrics face)
  renders its muted suffix from `insights.delta.vsLastYear` ("vs last
  year") instead of `insights.delta.vsLY` ("vs LY"), per direct
  instruction. Both keys already existed in the vendored bundle; only the
  key `w.metric.card` reads changed — the string values, `DeltaVM.display`
  read (D-10), sentiment→tone mapping and badge markup are unchanged.
  Scoped to this widget only: `w.metric-detail.comparison`'s reused
  delta-line face (S-P4-02, widget-contracts.md) is unaffected and keeps
  `insights.delta.vsLY`. **Partially resolves `OQ-32`**, which remains open
  for that screen's face.

# v2.0.0 addendum — TEAM Focus metric change, unified in-place overlay, filter persistence, money abbreviation (SPEC-2026-003)

**Breaking**, correlated with S-P4-04 v2.0.0. NEW_RECRUIT_CONTRACTED is FOCUS
at both scopes (C1 2.0.0), and MY config TEAM `priorityCards.maxCount` is 8
(C4 3.0.0). SELF is unchanged. Amends A2.

- **AC-P4-01-78** In TEAM scope (DIRECT or GROUP) the dashboard renders
  exactly 8 priority cards in MY — TPC, PTPC, CASE_COUNT, FYP, MANPOWER,
  ACTIVITY_RATIO, PRODUCTIVITY, AVERAGE_CASE_SIZE, in saved order — and never
  a NEW_RECRUIT_CONTRACTED priority card. NEW_RECRUIT_CONTRACTED renders as an
  Other Focus Metrics card only when it is in the TEAM preference's
  `focusMetricCodes` (not selected by default).

**Unified Customize Metrics entry (supersedes `AC-P4-01-58`'s tablet/desktop
scoping and `AC-P4-01-26`'s mobile navigation):** the requester asked that
opening Customize Metrics from this dashboard never navigate away, at any
breakpoint.

- **AC-P4-01-80** At every breakpoint, tapping "Customize Metrics" in the More
  Actions sheet, or the "+" on an empty Other Focus Metrics panel, opens
  S-P4-04's overlay in place (side sheet at tablet/desktop per `AC-P4-01-58`;
  bottom sheet below `breakpoint.tablet` per S-P4-04 `AC-P4-04-41`) without
  navigating away from S-P4-01. The standalone `insights/customize-metrics`
  route remains a direct-link fallback at every breakpoint. No VM, API, BFF,
  or config change — only which control mechanism fires, now uniform across
  breakpoints instead of split at `breakpoint.tablet`.

**Filter persistence (new — no prior AC covered this):** the requester asked
that applied Product/Time/Scope filters survive leaving and returning to this
dashboard, e.g. via a metric card, Historical Data, or a page reload, rather
than resetting to config defaults every time.

- **AC-P4-01-79** After a filter Apply, scope switch, or initial load
  succeeds, the dashboard's resulting filters (`period`, `businessLine`,
  `basis`, `scope`, `teamView`) are retained client-side (browser session
  storage) keyed to the current persona/mock-sample identity. Re-entering this
  route within the same browser session restores them instead of the config
  defaults. A different persona/sample, a fresh browser session, or a filter
  set the BFF rejects (non-200) all fall back to defaults. This is
  client-side-only state, not a URL parameter or a server-persisted
  preference — it does not use or extend `metric_preferences` (C1 §5).

**Money abbreviation on metric cards — closes `OQ-25`:** see README §7 for
the resolution. On this screen it applies as follows.

- **AC-P4-01-81** Every `w.metric.card` MONEY value — both the `compact`
  (Priority) and `simple` (Other Focus Metrics) faces, every scope — renders
  in the existing compact form (`formatMoneyCompact`: below 1,000 the plain
  integer, 1,000+ "{n}K", 1,000,000+ "{n}M", one decimal, half-up rounding, no
  currency prefix), regardless of `MetricCardVM.valueDisplay`. COUNT, PERCENT
  and DECIMAL values are unaffected and continue to follow `valueDisplay`
  (default FULL). This generalizes the compact rendering `AC-P4-01-44`
  (v1.5.11) already required for TPC specifically; TPC's now-redundant
  `cardOverrides.valueDisplay` config entry may be removed in a future config
  revision without any visible effect. Scope is this widget only — Metric
  Detail (S-P4-02) and every other MONEY consumer keep `formatMoney` per D-04,
  unaffected.
# v2.1.0 addendum — Viewing a team member's dashboard (SPEC-2026-004)

Source: requester MY frames f03 (mobile), f11 (desktop 1024) and f17
(desktop 1440), 2026-09-24, screenshot-derived; decisions D-P4-07-03/04 in
S-P4-07. Entry point: S-P4-07 member card tap (`TeamMemberVM.nav`).
C3 1.8.0 adds `PerformanceDashboardVM.viewing` (`DashboardViewingVM`); the
BFF dashboard route accepts `subjectAgentId`.

| # | UI element | VM field | Notes |
|---|---|---|---|
| V1 | Viewing banner: avatar, "Viewing {name}", `{agentId} \| {role}` | `viewing.member` | `insights.viewing.title`; role = `insights.teamDrilldown.basis.{hierarchyBasis}` |
| V2 | Exit View (desktop outlined button) / close ✕ (mobile) | `viewing.exitNav` | `insights.viewing.exit`; mobile ✕ uses `insights.common.close` as its accessible name |
| V3 | Member's dashboard body | `priorityMetrics`, `focusMetrics`, `quickLinks`, `moreActions`, `filters` | composed for the member in `viewing.scope` |

- **AC-P4-01-82** *(BFF)* `subjectAgentId` is accepted only for leader
  callers and only for a member of the caller's downline (P3: DIRECT team;
  P2: whole downline); otherwise 403 `BFF-4033`. The domain is called with the
  member's `agentId` under the caller's `insights:read:downline` scope.
- **AC-P4-01-83** *(BFF)* Scope follows the member's role (D-P4-07-03): an
  agent ⇒ `scope=SELF`; a member with direct reports ⇒ `scope=TEAM`,
  `teamView=DIRECT`. The response carries `viewing` with that scope, and
  `filters.scope`/`teamView` match it. A `scope`/`teamView` query supplied
  with `subjectAgentId` is ignored.
- **AC-P4-01-84** *(BFF)* Viewing mode is read-only: `scopeSwitcher` absent;
  `quickLinks` = C4 `viewing.quickLinks` (MY: COMP_BEN); `moreActions` = C4
  `viewing.moreActions` (MY: HISTORICAL_DATA); `focusMetrics.addEnabled`,
  `milestones.addEnabled` and `milestones.setGoalEnabled` are false.
  Period/Product filters still apply and keep `subjectAgentId`.
- **AC-P4-01-85** *(UI)* With `viewing` present the page replaces the
  "Performance" title row and scope switcher with the viewing banner (V1/V2):
  mobile — full-width white strip under the app bar, avatar 36, name line +
  `{agentId} | {role}` line, close ✕ on the right; desktop — white card
  (radius 16, 1px border) at the top of the content column, avatar 36,
  outlined "Exit View" button right-aligned. The quick-link rail then shows
  the viewing links as a single wide tile row (icon + label inline), per
  f03/f11/f17. Metric cards keep their face; card navigation is disabled in
  viewing mode (S-P4-02 has no viewing support yet — OQ-84).
- **AC-P4-01-86** *(UI)* Exit View / ✕ navigates to `viewing.exitNav`
  (S-P4-07), restoring the list's search/sort/filter state (AC-P4-07-14).
- **AC-P4-01-87** *(content)* `insights.quicklink.TEAM_DRILLDOWN` reads
  "My Team" (frames f04–f06, f13–f15); icon, order and nav unchanged.

Open: OQ-84 🟡 metric-detail/history drill-through while viewing a member
(Product). The frames' "+" on Other Focus Metric is not rendered in viewing
mode (read-only, recorded in OQ-82).

# v2.2.0 addendum — Filter label copy, quick-link `disabled` field (content + contract)

Two independent changes from the frontend's 2026-09-29 implementation pass.

**Filter label copy (content-only, no layout/behavior change).** "Product"
becomes "Business" and "Time"/"Time Period" becomes "Period" wherever they
label the same two filter dimensions, and `insights.businessLine.ALL` becomes
the more explicit "PAMB & PBTB" (chip copy `insights.businessLine.ALL.chip`
"Insurance + Takaful" is unchanged).

- **AC-P4-01-88** *(content)* `insights.filter.sectionProduct`,
  `insights.dashboard.filter.product` read "Business" (were "Product");
  `insights.period.sheetTitle` reads "Period" (was "Time Period");
  `insights.dashboard.filter.time` reads "Period" (was "Time");
  `insights.businessLine.ALL` reads "PAMB & PBTB" (was "Both"). No VM field,
  filter semantics or query-param name changes — `businessLine`/`period`
  request values are unchanged.

**Quick-link `disabled` field (additive, BFF↔UI contract).** `QuickLinkVM`
gains an optional `disabled` boolean (`domains/insights/bff/performance-vm.ts`):
when true, R1 renders that tile visible but non-interactive (no navigation,
muted tone, `not-allowed` cursor) instead of omitting it. This gives the BFF
a per-link interactivity signal that didn't exist before v2.1.0, where
composition only ever governed which links render (A2, v1.5.17), never
whether a rendered one is clickable.

- **AC-P4-01-88b** *(BFF/UI)* `QuickLinkVM.disabled` absent or `false` ⇒
  tile behaves exactly as before (clickable). `disabled: true` ⇒ tile stays
  in the rail at its configured `order`, renders with muted icon tone and
  `not-allowed` cursor, and any click/keyboard activation is a no-op (no
  navigation, no route change).

Not yet resolved by this addendum: the BFF does not populate `disabled` for
S-P4-01 today — the frontend independently disables every SELF quick link
and every TEAM quick link except `TEAM_DRILLDOWN`, hardcoded by `scope`
rather than driven by this field. That gap, and whether it's a permanent
per-scope rule or temporary pending unbuilt destination screens, is tracked
as **OQ-85** (unchanged by this addendum — still 🟡, not promoted to an AC).

# v2.2.0 addendum — AI Recommendations overlay removed from render (unconfirmed — flagged, not specced)

The frontend's 2026-09-29 change comments out the entire `reco-overlay`
block (was gated on `vm.recommendations.visible && vm.recommendations.panel`,
AC-P4-01-49–53) so the AI Recommendations panel/banner no longer renders at
all, regardless of BFF data. This is **not** encoded as a spec change here:
nothing in this conversation confirms whether it's a deliberate product
decision (e.g. panel pulled from this release) or a temporary local edit
(e.g. debugging, mid-refactor). AC-P4-01-49–53 stand unchanged pending
confirmation. Recorded as **OQ-86** 🟡 — owner: Product, confirm before the
next revision either restores the overlay or formally retires those ACs.
