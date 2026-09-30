# S-P4-02 — Metric Detail (capability-driven template)

| | |
|---|---|
| Screen ID / Version | `S-P4-02` · `specVersion 1.21.0` · Status: **DRAFT** (see package `README.md` blockers). `1.12.0` (Persistency reconciliation) was authored after `1.13.0` into its reserved slot; its addendum sits in version order, before `1.13.0`'s. |
| Route | `insights/metric-detail?metricCode=…` (context params: period, businessLine, basis) |
| BFF endpoint | `GET /api/bff/v1/performance/metrics/:metricCode?period&businessLine&basis` → `MetricDetailVM` |
| Domain ops | `getMetricDetail` (+ `listMetricDefinitions` cached, for capability gating) |
| Config | `screens.metricDetail` (section order + widget variants) |
| Mocks | Image 5 (TPC), 6 (PTPC), 7 (Case Count), 8 (FYP), 10 (First Year Persistency) |

## 1. Purpose — ONE template, every metric, every country
This is the standardization proof point (D-02). The screen is a **section list**:
the BFF emits `sections[]` = `config.sectionOrder` ∩ metric `capabilities` ∩ data
present. The UI renders sections in order via their widgets and skips unknown types.
FYP in any country is this same contract; countries differ only in which sections
their config/capabilities light up and in DLS skin.

### Section matrix (MY, from mocks)

| Section id → widget | TPC | PTPC | CASE_COUNT | FYP | PERSISTENCY_* |
|---|---|---|---|---|---|
| `gauge.primary` → `w.metric-detail.gauge` | ✓ (RM, penders) | ✓ | ✓ (counts) | ✓ | — |
| `threshold.primary` → `w.metric-detail.threshold-gauge` | — | — | — | — | ✓ (GTE; CY 90 / Y1 85 / Y2 80 per v1.1.0 A1 — the flat "85%" here was v1.0.0's; SELF and TEAM, v1.12.0) |
| `comparison.primary` → `w.metric-detail.comparison` | ✓ (% Growth) | ✓ | ✓ | ✓ | ~~✓ (pp change)~~ → **— (year-on-year comparison removed, SELF and TEAM — v1.12.0, `AC-P4-02-46`)** |
| `variant.with-repricing` → `w.metric-detail.variant-value` | ✓ | ✓ | — | — | — |
| `penders.primary` → `w.metric-detail.penders` | ✓ (TEAM scope only, COUNT, v1.7.0) | ✓ (TEAM scope only, COUNT, v1.7.0) | ✓ (TEAM scope only, COUNT, v1.10.0) | — | — |
| `breakdown.without-repricing` / `.with-repricing` → `w.metric-detail.breakdown-table` | ✓ (5 products, 1 column per `context.businessLine`, v1.8.0) | ✓ (5 products — same set as TPC, v1.9.0; superseded the prior 7-product/UNIT_TRUST+GROUP_PREMIUM note) | — | ✓ (7 products incl. UNIT_TRUST/GROUP_PREMIUM — the pre-v1.9.0 set TPC/PTPC moved away from; `breakdown.without-repricing` only, no repricing capability; v1.11.0) | — |

## 2. Traceability

| # | UI element | VM field (`MetricDetailVM`) | Domain API field | Mongo (`metric_snapshots`) |
|---|---|---|---|---|
| 1 | Title (back bar) | `context.metricCode` → i18n | `metricCode` | `metricCode` |
| 2 | ~~Chips "Insurance + Takaful", "YTD"~~ → **Pills "Product Both", "Time YTD" — v1.21.0, `AC-P4-02-61`** | `context.businessLine/period` → i18n (~~`businessLine.ALL.chip`~~ → `businessLine.ALL` for ALL, v1.21.0) | `context.businessLine/period.type` | key fields |
| 3 | "As of 27 Jul 2026" | `context.asOfDate` → `formatDateAsOf` | `context.asOfDate` | `asOfDate` |
| 4 | Gauge Collected / Penders | `GaugeSectionVM.collected/penders` | `primary.collected/penders` | `values.collected/penders` |
| 5 | Gauge heading "TPC without repricing" | `GaugeSectionVM.variant` | `primary.variant` | capability-derived |
| 6 | Threshold arc 95% vs 85% marker | `ThresholdGaugeSectionVM.{current,threshold,sentiment}` | `primary.collected`, `threshold` | `values.collected`, `threshold.*` |
| 7 | "YTD 2026 / YTD 2025 / % Growth +27%" | `ComparisonSectionVM.{currentYear,current,priorYear,prior,change}` | `comparison.*` | `values.collected`, `comparison.*` |
| 8 | ~~"Persistency Change +2pp"~~ — **superseded v1.12.0 (`AC-P4-02-46`)**: persistency drill-downs no longer render a comparison. The PP change row itself survives for ACTIVITY_RATIO (row 19, `AC-P4-02-13`) — *until v1.14.0, which moves ACTIVITY_RATIO to PCT (`AC-P4-02-48`); no S-P4-02 metric now renders a PP change* | `ComparisonSectionVM.change.pp` | `comparison.change.pp` | `comparison.changePp` |
| 9 | "TPC With Repricing · RM 120,000" | `VariantValueSectionVM.value` | `altVariants[WITH_REPRICING].collected` | `values.withRepricing.collected` |
| 10 | "YTD 2026 Penders · 100" | `PendersSectionVM.value` | `primary.penders` | `values.penders` |
| 11 | Breakdown row "PSA (10%) · RM 15,007 …" | `BreakdownSectionVM.rows[].{productCode,weightPct,cells}` | `breakdowns[].rows[]` | `breakdown[]` |
| 12 | Breakdown Total row | `BreakdownSectionVM.totals` | `breakdowns[].totals` | summed by Fastify from `breakdown[].cells` |
| 13 | Columns Insurance / Takaful (h-scroll) — *one column since v1.8.0 (`AC-P4-02-35`); its header row is screen-reader-only since v1.21.0 (`AC-P4-02-62`)* | `BreakdownSectionVM.columns` | `breakdowns[].columns` | distinct `cells.businessLine` |

## 3. Interactions & states
- Entry always carries dashboard context; deep links without context fall back to config defaults (`defaultPeriod`, `defaultBusinessLine`, `STANDARD`).
- Chips are **read-only context** in P4 (no in-screen filter change) — matches mocks.
- Breakdown tables scroll horizontally; first column sticky.
- Loading: per-section skeletons in configured order. Partial: failed section ids → inline retry slots (`meta.failedSections`). 404 (metric not in tenant catalog): DLS not-available state + back.

## 4. Acceptance criteria
- **AC-P4-02-01** Section render order strictly follows `config.sectionOrder`; sections absent from the payload leave no gap or placeholder.
- **AC-P4-02-02** `metricCode=FYP` (MY) renders `gauge.primary` + `comparison.primary` (mock 8) — **amended, v1.11.0 (`AC-P4-02-40`)**: FYP also renders `breakdown.without-repricing` (7 products); "exactly" no longer applies now that FYP has a breakdown capability. `variant.with-repricing` and `penders.primary` remain absent for FYP (no repricing capability; Penders stays gauge-legend-only per `AC-P4-02-39`), so those two sections are unaffected by this amendment.
- **AC-P4-02-03** `PERSISTENCY_Y1` renders threshold gauge with marker at `threshold.value`, arc tinted by `sentiment` (POSITIVE at 95 ≥ 85); comparison shows `+2pp` with `insights.comparison.persistencyChange` label. — **amended, v1.12.0 (`AC-P4-02-46`)**: the threshold-gauge half stands unchanged, for `PERSISTENCY_CY`/`Y1`/`Y2` at both scopes. The comparison half is **superseded**: persistency drill-downs render no `comparison.primary`, so there is no "+2pp" and no `persistencyChange` label. This follows the 08-Sep-26 "Removed year on year comparison" change to ARVIJ-111/113/115/170/172/174, re-signed 10-Sep-26.
- **AC-P4-02-04** `CASE_COUNT` gauge renders COUNT scalars without currency; penders card shows `100`.
- **AC-P4-02-05** TPC/PTPC render two breakdown tables (without/with repricing) with a Total row equal to the column sum of rendered rows.
- **AC-P4-02-06** `weightPct=10` renders "(10%)" after the product label; absent ⇒ no suffix.
- **AC-P4-02-07** An unknown section `type` in `sections[]` is skipped without error (forward compat).
- **AC-P4-02-08** Growth badge tone follows `change.sentiment`, not sign.
- **AC-P4-02-09** Retired — the Metric Detail screen no longer links to Historical Data (S-P4-03); the History screen remains reachable only from the dashboard overflow menu.

## 5. Analytics
`insights_metric_detail_viewed {metricCode, period, businessLine, basis}` ·
`insights_breakdown_scrolled {metricCode, variant}` · `insights_history_opened {from:"detail", metricCode}`.

## 6. NFR
BFF p95 ≤ 600 ms (single domain call); breakdown ≤ 30 rows enforced server-side; ETag 60 s.


---

# v1.1.0 addendum — team drilldowns (P2/P3)

Same template, five new metrics, one new section type. Context now carries
`scope`/`teamView`; team drilldowns open with the **Direct/Group chip first**
(Figma 6588:18604 …:21450).

## A1. Section matrix extension (MY · TEAM)

| Section id → widget | MANPOWER | NEW_RECRUIT_CONTRACTED | ACTIVITY_RATIO | PRODUCTIVITY | AVERAGE_CASE_SIZE |
|---|---|---|---|---|---|
| `bars.primary` → `w.metric-detail.bar-comparison` | ~~✓ grouped (Opening/Closing, axis AGENTS)~~ → **✓ stacked (Existing Agents + New Recruits = Total Manpower, axis AGENTS) — v1.13.0, `AC-P4-02-42`** | ✓ single | — | — | — |
| `threshold.primary` | — | — | ✓ (90 GTE) | — | — |
| `gauge.primary` | — | — | — | ✓ (DECIMAL) — **🔴 v1.15.0: ARVIJ-161 AC4 asks for a bar chart; unchanged pending `OQ-66`** | ✓ (MONEY, no penders) — **🔴 v1.16.0: ARVIJ-162 AC4 asks for a bar chart; same root conflict, unchanged pending `OQ-66` (extended)** |
| `comparison.primary` | ~~✓ ABS "+7" (label `manpowerGrowth`, rows "Closing Manpower")~~ → **✓ PCT "+39%" (label `manpowerGrowth`, rows = Total Manpower current / previous year) — v1.13.0, `AC-P4-02-44`** | ✓ ABS "+7" (label `pctChange` — OQ-12) | ~~✓ PP (label `activityRatioChange`)~~ → **✓ PCT "+18%" (label `activityRatioChange`, rows = current / previous year ratio) — v1.14.0, `AC-P4-02-48`** | ~~✓ ABS "+0.4" (label `productivityChange`)~~ → **✓ PCT "+5%" (label `productivityChange`, rows = current / previous year productivity) — v1.15.0, `AC-P4-02-50`** | ~~✓ ABS "+RM 20,000" (label `absoluteChange`)~~ → **✓ PCT "+9%" (label `averageCaseSizeChange`, rows = current / same period last year average case size) — v1.16.0, `AC-P4-02-52`** |

Persistency thresholds correct to CY 90 / Y1 85 / Y2 80 (supersedes v1.0.0's flat 85 in AC-P4-02-03's example).

## A2. Added traceability

| # | UI element | VM field | Domain API | Mongo |
|---|---|---|---|---|
| 14 | ~~"Direct"/"Group" chip~~ — **not rendered since v1.21.0 (`AC-P4-02-60`)**; `context.teamView` still carried | `context.teamView` → i18n | `context.teamView` | `teamView` (key) |
| 15 | Year bars + value labels | `BarComparisonSectionVM.measures[].points[]` | `barComparison.measures[].points[]` | `barComparison` |
| 16 | Bar delta chips ("+3", "+7") | `points[].change` (ABS) | `points[].change.abs` | `points[].changeAbs` |
| 17 | Axis "No. of Agents" | `axisUnitCode` → `insights.axis.AGENTS` | `barComparison.axis.unitCode` | `barComparison.axisUnitCode` |
| 18 | Legend ~~Opening/Closing~~ Existing Agents / New Recruits (v1.13.0) | `measures[].measureCode` → i18n | `measures[].measureCode` | same |
| 19 | Comparison ABS chip | `ComparisonSectionVM.change` (`display=ABS`) | `comparison.change.abs` | `comparison.changeAbs` |

## A3. Added acceptance criteria

- **AC-P4-02-10** TEAM drilldowns render the teamView chip first; SELF renders none; chip reflects the dashboard toggle at entry. — **superseded, v1.21.0 (`AC-P4-02-60`)**: no teamView chip renders at any scope. `context.teamView` still reflects the dashboard toggle at entry and still drives the request (`AC-P4-02-34`).
- **AC-P4-02-11** `bars.primary` renders grouped bars when `measures.length ≥ 2` (legend from `measureCode`), simple bars when 1 (no legend); prior years use the muted series token, anchor year the primary token. — **amended, v1.13.0 (`AC-P4-02-42`)**: the grouped branch applies only when `layout` is absent or `GROUPED`. `layout=STACKED` renders stacked bars instead.
- **AC-P4-02-12** Each bar's delta chip renders `change` per `display` with sentiment tone; chips absent for the earliest year. — **amended, v1.13.0 (`AC-P4-02-43`)**: in `layout=STACKED` the chip comes from `totals[].change`, and segment points have none.
- **AC-P4-02-13** Comparison card renders the change row label from the metric's comparison label key and the value per `display` (PP "+2pp" · ABS "+RM 20,000"/"+7"/"+0.4" · PCT "+27%"). — **amended, v1.14.0 (`AC-P4-02-48`)**: the rule is unchanged, but ACTIVITY_RATIO now arrives with `display=PCT` (e.g. "+18%"), so the PP example no longer has a live S-P4-02 metric. — **amended, v1.15.0 (`AC-P4-02-50`)**: likewise PRODUCTIVITY now arrives with `display=PCT` (e.g. "+5%"), so the ABS "+0.4" example no longer has a live S-P4-02 metric. The ABS rule still applies to AVERAGE_CASE_SIZE and NEW_RECRUIT_CONTRACTED. — **amended, v1.16.0 (`AC-P4-02-52`)**: AVERAGE_CASE_SIZE now arrives with `display=PCT` (e.g. "+9%") under the new label `averageCaseSizeChange`, so the "+RM 20,000" ABS example no longer has a live S-P4-02 metric. The ABS rule still applies to NEW_RECRUIT_CONTRACTED ("+7").
- **AC-P4-02-14** DECIMAL primaries format via `formatDecimal` (9.7), never with "%" (guards the Figma "9.7%" artifact — OQ-11).
- **AC-P4-02-15** Threshold markers read per-metric values (90/85/80); arc tone = threshold `sentiment`.
- **AC-P4-02-16** Hidden-in-design sections (member table, gauge goal marker) are **not** emitted in 1.1.0; `capabilities.memberTable` stays false pending the Team Drilldown pack (OQ-13).

## A4. Added analytics
`insights_bar_point_tapped {metricCode, year, measureCode?}` (if made interactive later — reserved).


---

# v1.2.0 addendum — P4 uplift (states, notices, matrix fixes)

## B1. Data states (designed)
`dataState` gates the body (context chips always render):

| dataState | Widget | Copy keys | Action |
|---|---|---|---|
| `PROCESSING` | `w.state.processing` | `insights.state.processing.*` ("Data Temporarily Unavailable…") | Refresh → refetch |
| `EMPTY` | `w.state.empty` | `insights.state.empty.*` ("No Data Available… once activity is logged") | — |
| `OK` | sections per v1.0–1.1 | — | — |

## B2. Notices
`notices[]` render as dismissible banners (`w.notice.banner`) above the first
section — e.g. `PRODUCT_DATA_MISSING {productCode: CREDIT_POINTS}` → amber
"No data is available for Credit Points". Dismissal is per-session; notices
never suppress sections (the breakdown simply omits the gapped row).

## B3. Matrix fixes
FYC's uplifted detail = gauge (Collected + **Penders**) + comparison → FYC
capabilities gain `penders`. NEW_RECRUIT_CONTRACTED `bars.primary` renders in
**SELF too** (chips: Insurance + Takaful · YTD; no teamView chip) — supersedes
the A1 note scoping it to TEAM.

**Added ACs**
- **AC-P4-02-17** PROCESSING renders exactly the processing state (no skeletons, no stale sections); Refresh refetches and transitions on `dataState` change.
- **AC-P4-02-18** EMPTY renders the empty state with the metric title interpolated; no Refresh button.
- **AC-P4-02-19** Each notice renders once, above sections, dismissible independently; unknown `code` falls back to `insights.notice.generic` with `severity` tone.
- **AC-P4-02-20** A breakdown missing a configured product renders remaining rows + totals of rendered rows only (never zero-fills), with the corresponding notice present.


---

# v1.3.0 addendum — responsive layout baseline (`gauge.primary` + `comparison.primary` combined card, MY)

Requester supplied three MY screenshots of the TPC screen (not Figma exports)
at `breakpoint.mobile`, `breakpoint.tablet` and `breakpoint.desktop`
(`common/ux/tokens/breakpoint.tokens.json`) — the responsive visual baseline
this package's manifest lists as a blocker. This addendum resolves that
baseline for **one** section pairing only: `gauge.primary` ("Without
repricing") and `comparison.primary` ("YTD Comparison"), which the
screenshots show sharing a single bordered card at every breakpoint, not two
separate cards. It does **not** address `variant.with-repricing`,
`penders.primary`, either `breakdown-table` section, or the `dataState`
PROCESSING/EMPTY responsive treatment — those sections' breakpoint behavior
remains unspecified and the manifest blocker stays open for them.

Also explicitly out of scope: the surrounding chrome visible in all three
screenshots (left navigation rail, "Performance > TPC" breadcrumb, top search
bar). That is host-application shell, outside this screen's own traceability
(§2 row 1 specs only a back action + title) and outside any package in this
repo — see the open questions below.

- **AC-P4-02-21** For `metricCode=TPC` (and `PTPC`, same section pairing per
  §1's matrix), `gauge.primary` and `comparison.primary` render inside one
  bordered container — titled from `GaugeSectionVM.variant` — instead of as
  two independent cards, at every breakpoint. Below `breakpoint.desktop`
  (mobile and tablet alike): single column, gauge content (`collected`
  value) above a horizontal divider above the comparison content
  (`currentYear`/`current`/`priorYear`/`prior`/`change`), matching the
  existing stacked order. At `breakpoint.desktop` (≥1024px): two columns
  separated by a vertical divider, gauge content left, comparison content
  right. This supersedes, for this one section pairing only, the
  independent-card rendering implied by `AC-P4-02-01`'s per-section list;
  `sections[]` render order and every other section's independent-card
  rendering are otherwise unchanged. **Added (v1.5.1):** at
  `breakpoint.desktop`, the combined card has a fixed height of `336px`.
  ⚠ Direct-instruction value, not a measured/Figma export — same convention
  as `AC-P4-01-46`. Below `breakpoint.desktop` the card stays content-sized.

## Open questions

- 🟡 The screenshots' gauge face shows only a "Collected" label + value, no
  visible donut/arc. This addendum does **not** change `w.metric-detail.gauge`
  from its spec'd `donut-270` variant — confirm with UX whether the donut is
  simply not visible in this screenshot crop, or whether a value-only face is
  wanted (would be a separate widget-contract change).
- 🟡 The supplied "2025" comparison figure differs across the three
  screenshots for the same TPC fixture (`91%` on the desktop screenshot vs
  `800K` on the tablet/mobile screenshots). Logged as a design-artifact
  discrepancy, not replicated (same convention as README OQ-12/19);
  `ComparisonSectionVM.prior` is unaffected by this addendum.
- 🟡 Ownership of the breadcrumb and collapsing left nav rail shown in every
  screenshot — confirm whether these belong to a future Insights-domain
  screen-chrome package or to the host application shell, before either is
  added to this package's traceability table.
- 🟡 `AC-P4-02-21` is evidenced only for TPC. FYP and CASE_COUNT share the
  same `gauge.primary` + `comparison.primary` pairing per §1's matrix —
  confirm whether they should adopt the same combined-card grouping, or keep
  today's two-card rendering, before extending `AC-P4-02-21` past TPC/PTPC.


---

# v1.4.0 addendum — header region + mobile/tablet card layouts (MY)

Requester supplied two further MY screenshots of the TPC screen (not Figma
exports; tracked under the existing "Strict UX source approval is incomplete"
blocker, same convention as v1.3.0): one of the **header region** below the top
bar, one of the **Without repricing / With repricing / Penders** card stack.

Both screenshots are at `breakpoint.mobile`/`breakpoint.tablet` only.
**Desktop is not evidenced and this addendum specifies nothing for it** —
`breakpoint.desktop` keeps the v1.3.0 two-column pairing (`AC-P4-02-21`) and,
for everything in Part B below, today's contract until desktop evidence is
supplied. `config.sectionOrder` is unchanged; the card stack in the screenshot
already matches it. Host-application chrome (nav rail, breadcrumb, search bar)
remains out of scope — see the v1.3.0 open questions.

## B1. Amended traceability (§2)

| §2 row | Was | Now (v1.4.0) |
|---|---|---|
| 1 | Title rendered in the back bar; back control is an unlabelled affordance | Metric title renders as a **page title in the page body**, below the bar; the back control gains a **visible label** (`insights.common.back`) |
| 3 | "As of …" rendered in the context chip row | `context.asOfDate` renders **right-aligned in the back-bar row**; `insights.detail.asOf` and `formatDateAsOf` unchanged |
| 4 | Gauge renders Collected **and Penders** in its legend | `GaugeSectionVM.penders` **no longer renders in the gauge legend**; penders presents as its own section card (`AC-P4-02-26`) |

## B2. Acceptance criteria

- **AC-P4-02-22** The header region renders, in order: a back affordance with
  a **visible label** plus `context.asOfDate` right-aligned on the same row;
  the metric title as a page title below that row; then the read-only context
  as **labelled pills** — "Product {businessLine}" and "Time {period}" — each
  pairing a muted label with its value, rather than the previous bare value
  chips. `AC-P4-02-10` is unchanged: when `context.teamView` is present its
  chip still renders first, before the Product pill. Chips remain read-only in
  P4 (§3).
  **Amended, v1.21.0 (`AC-P4-02-60`/`-61`):** no teamView chip renders, so
  the Product pill is first; for `businessLine=ALL` the Product value reads
  "Both" (`insights.businessLine.ALL`).
- **AC-P4-02-23** At `breakpoint.mobile` and `breakpoint.tablet` the
  `gauge.primary` face renders **value-only**: a muted "Collected" label above
  `GaugeSectionVM.collected`, with **no donut/arc** and **no penders legend
  entry**. This supersedes the `donut-270` face at those breakpoints and
  **resolves** the v1.3.0 open question that asked whether the donut-less
  screenshot was a crop artifact — it is the intended face. `breakpoint.desktop`
  is unevidenced and unchanged.
- **AC-P4-02-24** Card headings render the **variant alone** — "Without
  repricing" (`gauge.primary` + `comparison.primary` combined card) and "With
  repricing" (`variant.with-repricing`) — not the metric title plus variant.
  Comparison and variant-value rows render the **bare year** (`currentYear` /
  `priorYear` / `periodLabelYear`) with a muted "Collected" subtitle; the
  "YTD " prefix is dropped, the period now being carried by the Time pill
  (`AC-P4-02-22`). Supersedes the heading and row-label wording of §2 rows 5,
  7 and 9.
- **AC-P4-02-25** In the TPC/PTPC combined card only, the growth delta renders
  as a **toned delta line directly under the current-year value**, replacing
  the separate labelled "% Growth" row and its badge. This is a reuse of the
  delta-line treatment already used by `w.metric.card`, not a new widget.
  `DeltaVM.display` still drives the unit (D-10) and `change.sentiment` still
  drives the tone (`AC-P4-02-08`). A standalone `comparison.primary` card —
  FYP, persistency, and the team metrics — **keeps its labelled change row**:
  `AC-P4-02-13` and `AC-P4-02-03` still require that label ("Persistency
  Change +2pp"), and no evidence was supplied for those screens.
  **Amended, v1.12.0 (`AC-P4-02-46`):** persistency no longer renders a
  `comparison.primary` card at all. The labelled-row rule still applies to
  FYP and the team metrics.
- **AC-P4-02-26** Penders renders as its **own single-row card** — label left,
  value right — in its existing `config.sectionOrder` position (after
  `variant.with-repricing`, before the breakdown tables). The card is
  specified as **non-navigable**: the link affordance, the "Cases" unit label
  and the value's data source are all **blocked** pending the open questions
  below. Emission of `penders.primary` for a MONEY-primary metric such as TPC
  additionally requires the domain/BFF change recorded in this revision's
  handoff, which is likewise blocked until the value's source is confirmed.
  **Amended, v1.19.0 (`AC-P4-02-56`/`-57`):** for TPC/PTPC the value now
  shows the "Cases" unit and the link face with the external-link icon. The
  card is navigable only when the optional `nav` is present. The destination
  (`OQ-30`) is still open, so today's BFF output stays non-navigable.

## Open questions

- 🔴 **Penders value source.** The screenshot shows a **case count** ("6
  Cases") where TPC's contract today carries a money penders figure
  (`values.penders`, rendered in the gauge legend). These are different values
  with different units. Confirm whether this is a new domain field, an existing
  field not yet exposed, or a re-interpretation of `values.penders` — it must
  **not** be mapped to `values.penders` by assumption. Owner: Business/Data.
  Blocks `AC-P4-02-26`'s value and the backend emission change.
- 🔴 **Penders link destination.** The screenshot renders the value as a link
  with a trailing external-link glyph; no destination is evidenced. Confirm the
  target before any `nav` field is added to `PendersSectionVM`. Owner:
  Product/UX. Until answered the card stays non-navigable per `AC-P4-02-26`.
- ✅ **"Cases" unit copy.** No insights-scoped key exists
  (`insights.contest.unit.cases` is contest-scoped and must not be reused). A
  new key is required only once the value above is confirmed; none is added by
  this revision. **Resolved, v1.19.0:** `insights.detail.pendersCases` =
  "{count} Cases".
- 🟡 **Delta suffix copy mismatch.** The screenshot reads "vs last year";
  `insights.delta.vsLY` is **"vs LY"**. Confirm whether the copy value changes
  or the screenshot is a mockup artifact — the key is not edited by this
  revision.
- 🟡 **Context-pill copy keys.** `AC-P4-02-22`'s pills reuse S-P4-01's existing
  Product/Time summary pills (`AC-P4-01-38`/`-48`/`-51`, keys
  `insights.dashboard.filter.product` / `.time`) as a `REUSE_AS_IS` decision.
  Confirm whether those dashboard-namespaced keys are acceptable on a detail
  screen or should be re-keyed to a shared namespace before build.
- 🟡 **As-of date format.** The header screenshot renders the date numerically
  (`03/09/2026`), while §2 row 3 specifies `formatDateAsOf` ("27 Jul 2026").
  This addendum **keeps the existing format**; confirm whether the numeric form
  is an intentional change, a locale artifact, or a mockup artifact. (Raised
  under the "never invent" rule — it was not part of the change request.)
- ✅ **Resolved (v1.5.0):** breakpoint scope of `AC-P4-02-24`/`-25`. Desktop
  evidence supplied with v1.5.0 shows the same variant-only heading, bare
  years and delta line at `breakpoint.desktop`, confirming the wider scope
  that was implemented as a recorded deviation.
- ✅ **Resolved (v1.5.0):** the "YTD Comparison" sub-heading is confirmed
  present by the desktop evidence and is now specified as `AC-P4-02-28`, with
  the new key `insights.detail.comparisonTitle`.
- ✅ **Resolved (v1.5.1):** the visible "Back" label ships.
  `insights.common.back` reached the app once the C3/C4 drift blocking
  `sync:specs` was reconciled — see the v1.5.0 addendum's open questions.
- 🟡 **Variant label case.** `insights.variant.WITHOUT_REPRICING` is "Without
  Repricing" (title case); the screenshot reads "Without repricing". The
  existing copy value is used unchanged — confirm whether the sentence-case
  form is wanted.
- 🔴 **Value abbreviation — see README OQ-25.** Every money value in these
  screenshots is abbreviated with no currency prefix ("960K", "800K", "120K").
  That is the existing blocking OQ-25, which already names this screen as its
  unresolved scope question and conflicts with `AC-P4-01-09`/D-04. This
  addendum specifies **no** abbreviation, thresholds, rounding or prefix
  behavior and authorizes **no** formatter change; every value stays on
  `formatMoney` until OQ-25 is answered. — **✅ Resolved for TPC, PTPC, FYC,
  FYP and AVERAGE_CASE_SIZE by v1.17.0 (`AC-P4-02-54`)**: their MONEY values
  on this screen render compact with no currency prefix. Every other metric
  keeps `formatMoney`.


---

# v1.5.0 addendum — desktop card layouts (MY)

Requester supplied one further MY screenshot: the **desktop** view of the
same TPC card stack (still not a Figma export — same "Strict UX source
approval is incomplete" blocker). It closes the `breakpoint.desktop` gap the
v1.4.0 addendum left open for Part B, and adds one new layout requirement.

`config.sectionOrder` remains unchanged. Host-application chrome remains out
of scope. The v1.3.0 combined-card split (gauge left / comparison right at
`breakpoint.desktop`, `AC-P4-02-21`) is visible in this screenshot and is
**confirmed unchanged**.

## C1. Amended acceptance criteria

- **`AC-P4-02-23` amended (supersedes its v1.4.0 breakpoint scoping).** The
  value-only gauge face — muted "Collected" label above `collected`, no
  donut/arc, no penders legend entry — applies at **every breakpoint** for
  the TPC/PTPC combined card, not only below `breakpoint.desktop`. The
  desktop screenshot shows the same donut-less face. A **standalone**
  `w.metric-detail.gauge` (FYP, CASE_COUNT, PRODUCTIVITY, AVERAGE_CASE_SIZE)
  is unaffected and keeps `donut-270` — no evidence has been supplied for
  those metrics.

## C2. New acceptance criteria

- **AC-P4-02-27** At `breakpoint.desktop`, `variant.with-repricing` and
  `penders.primary` render **side by side as two equal-width cards in one
  row**, below the full-width combined card. Below `breakpoint.desktop` they
  remain stacked full-width, one card each, per v1.4.0. The pairing applies
  **only when both sections are present in `sections[]`**; whenever either is
  absent — which is every metric today, see the open questions — the
  remaining section renders full-width at every breakpoint, exactly as now.
  `sections[]` order is unchanged; this is presentation only.
- **AC-P4-02-28** The comparison half of the combined card renders a
  `{period} Comparison` heading (`insights.detail.comparisonTitle`,
  interpolating `context.period`) above its rows, at every breakpoint. This
  replaces the metric-title heading that half carried before v1.4.0 and which
  `AC-P4-02-24` removed as redundant with the card heading.

## Open questions

- 🟡 **Comparison heading interpolation.** Only the YTD period is evidenced
  ("YTD Comparison"). `insights.detail.comparisonTitle` is specified as
  `"{period} Comparison"` so MTD/QTD render consistently, matching the
  existing interpolated-heading convention
  (`insights.detail.breakdownByProduct`). The interpolation itself is an
  inference — confirm, or fix the heading to a literal "YTD Comparison".
- 🟡 **`AC-P4-02-27` is unverifiable today.** No metric emits both
  `variant.with-repricing` (repricing capability ⇒ TPC/PTPC, MONEY primary)
  and `penders.primary` (gated on a COUNT primary), so the two-column state
  cannot be exercised until the penders emission question (OQ-29/30) is
  answered. The layout is specified and implemented; nothing renders it yet.
- ✅ **Resolved (v1.5.1): vendored-contract drift with the app.** The first
  `sync:specs` against this revision broke the app, because two things it
  already shipped were never recorded here. Both were adopted (commit
  `3c0e7d8`) so the sync is lossless, and `AC-P4-02-22`'s label and
  `AC-P4-02-28` now render:
  1. `MetricCardVM.valueDisplay?: 'FULL' | 'COMPACT'` — the app renders
     values in COMPACT form against this field. Recording it documents what
     ships; it does **not** approve an abbreviation policy. `OQ-25` remains
     🔴 and still owns which metrics abbreviate, the currency prefix, the
     thresholds/rounding and the screen scope; no composer may emit
     `COMPACT` until it is answered.
  2. `screens.dashboard.scopes.TEAM.footerLinks` had been emptied here while
     the app serves `VIEW_MOC`; a sync would have silently removed that link
     in TEAM scope. Restored.
  ⚠ Residual: the two repos' contracts drifted without anyone noticing, and
  nothing in CI compares them. Worth a guard so the next divergence is caught
  at commit time rather than by a broken sync.
- 🟡 **Prior-year value, updated from v1.3.0.** The 2025 row reads `91%` on
  **both** supplied desktop screenshots and `800K` on **both** mobile/tablet
  screenshots. That consistency makes it look deliberate in the design source
  rather than a one-off typo — but a percentage in a MONEY comparison row
  contradicts `ComparisonSectionVM.prior`'s type, and `800K → 960K` is not
  the `+11.4%` the same card shows either. Still logged, still not
  replicated; UX/product to clarify what the desktop row is meant to express.


---

# v1.6.0 addendum — breakdown-table desktop pairing (MY)

Requester supplied one further MY screenshot: `breakpoint.desktop` showing the
TPC screen's "Breakdown by Product" region as two equal-width cards in one
row — "Without Repricing" (`breakdown.without-repricing`, existing) beside
"With Repricing" — instead of today's full-width stacked table (not a Figma
export; same "Strict UX source approval is incomplete" blocker as every prior
addendum). This addendum specifies the desktop **presentation** of that
pairing only; it does **not** specify or authorize a `breakdown.with-repricing`
section's data.

`config.sectionOrder` is unchanged. §1's section matrix already lists
`breakdown.without-repricing` / `.with-repricing` as a pair for TPC (5
products) and PTPC (7 products) — that row predates this addendum and is not
new scope introduced here. No fixture today emits `breakdown.with-repricing`.

The same screenshot also shows a heading structure change that applies
regardless of `OQ-38`: one shared "Breakdown by Product" heading above the
card(s), with each card headed by its bare variant name — see `AC-P4-02-30`.

## D1. New acceptance criteria

- **AC-P4-02-29** At `breakpoint.desktop`, two `BREAKDOWN`-typed sections
  adjacent in `sections[]` render side by side as two equal-width cards in one
  row, mirroring `AC-P4-02-27`'s pairing rule. Below `breakpoint.desktop` they
  remain stacked full-width, one card each. The pairing applies **only when
  two `BREAKDOWN` sections are adjacent in `sections[]`** — today no fixture
  emits more than one, so every breakdown table keeps rendering full-width at
  every breakpoint until a second section exists. `sections[]` order is
  unchanged; this is presentation only, exactly as `AC-P4-02-27`.
- **AC-P4-02-30** The breakdown-table region renders a single shared "Breakdown
  by Product" heading (`insights.detail.breakdownByProduct`, no longer
  interpolated with the metric/variant) once above the `BREAKDOWN` section(s)
  — one card today, two paired cards once `AC-P4-02-29` has data. Each
  individual `BreakdownTable` card renders its **own** heading as the bare
  variant label (`insights.variant.{variant}`, e.g. "Without Repricing"),
  matching the variant-only card-heading convention `AC-P4-02-24` already
  established for `variant.with-repricing`. This supersedes today's per-table
  heading ("{metric} Breakdown by Product"). Unlike `AC-P4-02-29`, this AC is
  **not** blocked by `OQ-38` — it applies to the single existing
  `breakdown.without-repricing` table today, independent of whether a second
  breakdown section ever exists.

## Open questions

- 🔴 **`breakdown.with-repricing` data source (OQ-38).** The screenshot shows
  a full per-product table for "With Repricing" using the same row set as
  "Without Repricing". The domain today exposes only a single repriced total
  (`altVariants[WITH_REPRICING].collected`, rendered via
  `variant.with-repricing`) — no per-product repriced breakdown exists in
  `mongodb.md` or `insights.v1.yaml`. Confirm whether this is a new domain
  calculation (repricing applied per product row) or a re-interpretation of
  existing data before any `breakdown.with-repricing` section, VM field or
  fixture row is added. Owner: Business/Data. Blocks `AC-P4-02-29` from ever
  rendering — same structural gap as `AC-P4-02-27`/OQ-29-30 today.
- 🟡 **`AC-P4-02-29` is unverifiable today**, for the same reason as
  `AC-P4-02-27`: no fixture has two adjacent `BREAKDOWN` sections. The layout
  is specified and will be implemented; nothing renders it until OQ-38 is
  answered.


---

# v1.7.0 addendum — TPC drill-down alignment with ARVIJ-19 (Self) / ARVIJ-157 (Team)

Two formal, signed-off Jira stories — **ARVIJ-19** (Self scope, TPC drilldown)
and **ARVIJ-157** (Team scope, TPC drilldown) — define acceptance criteria
distinct from, and in one place contradicting, the screenshot-driven addenda
above (v1.3.0–v1.6.0). This addendum reconciles the two: it is additive/minor
(no existing AC's rendered behavior changes), documents new domain rules and
per-scope section presence, and explicitly does **not** resolve the chart
conflict — see the open questions.

Both stories confirm "Goal Setting will not be applicable for R1" — no goal
concept is added to the metric-detail gauge by this addendum (there was none
to begin with: `GaugeSectionVM` has no `goal`/`target` field; that concept
exists only on the dashboard's `MetricCardVM.goal`, an unrelated widget).

## E1. New acceptance criteria

- **AC-P4-02-31** For TPC/PTPC, the KPI element set is **scope-dependent**:
  `scope=SELF` renders exactly four — TPC (Without Repricing), Previous Year
  TPC (Without Repricing), TPC Growth (Without Repricing), TPC (With
  Repricing) — realized by the existing `gauge.primary` + `comparison.primary`
  combined card and `variant.with-repricing`, with **no Penders element**.
  `scope=TEAM` renders those same four **plus a fifth**: Penders (see
  `AC-P4-02-32`). `sections[]` composition is unchanged in mechanism —
  `penders.primary` capability is simply gated off for `scope=SELF` on
  TPC/PTPC (§1's matrix, updated). *(v1.20.0: Self half superseded by
  `AC-P4-02-58` — Self now renders five elements, including Penders.)*
- **AC-P4-02-32** Penders semantics are **scope-dependent** for TPC/PTPC:
  - `scope=SELF`: Penders is a **MONEY** amount inside the gauge/chart legend
    only (`GaugeSectionVM.penders`, unchanged) — never its own section/card.
  - `scope=TEAM`: Penders renders as its **own KPI card**
    (`penders.primary` → `w.metric-detail.penders`), `value.kind=COUNT`,
    equal to the **sum of all agents' Penders cases** in the selected
    `teamView` unit (`mongodb.md`'s new `values.pendersCaseCount`) — a
    different value with a different unit from Self's money figure, never
    derived from it. The card carries a hyperlink to the Activity Management
    module's Proposal screen, listing the relevant proposal cases — **this
    link stays non-navigable, same convention as the existing blocked Penders
    card**, until `OQ-30` (destination route) is answered. This narrows but
    does not close `OQ-29`/`OQ-30`: the value source for TEAM is now
    confirmed (case count, team-aggregated); the link destination is not.
    *(v1.19.0: presentation and optional `nav` placeholder specified in
    `AC-P4-02-56`/`-57`; `OQ-30` still open.)*
    *(v1.20.0: superseded for TPC/PTPC Self by `AC-P4-02-58` — the Penders
    card is now emitted at both scopes.)*
- **AC-P4-02-33** For TPC/PTPC, the `CREDIT_POINTS` breakdown row (both
  `WITHOUT_REPRICING` and `WITH_REPRICING` variants, both scopes) is
  **pipeline-computed** per the capped formula now documented in
  `mongodb.md` §1 ("v1.7.0 (ARVIJ-19/157, D-19)"): `A` = that variant's
  Insurance + Takaful collected total; `B` = 10% × Single Premium + 10% ×
  PSA (same variant); Credit Point = `B` when `B < 25%×A`, else capped at
  `25%×A`. This replaces today's `PRODUCT_DATA_MISSING` placeholder for
  `CREDIT_POINTS` once the domain pipeline computes it — no fixture is
  updated by this addendum (the pipeline change is a backend action, not a
  spec-only change); see the open question below on whether the gauge's
  headline `collected` value (`TPC = A + Credit Point`) must also reflect
  this, not just the breakdown row.
- **AC-P4-02-34** The Team Type filter (ARVIJ-157 AC17: Direct Unit / Group)
  maps onto the existing `context.teamView` (`DIRECT`/`GROUP`) dimension —
  already wired end-to-end (dashboard entry, detail-page query forwarding,
  refetch-on-change). Changing it refreshes the chart, all KPI elements and
  both breakdown tables, consistent with existing `AC-P4-02-10` behavior.
  This AC documents traceability only; no new plumbing is introduced.

## E2. Open questions

- 🔴 **Chart-design conflict (unresolved by this addendum).** Both Jira
  stories specify a colored visual chart: Self wants a two-tone donut
  (Collected = dark blue, Penders = light blue); Team wants a single-tone
  Collected-only chart (no Penders, no goal segments in either). The
  currently shipped design (`AC-P4-02-23`, from screenshot evidence) is a
  text-only "value-only" face with no donut at any breakpoint. This
  addendum **does not change the chart** — `AC-P4-02-23` stands as-is.
  Product/UX must decide which source of truth governs the TPC gauge's
  visual design before either is implemented; do not silently pick one.
- 🟡 **Self's stale goal-segment bullets.** ARVIJ-19's "Visual Chart Color
  Logic" AC still lists a grey (remaining-to-goal) and green
  (goal-achieved) segment even though the same story elsewhere strikes out
  its "Goal not available" AC and states goal-setting is out of scope for
  R1. Treated as non-authoritative leftover text for R1; not implemented.
  Confirm with the story's author before any future revision reintroduces
  goal segments.
- 🟡 **"AM-only" Group visibility vs. existing P2/P3 leader-level gating.**
  ARVIJ-157 AC17 restricts the Group team-type to "AM only." The existing
  entitlement model gates `teamView=GROUP` by **leader level** (P2 may
  request DIRECT or GROUP; P3 is DIRECT-only, 403 `INS-4031` otherwise) —
  not by a role literally named "AM." Confirm whether "AM" is this
  repo's/business's synonym for the P2 leader level, or a distinct check
  requiring new entitlement logic, before `AC-P4-02-34` is treated as fully
  closed.
- 🔴 **Does `TPC` itself (the gauge's `collected` value), not just the
  breakdown row, get computed via the new Credit Point formula?** ARVIJ-157
  AC13's note reads "`TPC = A + Credit Point`" — read literally, this
  redefines the headline TPC value the gauge/KPI cards show, not only the
  `CREDIT_POINTS` breakdown line. Confirm before backend implementation:
  if yes, `values.collected` in `mongodb.md` must be pipeline-derived from
  this formula too (a materially bigger change than a single breakdown
  row); if no (i.e. `collected` stays independently sourced and
  `CREDIT_POINTS` is purely informational), say so explicitly.


---

# v1.8.0 addendum — breakdown-table column is filter-driven, not fixed (MY)

A requester screenshot of the TPC breakdown-by-product table showed both
Insurance and Takaful columns rendered side by side, unconditionally — this
addendum corrects that: the table's column has always been meant to follow
the page's own Business Line filter (`context.businessLine`), the same
filter every other section on this screen already reflects (§3: "Chips are
read-only context... matches mocks"), not present a fixed Insurance/Takaful
comparison regardless of it. This is additive/corrective, not a new feature.

This addendum only changes the breakdown table's **column count and value
semantics**. It does not change TPC's product row list (still 5, unaffected
— `AC-P4-02-33`'s v1.7.0 fix already covers that), and it does not change
PTPC's 7-product row list (no Jira story covers PTPC; only its column shape
changes, since `w.metric-detail.breakdown-table` is one shared widget).

## F1. New acceptance criteria

- **AC-P4-02-35** The breakdown table's `columns` array has exactly **one**
  entry, equal to `context.businessLine` (`ALL`, `INSURANCE`, or `TAKAFUL`)
  — never the fixed `[INSURANCE, TAKAFUL]` pair rendered today. Each row's
  single cell, and the Total row, reflect that one business line:
  `INSURANCE`/`TAKAFUL` show that line's own value per product (unchanged
  math from today's per-column figures); `ALL` shows the **combined**
  Insurance+Takaful value per product — a single summed figure, not two
  values side by side, matching the "Both (combined value only, no split)"
  convention `AC-P4-02-12`/`-14` already use for the KPI summary. Changing
  the page's Business Line filter changes which single column renders,
  exactly like every other section on this screen. This amends `AC-P4-02-05`
  (its "Total row equal to the column sum of rendered rows" language is
  unchanged; only the column count changes) and the §1 section matrix note
  ("h-scroll ≥2 columns" no longer applies — horizontal scroll is now a
  fallback for long single-column content, not a comparison feature).
  **Amended, v1.21.0 (`AC-P4-02-62`):** the one-column rule stands, but the
  column-header row is visually hidden (screen-reader only).

## Open questions

- 🟡 Evidence is a requester screenshot showing the pre-fix (two-column)
  state, not a positive design approval of the one-column layout — tracked
  under the existing "Strict UX source approval is incomplete" blocker.
  Confirm the single-column header/spacing is acceptable once built, since
  no baseline exists for it at any breakpoint.

## Correction to v1.6.0's `OQ-38`

`OQ-38` claimed "no fixture emits `breakdown.with-repricing`," and on that
basis called `AC-P4-02-29`'s desktop pairing unverifiable. That was only true
of this package's hand-authored canonical fixture — the actual backend
(`pa-be-dev`'s stub engine, `metricDetail()`) has **always** built both
`WITHOUT_REPRICING` and `WITH_REPRICING` breakdown tables together for any
breakdown-capable metric, predating this whole addendum chain. `TPC`/`PTPC`
therefore already emit both `breakdown.without-repricing` and
`breakdown.with-repricing` side by side, and `AC-P4-02-29`'s pairing is live
and verifiable today, not blocked. `OQ-38` is **closed**: it described the
canonical fixture's gap, not a real product gap. The canonical fixture still
only shows one breakdown table for illustration; that remains a fixture
authoring choice, not evidence of a missing capability.


---

# v1.9.0 addendum — PTPC drill-down alignment with ARVIJ-106 (Self) / ARVIJ-164 (Team)

Two further signed-off Jira stories — **ARVIJ-106** (Self scope, PTPC
drilldown, signed off 19-Aug-2026) and **ARVIJ-164** (Team scope, PTPC
drilldown, signed off 19-Aug-2026; both re-signed-off 10-Sep-2026 after
credit-point and Penders wording updates) — are PTPC's counterpart to the TPC
stories reconciled in v1.7.0 (ARVIJ-19/ARVIJ-157). Both stories carry the same
struck-through/green-highlighted revision pattern as that addendum's sources.
This addendum is additive/corrective, closes the long-open PTPC-definition
half of README `OQ-2`, and — per product's direction on this revision —
explicitly does **not** close the chart-design conflict for PTPC; it stays
open exactly as it is for TPC.

## G1. New acceptance criteria

- **AC-P4-02-36** PTPC's product-category breakdown (both
  `breakdown.without-repricing` and `breakdown.with-repricing`, both scopes)
  is the **same 5-product set as TPC** — `LINKED_PREMIUM`, `REGULAR_PREMIUM`,
  `PSA`, `SINGLE_PREMIUM`, `CREDIT_POINTS` — **not** the 7-product set (with
  `UNIT_TRUST`/`GROUP_PREMIUM`) this screen previously carried for PTPC. Both
  ARVIJ-106 and ARVIJ-164 strike `Unit Trust` and `Group Premium` from their
  product-category ACs (AC13/AC15 in each story), in agreement with each
  other. This closes README `OQ-2`'s previously-unresolved second half ("PTPC
  _definition_ ... still awaits sign-off"); the goal half of `OQ-2` was
  already resolved (`cardOverrides.PTPC.showGoal:false`) and is unaffected.
  No fixture or backend implementation ever emitted `UNIT_TRUST`/
  `GROUP_PREMIUM` for PTPC, so this is a correction to a previously-open
  question, not a change to shipped behavior (same framing as `AC-P4-02-35`).
  Supersedes §1's prior "7 products incl UNIT_TRUST, GROUP_PREMIUM" matrix
  note for PTPC.

## G2. Confirmatory findings (no new AC — existing ACs already generalize)

- **KPI cards / Penders scope-gating.** Both stories' AC9/AC16 (PTPC KPI set;
  Team Penders = sum of all agents' cases with a blocked hyperlink) match
  `AC-P4-02-31`/`AC-P4-02-32` exactly, which are already worded "for TPC/PTPC."
  No amendment needed.
- **Credit Point formula.** Both stories' AC13/AC15 notes are the identical
  capped formula already documented as `AC-P4-02-33` / `mongodb.md` §1
  ("TPC/PTPC"). No amendment needed.
- **Team Type filter.** ARVIJ-164 AC18 (Direct Unit/Group) matches the
  existing `context.teamView` mechanism already covered by `AC-P4-02-34`
  ("for TPC/PTPC"). No amendment needed.
- **Goal/visual-chart bullets struck out** (Target PTPC, Penders
  amount/legend, both Goal-Available/Not-Available ACs, 3 of 4 color-logic
  bullets) are consistent with the existing MY config decision
  (`cardOverrides.PTPC.showGoal:false`, README `OQ-2`) and the already-shipped
  value-only gauge face (`AC-P4-02-23`) — confirmatory, not new scope.
- **AC17 (Product Data Not Available → disclaimer)**, both stories: already
  generically covered by `AC-P4-02-19`/`AC-P4-02-20`'s notice/state behavior.
- ARVIJ-164's precondition strikes "clawbacks, introducer credits" from the
  team-level PTPC values retrieved — scoping-out note only, logged for
  traceability, no AC impact.

## G3. Open questions

- 🔴 **Chart-design conflict — explicitly left open for PTPC too (by product
  direction on this revision).** ARVIJ-106/164's surviving chart bullet
  ("Dark Blue = collected PTPC achieved" only, no Penders/goal segments) is
  consistent with the shipped value-only `AC-P4-02-23` face, but this
  revision does **not** formally close the conflict for PTPC — it stays open
  exactly as v1.7.0 left it for TPC, pending one product/UX ruling that
  covers both metrics together.
- 🟡 **Orphaned product codes.** With PTPC narrowed to 5 products,
  `UNIT_TRUST`/`GROUP_PREMIUM` (TPC never used them either) have no
  consuming metric anywhere in the system. Kept documented in
  `insights.v1.yaml` as reserved/unused per this revision's direction, rather
  than removed — preserves history/traceability at no cost, since
  `productCode` is not a closed enum.
- 🟡 **ARVIJ-164 Jira workflow status is "Backlog"** (vs. ARVIJ-106 "In
  Development") despite both carrying the same 19-Aug-2026 signoff and
  10-Sep-2026 re-signoff comments from the same approver (Loke Wee Wong).
  Treated as equally authoritative business evidence per
  `source-evidence-policy.md` (comments, not ticket workflow state, are the
  approval signal) — flagged in case the Backlog status reflects a build
  sequencing decision this spec should know about.


---

# v1.10.0 addendum — CASE_COUNT drill-down alignment with ARVIJ-20 (Self) / ARVIJ-158 (Team)

Two further signed-off Jira stories — **ARVIJ-20** (Self scope, CASE_COUNT
drilldown) and **ARVIJ-158** (Team scope, CASE_COUNT drilldown), both signed
off 19-Aug-2026 — are CASE_COUNT's counterpart to the TPC and PTPC stories
reconciled in v1.7.0 and v1.9.0. Unlike TPC/PTPC, CASE_COUNT has no
repricing or breakdown capability (`mongodb.md` §4: `repricing ✗`,
`breakdown ✗`), so neither story's ACs touch `variant.with-repricing` or the
breakdown tables — the reconciliation is narrower, covering only the
gauge/chart, the KPI set and Penders scope-gating, and the default-goal
formula. This addendum is additive/corrective and explicitly does **not**
resolve the chart-design conflict — see H3.

## H1. New acceptance criteria

- **AC-P4-02-37** For CASE_COUNT, the KPI element set is **scope-dependent**,
  reusing the `AC-P4-02-31`/`-32` pattern already established for TPC/PTPC
  (§4.1 of v1.7.0), narrowed to CASE_COUNT's smaller capability set (no
  repricing variant, so no 4th "With Repricing" element to begin with):
  `scope=SELF` renders exactly **three** KPI elements — Case Count (Current
  Period, excluding Penders), Case Count (Previous Period, excluding
  Penders), Case Count Growth (`ARVIJ-20` AC11) — with **no Penders element
  anywhere**, not as a KPI card and not inside the gauge/chart legend
  (`ARVIJ-20` AC4 specifies the chart shows "the collected amount" only,
  unlike TPC/PTPC's SELF case which keeps a **money** Penders figure in the
  gauge legend). This is a narrower Self behavior than TPC/PTPC's: CASE_COUNT
  SELF has zero Penders exposure, not a legend-only one. `scope=TEAM` renders
  those same three **plus a fourth**: Penders, as its **own KPI card**
  (`penders.primary` → `w.metric-detail.penders`), `value.kind=COUNT`
  (`ARVIJ-158` AC4/AC5/AC11). This amends the §1 section matrix's CASE_COUNT
  `penders.primary` cell (now `✓, TEAM scope only`, superseding the
  unconditional `✓ (100)` it carried before this revision) and `mongodb.md`
  §4's CASE_COUNT capability row, which listed `penders ✓` without a scope
  qualifier.
- **AC-P4-02-38** CASE_COUNT's default goal, when no goal is explicitly
  configured, is the **previous year's achieved Case Count** (`ARVIJ-20` AC7,
  `ARVIJ-158` AC7 — both non-struck in both stories, unlike the surrounding
  goal-segment bullets struck in H2 below). This is a **formula-only**
  specification: no VM field is added by this revision. `GaugeSectionVM` has
  no `goal`/`target` field for any metric today (unchanged since v1.7.0 — see
  that addendum's framing); the surface this default would populate — a goal
  reference on the CASE_COUNT drill-down chart — does not exist until the
  chart-design conflict (H3) is resolved, so this AC is **specified but
  unrenderable on the detail screen** pending that ruling, the same
  "specified, not yet renderable" convention used for `AC-P4-02-27`/`-29`
  pending their own blocking data questions. Separately, CASE_COUNT's
  **dashboard** card (`S-P4-01`, `MetricCardVM.goal`) already carries
  `showGoal:true` with `goal:{state:"NOT_SET"}` in the canonical fixture
  (`dashboard-self.json`) — whether this same default-goal formula should
  also apply there, converting that card's `NOT_SET` to a computed `SET`
  target, is a cross-screen consequence this addendum surfaces but does
  **not** decide or implement, being out of `S-P4-02`'s scope (see H3).

## H2. Confirmatory / non-implemented findings (no new AC)

- **Team Type filter.** `ARVIJ-158` AC14 (Direct Unit/Group) matches the
  existing `context.teamView` mechanism already covered by `AC-P4-02-34`
  ("for TPC/PTPC" — that AC documents the `teamView` dimension itself, which
  is screen-wide and metric-agnostic, so it already covers CASE_COUNT with no
  amendment needed). Confirmatory only, same treatment as `AC-P4-02-34`'s
  v1.9.0 confirmation for PTPC.
- **Stale goal-segment color bullets.** Both `ARVIJ-20`'s AC8 and
  `ARVIJ-158`'s AC8 carry a second, internally-contradictory "goal segment"
  color AC (dark blue = collected, grey = remaining-to-goal, the entire
  collected amount turning green once the goal is achieved/exceeded)
  alongside their primary segment-colored AC (NB = blue, NB Penders = amber,
  Endorsement = grey — see H3), even though both stories otherwise treat
  goal-setting as inapplicable for R1 chart rendering. Treated as
  non-authoritative leftover text, same convention as v1.7.0's handling of
  `ARVIJ-19`'s stale goal-segment bullets (that addendum's E2) — **not
  implemented**.
- **AC13 (Chart Data Not Available → disclaimer)**, both stories: already
  generically covered by `AC-P4-02-19`/`AC-P4-02-20`'s notice/state behavior,
  same as `ARVIJ-106`/`164`'s equivalent AC17 was in v1.9.0.
- **AC14 (Team Type Update: Direct Unit/Group refresh)**, `ARVIJ-158`: already
  covered by `AC-P4-02-10`'s existing refresh-on-`teamView`-change behavior,
  same as `AC-P4-02-34` documents for TPC/PTPC.

## H3. Open questions

- 🔴 **Chart-design conflict, extended to CASE_COUNT with a new chart shape.**
  Both stories specify a **stacked bar/segment chart** for the primary
  visual — segments for NB, NB Penders and Endorsement, each showing both its
  count and its percentage contribution (`ARVIJ-20` AC4/AC5/AC9, `ARVIJ-158`
  AC4/AC5/AC9) — not the shipped value-only face (`AC-P4-02-23`) or the
  standalone `donut-270` CASE_COUNT otherwise keeps per the widget-contracts
  note. No existing widget in `widget-contracts.md` renders stacked segments
  with per-segment counts and percentages; `w.metric-detail.gauge` and
  `w.metric-detail.bar-comparison` are both shaped differently (a donut/value
  face and a grouped year-over-year bar chart, respectively). This is a
  **different chart type** from the TPC/PTPC conflict (a two-tone/single-tone
  **donut** disagreement, still open per `AC-P4-02-23`'s open questions and
  README `OQ-40`/`OQ-42`) — not the same shape with different colors. Logged
  at the same 🔴 severity and with the same "do not implement a guess"
  handling as the existing TPC/PTPC conflict, but flagged as a **third,
  structurally distinct** chart-design question that the pending product/UX
  ruling should now cover alongside TPC/PTPC's, rather than assuming one
  ruling settles all three.
- 🟡 **Strikethrough markup not reliably extractable from the PDF text
  dump.** Both `ARVIJ-20` and `ARVIJ-158` use struck-through text extensively
  to mark removed/superseded bullets, but the text extraction used to produce
  this addendum could not reliably distinguish struck from live text in two
  places: (1) `AC-P4-02-37`'s H1 chart-detail field list (AC5 in both
  stories — which of NB, NB Penders, Endorsement, % contribution, Legend,
  Goal Case Count and Previous Year Case Count survive vs. are struck), and
  (2) `ARVIJ-158`'s AC11 KPI bullet list, specifically whether Team's Penders
  KPI is the single aggregate card this addendum specifies in `AC-P4-02-37`
  (reusing the `AC-P4-02-31`/`-32` shape) or two separate cards ("Case Count
  (Current Period) – Penders" and "Case Count (Previous Period) – Penders",
  as AC11's bullet text literally reads before any strikethrough is applied).
  This addendum implements the single-aggregate-card reading per direct
  instruction; both points need a visual re-check against the source PDFs
  (not the text dump) before being treated as fully confirmed.
- 🟡 **Default-goal formula "family" claim is not evidenced elsewhere in this
  repo.** The request framed CASE_COUNT's default-goal formula
  (`AC-P4-02-38`) as belonging to "the same formula family as TPC/PTPC," as
  opposed to a distinct FYP/FYC "+20%" formula. Neither formula exists
  anywhere in this spec repository today: v1.7.0 explicitly declared
  goal-setting inapplicable to TPC/PTPC for R1 ("no goal concept is added to
  the metric-detail gauge by this addendum"), and no FYP/FYC default-goal
  formula of any kind — "+20%" or otherwise — appears in `mongodb.md`,
  `performance-vm.ts`, or either screen's requirements. `AC-P4-02-38` is, as
  far as this repository's history shows, the **first** default-goal formula
  ever documented in the `S-P4-02` spec chain, not a reuse of an established
  pattern. Flagged so a future TPC/PTPC or FYP/FYC default-goal Jira story is
  reconciled against what's actually written here, not against an assumed
  precedent.


---

# v1.11.0 addendum — FYP drill-down alignment with ARVIJ-107 (Self) / ARVIJ-165 (Team)

Two further signed-off Jira stories — **ARVIJ-107** (Self scope, FYP
drilldown) and **ARVIJ-165** (Team scope, FYP drilldown), both signed off
19-Aug-2026 — are FYP's counterpart to the TPC, PTPC and CASE_COUNT stories
reconciled in v1.7.0, v1.9.0 and v1.10.0. FYP's capability set
(`mongodb.md`'s matrix: `goal ✓`, `penders ✓`, `repricing ✗`, `breakdown ✗`
before this revision) puts it structurally closer to TPC/PTPC than to
CASE_COUNT — both stories describe a gauge + comparison + product-breakdown
template — but two things diverge from every prior reconciliation in this
chain and are documented as their own rules rather than folded into an
existing pattern: FYP's KPI/Penders set is **not** scope-dependent at all
(unlike `AC-P4-02-31`/`-37`), and its breakdown reactivates the pre-v1.9.0
7-product set with a **plain**, uncapped `CREDIT_POINTS` row. This addendum
is additive/corrective and explicitly does **not** resolve the chart-design
conflict — see I3.

## I1. New acceptance criteria

- **AC-P4-02-39** For FYP, the KPI element set is **not scope-dependent** —
  both `scope=SELF` and `scope=TEAM` render the same **three** elements:
  Current Year FYP, Previous Year FYP, FYP Growth (`ARVIJ-107` AC9–AC11,
  `ARVIJ-165` AC9–AC11), realized by the existing `gauge.primary` +
  `comparison.primary` combined card, unchanged mechanism from
  `AC-P4-02-31`. FYP has no repricing capability, so there is no 4th "With
  Repricing" element to begin with (same absence as CASE_COUNT,
  `AC-P4-02-37`). Unlike TPC/PTPC/CASE_COUNT, **Team never gains a Penders
  KPI card**: neither story lists a separate Penders card in its KPI-cards
  AC, and both keep Penders as a money amount inside the gauge/chart legend
  only (`GaugeSectionVM.penders`, unchanged) — the same treatment at
  `scope=SELF` and `scope=TEAM`. This is a **confirmatory, not a gap**:
  FYP's existing capability row already has `penders ✓` with no
  `penders.primary` section ever specified for it (§1 matrix, unchanged by
  this revision — `penders.primary`/FYP stays "—"), and this addendum finds
  nothing in either signed-off story that would add one. This narrows,
  rather than extends, the `AC-P4-02-31`/`-32`/`-37` scope-gating pattern:
  FYP simply never needs the TEAM-only Penders-card branch those ACs
  introduced for TPC/PTPC/CASE_COUNT.
- **AC-P4-02-40** FYP's product-category breakdown
  (`breakdown.without-repricing` only — no `.with-repricing` variant exists
  for FYP, since `repricing ✗`) activates the metric's `breakdown`
  capability (`mongodb.md` matrix: `✗` → `✓`) and lists **seven** products —
  `LINKED_PREMIUM`, `REGULAR_PREMIUM`, `PSA (10%)`, `SINGLE_PREMIUM (10%)`,
  `CREDIT_POINTS (10%)`, `UNIT_TRUST`, `GROUP_PREMIUM` (`ARVIJ-107` AC13,
  `ARVIJ-165` AC13) — the **old** 7-product set TPC/PTPC carried before
  v1.9.0 narrowed them to 5, not that narrowed set. `CREDIT_POINTS` here is
  a **plain** `weightPct=10` row like `PSA`/`SINGLE_PREMIUM` — it does
  **not** use the capped formula `AC-P4-02-33` documents (`mongodb.md` D-19,
  "for TPC/PTPC" only); no story evidence suggests FYP's Credit Point is
  pipeline-derived from Insurance+Takaful collected totals the way TPC/PTPC's
  is. This activates `UNIT_TRUST`/`GROUP_PREMIUM` as consuming codes again,
  resolving v1.9.0's `OQ-43` ("orphaned product codes" — they now have a
  consuming metric). Supersedes §1's matrix note and amends `AC-P4-02-02`
  (above).
- **AC-P4-02-41** FYP's default goal, when no goal is explicitly configured,
  is **last year's achieved FYP + 20% growth** (`ARVIJ-107` AC7, `ARVIJ-165`
  AC7 — both non-struck in both stories) — documented in `mongodb.md` as its
  **own** rule (D-21), explicitly **different** from `AC-P4-02-38`'s
  "previous year's achieved" default for CASE_COUNT: `goal.target = priorYear.achieved × 1.20`
  for FYP, vs. `goal.target = priorYear.achieved` (no growth factor) for
  CASE_COUNT. Do not conflate the two formulas or assume one supersedes the
  other. Same convention as `AC-P4-02-38`: this is **formula-only** — no VM
  field is added, and the surface a FYP goal reference would populate (the
  gauge/chart) does not exist until the chart-design conflict (I3) is
  resolved, so this AC is **specified but unrenderable** on the detail
  screen. FYP's capability row already carries `goal ✓` (pre-existing, for
  the `S-P4-01` dashboard's `MetricCardVM.goal`) — whether this new default
  formula should also populate that dashboard card's goal when unset is a
  cross-screen consequence this addendum surfaces but does not decide or
  implement, out of `S-P4-02`'s scope (same framing as `AC-P4-02-38`'s H1
  cross-screen note).

## I2. Confirmatory findings (no new AC — existing ACs already cover this)

- **No Self/Team Penders scope-gating for FYP.** Covered above as part of
  `AC-P4-02-39`'s reasoning, not a separate AC: this is a confirmed
  divergence from the TPC/PTPC/CASE_COUNT pattern (simpler, not a gap), so
  no amendment to `AC-P4-02-31`/`-32`/`-37` is needed — those remain worded
  "for TPC/PTPC" and "for CASE_COUNT" respectively and are not extended to
  FYP.
- **Team Type filter.** Neither `ARVIJ-107` (Self scope; no Team Type filter
  applies) nor `ARVIJ-165` AC15 (Direct Unit/Group) introduces anything
  beyond the existing `context.teamView` mechanism already covered by
  `AC-P4-02-34` ("for TPC/PTPC" — that AC documents the `teamView` dimension
  itself, screen-wide and metric-agnostic, so it already covers FYP with no
  amendment needed). Confirmatory only, same treatment as `AC-P4-02-34`'s
  v1.9.0/v1.10.0 confirmations for PTPC/CASE_COUNT.
- **AC14 (Product Data Not Available → disclaimer)**, both stories: already
  generically covered by `AC-P4-02-19`/`AC-P4-02-20`'s notice/state behavior,
  same as every prior reconciliation's equivalent AC.
- **Goal Setting out of scope confirmation.** Both stories separately state
  "Goal Setting will not be applicable for R1" (same phrasing v1.7.0 quoted
  for `ARVIJ-19`/`157`) directly above their AC6/AC7 goal bullets — read
  together with `AC-P4-02-41` being specified-but-unrenderable, this is
  read as scoping the goal *display* out of R1, not the default-goal
  *formula* itself, which both stories still specify as non-struck text
  (AC7 in each). No contradiction is treated as resolved beyond that
  reading; flagged in I3 if this needs product confirmation.

## I3. Open questions

- 🔴 **Chart-design conflict — extends to FYP (by the same instruction that
  scoped v1.9.0 to PTPC and v1.10.0 to CASE_COUNT).** Both `ARVIJ-107` and
  `ARVIJ-165` specify the same two-tone donut ARVIJ-19/157 specified for TPC
  in v1.7.0 (dark blue = collected, light blue = Penders, grey =
  remaining-to-goal, entire collected segment turns green once the goal is
  achieved/exceeded) — logged under the **same** open TPC/PTPC chart-design
  question (`OQ-40`/`OQ-42`), not a new, separate one, per direct
  instruction. One nuance worth surfacing rather than silently absorbing:
  `AC-P4-02-23`'s shipped **value-only** face — the thing TPC/PTPC's donut
  request contradicts — is scoped in `widget-contracts.md` to "the TPC/PTPC
  combined card" specifically; a **standalone** gauge (which is what FYP
  actually uses, `donut-270`, per that same widget-contracts row) is
  documented there as "unevidenced" — no approved baseline exists for what
  `donut-270` renders on its own. So for FYP the conflict is, strictly, a
  colored/segmented request against an *unevidenced* placeholder rather than
  against an evidenced shipped face — a materially different starting point
  than TPC's. Grouped under the same tracked question as instructed, but
  the product/UX ruling covering TPC/PTPC/CASE_COUNT should also settle
  FYP's baseline explicitly rather than assume the TPC finding transfers
  as-is. FYC is not covered by either signed-off story reconciled here and
  will need its own alignment once that story lands.
- 🟡 **"Formula family" question (`OQ-47`) is now answered for the FYP half,
  not the TPC/PTPC half.** v1.10.0 flagged that neither a "previous year's
  achieved" (CASE_COUNT) nor a "+20% growth" (FYP/FYC) default-goal formula
  had prior evidence in this repo, and that the two were claimed to belong
  to distinct formula families. `AC-P4-02-41` now confirms the FYP formula
  is `priorYear.achieved × 1.20`, distinct from `AC-P4-02-38`'s
  `priorYear.achieved` for CASE_COUNT — the two families **are** different,
  as claimed. What remains unconfirmed: whether TPC/PTPC, which v1.7.0
  declared goal-setting inapplicable to entirely for R1, would use the
  CASE_COUNT family, the FYP family, or a third formula if goal-setting is
  ever enabled for them — no evidence in either TPC/PTPC story addresses
  this, so it stays an open question rather than an assumption either way.
- 🟡 **Goal-formula vs. goal-display scoping.** Both stories' precondition/
  AC6 text says goal-setting is inapplicable for R1 in the same breath as
  specifying the AC7 default-goal formula as live (non-struck). This
  addendum reads that as "the formula is documented now; only its on-screen
  rendering is deferred," matching the exact convention v1.10.0 established
  for `AC-P4-02-38`. Flagged in case product intends the formula itself,
  not just its rendering, to also wait for a later release.


---

# v1.12.0 addendum — Persistency (CY / Y1 / Y2) drill-down alignment, Self and Team

> Version note: this fills the `1.12.0` slot that v1.13.0 reserved. It was
> authored after v1.13.0 and does not depend on it. Nothing in v1.13.0
> (MANPOWER) is changed by this addendum.

**Sources.** Six downloaded Jira PDF exports (22-Sep-2026, 5 pp. each), all
"[PAMB/PBTB] Metric Display (Drilldown)", Jira status **Backlog**, LBU PAMB,
label Release1.1. They form three Self/Team pairs:

| Metric | Self | Team | Threshold stated |
|---|---|---|---|
| `PERSISTENCY_CY` | ARVIJ-111 | ARVIJ-170 | 90% (Self AC4/AC5); Team says "configured" |
| `PERSISTENCY_Y1` | ARVIJ-113 | ARVIJ-172 | 85% (Self AC4/AC5/AC8); Team says "configured" |
| `PERSISTENCY_Y2` | ARVIJ-115 | ARVIJ-174 | 80% (Self AC4/AC5/AC8); Team says "configured" |

The PDFs were supplied in the request and are **not stored** in this repo, so
there is no SHA-256. The attached `Request for Sign Off - Sprint 2
_Drilldown stories.eml` was **not read**. The 3-Sep UI/UX MOM snippet
(`image-20260910-071318.png`, on ARVIJ-111/113/115) was read only as it
renders inside the PDFs (p.4–5). The PBTB clones ARVIJ-522/524/526 (Self) and
ARVIJ-546/548/550 (Team) were **not reconciled**.

**Evidence strength (same pattern as v1.13.0's `OQ-52`).** Every story has a
01-Sep-2026 comment by Aritra Kabiraj: *"This user story was signed off on
19th Aug 2026"*. On 08-Sep-2026 Pramit Pal posted on every story: *"Following
changes are made basis the UI/UX alignment on 3rd sept — 1. Removed year on
year comparison. Requesting you to re-signoff"*. On 10-Sep-2026 Loke Wee Wong
replied on every story, *"acknowledge the changes in green. please proceed.
Irene PL Tan confirmed as well"*. On the Team stories that reply also asked
*"AC8: Why the Threshold Indicator was remove for team?"*, and Shreya Jain
answered the same day: *"Threshold is applicable for the requirement, story
is now updated."* Every requirement this addendum **changes** rests on that
10-Sep acknowledgement, not a restated sign-off. That is treated as business
approval under `source-evidence-policy.md`, and flagged in K3 (`OQ-58`).

**What changed in the stories.** Across all six, the green edits strike
"Last Year Same Date Value" and "Persistency Change" (Self) / "Change in
Difference" (Team) from AC5 (chart details), AC8 (updates on filter change)
and AC9 (KPI cards), and strike AC11 (the change calculation). What is left
is the **latest persistency value, the threshold indicator and the as-on
date**. Each story also adds a green note to AC2/AC10: *"Persistency will
always have YTD value irrespective of the period filter chosen on the
landing page"*.

## K1. New acceptance criteria

- **AC-P4-02-46** For `PERSISTENCY_CY`, `PERSISTENCY_Y1` and `PERSISTENCY_Y2`,
  at **both** `scope=SELF` and `scope=TEAM`, the drill-down renders **no**
  `comparison.primary`. There is no Last Year Same Date Value, no Persistency
  Change / Change in Difference card or row, and no year-on-year directional
  indicator. With `dataState=OK` the body is `threshold.primary` alone (plus
  any `notices[]`). By `AC-P4-02-01`, the missing section leaves no gap or
  placeholder.
  **Realization (no schema change).** `getMetricDetail` omits `comparison`
  for these three metrics. `MetricDetail.comparison` has been optional in C2
  since v1.2.0, and the BFF already emits no `comparison.primary` when
  `comparison` is absent, so C2, C3 and C4 are unchanged. `config.sectionOrder`
  is shared and stays as it is.
  **Supersedes** the §1 matrix's `comparison.primary`/`PERSISTENCY_*` cell,
  §2 traceability row 8 and the comparison half of `AC-P4-02-03`. It also
  amends `AC-P4-02-25`'s note that persistency keeps a labelled change row.
  `insights.comparison.persistencyChange` is **kept** as a reserved key, the
  same precedent as v1.13.0's `OPENING`/`CLOSING`.
  **Explicitly unaffected:**
  - ACTIVITY_RATIO still renders `threshold.primary` plus a PP
    `comparison.primary` (`AC-P4-02-13`/`-15`).
  - Every other metric's comparison is unchanged.
  - The pipeline still writes `metric_snapshots.comparison.*` for
    persistency, because S-P4-01's persistency card delta
    (`listAgentMetrics`) is out of this screen's scope (`OQ-59`).
  - S-P4-03 history is unchanged.
- **AC-P4-02-47** For `PERSISTENCY_CY`/`Y1`/`Y2`, the drill-down always shows
  the **YTD** value, whatever period the dashboard had selected (every
  story's AC2/AC10 note). The BFF calls `getMetricDetail` with
  `period=YTD` whatever the route's `period` context param is (MTD, QTD or
  YTD), and returns `context.period = 'YTD'` with the YTD snapshot's
  `context.asOfDate`. So:
  - The existing Time pill (`AC-P4-02-22`) reads **"YTD"**. That pill *is*
    the drill-down "YTD tag" Aritra Kabiraj's 10-Sep comment on
    ARVIJ-111/113/115 describes. No new widget, pill or key is added, and the
    pill is **not** hidden.
  - For the same `businessLine`/`scope`/`teamView`, the value is identical
    whether the user arrived from an MTD, QTD or YTD dashboard.
  - `businessLine` and, for TEAM, `teamView` still apply (AC2/AC8/AC12/AC13).
  - The route's `period` param and the dashboard's filter state are **not
    rewritten**, so Back returns to the dashboard with its original period
    (AC3; §3).
  - No YTD value ⇒ `dataState=EMPTY` (AC14; `AC-P4-02-18`).

  This is consistent with C0 `AC-PA-SRC-04`: no MTD/QTD canonical value is
  produced or substituted, because YTD is requested explicitly. It also
  matches `pa-be-dev`'s existing YTD-only persistency mapping. The rule is
  **metric-specific** to these three codes, and catalog
  `dimensions.periods` is not changed (changing it could alter S-P4-01
  composition). It fixes today's behavior, where an MTD/QTD entry falls
  through to EMPTY. **Decision provenance:** requester, 24-Sep-2026, answering
  this revision's impact question. The recommended option ("BFF requests
  YTD") was chosen over "log as OQ only" and "also hide the Time pill".
  `mongodb.md` D-23.

## K2. Confirmatory findings (no new AC)

- **Thresholds and semi-circle gauge (AC4/AC6, all six).** Already specified:
  `threshold.primary` → `w.metric-detail.threshold-gauge` (`arc-180`, 0–100%),
  reading per-metric `threshold.value` (`widget-contracts.md` §2;
  `AC-P4-02-15`), catalog CY **90** / Y1 **85** / Y2 **80** GTE
  (`mongodb.md` §4, v1.1.0). The Team stories say "configured thresholds"
  without numbers. The catalog is scope-agnostic, so Team uses the same
  values.
- **Threshold stays for Team.** Loke Wee Wong's 10-Sep query and Shreya
  Jain's reply ("Threshold is applicable … story is now updated") confirm it
  is **present, not removed**. ARVIJ-170/172/174 AC5/AC6/AC8 list it
  (green). ARVIJ-174 AC4 still shows a struck "gauge shall display configured
  threshold markers" line. Read as an editorial leftover and overridden by the
  reply (`OQ-61`).
- **RAG progress ring (AC7 on all six; MOM "Red for below threshold, Green
  for at or above").** Already satisfied, with no new behavior.
  `ThresholdGaugeSectionVM.sentiment` is `POSITIVE` when the threshold is met
  and `NEGATIVE` otherwise. For `GTE`, met means `current ≥ threshold.value`,
  so a value **exactly at** the threshold is green, which matches ARVIJ-111
  AC7's "meets or exceeds". The global mapping gives `POSITIVE → tone.success`
  and `NEGATIVE → tone.danger` (`widget-contracts.md` §2). Both `pa-be-dev`
  (`compose/metric-detail.ts`) and `pa-fe-dev` (`ThresholdArc`) already do
  exactly this. No amber band is evidenced: the MOM lists only the two
  states. No AC is added because the behavior does not differ.
- **As On Date.** `context.asOfDate` (traceability row 3; header per
  `AC-P4-02-22`).
- **Navigation, filters and Back (AC1/AC2/AC3/AC8).** Existing tile
  navigation and dashboard-carried context (§3). The period dimension is
  overridden only as `AC-P4-02-47` specifies.
- **Team hierarchy (ARVIJ-170/172/174 AC13: AM Direct Unit + Group, UM
  Direct Unit only).** Matches the existing `context.teamView` mechanism and
  P2/P3 gating (`AC-P4-02-10`/`-34`; D-14). Confirmatory, same treatment as
  v1.9.0–v1.13.0.
- **Total Summary by business line (AC12).** Read as the existing
  filter-driven value for the selected `businessLine`, not a new three-row
  section. This is the same reading as `OQ-55`. AC12's "reporting period"
  wording is overridden by the always-YTD note (`AC-P4-02-47`).
- **Data unavailable (AC13 Self / AC14 Team).** `dataState=EMPTY`
  (`AC-P4-02-18`).
- **Entitlement and consistency (AC14 Self / AC15 Team).** Existing
  entitlement model. With `comparison.primary` gone, the only value surface is
  the threshold gauge, so "consistent across KPI cards, summary and gauge" is
  trivially one value.
- **No goal.** The catalog has `goal ✗` for all three, and no story specifies
  one.
- **No informational message on the drill-down.** Loke Wee Wong asked about
  an "AC11: Display information message" on the Self stories. Aritra
  Kabiraj's 10-Sep reply (citing the 3-Sep MOM) says the message belongs on
  the persistency **tiles** only, and that the drill-down has a YTD tag
  instead. That tag is realized by `AC-P4-02-47`. No notice or key is added
  here.
- **"Persistency is calculated annually" supporting text (MOM,
  highlighted).** This belongs on the **dashboard metric card** (S-P4-01),
  not this screen. It is cross-screen and out of S-P4-02's scope, so it is
  not added here (`OQ-59`).

## K3. Open questions

- 🟡 **`OQ-58` — Evidence strength.** Every changed requirement rests on the
  10-Sep "acknowledge … please proceed", not a restated sign-off. The 19-Aug
  `.eml` was not read, the MOM image was read only as rendered, and all six
  stories are in Backlog status. The six PBTB clones were not reconciled, so
  this spec remains MY/PAMB.
- 🟡 **`OQ-59` — S-P4-01 cross-screen follow-ups (not changed here).**
  - (a) The MOM's "Persistency is calculated annually" supporting text on the
    dashboard card.
  - (b) Whether the dashboard persistency card should also show YTD whatever
    the period. The stories' note says "irrespective of the period filter
    chosen on the landing page"; today an MTD/QTD dashboard card is EMPTY.
  - (c) Whether the MOM's "Remove % change / percentage point change
    indicators" also removes the card's PP delta.

  All three need an S-P4-01 revision. Owner: Product.
- 🟡 **`OQ-60` — Analytics period.** Should `insights_metric_detail_viewed.period`
  carry the rendered `context.period` (always `YTD` for persistency) or the
  entry period? Not decided here. Owner: Product analytics.
- 🟡 **`OQ-61` — Story editorial inconsistencies**, each read as noted.
  - ARVIJ-115 AC11 keeps its heading and calculation text unstruck while its
    "Last Year Same Date Value" bullet and all comparison items in
    AC5/AC8/AC9 are struck. Read as removed, like the other five, per the
    08-Sep comment.
  - ARVIJ-174 AC4's struck threshold-marker line is read as threshold stays
    (K2).
  - ARVIJ-174 AC10 lacks the YTD note. Its AC2 carries it, so the note is
    read as applying.
- 🟡 **`OQ-62` — Source readiness is unchanged.** YTD persistency itself is
  still `CANDIDATE_MAPPING` (`source-mapping.md` OQ-PA-13: `metrics.persistency.*`
  vs `metrics.ytd.*` precedence, scale and weighted aggregation).
  `AC-P4-02-47` decides only which period the drill-down requests. It
  approves no field.


---

# v1.13.0 addendum — MANPOWER drill-down alignment with ARVIJ-159 (Team)

> Version note: `1.12.0` is reserved for the pending Persistency
> reconciliation, which is not yet in this repository. This addendum is
> numbered `1.13.0` by requester direction and does not depend on it.
> *(Since filled: see the v1.12.0 addendum above.)*

**Source.** `ARVIJ-159` "[PAMB/PBTB] Metric Display (Drilldown) - Team -
Manpower", a downloaded Jira PDF export (6 pp., exported 22-Sep-2026, Jira
status **Backlog**, LBU PAMB, label Release1.1). It was supplied in the
request and **not stored** in this repo, so there is no SHA-256. The attached
`Request for Sign Off - Sprint 2 _Drilldown stories.eml` is referenced in the
PDF but was **not read**. The clone `ARVIJ-535` ("[PBTB] …", Backlog) was
**not reconciled**. This is a **Team-only** story: MANPOWER is `scopes: T` in
the catalog, and there is no Self counterpart, unlike v1.7.0–v1.11.0's
Self/Team pairs.

**Evidence strength (compare v1.9.0 G3's ARVIJ-164 note).** The story carries:
(a) a 01-Sep-2026 comment by Aritra Kabiraj, *"This user story was signed off
on 19th Aug 2026, attaching the signoff email"* (PDF p.5), and (b) a
10-Sep-2026 comment by Loke Wee Wong, *"Acknowledge the changes in green.
please proceed. Irene PL Tan confirmed as well"* (p.6). That comment replies
to Pramit Pal's 08-Sep request to re-sign-off changes made after the 3-Sep
UI/UX alignment. The request that produced this addendum said the thread has
no explicit "signed off on [date]" sentence. **That is incorrect:** comment
(a) is exactly such a sentence, the same pattern as ARVIJ-164. The real
evidence-strength difference is narrower. **Every requirement this addendum
changes** (the Opening/Closing → Total Manpower replacement, the % display
and the round-up rule) is green text added **after** the 19-Aug sign-off. It
rests only on comment (b), which is an acknowledgement ("please proceed"),
not a restated sign-off, and it post-dates the `.eml` this spec could not
read. It is treated as authoritative business approval per
`source-evidence-policy.md` (comments, not workflow state, are the approval
signal). The weaker wording and the Backlog status are flagged in J3.

## J1. New acceptance criteria

- **AC-P4-02-42** For MANPOWER (`scope=TEAM`), `bars.primary` is a
  **stacked** year-over-year bar chart (`BarComparisonSectionVM.layout =
  'STACKED'`, C3 v1.6.0). Each year renders one bar made of two measures,
  `EXISTING_AGENTS` (base) and `NEW_RECRUITS` (top), in `measures[]` order.
  The bar's height and total label are **Total Manpower** from
  `totals[].value`, which equals EXISTING_AGENTS + NEW_RECRUITS
  (domain-computed; the UI never sums segments). The legend renders from
  `measureCode` (`insights.measure.{EXISTING_AGENTS,NEW_RECRUITS}`) and the
  axis stays `insights.axis.AGENTS` (ARVIJ-159 Pre-condition, AC5; both
  green). NEW_RECRUITS = agents who joined **in the same calendar year** as
  the bar's year, with values fetched from upstream (AC5 note). The "As On
  Date" bullet is already met by `context.asOfDate` (traceability row 3).
  **Supersedes** v1.1.0 A1's grouped Opening/Closing cell (AC5/AC6/AC7/AC15
  strike Opening/Closing Manpower, both current and same-period-last-year),
  **amends** `AC-P4-02-11` (the grouped branch now needs `layout`
  absent/`GROUPED`), and retires `OPENING`/`CLOSING` as MANPOWER measure codes
  (kept as reserved i18n/`MeasureCode` values, same precedent as v1.9.0's
  `UNIT_TRUST`/`GROUP_PREMIUM`). NEW_RECRUIT_CONTRACTED's single-measure bars
  are unaffected. Segment color tokens are **not specified** because there is
  no approved visual baseline for a stacked face (existing UX-source blocker).
- **AC-P4-02-43** In `layout=STACKED`, the **only** bar delta chip is
  `totals[].change` (vs the previous year's total), rendered per
  `DeltaVM.display` with sentiment tone, with no chip for the earliest year.
  Segment points carry no `change`. This **amends** `AC-P4-02-12` for the
  STACKED case only.
- **AC-P4-02-44** MANPOWER's change is shown **as a percentage on every
  surface**. The catalog `changeDisplay` flips `ABS → PCT` (`mongodb.md` §4,
  D-22), and `DeltaVM.display = 'PCT'` for the comparison change, the stacked
  total chips and the dashboard card delta. The "change in absolute number"
  shown to the user as +/- % (ARVIJ-159 AC8/AC10/AC15 notes: "Percentage
  calculation will be for absolute numbers. However, the change will always be
  shown in % … as per business recommendation") means the % is **computed
  from** the absolute headcounts. It does not mean an absolute figure is
  displayed. `comparison.primary` realizes AC10's KPI set: **Total current
  year Manpower** (`current`), **Total previous year manpower** (`prior`,
  same period last year) and **Manpower Growth** (`change`, label
  `insights.comparison.manpowerGrowth`, unchanged). AC10 strikes Current/
  Previous Year Closing Manpower. AC7's "Current total manpower (Same Period
  Last Year)" is read as a typo for the current-year total (the only reading
  consistent with AC6 and AC10), and flagged in J3. **Supersedes** A1's
  comparison cell (ABS "+7", rows "Closing Manpower"). The directional
  indicator (AC9: up/down/neutral) is the existing `DeltaVM.direction`
  (`UP`/`DOWN`/`FLAT`), so there is no new field. **Cross-screen:** because
  `changeDisplay` is catalog-level, S-P4-01's Manpower card delta becomes a %
  and S-P4-03's MoM header for MANPOWER becomes `insights.history.momPctChange`
  (widget-contracts §2). ARVIJ-159 AC14 names "the Manpower tile and Drill
  Down page" together, which supports this scope. This revision does not bump
  S-P4-01/S-P4-03 (J3).
- **AC-P4-02-45** Every MANPOWER `DeltaVM.pct` follows the shared percent
  round-up rule **`R-PCT-ROUNDUP`** (`widget-contracts.md` §2, the single
  definition, not restated here). It is applied by the producer, and widgets
  render the integer as-is (ARVIJ-159 AC8/AC10/AC15: "23.4 should round up to
  +/- 24%"). The story's own AC8 example confirms the away-from-zero ceiling
  reading: 120 vs 110 is +9.09%, shown as **+10%**. Standard half-up rounding
  would show +9%, contradicting the example. Canonical fixture:
  `metric-detail-manpower.json`, 25 vs 18 = +38.9% → `pct: 39`.

## J2. Confirmatory findings (no new AC)

- **No goal for MANPOWER.** ARVIJ-159 specifies no target, goal marker or
  default-goal formula. Catalog `goal ✗` is unchanged, consistent with
  goal-setting being out of R1 scope for every metric reconciled so far. There
  is no equivalent of `AC-P4-02-38`/`-41`.
- **Navigation / filters / back (AC1–AC3, AC11, AC13).** Covered by the
  existing tile navigation, the context carried from the dashboard (§3) and
  refetch on filter change. No amendment.
- **Team Type (AC14/AC15: AM Direct Unit + Group, UM Direct Unit only).**
  Matches the existing `context.teamView` mechanism and P2/P3 gating
  (`AC-P4-02-10`/`-34`; D-14). Confirmatory, same as v1.9.0–v1.11.0.
- **Data unavailable (AC16).** Covered by `dataState=EMPTY` (`AC-P4-02-18`).
- **Trend chart (AC4 "Ex-Bar Chart").** Satisfied by `bars.primary`, whose
  shape is changed by `AC-P4-02-42`.

## J3. Open questions

- 🔴 **`OQ-51` — Upstream "existing agents" value.** MAPA supplies
  `ptd.manpowerTotal.{mtd,qtd,ytd}` and `ptd.newRecruits.{…}`
  (`source-mapping.md` §2.2) but no existing-agents field. ARVIJ-159 says the
  values are "fetched from upstream". Deriving `existing = total − newRecruits`
  is **not** approved (OQ-PA-12/-14). This blocks backend emission of
  `AC-P4-02-42`'s stacked measures. Owner: Business / Source owner. The
  recommended answer is Unknown until the source owner confirms a field or
  approves the derivation.
- 🟡 **`OQ-52` — Evidence strength.** See the source note above. Every
  changed requirement rests on a 10-Sep "acknowledge … please proceed", not a
  restated sign-off. The 19-Aug `.eml` was not read, and the Jira status is
  Backlog despite a 01-Sep "transition into Development" automation comment.
  This corrects the request's premise that there was no dated sign-off
  sentence.
- 🟡 **`OQ-53` — Is NEW_RECRUITS the same as NEW_RECRUIT_CONTRACTED?**
  Manpower's "new recruits" (joined this calendar year) may or may not equal
  the NEW_RECRUIT_CONTRACTED metric's count (OQ-PA-14 recruited vs
  contracted). Also unconfirmed: whether MTD/QTD bars still use the
  calendar-year join boundary, and whether AC7's "Current total manpower (Same
  Period Last Year)" is the typo `AC-P4-02-44` assumes.
- 🟡 **`OQ-54` — Previous-year total = 0.** The percentage is undefined when
  `prior = 0`, for example a unit that did not exist last year. The story is
  silent. Do not guess ("+100%", "N/A" or omitting the chip). Owner: product.
- 🟡 **`OQ-55` — AC12 "Manpower summary" for Insurance / Takaful / Both.**
  Read as the existing filter-driven values (the page shows the selected
  Business Type, like v1.8.0's single-column rule), **not** a new three-row
  summary section. No section is added. Needs product confirmation.
- 🟡 **`OQ-56` — Cross-screen reach of the PCT flip and the rounding rule.**
  The catalog flip (`AC-P4-02-44`) changes S-P4-01's Manpower card delta and
  S-P4-03's MoM header without bumping those screens. `R-PCT-ROUNDUP` is
  producer-applied to YoY `pct`. S-P4-03's MoM deltas are BFF-computed
  (D-11), and whether they also round up is not stated by the story.
- 🟡 **`OQ-57` — Version gap and PBTB clone.** `1.12.0` is reserved for
  Persistency (not in the repo). `ARVIJ-535` (PBTB) is not reconciled, and
  this spec remains MY/PAMB. ◐ **Version-gap half resolved:** `1.12.0` is
  now filled by the Persistency addendum above. The PBTB half stays open.


---

# v1.14.0 addendum — ACTIVITY_RATIO drill-down alignment with ARVIJ-160 (Team)

**Source.** `ARVIJ-160` "[PAMB/PBTB] Metric Display (Drilldown) - Team -
Activity ratio", a downloaded Jira PDF export (4 pp., exported 22-Sep-2026,
Jira status **Backlog**, LBU PAMB, label Release1.1, parent ARVIJ-4). It was
supplied in the request and **not stored** in this repo, so there is no
SHA-256. The attached `Request for Sign Off - Sprint 2 _Drilldown
stories.eml` is referenced (p.4) but was **not read**. The clone `ARVIJ-536`
("[PBTB] …", Backlog) was **not reconciled**. Like v1.13.0, this is a
**Team-only** story: ACTIVITY_RATIO is `scopes: T` in the catalog.

**Evidence strength (same pattern as `OQ-52`/`OQ-58`).** The request that
produced this addendum said the story has no explicit sign-off sentence,
only UI/UX-alignment comments. **That is incorrect.** Page 4 carries a
01-Sep-2026 comment by Aritra Kabiraj: *"This user story was signed off on
19th Aug 2026, attaching the signoff email"*. The real gap is narrower, and
it is the same one v1.13.0 found. On 09-Sep-2026 Pramit Pal posted:
*"Following changes are made basis the UI/UX alignment on 3rd sept — 1.
Percentage Round up logic 2. Percentage to be shown. Requesting you to
re-signoff"*. On 10-Sep-2026 Loke Wee Wong replied: *"Acknowledge the
changes in green. please proceed. Irene PL Tan confirmed as well"*. Every
requirement this addendum **changes** (the % display and the round-up) is
green text that rests only on that 10-Sep acknowledgement. It is treated as
business approval under `source-evidence-policy.md` and flagged in L3
(`OQ-63`).

**What the story says.** AC4 asks for a chart from 0% to 100%. AC5 (chart
details) lists the current period ratio, the same period last year, the
change "as PERCENTAGE (%)" (green) and the as-on date. AC8 (KPI cards)
lists the current period, the previous year and "Activity Ratio Growth in
%" (green). AC5, AC8 and AC9 each add a green note: *"In case Change is in
absolute numbers then as well, it will be shown as (+/- %)"* and
*"Percentage change should follow round up logic. example: 23.4 should
round up to +/- 24%"*. The story strikes AC5's "Goal / Target Value", AC6
(Goal) and AC7 (Goal Not Available), and its description notes that goal
setting is out of R1.

## L1. New acceptance criteria

- **AC-P4-02-48** For ACTIVITY_RATIO (`scope=TEAM`), the change is shown **as
  a relative percentage on every surface**. The catalog `changeDisplay`
  flips `PP → PCT` (`mongodb.md` §4, D-24), so `DeltaVM.display = 'PCT'` on
  the detail comparison and on the dashboard card delta. `pct` is the
  **relative** change of the ratio, `(current − prior) / prior × 100`, and
  not the point difference. So 72.4% vs 61.8% is **+18%**, not +10.6pp or
  "+11%". **Decision provenance:** requester, 24-Sep-2026, answering this
  revision's impact question. The recommended "relative % growth" option was
  chosen over "PP value with a % glyph" and "keep PP, log OQ only". Grounds:
  AC9 ("Growth % … comparing the selected reporting period against the
  corresponding prior-year period"), AC8's "Growth in %", and the v1.13.0
  MANPOWER reading of the identical green note (`AC-P4-02-44`).
  `comparison.primary` realizes AC8's KPI set: **current period** ratio
  (`current`), **previous year** ratio (`prior`, same period last year) and
  the change (`change`, label `insights.comparison.activityRatioChange`,
  unchanged; AC5 calls it "Activity Ratio Change"). The directional
  indicator (AC10: up/down/neutral) is the existing `DeltaVM.direction`
  (`UP`/`DOWN`/`FLAT`), and its tone is `change.sentiment`
  (`HIGHER_IS_BETTER`, unchanged). **Supersedes** v1.1.0 A1's
  `comparison.primary`/ACTIVITY_RATIO cell ("✓ PP") and the v1.12.0 note that
  ACTIVITY_RATIO keeps a PP comparison. **Amends** `AC-P4-02-13` (its PP
  example no longer has a live S-P4-02 metric). **Cross-screen:** because
  `changeDisplay` is catalog-level, S-P4-01's Activity Ratio card delta
  becomes a % and S-P4-03's MoM header for ACTIVITY_RATIO becomes
  `insights.history.momPctChange` (widget-contracts §2). ARVIJ-160 AC12
  names "the Activity Ratio tile and drill-down page" together, which
  supports this scope. This revision does not bump S-P4-01/S-P4-03, and
  `AC-P4-03-10`'s "`pp` for ACTIVITY_RATIO" example is now stale (L3,
  `OQ-56`).
- **AC-P4-02-49** Every ACTIVITY_RATIO `DeltaVM.pct` follows the shared
  percent round-up rule **`R-PCT-ROUNDUP`** (`widget-contracts.md` §2).
  This addendum only opts in and does not restate the rule. The producer
  applies it to the exact, unrounded ratio values, and widgets render the
  integer as-is (ARVIJ-160 AC5/AC8/AC9: "23.4 should round up to +/- 24%").
  Canonical fixture: `metric-detail-activity-ratio.json`, 72.4 vs 61.8 =
  +17.15…% → `pct: 18`.

## L2. Confirmatory findings (no new AC)

- **0–100% chart (AC4).** Already specified: `threshold.primary` →
  `w.metric-detail.threshold-gauge` (`arc-180`, 0–100%, `PercentValue`
  0–100 scale), per v1.1.0 A1.
- **90% threshold marker, kept.** ARVIJ-160 does not mention a threshold.
  The catalog's `threshold ✓ (90 GTE)` (v1.1.0; `widget-contracts.md` §2;
  `AC-P4-02-15`) is **kept** by requester decision (24-Sep-2026). In this
  spec a threshold is not a goal (the catalog already has `goal ✗` and
  `threshold ✓`), and persistency kept its threshold under the same
  goal-out-of-R1 pattern (v1.12.0 K2). It is therefore not treated as
  removed by the struck "Goal / Target Value". Confirmation is logged as
  `OQ-64`. Gauge tone is still the threshold `sentiment`, independent of
  the change's sentiment: the fixture's 72.4% is below 90 (`NEGATIVE` arc)
  while its +18% change is `POSITIVE`.
- **No goal (AC5 bullet, AC6, AC7 struck; description note).** The catalog
  keeps `goal ✗`. This is consistent with MANPOWER (v1.13.0 J2), and there
  is no default-goal formula like `AC-P4-02-38`/`-41`.
- **As On Date (AC5).** `context.asOfDate` (traceability row 3; header per
  `AC-P4-02-22`).
- **Navigation, filters and Back (AC1–AC3, AC11).** Covered by existing tile
  navigation, dashboard-carried context (§3) and refetch on filter change.
  AC11's "targets" has no surface because there is no goal.
- **Team Type (AC12: AM Direct Unit + Group, UM Direct Unit).** Matches the
  existing `context.teamView` mechanism and P2/P3 gating
  (`AC-P4-02-10`/`-34`; D-14). Confirmatory, same as v1.9.0–v1.13.0.
- **Data unavailable (AC13).** `dataState=EMPTY` (`AC-P4-02-18`).

## L3. Open questions

- 🟡 **`OQ-63` — Evidence strength.** See the source note above. The changed
  requirements rest on a 10-Sep "acknowledge … please proceed", not a
  restated sign-off. The 19-Aug `.eml` was not read, and the Jira status is
  Backlog. This corrects the request's premise that there was no dated
  sign-off sentence. `ARVIJ-536` (PBTB) is not reconciled, so this spec
  remains MY/PAMB.
- 🟡 **`OQ-64` — 90% threshold not evidenced by ARVIJ-160.** Kept per L2.
  Product should confirm that the struck "Goal / Target Value" does not also
  cover the threshold marker. Owner: Product/UX.
- 🟡 **`OQ-65` — Story editorial inconsistencies**, each read as noted.
  - The Pre-condition still lists "Goal / Target Value" unstruck. Read as
    superseded by the description's R1 note and the struck AC5/AC6/AC7.
  - The label wording differs: "Activity Ratio Change" (AC5) vs "Activity
    Ratio Growth" (AC8). The existing single key `activityRatioChange` is
    kept. No copy change is authorized.
- **Extended, not new:**
  - `OQ-54` (previous-year value = 0) now also covers ACTIVITY_RATIO. A team
    whose ratio last year was 0% has an undefined relative change. Do not
    guess.
  - `OQ-56` (cross-screen reach and MoM rounding) now also covers
    ACTIVITY_RATIO's S-P4-01 card and S-P4-03 MoM header, including the
    stale `AC-P4-03-10` example.


---

# v1.15.0 addendum — PRODUCTIVITY drill-down alignment with ARVIJ-161 (Team)

**Source.** `ARVIJ-161` "[PAMB/PBTB] Metric Display (Drilldown) - Team -
Productivity" is a downloaded Jira PDF export: 5 pp., exported 22-Sep-2026,
Jira status **Backlog**, LBU PAMB, label Release1.1, parent ARVIJ-4. It was
supplied in the request and **not stored** in this repo, so there is no
SHA-256. The attached `Request for Sign Off - Sprint 2 _Drilldown
stories.eml` is referenced (p.5) but was **not read**. The clone `ARVIJ-537`
("[PBTB] …", Backlog) was **not reconciled**. Like v1.13.0 and v1.14.0, this
is a **Team-only** story: PRODUCTIVITY is `scopes: T` in the catalog.

**Evidence strength (same pattern as `OQ-52`/`OQ-63`).** Page 5 carries a
01-Sep-2026 comment by Aritra Kabiraj: *"This user story was signed off on
19th Aug 2026, attaching the signoff email"*. On 09-Sep-2026 Pramit Pal
posted: *"Following changes are made basis the UI/UX alignment on 3rd sept —
1. Percentage Round up logic 2. Percentage to be shown. Requesting you to
re-signoff"*. On 10-Sep-2026 Loke Wee Wong replied: *"Acknowledge the
changes in green. please proceed. Irene PL Tan confirmed as well"*. The
round-up rule and the green "(+/- %)" notes rest only on that 10-Sep
acknowledgement. The % display is slightly better evidenced than MANPOWER's,
because AC8's **unstruck, non-green** bullet already read "Productivity
Change %" at the 19-Aug sign-off. That same signed-off text also says
"absolute" (Pre-condition, AC9), and the green notes reconcile the two
(`OQ-68`). The evidence is treated as business approval under
`source-evidence-policy.md` and flagged as `OQ-67`.

**What the story says.**
- AC4 asks for a **Bar Chart** representing Productivity performance.
- AC5 (chart details) lists the current period, the same period last year,
  the change, the as-on date and a chart legend. It strikes "Goal / Target
  Value".
- AC8 (KPI cards) lists the current period, the previous year and
  "Productivity Change %".
- AC9 calculates the change as the "absolute difference" against the
  corresponding period of the previous year.
- AC5, AC8, AC9 and AC15 carry the green notes: *"In case Change is in
  absolute numbers then as well, it will be shown as (+/- %)"* and
  *"Percentage change should follow round up logic. example: 23.4 should
  round up to +/- 24%"*.
- AC6 (Goal) and AC7 (Goal Not Available) are struck, as is AC15's "Goal /
  Target Value". The description notes that goal setting is out of R1.

## M1. New acceptance criteria

- **AC-P4-02-50** For PRODUCTIVITY (`scope=TEAM`), the change is shown **as
  a relative percentage on every surface**. The catalog `changeDisplay` flips
  `ABS → PCT` (`mongodb.md` §4, D-25), so `DeltaVM.display = 'PCT'` on the
  detail comparison and on the dashboard card delta. `pct` is the
  **relative** change of the DECIMAL value, `(current − prior) / prior ×
  100`, **computed from** the absolute values (AC9's "absolute difference").
  The absolute figure itself is not displayed. So 9.7 vs 9.3 is **+5%**, not
  "+0.4". **Decision provenance:** requester, 24-Sep-2026, answering this
  revision's impact question. The recommended "relative %" option was chosen
  over "keep ABS, log OQ only" and "show ABS and % together" (the last would
  need a `DeltaVM` schema change). Grounds: AC8's "Productivity Change %",
  the green "(+/- %)" notes, the 09-Sep "Percentage to be shown" change, and
  the identical MANPOWER/ACTIVITY_RATIO readings (`AC-P4-02-44`/`-48`).
  `comparison.primary` realizes AC8's KPI set: **current period**
  productivity (`current`), **same period last year** (`prior`) and the
  change (`change`, label `insights.comparison.productivityChange`,
  unchanged). Both values stay `DecimalValue` and are formatted per
  `AC-P4-02-14`: the values carry no "%", only the delta does. The
  directional indicator (AC10: up/down/neutral) is the existing
  `DeltaVM.direction` (`UP`/`DOWN`/`FLAT`), and its tone is
  `change.sentiment` (`HIGHER_IS_BETTER`, unchanged). **Supersedes** v1.1.0
  A1's `comparison.primary`/PRODUCTIVITY cell ("✓ ABS +0.4"). **Amends**
  `AC-P4-02-13` (its "+0.4" ABS example no longer has a live S-P4-02 metric).
  **Cross-screen:** because `changeDisplay` is catalog-level, S-P4-01's
  Productivity card delta becomes a % and S-P4-03's MoM header for
  PRODUCTIVITY becomes `insights.history.momPctChange` (widget-contracts §2).
  ARVIJ-161 AC14 names "the Productivity tile and Productivity Drill Down
  page" together, which supports this scope. This revision does not bump
  S-P4-01/S-P4-03 (`OQ-56`, extended).
- **AC-P4-02-51** Every PRODUCTIVITY `DeltaVM.pct` follows the shared percent
  round-up rule **`R-PCT-ROUNDUP`** (`widget-contracts.md` §2). This addendum
  only opts in and does not restate the rule. The producer applies it to the
  exact, unrounded DECIMAL values, not the 1-dp display values, and widgets
  render the integer as-is (ARVIJ-161 AC5/AC8/AC9/AC15: "23.4 should round up
  to +/- 24%"). Canonical fixture: `metric-detail-productivity.json`, 9.7 vs
  9.3 = +4.30…% → `pct: 5`.

## M2. Confirmatory findings (no new AC)

- **No goal (AC5 bullet, AC6, AC7, AC15 bullet struck; description note).**
  The catalog keeps `goal ✗`, consistent with MANPOWER (v1.13.0 J2) and
  ACTIVITY_RATIO (v1.14.0 L2). There is no default-goal formula like
  `AC-P4-02-38`/`-41`, and `GaugeSectionVM` gains no goal field. AC7's struck
  "previous year's achieved Productivity" default is **not** adopted.
- **DECIMAL formatting.** The current and prior values keep `formatDecimal`
  with no unit suffix (`AC-P4-02-14`, `AC-P4-01-38`). The "%" belongs only to
  the change.
- **As On Date / Chart Legend (AC5).** As On Date is `context.asOfDate`
  (traceability row 3; header per `AC-P4-02-22`). No legend is specified
  here; it belongs to whichever chart `OQ-66` settles on.
- **Navigation, filters and Back (AC1–AC3, AC11, AC13).** Covered by
  existing tile navigation, dashboard-carried context (§3) and refetch on
  filter change. AC11's "target comparisons" has no surface because there is
  no goal.
- **Team Type (AC14/AC15: AM Direct Unit + Group, UM Direct Unit).** Matches
  the existing `context.teamView` mechanism and P2/P3 gating
  (`AC-P4-02-10`/`-34`; D-14). Confirmatory, same as v1.9.0–v1.14.0.
- **AI Insights (AC15).** S-P4-02 has no AI-insights section. The
  recommendations panel belongs to S-P4-01 (`RecommendationsPanelVM`) and
  already refetches on a `teamView` change. Nothing is added here (`OQ-68`).
- **Data unavailable (AC16).** `dataState=EMPTY` (`AC-P4-02-18`).

## M3. Open questions

- 🔴 **`OQ-66` — Chart-type conflict: bar chart vs gauge.** ARVIJ-161 AC4
  (unstruck, signed off 19-Aug) requires "a **Bar Chart** representing
  Productivity performance". The v1.1.0 A1 matrix places PRODUCTIVITY on
  `gauge.primary` → `w.metric-detail.gauge` (DECIMAL), and v1.5.0
  `AC-P4-02-23` leaves that standalone gauge on the unevidenced `donut-270`
  face. This is a different chart **type**, not a face variant. It is
  therefore **not** folded into the TPC/PTPC/FYP gauge-face question
  (v1.7.0 E2) or the CASE_COUNT stacked-segment question (v1.10.0). This
  revision does **not** switch the widget: `gauge.primary` stays, catalog
  `barComp ✗` is unchanged, and no `bars.primary` is emitted. A switch would
  most likely mean `bars.primary` → `w.metric-detail.bar-comparison` with a
  single PRODUCTIVITY measure across years, like NEW_RECRUIT_CONTRACTED. That
  would need:
  - a catalog capability change (`barComparison ✓`);
  - a `metric_snapshots.barComparison` series from the pipeline;
  - a DECIMAL `axisUnitCode`;
  - a decision on which years/periods the bars cover.

  None of that is evidenced. Product/UX must decide, and neither option may
  be picked silently. Owner: Product/UX.
- 🟡 **`OQ-67` — Evidence strength.** See the source note above. The
  round-up rule and the "(+/- %)" notes rest on a 10-Sep "acknowledge …
  please proceed", not a restated sign-off. The 19-Aug `.eml` was not read,
  and the Jira status is Backlog despite a 01-Sep "transition into
  Development" automation comment. `ARVIJ-537` (PBTB) is not reconciled, so
  this spec remains MY/PAMB.
- 🟡 **`OQ-68` — Story editorial inconsistencies**, each read as noted.
  - The Pre-condition still lists "Goal / Target Value" unstruck. Read as
    superseded by the description's R1 note and the struck AC5/AC6/AC7/AC15
    bullets.
  - The Pre-condition's "Productivity Change in absolute value" and AC9's
    "absolute difference" are read as the **input** to the %, per the green
    notes (`AC-P4-02-50`), not as an absolute display.
  - AC15 lists "AI Insights" among the refreshed items. This screen has no
    such section (M2).
  - AC14's Team Type bullets are flattened (AM Access / Direct Unit / Group /
    UM Access / Direct Unit). Read as AM = Direct Unit + Group and UM =
    Direct Unit, as in every other Team story.
- **Extended, not new:**
  - `OQ-54` (previous-year value = 0) now also covers PRODUCTIVITY. A team
    whose productivity last year was 0 (for example a new unit) has an
    undefined relative change. Do not guess.
  - `OQ-55` (AC12 "summary" for Insurance / Takaful / Both) now also covers
    ARVIJ-161 AC12/AC13. Read as the existing filter-driven value, not a new
    three-row section.
  - `OQ-56` (cross-screen reach and MoM rounding) now also covers
    PRODUCTIVITY's S-P4-01 card and S-P4-03 MoM header. `AC-P4-01-38` (no
    "%" on the value) is unaffected, because it concerns the value, not the
    delta.


---

# v1.16.0 addendum — AVERAGE_CASE_SIZE drill-down alignment with ARVIJ-162 (Team)

**Source.** `ARVIJ-162` "[PAMB/PBTB] Metric Display (Drilldown) - Team -
Average case size" is a downloaded Jira PDF export: 5 pp., exported
22-Sep-2026, Jira status **Backlog**, LBU PAMB, label Release1.1, parent
ARVIJ-4. It was supplied in the request and **not stored** in this repo, so
there is no SHA-256. The attached `Request for Sign Off - Sprint 2
_Drilldown stories.eml` is referenced (p.5) but was **not read**. The clone
`ARVIJ-538` ("[PBTB] …", Backlog) was **not reconciled**. Like v1.13.0–v1.15.0,
this is a **Team-only** story: AVERAGE_CASE_SIZE is `scopes: T` in the
catalog.

**Evidence strength (same caveat as MANPOWER, `OQ-52`).** Page 5 carries a
01-Sep-2026 comment by Aritra Kabiraj: *"This user story was signed off on
19th Aug 2026, attaching the signoff email"*. On 09-Sep-2026 Pramit Pal
posted: *"Following changes are made basis the UI/UX alignment on 3rd sept —
1. Percentage Round up logic 2. percentage to be shown. Requesting you to
re-signoff"*. On 10-Sep-2026 at 2:47 PM Loke Wee Wong replied: *"Acknowledge
the changes in green. please proceed. Irene PL Tan confirmed as well"*.
Unlike ARVIJ-161, where AC8's "Productivity Change %" was already in the
signed text, ARVIJ-162's signed text said the opposite: AC8 read "Average
Case Size Change as **absolute value**", and that phrase is now struck and
replaced by green "percentage". So, as with MANPOWER, **every requirement
this addendum changes** (the % display and the round-up) rests only on the
10-Sep acknowledgement. It is treated as business approval under
`source-evidence-policy.md` and flagged as `OQ-69`.

**The Goal/Target thread (p.5).** At 2:49 PM on 10-Sep-2026, two minutes
after the acknowledgement above, Loke Wee Wong asked: *"Why goal/target
value was removed in AC5, but it is available under AC15?"* At 6:00 PM
Shreya Jain replied: *"its now updated, was not saved before."* In the
22-Sep export, the "Goal / Target Value" bullet is rendered **struck
through** in AC15 (p.4) as well as in the Pre-condition (p.1) and AC5
(p.2), and AC6 and AC7 are struck whole (pp.2–3). The exported story is
therefore **not** internally inconsistent on goal. The request that
produced this addendum said AC15 still lists the goal; that describes the
text Loke Wee Wong queried, not the exported text. What the thread leaves
open is narrower: the AC15 strike was saved **after** the 2:47 PM
acknowledgement, and the thread records no re-acknowledgement of it. This
is logged as `OQ-70`, quoting the thread, with no inference about intent.
It has no behavioral effect: the catalog is already `goal ✗`.

**What the story says.**
- AC4 asks for a **Bar Chart** representing Average Case Size performance.
- AC5 (chart details) lists the current period, the same period last year,
  the change "to be shown in percentage" (green), the as-on date and a chart
  legend. It strikes "Goal / Target Value".
- AC8 (KPI cards) lists the current period, the same period last year, and
  the change "as ~~absolute value~~ percentage" (green).
- AC9 calculates the change against the corresponding period of the
  previous year "in absolute value".
- AC5, AC8 and AC15 carry the green notes: *"In case Change is in absolute
  numbers then as well, it will be shown as (+/- %)"* (AC5: "… shown as
  %") and *"Percentage change should follow round up logic. example: 23.4
  should round up to +24%"*.
- AC6 (Goal) and AC7 (Goal Not Available) are struck, as are the
  Pre-condition's, AC5's and AC15's "Goal / Target Value" bullets. The
  description notes that goal setting is out of R1.

## N1. New acceptance criteria

- **AC-P4-02-52** For AVERAGE_CASE_SIZE (`scope=TEAM`), the change is shown
  **as a relative percentage on every surface**. The catalog `changeDisplay`
  flips `ABS → PCT` (`mongodb.md` §4, D-26), so `DeltaVM.display = 'PCT'` on
  the detail comparison and on the dashboard card delta. `pct` is the
  **relative** change of the MONEY value, `(current − prior) / prior × 100`,
  **computed from** the absolute amounts (AC9's "in absolute value"). The
  absolute figure itself is not displayed. So RM 5,200 vs RM 4,800 is
  **+9%**, not "+RM 400". **Decision provenance:** requester, 24-Sep-2026,
  answering this revision's impact question. The recommended "relative %"
  option was chosen over "keep ABS, log OQ only". Grounds: AC8's green
  "percentage", AC5/AC15's green "shown in percentage", the green "(+/- %)"
  notes, the 09-Sep "percentage to be shown" change, and the identical
  MANPOWER/ACTIVITY_RATIO/PRODUCTIVITY readings (`AC-P4-02-44`/`-48`/`-50`).
  `comparison.primary` realizes AC8's KPI set: **current period** average
  case size (`current`), **same period last year** (`prior`) and the change
  (`change`). Both values stay `MoneyValue` and format via `formatMoney`
  (AGENTS.md §3; abbreviation is still blocked by README `OQ-25`); only the
  delta carries "%". *(Amended by v1.17.0, `AC-P4-02-54`: both values now
  render compact with no currency prefix; the delta is unchanged.)* **Label:** the change row label moves from
  `insights.comparison.absoluteChange` ("Absolute Change", which would now
  contradict the % value) to the new key
  **`insights.comparison.averageCaseSizeChange`** = "Average Case Size
  Change", the story's own wording in AC5, AC8 and AC15 (requester decision,
  24-Sep-2026; the same per-metric pattern as `productivityChange`).
  `absoluteChange` is kept as a reserved key with no emitting metric (the
  same precedent as `persistencyChange`). The directional indicator (AC10:
  up/down/neutral) is the existing `DeltaVM.direction` (`UP`/`DOWN`/`FLAT`),
  and its tone is `change.sentiment` (`HIGHER_IS_BETTER`, unchanged).
  **Supersedes** v1.1.0 A1's `comparison.primary`/AVERAGE_CASE_SIZE cell
  ("✓ ABS +RM 20,000", label `absoluteChange`). **Amends** `AC-P4-02-13`
  (its "+RM 20,000" ABS example no longer has a live S-P4-02 metric; only
  NEW_RECRUIT_CONTRACTED's "+7" remains ABS). **Cross-screen:** because
  `changeDisplay` is catalog-level, S-P4-01's Average Case Size card delta
  becomes a % and S-P4-03's MoM header for AVERAGE_CASE_SIZE becomes
  `insights.history.momPctChange` (widget-contracts §2). ARVIJ-162 AC14
  names "the Average Case Size tile and Average Case Size Drill Down page"
  together, which supports this scope. This revision does not bump
  S-P4-01/S-P4-03 (`OQ-56`, extended).
- **AC-P4-02-53** Every AVERAGE_CASE_SIZE `DeltaVM.pct` follows the shared
  percent round-up rule **`R-PCT-ROUNDUP`** (`widget-contracts.md` §2,
  defined in v1.13.0). This addendum only opts in and does not restate the
  rule. The producer applies it to the exact decimal-string MONEY amounts
  (never `parseFloat`), and widgets render the integer as-is (ARVIJ-162
  AC5/AC8/AC15: "23.4 should round up to +24%"). Canonical fixture:
  `metric-detail-average-case-size.json`, RM 5,200.00 vs RM 4,800.00 =
  +8.33…% → `pct: 9` (half-up rounding would give 8).

## N2. Confirmatory findings (no new AC)

- **No goal (Pre-condition, AC5 and AC15 bullets, AC6, AC7 struck;
  description note).** The catalog keeps `goal ✗`, consistent with MANPOWER
  (v1.13.0 J2), ACTIVITY_RATIO (v1.14.0 L2) and PRODUCTIVITY (v1.15.0 M2).
  There is no default-goal formula like `AC-P4-02-38`/`-41`, and
  `GaugeSectionVM` gains no goal field. AC7's struck "Previous year's
  achieved Average Case Size" default is **not** adopted. See `OQ-70` for
  the thread's timing question.
- **MONEY formatting.** The gauge value and the current and prior values
  keep `formatMoney` with no penders (v1.1.0 A1). The "%" belongs only to
  the change. *(Amended by v1.17.0, `AC-P4-02-54`: these values now render
  compact, e.g. "5.2K", with no currency prefix.)*
- **As On Date / Chart Legend (AC5).** As On Date is `context.asOfDate`
  (traceability row 3; header per `AC-P4-02-22`). No legend is specified
  here; it belongs to whichever chart `OQ-66` settles on.
- **Navigation, filters and Back (AC1–AC3, AC11, AC13).** Covered by
  existing tile navigation, dashboard-carried context (§3) and refetch on
  filter change. AC11's "target comparisons" has no surface because there is
  no goal.
- **Team Type (AC14/AC15: AM Direct Unit + Group, UM Direct Unit).** Matches
  the existing `context.teamView` mechanism and P2/P3 gating
  (`AC-P4-02-10`/`-34`; D-14). Confirmatory, same as v1.9.0–v1.15.0. Unlike
  ARVIJ-161, AC15 lists no "AI Insights".
- **Data unavailable (AC16).** `dataState=EMPTY` (`AC-P4-02-18`).

## N3. Open questions

- 🔴 **`OQ-66` (extended) — Chart-type conflict: bar chart vs gauge.**
  ARVIJ-162 AC4 (unstruck, signed off 19-Aug) requires "a **Bar Chart**
  representing Average Case Size performance". The v1.1.0 A1 matrix places
  AVERAGE_CASE_SIZE on `gauge.primary` → `w.metric-detail.gauge` (MONEY, no
  penders) on the unevidenced standalone `donut-270` face. **This is the
  same root conflict as PRODUCTIVITY's, not a separate one** (requester
  decision, 24-Sep-2026): both metrics are Team-only single-value MAPA
  metrics on the same standalone gauge, both have catalog `barComp ✗`, both
  stories come from the same Sprint-2 drill-down sign-off batch, and their
  AC4 wording is identical apart from the metric name. One product/UX
  ruling should therefore cover both. The only per-metric difference is in
  the consequences of a switch: for AVERAGE_CASE_SIZE a `bars.primary`
  would also need a **MONEY** `axisUnitCode` (today only `AGENTS` exists)
  and would depend on money abbreviation on the axis and bar labels (README
  `OQ-25`, blocking). This revision does **not** switch the widget:
  `gauge.primary` stays, `barComp ✗` is unchanged, and no `bars.primary` is
  emitted. Owner: Product/UX.
- 🟡 **`OQ-69` — Evidence strength.** See the source note above. The % display
  and the round-up rest only on the 10-Sep "acknowledge … please proceed",
  because the signed 19-Aug AC8 text said "absolute value" (the MANPOWER
  pattern, `OQ-52`, not the stronger PRODUCTIVITY one, `OQ-67`). The 19-Aug
  `.eml` was not read, and the Jira status is Backlog despite a 01-Sep
  "transition into Development" automation comment. `ARVIJ-538` (PBTB) is
  not reconciled, so this spec remains MY/PAMB.
- 🟡 **`OQ-70` — AC15 Goal/Target strike saved after the acknowledgement.**
  Sourced verbatim from the p.5 thread: Loke Wee Wong, 10-Sep 2:49 PM, *"Why
  goal/target value was removed in AC5, but it is available under AC15?"*;
  Shreya Jain, 10-Sep 6:00 PM, *"its now updated, was not saved before."*
  The 22-Sep export shows AC15's bullet struck (p.4). The strike post-dates
  Loke Wee Wong's 2:47 PM acknowledgement, and no later acknowledgement of
  it is recorded. This spec does **not** infer which way business intended;
  it records only that the exported text and the catalog (`goal ✗`) agree.
  Business (Loke Wee Wong / Irene PL Tan) should confirm the updated AC15.
  Non-blocking. Owner: BA (Aritra Kabiraj / Pramit Pal).
- 🟡 **`OQ-71` — Story editorial inconsistencies**, each read as noted.
  - The Pre-condition's "Average Case Size Change in absolute value" and
    AC9's "in absolute value" are read as the **input** to the %, per the
    green notes (`AC-P4-02-52`), not as an absolute display.
  - AC5's green note ends "shown as %", while AC8 and AC15 read "(+/- %)".
    Read as the same signed-percentage rule.
  - AC11 still mentions "target comparisons". There is no goal, so this has
    no surface.
  - AC14's Team Type bullets are flattened (AM Access / Direct Unit / Group /
    UM Access / Direct Unit). Read as AM = Direct Unit + Group and UM =
    Direct Unit, as in every other Team story.
- **Extended, not new:**
  - `OQ-54` (previous-year value = 0) now also covers AVERAGE_CASE_SIZE. A
    team with no cases in the prior-year period has no prior average case
    size, so the relative change is undefined. Do not guess.
  - `OQ-55` (AC12 "summary" for Insurance / Takaful / Both) now also covers
    ARVIJ-162 AC12/AC13. Read as the existing filter-driven value, not a new
    three-row section.
  - `OQ-56` (cross-screen reach and MoM rounding) now also covers
    AVERAGE_CASE_SIZE's S-P4-01 card and S-P4-03 MoM header.


---

# v1.17.0 addendum — compact MONEY values for TPC, PTPC, FYC, FYP and AVERAGE_CASE_SIZE (MY)

**Source.** A direct requester instruction, 2026-09-25, resolving README
`OQ-25` for this screen and these five metrics only. The instruction cites a
requester screenshot of the TPC detail screen ("960K", "800K", "120K",
"980K"; breakdown rows in full, e.g. "24,690"). The screenshot was **not
received** with the request, so it is not stored here and has no SHA-256.
Every value below comes from the written instruction, not from the image.
The instruction deliberately departs from the screenshot on one point: the
breakdown product rows are compact too (24,690 → "24.7K").

**What changes.** Before v1.17.0, every MONEY value on this screen used
`formatMoney` (D-04), and `OQ-25`'s S-P4-01 resolution explicitly left
Metric Detail out. This revision extends that resolution to five metrics on
this screen. It **reuses** the existing compact rule
(`R-MONEY-COMPACT`, `widget-contracts.md` §2) with no new formatter. It
supersedes the v1.4.0 "no abbreviation" ruling for these five metrics only.
There is no C1/C2/C3/C4 shape change, no new i18n key and no fixture change.
The UI chooses the format from `context.metricCode`, because no VM field
carries it.

## O1. New acceptance criteria

- **AC-P4-02-54** For `context.metricCode` ∈ {`TPC`, `PTPC`, `FYC`, `FYP`,
  `AVERAGE_CASE_SIZE`}, at every scope and breakpoint, **every MONEY value**
  on this screen renders in `R-MONEY-COMPACT` form with **no currency
  prefix**:
  below 1,000 = plain integer; 1,000+ = "{n}K"; 1,000,000+ = "{n}M"; one
  decimal, round half-up, trailing ".0" dropped. That covers:
  1. `GaugeSectionVM.collected` on the gauge (e.g. "960K");
  2. `GaugeSectionVM.penders` when the gauge renders it as a money line
     (FYP, FYC; AVERAGE_CASE_SIZE when present, although the catalog emits
     no penders for it today);
  3. `ComparisonSectionVM.current` (e.g. "960K");
  4. `ComparisonSectionVM.prior` (e.g. "800K");
  5. `VariantValueSectionVM.value` on `variant.with-repricing` (e.g. "120K");
  6. `BreakdownSectionVM.totals[].value`, the Total row (e.g. "980K"), in
     both the Without Repricing and With Repricing tables;
  7. every `BreakdownSectionVM.rows[].cells[].value` in both tables,
     including FYP's `UNIT_TRUST`/`GROUP_PREMIUM` rows (e.g. 24,690 →
     "24.7K"). — **Superseded by v1.18.0 (`AC-P4-02-55`)**: product rows
     show the plain value without K/M ("24,690"). Only the Total (item 6)
     stays compact.

  Canonical fixture `metric-detail-tpc.json` therefore renders collected
  "100K", penders "30K" wherever a gauge shows it, current "100K", prior
  "78.7K", with repricing "120K", and Without Repricing rows "15.3K" /
  "18K" / "17.5K" / "25K" / "4.3K" with Total "80.1K". *(Rows superseded
  by v1.18.0: "15,345" / "18,000" / "17,507" / "25,000" / "4,250.70"; the
  Total stays "80.1K".)*

  **Unchanged:** the delta line (`DeltaVM.display`, e.g. "+11.4% vs last
  year"), COUNT values (e.g. the TEAM penders card's "6 Cases"), the
  `weightPct` suffix (`AC-P4-02-06`), and every other metric's MONEY values,
  which keep `formatMoney`. `AC-P4-02-05`'s "Total equals the column sum" is
  a statement about the `MoneyValue` amounts. The compact strings may not
  add up, and the UI must never re-sum or adjust them. **Decision
  provenance:** requester, 2026-09-25 (scope, prefix, algorithm and the
  breakdown-row departure from the screenshot).

## O2. Confirmatory findings (no new AC)

- **Reuse.** `REUSE_AS_IS` of the algorithm already shipped for
  `w.metric.card` (S-P4-01 `AC-P4-01-81`) and implemented in the Web app
  as `formatMoneyCompact`. It is now written once as `R-MONEY-COMPACT` in
  `widget-contracts.md` §2. The S-P4-01 wording is unchanged.
- **Gauge face.** The Web app renders a value-only face with a penders money
  line for FYP/FYC/AVERAGE_CASE_SIZE. The v1.5.0 `AC-P4-02-23` note says a
  standalone gauge keeps `donut-270`. This existing spec/code drift is not
  resolved here. `AC-P4-02-54` applies to the gauge's MONEY values on
  whichever face renders.
- **`OQ-66`.** A MONEY bar chart for AVERAGE_CASE_SIZE would also need axis
  labels. Axis labels are not covered by this AC, and `OQ-66` is unchanged.

## O3. Open questions

- 🟡 **`OQ-72` — "Credit Points" label suffix.** The requester's TPC
  screenshot shows "Credit Points" with no "(10%)". But
  `metric-detail-tpc.json` has `CREDIT_POINTS` `weightPct: 10`, and
  `AC-P4-02-06` renders "(10%)" whenever `weightPct = 10`. Possible
  answers: (a) the fixture and producer drop `weightPct` for TPC/PTPC
  `CREDIT_POINTS`, whose value comes from `AC-P4-02-33`'s formula; (b) the screenshot is a mockup artifact, and "(10%)" stays;
  (c) the UI suppresses the suffix for this product. Not decided here.
  Current behavior stays (`AC-P4-02-06`, "(10%)" shown). Non-blocking for
  `AC-P4-02-54`. Owner: Product/BA with Data (`OQ-PA-17`, product weighting).


---

# v1.18.0 addendum — breakdown product rows show plain values (MY)

**Source.** A direct requester instruction, 2026-09-25, reviewing the
v1.17.0 layout: *"the breakdown by product the values has to be displayed
only values. Only total will be having K/M"*. This matches the requester
screenshot cited in v1.17.0 ("24,690"), which v1.17.0 had deliberately
overridden. The screenshot is still not received.

**What changes.** `AC-P4-02-54` item 7 (breakdown product rows compact) is
superseded. Every other `AC-P4-02-54` item stays, including item 6 (the
Total row is compact). No C1–C4 shape, copy or fixture change.

## P1. New acceptance criteria

- **AC-P4-02-55** For `context.metricCode` ∈ {`TPC`, `PTPC`, `FYC`, `FYP`,
  `AVERAGE_CASE_SIZE`}, every breakdown **product row** value
  (`BreakdownSectionVM.rows[].cells[].value`), in both the Without Repricing
  and With Repricing tables, renders as the **plain value**: the
  `formatMoney` digits with **no currency prefix** and **no K/M
  abbreviation**. Thousands separators and `formatMoney`'s existing cents
  rule (".00" dropped, other cents kept) are unchanged. So 24,690 →
  "24,690", and `metric-detail-tpc.json` renders "15,345" / "18,000" /
  "17,507" / "25,000" / "4,250.70". The **Total** row in the same table
  stays compact per `AC-P4-02-54` item 6 ("80.1K"). The `weightPct` suffix
  is unchanged (`AC-P4-02-06`, `OQ-72`). Other metrics keep `formatMoney`
  with the prefix. **Supersedes** `AC-P4-02-54` item 7. **Decision
  provenance:** requester, 2026-09-25. Reading "only values" as "no prefix,
  no abbreviation, existing cents rule" is this revision's interpretation;
  see `OQ-73`.

## P2. Open questions

- 🟡 **`OQ-73` — Cents on breakdown rows.** The instruction and screenshot
  show whole numbers ("24,690"), but fixture amounts can carry cents
  (`CREDIT_POINTS` 4,250.70). `AC-P4-02-55` keeps `formatMoney`'s existing
  rule ("4,250.70"). Rounding rows to whole numbers would be a new rule and
  is not adopted without a decision. Non-blocking. Owner: requester/Product.


---

# v1.19.0 addendum — Penders card "{count} Cases" link face and optional `nav` (MY)

**Source.** A direct requester instruction with an attached screenshot,
2026-09-25 (`/update-spec S-P4-02`). The screenshot shows the Penders card:
"Penders" on the left, and "6 Cases" in blue link text with a trailing
external-link glyph (a square with an outgoing arrow) on the right. It was
received in the session (353×66 px PNG, SHA-256
`d929887d091f83e0b70181512fd9df479c77124fce2d43458147b601a955ebef`) and is
**not stored** in this repo. Sampled colours: text `#1D4ED8`, and `#3B82F6`
on the icon's thin strokes (read as anti-aliasing of the same colour, not a
second token).

**Requester decisions (2026-09-25):**
- Scope is **TPC/PTPC only**. CASE_COUNT's Team Penders card (`AC-P4-02-37`)
  keeps its bare count.
- The link colour is the **screenshot-sampled** hex, recorded as unapproved.
- The icon is the Remix `external-link-line` substitute, pending UX approval.
- The link target is an **optional placeholder** `nav`. The BFF omits it
  until `OQ-30` is answered.
- Singular "1 Cases" is logged as an open question, not solved here.

**What changes.** C3 1.7.0 adds `PendersSectionVM.nav?: RouteRef`, a
backward-compatible optional field. Also added: the copy key
`insights.detail.pendersCases`, the asset `icon.external-link-line` and the
widget-contracts §2 `color.link` token. There is no C1/C2/C4 change, no
backend emission change and no fixture change: no spec fixture carries a
`PENDERS` section, and the Team TPC card's "6" comes from the pa-be-dev stub.
Resolves README `OQ-31`. `OQ-30` stays open.

## Q1. New acceptance criteria

- **AC-P4-02-56** For `context.metricCode` ∈ {`TPC`, `PTPC`}, the
  `w.metric-detail.penders` card (emitted at `scope=TEAM` only,
  `AC-P4-02-32`) keeps "Penders" (`insights.detail.penders`) on the left.
  On the right, its COUNT value renders as `insights.detail.pendersCases`
  with `{count}` = `formatCount(value)` (e.g. "6 Cases"), followed by
  `icon.external-link-line`. Text and icon both use `color.link`
  (widget-contracts §2) and sit right-aligned on one baseline. The icon is
  ≈16px with a ≈4px gap (requester instruction, unmeasured; `OQ-76`). The
  icon is decorative (`aria-hidden`). This face renders **whether or not**
  `nav` is present. CASE_COUNT and any other metric keep the bare
  `formatScalar` count. **Amends** `AC-P4-02-26` (unit and link face).
  **Decision provenance:** requester, 2026-09-25.
- **AC-P4-02-57** The Penders value is navigable **only** when
  `PendersSectionVM.nav` is present:
  - `nav` present ⇒ the value text and icon form one link to `href(nav)`,
    whose accessible name is the "{count} Cases" text.
  - `nav` absent ⇒ a plain element with no `href`, no link role, and not
    focusable or clickable. The look is unchanged.

  While `OQ-30` is open, the BFF MUST omit `nav`, so production renders the
  non-interactive case. The UI must not synthesize a route. **Decision
  provenance:** requester, 2026-09-25 (placeholder link option).

## Q2. Confirmatory findings (no new AC)

- `GaugeSectionVM.penders` (the SELF money penders inside the gauge) is
  unchanged.
- `AC-P4-02-54`/`-55` formatting is unchanged. COUNT values are never
  compact.
- `AC-P4-02-27` desktop pairing with `variant.with-repricing` is unchanged.
- `RouteRef` is reused unchanged, following the existing
  `MilestoneCardVM.nav` pattern.

## Q3. Open questions

- 🔴 **`OQ-30` (unchanged) — Penders link destination.** The Activity
  Management Proposal-screen route is still unconfirmed. `nav` stays omitted
  until it is. Owner: Product/UX. Blocks only the navigable case of
  `AC-P4-02-57`.
- 🟡 **`OQ-74` — Singular "Cases".** A count of 1 renders "1 Cases". The
  bundle has no plural convention. Options: a singular key used at
  count = 1, or ICU plural support. Non-blocking. Owner: Product/Content.
- 🟡 **`OQ-75` — `color.link` approval.** `#1D4ED8` is sampled from a
  screenshot and is not a DLS-approved token. Replace it once the DLS link
  token is known. Non-blocking for build; blocks a pixel-perfect claim.
  Owner: UX/DLS.
- 🟡 **`OQ-76` — Icon source and size.** `icon.external-link-line` is an
  open-source substitute with no Figma node. The requester said ≈16px icon
  and ≈4px gap, but the screenshot measures ≈12px and ≈8px at an unknown
  scale. Needs a Figma export and measured values. Non-blocking. Owner: UX.

---

# v1.20.0 addendum — TPC/PTPC Penders card at Self and Team scope, all personas (MY)

**Source.** A direct requester instruction, 2026-09-25 (`/update-spec S-P4-02`):
"the Penders card in TPC and PTPC has to be displayed for all the personas,
Self and Team view."

**Requester decisions (2026-09-25):**
- Scope is **TPC/PTPC only**. CASE_COUNT Self keeps **no** Penders exposure
  at all (`AC-P4-02-37`, unchanged). FYP never emits a Penders card
  (`AC-P4-02-39`, unchanged).
- "All personas" means every persona that can open the TPC/PTPC detail: the
  P4 agent (Self), and the P3 leader and P2 leader (Self, plus Team within
  the existing `teamView` gating: P3 `DIRECT`, P2 `DIRECT`/`GROUP`,
  `AC-P4-02-34`). No gating rule (INS-4031/4032) changes.
- The Self card uses the **same** card, face and link behaviour as Team
  (`AC-P4-02-26`/`-27`/`-56`/`-57`). No new copy, token or asset.

**What changes.** The domain now fills `values.pendersCaseCount` at
`scope=SELF` for TPC/PTPC, so the BFF's existing `penders.primary` builder
emits the section there too. There is no C1/C3/C4 shape change: the field
and `PendersSectionVM` already exist. `sectionOrder` is unchanged, so
TPC/PTPC Self gains `PENDERS` directly after `VARIANT_VALUE`, and the
`AC-P4-02-27` desktop pairing now applies at Self as well.

## R1. New acceptance criteria

- **AC-P4-02-58** For `context.metricCode` ∈ {`TPC`, `PTPC`}, the
  `penders.primary` section (`w.metric-detail.penders`) is emitted at
  **both** `scope=SELF` and `scope=TEAM`, whenever `dataState=OK`, for every
  persona allowed to view that scope. `value.kind=COUNT`:
  - `scope=SELF`: the viewing agent's **own** Penders case count.
  - `scope=TEAM`: unchanged. The sum of all agents' Penders cases in the
    selected `teamView` unit.

  The value is never derived from the MONEY `GaugeSectionVM.penders`, which
  stays unchanged at both scopes (and stays hidden by the value-only face,
  `AC-P4-02-23`). The card renders the `AC-P4-02-56` "{count} Cases" link
  face at both scopes, and `nav` stays omitted while `OQ-30` is open
  (`AC-P4-02-57`). **Supersedes** the Self half of `AC-P4-02-31` ("with no
  Penders element") and the "`scope=SELF` … never its own section/card" and
  TEAM-only wording of `AC-P4-02-32`. `AC-P4-02-37` and `AC-P4-02-39` are
  **not** amended. **Decision provenance:** requester, 2026-09-25.
- **AC-P4-02-59** Resulting TPC/PTPC `sections[]` type order at `scope=SELF`
  with full data: `GAUGE`, `COMPARISON`, `VARIANT_VALUE`, `PENDERS`,
  `BREAKDOWN`, `BREAKDOWN`. This is identical to `scope=TEAM`. At
  `breakpoint.desktop`, `VARIANT_VALUE` + `PENDERS` share one row
  (`AC-P4-02-27`). Below it, they stack.

## R2. Open questions

- 🟡 **`OQ-77` — Self Penders case-count source.** No pipeline fills
  `values.pendersCaseCount` yet, at either scope (`mongodb.md` D-19).
  pa-be-dev keeps the interim mock and adds a `SELF` entry. Non-blocking for
  build, blocking for production truth. Owner: Data/Pipeline.
- 🟡 **`OQ-78` — Self link destination.** Is the Self card's eventual `nav`
  the same Activity Management Proposal screen as Team, filtered to the
  agent's own cases? Folds into `OQ-30`. Owner: Product/UX.

---

# v1.21.0 addendum — header context strip and breakdown-table header simplification (MY)

**Source.** A direct requester instruction, 2026-09-26 (`/update-spec S-P4-02`),
with a requester-supplied ASCII layout of the TPC/PTPC desktop page. There is
no Figma export or screenshot, so it is tracked under the existing "Strict UX
source approval is incomplete" blocker. Compared with the shipped v1.20.0
layout, the ASCII layout differs in three places: no Direct/Group tag, a
Product pill reading "Both", and breakdown tables with no header row.
Everything else in it matches the current contract.

**Requester decisions (2026-09-26):**
- Scope is the **whole S-P4-02 screen**, every metric, not only TPC/PTPC.
- The Direct/Group tag is removed at **every** scope, Team included.
- The breakdown header row is **visually hidden but kept for screen readers**
  (recommended option, accepted), so no accessibility open question is raised.

**What changes.** Display only. There is no C1/C2/C3/C4 shape change:
`MetricDetailVM.context.teamView` stays and the BFF keeps emitting it at
`scope=TEAM`. There is no copy change, since both `insights.businessLine.ALL`
and `.ALL.chip` already exist, and no fixture change. `insights.businessLine.ALL.chip`
loses its only consumer (S-P4-01 does not use it) and is kept as a reserved
key. widget-contracts 1.5.0.

## S1. New acceptance criteria

- **AC-P4-02-60** The Metric Detail context strip renders **no teamView
  chip** (`insights.teamView.{DIRECT|GROUP}`) at any scope or persona. At
  `scope=TEAM`, `context.teamView` is still present in the VM, still reflects
  the dashboard toggle at entry, and still selects the Direct/Group data
  (`AC-P4-02-34`, D-14). Only its on-screen chip is removed. The context strip
  is exactly the Product pill followed by the Time pill. **Supersedes**
  `AC-P4-02-10`. **Amends** `AC-P4-02-22` ("its chip still renders first")
  and §2 row 14. **Decision provenance:** requester, 2026-09-26.
- **AC-P4-02-61** The Product context pill (`w.detail.context-pill`,
  label `insights.dashboard.filter.product`) renders its value as
  `insights.businessLine.{context.businessLine}` for every value. So `ALL` reads
  **"Both"**, and `INSURANCE`/`TAKAFUL` are unchanged ("Insurance"/"Takaful").
  `insights.businessLine.ALL.chip` ("Insurance + Takaful") is no longer used
  on this screen. **Amends** `AC-P4-02-22` and §2 row 2. **Decision
  provenance:** requester, 2026-09-26.
- **AC-P4-02-62** Every `w.metric-detail.breakdown-table` (TPC, PTPC and FYP;
  both variants) renders **no visible column-header row**. The product rows
  start directly under the card's variant heading (`AC-P4-02-30`). The header
  row ("Product" `insights.detail.product` + the business-line label
  `insights.businessLine.{column}`) stays in the table as real column headers,
  **visually hidden**, so assistive technology still names both columns. The
  one-column rule, row set, `weightPct` suffix (`AC-P4-02-06`), plain row values
  (`AC-P4-02-55`), compact Total (`AC-P4-02-54`), shared "Breakdown by Product"
  heading and desktop pairing (`AC-P4-02-29`/`-30`) are unchanged. The
  business line is conveyed visually only by the Product pill
  (`AC-P4-02-61`). **Amends** `AC-P4-02-35` (header text only) and §2 row 13.
  **Decision provenance:** requester, 2026-09-26.

## S2. Confirmatory findings (no new AC)

- The ASCII layout confirms, unchanged: the back row with the as-of date and
  the page title below it (`AC-P4-02-22`); the value-only combined card with
  the "{period} Comparison" half (`AC-P4-02-21`/`-23`/`-24`/`-25`/`-28`); the
  With Repricing + Penders desktop pair with the "{count} Cases" link face
  (`AC-P4-02-27`/`-56`–`-59`); the shared breakdown heading and pairing
  (`AC-P4-02-29`/`-30`); and money formatting (`AC-P4-02-54`/`-55`).
- Below `breakpoint.desktop` the same content stacks in one column; no new
  responsive rule.
- Entitlement is unchanged: removing the chip does not change which personas
  may open Team or Group (D-14, INS-4031/4032).

## S3. Open questions

- None new. The existing "Strict UX source approval is incomplete" blocker
  covers the ASCII-only evidence. The v1.8.0 open question about a
  single-column breakdown baseline now also covers the header-less face.
