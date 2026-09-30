# Performance Widget Contracts (CDK · DLS) — P4 + P2/P3

> **v1.1.0** adds the Agent Leader widgets (marked 🆕); **v1.2.0** adds the P4-uplift
> widgets (marked 🆕2); **S-P4-01 v1.5.14** adds the combined Filter sheet
> (marked 🆕3); **S-P4-04 v1.4.0** adds the Customize Metrics responsive
> overlay (marked 🆕4); **S-P4-02 v1.3.0** adds the `gauge.primary`/
> `comparison.primary` responsive card grouping (marked 🆕5); **S-P4-02 v1.4.0**
> adds the header region and mobile/tablet detail-card faces (marked 🆕6).
> Prop types reference `domains/insights/bff/performance-vm.ts`; the current
> C3 1.5.0 card-availability contract is clarified below.

`specVersion: 1.5.0` — S-P4-02 v1.21.0 simplifies the Metric Detail header
and breakdown table (`AC-P4-02-60`–`-62`): no `teamView` chip at any scope,
the `w.detail.context-pill` Product value for `ALL` reads "Both", and
`w.metric-detail.breakdown-table` keeps its column-header row for screen
readers only. No prop shape or token change.
1.4.0: S-P4-02 v1.20.0 emits `w.metric-detail.penders` for
TPC/PTPC at `scope=SELF` as well as `scope=TEAM` (`AC-P4-02-58`/`-59`), with
the same `link-value` face; CASE_COUNT and FYP are unchanged.
1.3.0: S-P4-02 v1.19.0 gives `w.metric-detail.penders` a
`link-value` face for TPC/PTPC ("{count} Cases" plus `icon.external-link-line`,
navigable only when the optional `PendersSectionVM.nav` is present), and adds
the screenshot-derived §2 `color.link` token.
1.2.0: S-P4-02 v1.18.0 takes breakdown product rows out of
`R-MONEY-COMPACT`: they show plain values, and only the Total stays compact.
1.1.0: adds the shared §2 `R-MONEY-COMPACT` rule and opts S-P4-02 v1.17.0 in
(TPC/PTPC/FYC/FYP/AVERAGE_CASE_SIZE). 1.0.2: card-state
clarification for C3 1.5.0 / SPEC-2026-001; `w.metric.card` compact-MONEY
rendering and `w.customize.overlay` unified non-navigating behavior for
SPEC-2026-003. No widget prop shape or visual-token change in either
revision.

**`w.filter.sheet` (🆕3) note:** on S-P4-01 only, since v1.5.14, this widget
supersedes the standalone rendering of `w.filter.segmented` (business line)
and the `bottom-sheet` variant of `w.filter.period` (time period, including
its per-option date subtitle and "Select" CTA) *inside the combined sheet*.
Both widgets are otherwise unchanged and still used as-is elsewhere (e.g.
`w.filter.segmented` on S-P4-02's Product/Time selectors, `new-recruit-contracted.md`).
Since v1.5.19, its responsive chrome follows `w.customize.overlay`'s existing
split: `bottom-sheet` (<768px) / `side-sheet` (≥768px, right-anchored,
`width: min(420px,100vw)`, non-navigating over the still-mounted dashboard).
No prop, VM, or API change — same staged/Apply contract either way
(`AC-P4-01-71`/`72`).

Widgets are the standardization unit on the UI side. Each widget has a **frozen
props contract** (a VM type from `domains/insights/bff/performance-vm.ts`) shared by every
country. Countries vary a widget only through:

1. **DLS tokens** — colors, elevation, radius, typography (theme pack per country).
2. **CDK variant** — a named visual variant selected in config (`widgetVariant`),
   never a fork of props or behaviour.
3. **Config composition** — whether/where the widget appears (C4).

Changing a prop shape is a **breaking change**: bump this file + `performance-vm.ts`
major, and register a deprecation window before removing anything.

## 1. Widget inventory

| Widget ID | Props (VM type) | Purpose | Known variants | States |
|---|---|---|---|---|
| `w.quicklink.rail` | `QuickLinkVM[]` | Icon shortcut rail (Milestones, Compensation & Benefits, …) | `circle-icon` (MY) | default |
| `w.reco.banner` | `RecommendationsEntryVM` | "Performance Recommendations" entry | `gradient` (MY) | hidden when `visible=false` |
| `w.filter.period` | `filters.period(+Options)` | QTD/YTD dropdown | `pill-dropdown` | disabled while loading |
| `w.filter.segmented` | `filters.businessLine(+Options)` | Both / Insurance / Takaful tabs | `segmented` | — |
| `w.filter.basis-toggle` | `filters.basis`, `basisToggleVisible` | "Scheme" switch | `labelled-switch` | hidden by config |
| `w.filter.sheet` 🆕3 | `Pick<DashboardFiltersVM, 'period'\|'periodOptions'\|'businessLine'\|'businessLineOptions'\|'basis'\|'basisToggleVisible'\|'teamView'\|'teamViewToggleVisible'>` | Combined "Filter & Selection" chrome opened from the Filter action (S-P4-01 only, `AC-P4-01-38`) | `grouped-radio` (MY, S-P4-01 v1.5.14); responsive chrome since v1.5.19: `bottom-sheet` (<768px) / `side-sheet` (≥768px, right-anchored, same split as `w.customize.overlay`) | staged (dirty, Apply enabled while unapplied changes exist) · applying (card-row skeletons during the post-Apply refetch) |
| `w.metric.card` | `MetricCardVM` | Priority metric card (TPC, PTPC, Case Count, FYP, …) | `compact` (MY; ⚠ implemented in `pa-fe-dev` code as `variant="priority"` — pre-existing spec/code naming mismatch, not resolved as of v1.5.11) | loading-skeleton · no-goal · error-slot; on S-P4-01 the `compact` face never renders goal/progress since v1.5.11 (`AC-P4-01-44`) regardless of `goal.state` — the `no-goal` state above is now this face's only goal-related state; card padding/title-row/value-gap tightened further in v1.5.12 (`AC-P4-01-46`, ⚠ unmeasured direct-instruction estimate); since v1.5.19 every face (`compact` and `simple`) gets a `1px solid #E4E4E7` border, direct-instruction value distinct from `--color-border` (`AC-P4-01-74`); since S-P4-01 v2.0.0 (`AC-P4-01-81`, closes `OQ-25`) every MONEY value on this widget renders in `formatMoneyCompact` form regardless of `valueDisplay` — COUNT/PERCENT/DECIMAL still follow `valueDisplay` |
| `w.milestone.card` | `MilestoneCardVM` | MDRT Series / Star Club progress | `three-measure` (MY) | loading-skeleton · error-slot; hidden by MY config default (`milestones.visible=false`) since v1.5.12 (`AC-P4-01-45`) — widget/VM/ACs unchanged, re-enable via config |
| `w.metric-detail.gauge` | `GaugeSectionVM` | Collected vs Penders donut | `donut-270` (MY) | loading · no-penders (solid arc) |
| `w.metric-detail.threshold-gauge` | `ThresholdGaugeSectionVM` | % value vs threshold marker | `arc-180` (MY) | below-threshold (sentiment tint). **S-P4-02 v1.12.0 (Persistency, ARVIJ-111/113/115/170/172/174)**: confirmatory, no prop or variant change. The RAG ring is the existing tint: `sentiment` `POSITIVE` (at or above the threshold for `GTE`) → `tone.success`, and `NEGATIVE` (below) → `tone.danger` (§2). No amber state. The threshold marker stays at **both** SELF and TEAM. For PERSISTENCY_* this widget is now the only value section, because `comparison.primary` is no longer emitted (`AC-P4-02-46`). |
| `w.metric-detail.comparison` | `ComparisonSectionVM` | YTD vs prior year + growth badge | `stacked-rows` | — |
| `w.metric-detail.variant-value` | `VariantValueSectionVM` | "With Repricing" value card | `single-row` | — |
| `w.metric-detail.penders` | `PendersSectionVM` | Penders count card | `single-row` · `link-value` (TPC/PTPC, S-P4-02 v1.19.0; Self and Team since v1.20.0) | nav-absent (non-interactive) · nav-present (link) |
| `w.metric-detail.breakdown-table` | `BreakdownSectionVM` | Product × business-line table | `scroll-x` | **v1.8.0 (`AC-P4-02-35`)**: `columns` is exactly one entry, equal to `context.businessLine` (`ALL`→"Both", combined value; `INSURANCE`/`TAKAFUL`→that line's own value) — never a fixed Insurance+Takaful pair. `scroll-x` is now a fallback for long single-column content, not a ≥2-column comparison feature. Column header reuses the existing `insights.businessLine.{ALL,INSURANCE,TAKAFUL}` keys unchanged (`ALL`="Both" already exists — no new key). Per `AC-P4-02-29`, two adjacent `BREAKDOWN` sections pair into a two-column *row* (one card per variant, each still single-column internally) at `breakpoint.desktop` when both are present — unrenderable today since no fixture emits `breakdown.with-repricing` (`OQ-38`). Per `AC-P4-02-30`, a single shared "Breakdown by Product" heading (`insights.detail.breakdownByProduct`, no longer interpolated) sits above the section's card(s); each card's own heading is the bare variant label (`insights.variant.{variant}`), same convention as `w.metric-detail.variant-value` under `AC-P4-02-24`. **v1.11.0 (FYP, `AC-P4-02-40`)**: FYP activates this widget for the first time with `breakdown.without-repricing` only (no repricing capability, so no paired `.with-repricing` card) and the **old 7-row set** (`LINKED_PREMIUM`, `REGULAR_PREMIUM`, `PSA`, `SINGLE_PREMIUM`, `CREDIT_POINTS`, `UNIT_TRUST`, `GROUP_PREMIUM`) — `CREDIT_POINTS` here is a plain `weightPct` row, not TPC/PTPC's capped formula. **v1.17.0 (`AC-P4-02-54`)**: for TPC/PTPC/FYC/FYP/AVERAGE_CASE_SIZE the Total renders per §2 `R-MONEY-COMPACT` ("80.1K"). **v1.18.0 (`AC-P4-02-55`)**: product row cells show the plain value, meaning `formatMoney` digits with no currency prefix and no K/M ("24,690", "4,250.70"). The `weightPct` suffix is unchanged (`OQ-72` covers the "Credit Points" label). **v1.21.0 (`AC-P4-02-62`)**: the column-header row ("Product" + the business-line label) is **visually hidden but kept for screen readers** (a real `<th>` header row, not removed). Product rows start directly under the card's variant heading. The business line is shown visually only by the Product context pill. Applies to every breakdown table (TPC, PTPC, FYP). |
| `w.history.tabs` | `HistoryTabVM[]` | Metric pill switcher | `pill` | — |
| `w.history.table` | `MetricHistoryVM.{years,rows}` | Month × year matrix | `scroll-x` | "-" for null cells |
| `w.history.pager` | `MetricHistoryVM.comparison` | "Vs Last 2 Years" ‹ › | `link-pager` | arrows disabled at bounds |
| `w.customize.list` | `CustomizeItemVM[]` + `CustomizeConstraintsVM` | Check + drag-reorder list | `card-rows` | locked (grey check) · drag |
| `w.customize.overlay` 🆕4 | `CustomizeMetricsVM` (composes existing `priority[]`/`focus[]`/`constraints`, no new fields) | Responsive chrome (header/footer/scroll container) hosting `w.customize.list`; supersedes the prior unversioned full-page treatment | `bottom-sheet` (<768px; through S-P4-04 v1.5.1 was route-based, per `AC-P4-04-11`–`15`) · `side-sheet` (≥768px, S-P4-04 v1.4.0/v1.4.1/v1.5.0; width `min(420px,100vw)`, non-navigating/in-place over the still-mounted dashboard, `AC-P4-04-33`–`37`) — since S-P4-04 v2.0.0 (`AC-P4-04-41`) **both variants are non-navigating/in-place**; the `insights/customize-metrics` route is now a direct-link fallback at every breakpoint, not a variant-specific mechanic | focus-trapped while open · Save disabled (clean) · Save enabled (dirty ∧ constraints satisfied) |
| `w.nav.footer-link` | `QuickLinkVM` | "View MOC" row | `list-row` | — |

### 1b. 🆕 v1.1.0 widgets (P2/P3 Agent Leader)

S-P4-01 v1.5.18 overrides `w.scope.switcher` below 768px with `view-sheet`:
props are `ScopeSwitcherVM` plus current `DashboardFiltersVM.teamView`.
Self/Team and the P2-only Direct/Group dropdown stage together until Apply;
capability comes from optional `scopeSwitcher.teamViewOptions`, not a client
persona check. Reuse BottomSheet and radio behaviors; the nested dropdown
shares the parent focus trap. See AC-P4-01-65–69. The `icon-pill` anchored
menu description below continues to apply at tablet/desktop.
Self/Team radios stay text-only, no icon — unaffected by the v1.5.20 icon
resolution on the trigger/anchored menu (`AC-P4-01-76`).
i18n: sheet title `insights.scope.sheetTitle`; Self/Team radio labels reuse
`insights.scope.{SELF,TEAM}`; the Direct/Group dropdown trigger's visible
text and menu-option labels reuse `insights.teamView.{DIRECT,GROUP}`, with
`insights.teamView.label` as the trigger's `aria-label` (no visible caption
in the attached PNG); footer buttons are `insights.common.{cancel,apply}`.
When staged Team lacks `teamViewOptions` (P3), the same trigger renders in a
disabled state showing `insights.teamView.DIRECT` — no press/keyboard
handling, no menu — instead of being omitted (`AC-P4-01-70`).

| Widget id | Props (VM type) | Variants | Notes |
|---|---|---|---|
| `w.scope.switcher` | `ScopeSwitcherVM` | `icon-pill` (responsive icon+label, v1.5.9; was icon-less `native-select` in v1.5.4, `avatar-dropdown` in v1.5.3, `header-dropdown` pre-v1.5.3 — all superseded) | Header persona menu, rendered as an 8px-corner-radius pill button (⚠ radius is a direct-instruction value, not the Figma node's full rounding; Figma 6588:16960, 108×38) beside the App Title, opening an anchored menu (current scope check-marked) on tap/click — not a native `<select>`. Since v1.5.20 (`AC-P4-01-76`) prefixed with one of two distinct, DLS_APPROVED assets, `icon.insights.scope-self`/`icon.insights.scope-team`, selected by the current scope — replacing the single generic `icon.insights.scope-avatar` (Remix `user-line`, unapproved placeholder) that rendered unchanged between SELF and TEAM; **closes OQ-24**. Suffixed with a trailing down-chevron (same generic affordance as the period picker). Below `breakpoint.tablet` (<768px) the label is visually hidden (icon+chevron only; `aria-label="Scope switcher"` retained); at `breakpoint.tablet` and `breakpoint.desktop` (≥768px) the icon, the current scope's label (`insights.scope.{SELF,TEAM}`) and the chevron all render. The anchored menu's rows also gained the per-scope icon beside each name since v1.5.20. Selecting a menu option refetches per A1. The mobile View sheet's Self/Team radios (`AC-P4-01-66`) are unaffected by v1.5.20 — text-only, no icon. |
| `w.filter.team-view-toggle` | `{ value: TeamView; visible: boolean }` | `pill-switch` | The "Group" toggle. Off = DIRECT, on = GROUP. i18n: `insights.teamView.toggle`. |
| `w.reco.panel` | `RecommendationsPanelVM` | `expanded` | Collapsible under the banner: flag chips (severity→tone), highlight row (value + goal bar + run-rate line), insight cards (`nav`-tappable, trend chip), narrative, CTA row, footer (Refresh glyph + generated-at + 👍/👎 → BFF feedback POST). |
| `w.metric.card` (variant `simple`) | `MetricCardVM` | `simple` | Focus-row card: title + value + delta only; never renders goal even if present. Below `breakpoint.desktop` (<1024px) this row renders as a static single-column list, identically to the `compact` face's `AC-P4-01-43` — since v1.5.12 (`AC-P4-01-47`); `≥breakpoint.desktop` stays the existing 2-column grid, unchanged. Independently specified from the `compact` face despite matching behavior. Since v1.5.19, has no visible nav icon in the head row (removed the `arrow-right-up-line` glyph, matching the `compact` face's existing icon-less carve-out); the whole card remains the tap target — `AC-P4-01-08` navigation is unaffected (`AC-P4-01-73`). |
| `w.metric-detail.bar-comparison` | `BarComparisonSectionVM` | `auto` (`year-bars` when 1 measure, `grouped-bars` when 2+ and `layout` absent/`GROUPED`, `stacked-bars` when `layout=STACKED` — v1.13.0) | Prior years grey, anchor year primary; per-point delta chip from `change` (tone by sentiment); axis label via `insights.axis.{unitCode}`; legend only for grouped mode (`insights.measure.{code}`). **v1.13.0 (ARVIJ-159, `AC-P4-02-42`/`-43`)**: `stacked-bars` stacks each year's measures into one bar (MANPOWER: `EXISTING_AGENTS` base, `NEW_RECRUITS` on top, in `measures[]` order). The total label above each bar is `totals[].value`, and the **only** delta chip is `totals[].change`, rendered per `DeltaVM.display` (PCT for MANPOWER, pre-rounded per §2 `R-PCT-ROUNDUP`). Segments show no chips. A legend is shown (`insights.measure.{code}`). The UI never sums segments. Segment tokens (anchor year vs prior years × two measures) are **not** specified: there is no approved visual baseline, so this falls under the existing UX-source blocker. `variant` stays `auto`, so there is no config change. |
| `w.metric.card` (variant `simple`) | `MetricCardVM` | `simple` | Focus-row card: title + value + delta only; never renders goal even if present. Below `breakpoint.desktop` (<1024px) this row renders as a static single-column list, identically to the `compact` face's `AC-P4-01-43` — since v1.5.12 (`AC-P4-01-47`); `≥breakpoint.desktop` stays the existing 2-column grid, unchanged. Independently specified from the `compact` face despite matching behavior. Since v1.5.19, has no visible nav icon in the head row (removed the `arrow-right-up-line` glyph, matching the `compact` face's existing icon-less carve-out); the whole card remains the tap target — `AC-P4-01-08` navigation is unaffected (`AC-P4-01-73`). Since S-P4-01 v2.0.0 (`AC-P4-01-81`), shares `w.metric.card`'s compact-MONEY rendering above. |
| `w.metric-detail.bar-comparison` | `BarComparisonSectionVM` | `auto` (`year-bars` when 1 measure, `grouped-bars` when 2+) | Prior years grey, anchor year primary; per-point delta chip from `change` (tone by sentiment); axis label via `insights.axis.{unitCode}`; legend only for grouped mode (`insights.measure.{code}`). |
| `w.history.window-pager` | `MetricHistoryVM['comparison']` | `inline` | ‹ › cycles `windowOptions`; label `insights.history.window.{window}`. |
| `w.history.table` (variant `mom`) | `MetricHistoryVM` | `mom` | CURRENT_YEAR mode: columns Month · anchor year · MoM Delta; `momDeltas[i] === null` ⇒ `insights.common.na`; chip tone by delta sentiment; renders `pp` for PERCENT, `abs` for ABS metrics, `pct` otherwise (per `display`). |
| `w.history.more-tabs` | `HistoryTabVM[]` | `dropdown` | "More Metrics" overflow when pills exceed the row; selecting swaps into the visible set. |
| `w.sheet.more-action` | `MoreActionVM[]` | `bottom-sheet` | ⋯ sheet; rows icon + `insights.action.{id}.title` + optional `.subtitle` + chevron; close affordance per DLS. |
| `w.toast` | `{ messageCode: string }` | `success` \| `error` | Post-save confirmations (customize, goals). Auto-dismiss per DLS motion spec. |
| `w.team-drilldown.member-list` 🆕7 | `TeamDrilldownVM` | `search-list` (MY draft) | S-P4-07 member list (search + hierarchy basis + team-view context); states: loading-skeleton · empty-search · forbidden-state. |
| `w.team-drilldown.member-summary` 🆕7 | `TeamDrilldownSelectedMemberDashboardVM` | `compact-summary` (MY draft) | **Superseded (S-P4-07 0.2.0)** by `w.dashboard.viewing-banner` + S-P4-01 viewing mode. Selected-member dashboard preview region for S-P4-07; states: no-selection · loading-selected-member. |
| `w.team-drilldown.member-card` 🆕8 | `TeamMemberVM` | `mobile` (<1024) · `desktop` (≥1024) | S-P4-07 0.2.0 card: badge row · goal status · avatar/name/role/code · compact TPC/PTPC (no currency) · subteam button (`directReportCount>0`). Absent optional fields drop their element. |
| `w.team-drilldown.summary-tile` 🆕8 | `TeamDrilldownSummaryTileVM` | `scroll-row` (<1024) · `grid-4` (≥1024) | Label `insights.teamDrilldown.summary.{code}` + compact value (MONEY keeps currency prefix); missing value → placeholder. |
| `w.team-drilldown.filters` 🆕8 | `TeamDrilldownFilterOptionsVM` | `sheet` (<768) · `drawer-608` (≥768) | Staged Sort By radios + All Agent + grouped badge checkboxes; Cancel/Confirm. |
| `w.team-drilldown.subteam-drawer` 🆕8 | `TeamDrilldownVM` (+`parent`) | `sheet` (<768) · `drawer-608` (≥768) | `{name}'s Team ({count})` + scoped search + member cards. |
| `w.dashboard.viewing-banner` 🆕8 | `DashboardViewingVM` | `strip` (<1024) · `card` (≥1024) | S-P4-01 2.1.0 "Viewing {name}" + `{agentId} \| {role}` + Exit View / ✕. |

### 1c. 🆕2 v1.2.0 widgets (P4 uplift)

| Widget id | Props (VM type) | Variants | Notes |
|---|---|---|---|
| `w.filter.period` (variant `bottom-sheet`) | `{ period, periodOptions, periodOptionsMeta? }` | `bottom-sheet` | "Time Period" sheet: radio rows `insights.period.{code}` + subtitle "{startDate} – Today" (DLS date format), red primary "Select" applies + dismisses; X cancels without applying. |
| `w.sheet.more-action` (variant `menu`) | `MoreActionVM[]` | `menu` | At `breakpoint.tablet`/`breakpoint.desktop` (S-P4-01 v1.5.16, `AC-P4-01-59`–`62`): anchored popover, right-edge-aligned below the "⋯" trigger, no dimmed backdrop, no X — dismisses via outside click/Escape/row selection. Below `breakpoint.tablet`, `w.sheet.more-action`'s plain `bottom-sheet` variant (above) is used instead, unchanged. Same `MoreActionVM[]`, same row content, at every breakpoint. |
| `w.notice.banner` | `NoticeVM` | `dismissible` | Amber (WARNING) / blue (INFO) banner above the first detail section; ⓘ/⚠ glyph; X dismisses for the session. |
| `w.state.processing` | `{ onRefresh }` | `full` | Illustration + `insights.state.processing.{title\|body}` + outlined "Refresh" button (refetch). |
| `w.state.empty` | `{ metricCode }` | `full` | Illustration + `insights.state.empty.{title\|body}` (body interpolates the metric title). |
| `w.benefit.card` | S-P4-05 spec §2 | `progress` \| `accent` | Benefit title + rate chip (tone: rate > 0 → success, 0 → danger), "Assessment Year: {y}", optional min/current/max progress bar, actions "♡ Pin to home" (toggle) + "View details ›". |
| `w.comp.bonus-row` | S-P4-06 spec §2 | `default` | Left accent (PAID → success, PENDING → warning), title, amount, status line ("Paid on {date}" / "Pending"), chevron. |

### 1d 🆕5 v1.3.0 widget update (S-P4-02 responsive)

| Widget id | Props (VM type) | Variants | Notes |
|---|---|---|---|
| `w.metric-detail.gauge` (paired with `w.metric-detail.comparison`, TPC/PTPC) | `GaugeSectionVM` + adjacent `ComparisonSectionVM` | `donut-270` (MY, unchanged) | Per `AC-P4-02-21` (`MetricDetail_S-P4-02` v1.3.0, evidenced for TPC): the `gauge.primary` + `comparison.primary` pair renders inside one bordered card instead of two, titled from `GaugeSectionVM.variant`. Below `breakpoint.desktop`: stacked single column, horizontal divider. At `breakpoint.desktop` and above: two columns (gauge left, comparison right), vertical divider. Whether this also applies to FYP/CASE_COUNT (same section pairing per the §1 matrix, no screenshot evidence supplied) is an open question in the addendum — until answered, only TPC/PTPC use this grouping. |

### 1e 🆕6 v1.4.0 widget updates (S-P4-02 header region + mobile/tablet card faces)

All rows below are evidenced at `breakpoint.mobile`/`breakpoint.tablet` only
(`MetricDetail_S-P4-02` v1.4.0); `breakpoint.desktop` is unevidenced and
unchanged. No value-abbreviation behavior is specified anywhere — README
`OQ-25` blocks it and every value stays on `formatMoney`. *(Superseded for
TPC/PTPC/FYC/FYP/AVERAGE_CASE_SIZE by S-P4-02 v1.17.0, `AC-P4-02-54`: their
MONEY values on these widgets and the `w.metric-detail.breakdown-table`
Total follow §2 `R-MONEY-COMPACT`; product rows show plain values per
v1.18.0 `AC-P4-02-55`.)*

| Widget id | Props (VM type) | Variants | Notes |
|---|---|---|---|
| `w.detail.context-pill` (shared) | `{ labelKey: string; value: string }` | `labelled` | Read-only context pill pairing a muted label with its value ("Product Both", "Time YTD"), per `AC-P4-02-22`. **Reuse decision `REUSE_AS_IS`** against S-P4-01's existing Product/Time summary pills (`AC-P4-01-38`/`-48`/`-51`, keys `insights.dashboard.filter.product` / `.time`) — same treatment, now used by two screens. Whether those dashboard-namespaced keys stay or are re-keyed is an open question in the v1.4.0 addendum. Static label, not a control (`AC-P4-01-51`). A `teamView` chip, when present, still precedes it (`AC-P4-02-10`). **v1.21.0 (`AC-P4-02-60`/`-61`)**: on S-P4-02 no `teamView` chip renders at any scope, so the Product pill is always first. The Product value for `context.businessLine=ALL` is `insights.businessLine.ALL` ("Both"), not `insights.businessLine.ALL.chip`. INSURANCE/TAKAFUL are unchanged. |
| `w.metric-detail.gauge` (value-only face) | `GaugeSectionVM` | `value-only` (MY, **every breakpoint** since v1.5.0) | Per `AC-P4-02-23`: muted `insights.gauge.collected` label above `collected`, **no donut/arc**, and **no penders legend entry** — `penders` presents via `w.metric-detail.penders` instead. v1.5.0 desktop evidence removed the original mobile/tablet-only scoping, so this face applies at every breakpoint for the TPC/PTPC combined card; a **standalone** gauge (FYP, CASE_COUNT, PRODUCTIVITY, AVERAGE_CASE_SIZE) keeps `donut-270`, unevidenced. Heading is the variant alone (`AC-P4-02-24`). **v1.11.0 note (FYP chart-design conflict, `AC-P4-02-41`'s addendum I3)**: ARVIJ-107/165's two-tone donut request is evaluated against this row's "unevidenced" `donut-270` standalone placeholder, not against this value-only face's evidenced TPC/PTPC scoping — a materially weaker baseline than the TPC conflict's starting point; logged under the same open TPC/PTPC chart-design question regardless, per direct instruction. **v1.15.0 note (PRODUCTIVITY chart-type conflict, `OQ-66`)**: ARVIJ-161 AC4 asks for a **bar chart** for PRODUCTIVITY, while this standalone gauge (`gauge.primary`, DECIMAL) is what the A1 matrix specifies. This is a different chart **type**, not a gauge-face variant. The widget is **not** switched. The standalone `donut-270` placeholder stays until product/UX rule on it. **v1.16.0 note (AVERAGE_CASE_SIZE, `OQ-66` extended)**: ARVIJ-162 AC4 makes the same bar-chart request for AVERAGE_CASE_SIZE's standalone gauge (MONEY, no penders). It is the same root conflict, covered by the same single ruling; the widget is **not** switched. A bar switch for this metric would additionally need a MONEY axis unit and would depend on money abbreviation (README `OQ-25`). |
| `w.metric-detail.comparison` (delta-line face) | `ComparisonSectionVM` | `stacked-rows` (amended) | Per `AC-P4-02-24`/`-25`/`-28`: a `{period} Comparison` heading (`insights.detail.comparisonTitle`) above rows that render the bare year with a muted `insights.comparison.collected` subtitle (no "YTD " prefix), and the growth delta as a toned delta line under the current-year value instead of a separate labelled `insights.comparison.growth` row with a Tag badge. Delta-line treatment is a reuse of `w.metric.card`'s, not a new widget; unit still from `DeltaVM.display` (D-10), tone from `change.sentiment`. Applies to the TPC/PTPC combined card only — a standalone comparison card keeps its labelled change row (`AC-P4-02-13`). ⚠ The evidence reads "vs last year" while `insights.delta.vsLY` is "vs LY" — `OQ-32` partially resolved: the Dashboard's `w.metric.card` delta line now reads `insights.delta.vsLastYear` (S-P4-01 v1.5.20, `AC-P4-01-77`); this reused delta-line face is unaffected by that change and still renders `insights.delta.vsLY` — open question remains for this face specifically. |
| `w.metric-detail.variant-value` | `VariantValueSectionVM` | `single-row` (unchanged) | Per `AC-P4-02-24`: heading is the variant alone ("With repricing"), row renders the bare `periodLabelYear` with the muted "Collected" subtitle. Per `AC-P4-02-27`, pairs with `w.metric-detail.penders` into a two-column row at `breakpoint.desktop` when both sections are present. |
| `w.metric-detail.penders` | `PendersSectionVM` | `single-row` (unchanged) | Per `AC-P4-02-26`: own single-row card (label left, value right) in its existing `sectionOrder` position. **v1.7.0 (ARVIJ-19/157) narrows the value-source open question**: for TPC/PTPC this section is emitted **only at `scope=TEAM`**, `value.kind=COUNT` (sum of all agents' Penders cases in the selected teamView unit, per `mongodb.md`'s new `values.pendersCaseCount`) — never at `scope=SELF`, where Penders stays a MONEY amount inside the gauge legend instead (`AC-P4-02-31`/`-32`). **Still specified non-navigable**: the link affordance/external-link glyph and its destination (the Activity Management module's Proposal screen) remain blocked pending `OQ-30`; no `nav` field is added to `PendersSectionVM` yet. Per `AC-P4-02-27`, pairs with `w.metric-detail.variant-value` into a two-column row at `breakpoint.desktop` when both are present — now renderable in principle for TEAM once the domain/BFF change ships, still blocked for SELF (the pairing never applies there since Penders isn't emitted). **v1.10.0 (ARVIJ-20/158) extends the same `scope=TEAM`-only gating to CASE_COUNT** (`AC-P4-02-37`) — CASE_COUNT SELF gets no Penders section at all, a narrower case than TPC/PTPC SELF since CASE_COUNT never had a money Penders figure to fall back to in the gauge legend either. **v1.11.0 (ARVIJ-107/165) confirms FYP never emits this section at either scope** (`AC-P4-02-39`) — FYP's `penders ✓` capability stays gauge-legend-only money content (`GaugeSectionVM.penders`) for both `scope=SELF` and `scope=TEAM`, unlike every other metric in this row's history; a confirmatory finding, not a new gating rule. **v1.19.0 (`AC-P4-02-56`/`-57`) — `link-value` face, TPC/PTPC only**: the value renders as `insights.detail.pendersCases` ("{count} Cases", count via `formatCount`) followed by a decorative `icon.external-link-line`, both in §2 `color.link`, right-aligned on one baseline. Icon ≈16px with a ≈4px gap (requester instruction, unmeasured). This supersedes the "still specified non-navigable" wording above for the **presentation** only. C3 1.7.0 adds an optional `nav?: RouteRef`, and the BFF omits it while `OQ-30` is open. Absent `nav` ⇒ a plain, non-focusable element with no link role. Present `nav` ⇒ a link to `href(nav)` whose accessible name is the "{count} Cases" text. CASE_COUNT's Team card keeps the bare-count `single-row` face. **v1.20.0 (`AC-P4-02-58`/`-59`) — TPC/PTPC now emit this section at both `scope=SELF` and `scope=TEAM`** (Self = the agent's own case count; Team unchanged), superseding the "only at `scope=TEAM`… never at `scope=SELF`" wording above and "still blocked for SELF" for the `AC-P4-02-27` pairing. Same `link-value` face at both scopes. CASE_COUNT stays TEAM-only (`AC-P4-02-37`); FYP never emits it (`AC-P4-02-39`). |

## 2. Rendering rules (shared)

- 🆕 **Delta rendering is driven by `DeltaVM.display`** (`PCT`→`pct` "+27%", `PP`→`pp` "+2pp", `ABS`→`abs` formatted by scalar kind: "+RM 20,000" / "+7" / "+0.4"). Widgets never infer the unit from the metric.
- 🆕 **Percent round-up rule (`R-PCT-ROUNDUP`, shared — S-P4-02 v1.13.0, first adopted by ARVIJ-159 MANPOWER).** This is the **single** definition. Later metric addenda (Activity Ratio, Productivity, Average Case Size) opt in by referencing `R-PCT-ROUNDUP` and must not restate it.
  1. **Input.** Compute the percentage change from the exact, unrounded absolute values: `x = (current − prior) / prior × 100`. Use exact or decimal arithmetic. Floating-point error must never push an exact integer up a step (e.g. 120 vs 110 → 9.0909… → **10**, but an exact 10 must stay 10, never become 11).
  2. **Rounding.** Round **away from zero** to an integer: `pct = sign(x) × ceil(|x|)`. So +23.4 → **+24**, −23.4 → **−24**, +9.09 → **+10**, and +0.2 → **+1**. An exact integer is unchanged, and only an exact zero change produces `0`.
  3. **Where it applies.** The **producer** (domain pipeline, `mongodb.md` D-22) emits the already-rounded integer in `DeltaVM.pct`, and the rule covers only the metrics that opted in (catalog-level, so every YoY `pct` that metric emits on every screen). Widgets and DLS `formatPercent` render `pct` **as-is** and never re-round. Metrics that have not opted in (TPC, PTPC, CASE_COUNT, FYP, FYC, APE, API) keep their existing rounding.
  4. **Direction/tone.** `DeltaVM.direction` is `FLAT` (neutral indicator) only when the exact change is zero. Any non-zero change shows at least ±1% with an UP/DOWN arrow.
  5. **Not covered.** A zero `prior` (the percentage is undefined, `OQ-54`) and BFF-computed MoM deltas on S-P4-03 (D-11, `OQ-56`) are unresolved. Do not guess either.
  - **Opted-in metrics:** MANPOWER (`AC-P4-02-45`) · ACTIVITY_RATIO (S-P4-02 v1.14.0, `AC-P4-02-49`; `x` is the relative change of the exact, unrounded ratio values, not their point difference) · PRODUCTIVITY (S-P4-02 v1.15.0, `AC-P4-02-51`; `x` is the relative change of the exact, unrounded DECIMAL values, not their absolute difference) · AVERAGE_CASE_SIZE (S-P4-02 v1.16.0, `AC-P4-02-53`; `x` is the relative change of the exact decimal-string MONEY amounts, not their absolute difference).
- 🆕 **Compact money rule (`R-MONEY-COMPACT`, shared — written once in S-P4-02 v1.17.0, algorithm unchanged from S-P4-01 `AC-P4-01-81` / README `OQ-25`).** DLS `formatMoneyCompact(MoneyValue)` renders the amount with **no currency prefix**: below 1,000 = plain integer; 1,000+ = "{n}K"; 1,000,000+ = "{n}M"; one decimal, round half-up, trailing ".0" dropped (960,000 → "960K", 78,740 → "78.7K", 24,690 → "24.7K", 18,000 → "18K"). It applies only where a screen opts in, and it never touches deltas or COUNT/PERCENT/DECIMAL values.
  - **Opted in:** `w.metric.card`, every MONEY value (S-P4-01 v2.0.0, `AC-P4-01-81`) · S-P4-02 Metric Detail, every MONEY value for `TPC`/`PTPC`/`FYC`/`FYP`/`AVERAGE_CASE_SIZE` only: gauge collected and penders, comparison current/prior, `variant.with-repricing`, and the breakdown **Total** in both tables (v1.17.0, `AC-P4-02-54`). Breakdown **product rows** are **not** compact: since v1.18.0 (`AC-P4-02-55`) they show the plain `formatMoney` digits with no currency prefix and no K/M ("24,690"). Every other consumer and metric keeps `formatMoney`.
- **Link colour (`color.link`, S-P4-02 v1.19.0).** Text and icon colour for an inline value that reads as a link. The value is **`#1D4ED8`**, sampled from the requester's Penders card screenshot (2026-09-25). It is **screenshot-derived and REVIEW_REQUIRED**, not a DLS-approved token (`OQ-75`). Consumers stub it once in the DLS token map, never inline. First consumer: `w.metric-detail.penders` `link-value` face.
- 🆕 **DECIMAL scalars** format via `formatDecimal(value, precision ?? 1)` — no unit suffix.
- 🆕 **Threshold gauges** read `threshold.value` per metric (MY: ACTIVITY_RATIO 90 · PERSISTENCY_CY 90 · Y1 85 · Y2 80); never hard-code 85.
- 🆕2 **MoM column header follows `display`**: PCT metrics → `insights.history.momPctChange` ("MoM % Change"), PP/ABS → `insights.history.momDelta`. Cell chips: `insights.common.na` when null; zero renders as a chip (per sentiment), never "N/A".
- 🆕2 **Detail `dataState`** gates the whole body: PROCESSING/EMPTY render their state widget alone (context chips stay); notices render only when `dataState = OK`.
- 🆕 Scope chrome: the `Direct`/`Group` chip (i18n `insights.teamView.{code}`) precedes the business-line chip on team drilldowns; SELF renders no scope chip. *(Superseded for S-P4-02 by v1.21.0, `AC-P4-02-60`: Metric Detail renders no scope chip at any scope.)*

- **Formatting** is DLS-owned: `formatMoney(MoneyValue, locale)`,
  `formatMoneyCompact(MoneyValue)` (opted-in consumers only, `R-MONEY-COMPACT`),
  `formatCount`, `formatPercent`, `formatPp`, `formatDateAsOf(IsoDate)`.
  Widgets never touch `Intl` directly and never round money client-side.
- **Sentiment → tone** mapping is global: `POSITIVE→tone.success`,
  `NEGATIVE→tone.danger`, `NEUTRAL→tone.muted`. No widget hard-codes red/green.
- **Delta badge** composes `{sign}{pct}% · insights.delta.vsLY` or `{sign}{pp}pp`. Since v1.5.20 (`AC-P4-01-77`), the Dashboard's `w.metric.card` (`compact` and `simple` faces) overrides the suffix to `insights.delta.vsLastYear`; every other consumer, including the S-P4-02 comparison delta-line face, still uses `vsLY`.
- **Goal row**: `showGoal=false` ⇒ omit row and progress bar entirely (PTPC MY).
  `goal.state=NOT_SET` ⇒ render `insights.goal.notSet` ("No Goal Set"), empty
  track, placeholder percent per DLS.
- **Unknown enum/section types** are skipped, never crash (forward compat).
- **Dashboard card availability (C3 1.5.0):** read `MetricCardVM.dataState`
  (default OK), not metric-code assumptions. OK cards use `value`; a legitimate
  zero is a value. PROCESSING/EMPTY cards retain identity, order and navigation
  and use existing processing/empty state semantics without numeric value,
  computed progress or delta. Other usable cards keep rendering. Do not infer
  source readiness, source units or cross-source freshness in the widget. Compact
  state visual baselines remain subject to the screen's existing DRAFT UX gates.
- **Section error slots**: when a section id appears in `meta.failedSections`,
  render the DLS inline-retry slot in its position.

## 3. i18n key conventions (D-08)

```
insights.metric.{METRIC_CODE}.title            TPC → "TPC"
insights.metric.{METRIC_CODE}.description
insights.variant.{VARIANT}                     WITHOUT_REPRICING → "Without Repricing"
insights.businessLine.{CODE}                   ALL → "Both" (tab; also the S-P4-02 Product pill since v1.21.0, AC-P4-02-61) / "Insurance + Takaful" (chip: insights.businessLine.ALL.chip — reserved, no current consumer since S-P4-02 v1.21.0)
insights.period.{CODE}                         QTD, YTD
insights.basis.SCHEME.toggle                   "Scheme"
insights.goal.notSet                           "No Goal Set"
insights.delta.vsLY                            "vs LY" (default; every consumer except S-P4-01's w.metric.card, AC-P4-01-77)
insights.delta.vsLastYear                      "vs last year" (S-P4-01 w.metric.card compact/simple faces only, AC-P4-01-77)
insights.gauge.collected / insights.gauge.penders
insights.detail.pendersCases                   "{count} Cases" (S-P4-02 v1.19.0, TPC/PTPC Penders card; not insights.contest.unit.cases)
insights.comparison.growth                     "% Growth"
insights.comparison.persistencyChange          "Persistency Change" (reserved: no longer emitted since S-P4-02 v1.12.0, AC-P4-02-46)
insights.product.{PRODUCT_CODE}                LINKED_PREMIUM → "Linked Premium"
insights.measure.{MEASURE_CODE}                ANNUAL_PREMIUM → "Annual"
insights.milestone.program.{PROGRAM_CODE}      MDRT_SERIES → "MDRT Series"
insights.milestone.tier.{TIER_CODE}            COT → "COT"
insights.history.vsLastYears                   "Vs Last {n} Years"
insights.month.{1..12}.short
```

### 3b. 🆕 v1.1.0 keys

`insights.scope.{SELF|TEAM}` · `insights.teamView.{DIRECT|GROUP}` · `insights.teamView.toggle` ("Group") ·
`insights.metric.{MANPOWER|ACTIVITY_RATIO|PRODUCTIVITY|AVERAGE_CASE_SIZE}.title` ·
`insights.measure.{OPENING|CLOSING}` ("Opening/Closing Manpower" — reserved, no longer emitted for MANPOWER since S-P4-02 v1.13.0) · `insights.measure.{EXISTING_AGENTS|NEW_RECRUITS}` ("Existing Agents" / "New Recruits", v1.13.0) · `insights.axis.AGENTS` ("No. of Agents") ·
`insights.comparison.{absoluteChange|manpowerGrowth|productivityChange|activityRatioChange|pctChange}` (`absoluteChange` reserved: no longer emitted for AVERAGE_CASE_SIZE since S-P4-02 v1.16.0) · `insights.comparison.averageCaseSizeChange` ("Average Case Size Change", S-P4-02 v1.16.0, ARVIJ-162 AC5/AC8/AC15 wording) ·
`insights.history.window.{CURRENT_YEAR|VS_LAST_YEAR|VS_LAST_2_YEARS}` · `insights.history.momDelta` · `insights.common.na` ("N/A") ·
`insights.history.moreMetrics` · `insights.action.{SET_GOALS|CUSTOMIZE_METRICS|HISTORICAL_DATA}.title` (+ `.subtitle`) ·
`insights.reco.flag.{code}` · `insights.reco.insight.{titleCode}` · `insights.reco.generatedAt` · `insights.reco.viewTeamDrilldown` ·
`insights.dashboard.otherFocusMetrics` ("Other Focus Metrics ({n})") · `insights.milestone.setGoal`.

### 3c. 🆕2 v1.2.0 keys

`insights.period.sheetTitle` ("Time Period") · `insights.period.range` ("{start} - Today") · `insights.common.select` ·
`insights.history.momPctChange` · `insights.notice.PRODUCT_DATA_MISSING` ("No data is available for {product}") ·
`insights.state.processing.title|body` ("Data Temporarily Unavailable" / processing copy) ·
`insights.state.empty.title|body` ("No Data Available" / empty copy) ·
`insights.toast.focusMetricsAdded` ("Other focus metrics added successfully.") ·
`insights.benefits.tab.bonus|contests` · `insights.benefits.rateChip` ("HPFB Rate: {pct}%") · `insights.benefits.assessmentYear` ·
`insights.benefits.pinToHome` · `insights.benefits.viewDetails` ·
`insights.compben.tab.paidCommission|retirement` · `insights.compben.paidOn` ("Paid on {date}") · `insights.compben.pending` ·
`insights.compben.staleNotice` ("Values reflected are not up to date…") · `insights.compben.asOnDate`.

### 3d. 🆕7 Team Drilldown draft keys

`insights.teamDrilldown.title` · `insights.teamDrilldown.searchPlaceholder` ·
`insights.teamDrilldown.emptySearch` · `insights.teamDrilldown.memberSection` ·
`insights.teamDrilldown.previewSection` · `insights.teamDrilldown.hierarchyBasisLabel` ·
`insights.teamDrilldown.basis.{AGENT|AM|UM}`.

### 3e. 🆕8 Team Drilldown "My Team" keys (S-P4-07 0.2.0 / S-P4-01 2.1.0)

`insights.teamDrilldown.{filters.title|sortBy.label|allAgent|breadcrumb|subteamTitle|subteamButton}` ·
`insights.teamDrilldown.badgeGroup.{MDRT|PRUWEALTH_PLANNER|PV|ROOKIE}` ·
`insights.teamDrilldown.badge.{MDRT|COT|TOT|WP|EWP|SWP|PWP|MWP|PV|ROOKIE|VIOLET}` ·
`insights.teamDrilldown.goalStatus.{SET|NOT_SET}` ·
`insights.teamDrilldown.summary.{MANPOWER|ACTIVITY_RATIO|PRODUCTIVITY|AVERAGE_CASE_SIZE}` ·
`insights.viewing.{title|exit}` · `insights.common.{confirm|close}` · `insights.dashboard.title`.
Changed values: `insights.teamDrilldown.title` "My Team",
`insights.teamDrilldown.searchPlaceholder` "Search by Name/ID",
`insights.quicklink.TEAM_DRILLDOWN` "My Team".

## 4. Accessibility (all widgets)

Gauges expose an SR summary ("Collected 100,000 ringgit of …; penders 30,000");
segmented tabs are a `tablist`; drag-reorder offers an SR-actionable
move-up/move-down fallback; delta badges include direction in the label, not
color alone; min touch target 44×44.

Sheet/overlay widgets (`w.customize.overlay`, `w.filter.sheet`, and the ⋯
`w.sheet.more-action`) trap focus while open, return focus to the opening
control on close, block background pointer interaction via the backdrop, and
honor `prefers-reduced-motion` by skipping their open/close transition
(formalized S-P4-04 v1.4.0, `AC-P4-04-27`/`28`/`30`).

## 5. Definition of done for a new country skin

Token pack + i18n bundle + config file only. If a skin request needs a prop or
behaviour change, it is a **contract change** — route it through this repo, not
a country branch.
