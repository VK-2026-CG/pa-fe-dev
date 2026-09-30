# Metric Detail — S-P4-02

| Property | Value |
|---|---|
| Screen ID | `S-P4-02` |
| Package | `MetricDetail_S-P4-02` |
| Status | **DRAFT after structural migration** |
| Route | `insights/metric-detail` |

## Purpose and existing contract

The complete behavior, traceability, states, acceptance criteria, analytics and non-functional requirements are preserved in [requirements/legacy-contract.md](requirements/legacy-contract.md).

The previous document's build-status wording predates the stricter UX package readiness gates. The package remains DRAFT until approved assets, typography, complete responsive/state contracts, reuse decisions and visual baselines are attached.

**v1.3.0** narrows this: the `gauge.primary`/`comparison.primary` combined-card responsive baseline for TPC/PTPC is now specified (see the v1.3.0 addendum in [requirements/legacy-contract.md](requirements/legacy-contract.md), `AC-P4-02-21`), from three requester-supplied MY screenshots rather than an approved Figma export. Every other blocker below is still open, including responsive/state baselines for the remaining sections.

**v1.5.0** closes the desktop gap v1.4.0 left open: the value-only gauge face now applies at every breakpoint (`AC-P4-02-23` amended), the comparison half gains a `{period} Comparison` heading (`AC-P4-02-28`), and `variant.with-repricing` + `penders.primary` pair into a two-column row at `breakpoint.desktop` (`AC-P4-02-27`) — though nothing renders that row until the Penders emission question is answered. Still open: Penders value source and link destination, money abbreviation (`OQ-25`), the breakdown sections' and `dataState` responsive baselines.

**v1.6.0** specifies the desktop presentation of the breakdown-table region: two `BREAKDOWN`-typed sections adjacent in `sections[]` pair side by side into equal-width cards at `breakpoint.desktop` (`AC-P4-02-29`), mirroring v1.5.0's variant/penders pairing, and hoists a single shared "Breakdown by Product" heading above the card(s) with each card headed by its bare variant name (`AC-P4-02-30`, applies today, independent of `AC-P4-02-29`). It does **not** add a `breakdown.with-repricing` data source — no per-product repriced breakdown exists in the domain today, only the single `altVariants[WITH_REPRICING]` total, so `AC-P4-02-29` is specified but unrenderable pending `OQ-38`. Still open: everything v1.5.0 left open, plus `OQ-38`.

**v1.7.0** reconciles the TPC drill-down with two signed-off Jira stories, ARVIJ-19 (Self) and ARVIJ-157 (Team). The KPI/Penders element set is now scope-dependent (`AC-P4-02-31`/`-32`): Self stays four KPI elements with no Penders card (Penders is a money amount inside the gauge legend, unchanged); Team gains a fifth, Penders, as its own COUNT-valued card (sum of all agents' cases) — link destination still blocked (`OQ-30`). A new pipeline-computed Credit Point formula for the `CREDIT_POINTS` breakdown row is documented (`AC-P4-02-33`, `mongodb.md` D-19) — spec-only, no backend implementation yet. Team Type filter traceability is confirmed against the existing `teamView` mechanism (`AC-P4-02-34`). This revision explicitly does **not** resolve the conflict between ARVIJ-19/157's colored visual-chart requirement and the shipped value-only gauge face (`AC-P4-02-23`) — flagged for product/UX. Also unconfirmed: whether the Credit Point formula redefines the headline TPC value itself, and whether ARVIJ-157's "AM only" Group-visibility rule is the same as the existing P2/P3 leader-level gating.

**v1.8.0** fixes the breakdown table's column structure: it now shows exactly one column, driven by the page's own Business Line filter (`context.businessLine`) — Insurance-only or Takaful-only when that line is selected, or one **combined** Insurance+Takaful total per product when "Both" (`ALL`) is selected — instead of always showing both columns side by side regardless of the filter (`AC-P4-02-35`). Applies to both TPC (5 products) and PTPC (7 products, unchanged row list) since they share the same widget. No visual baseline is approved for the new layout yet.

**v1.4.0** adds the header region (labelled back action, page title, Product/Time context pills, as-of placement) and the `breakpoint.mobile`/`breakpoint.tablet` layouts for the Without repricing, With repricing and Penders cards — including the value-only gauge face, which resolves v1.3.0's donut open question (`AC-P4-02-22`–`AC-P4-02-26`). Still open and explicitly **not** specified: the desktop equivalents of those card changes, the Penders card's value source and link destination, and money-value abbreviation (README `OQ-25`, blocking).

**v1.9.0** reconciles the PTPC drill-down with two further signed-off Jira
stories, ARVIJ-106 (Self) and ARVIJ-164 (Team) — PTPC's counterpart to
v1.7.0's TPC stories. It narrows PTPC's product-category breakdown to the
same 5 products as TPC (`AC-P4-02-36`), dropping the prior 7-product/
UNIT_TRUST+GROUP_PREMIUM note and closing the previously-open PTPC-definition
half of root `README.md`'s `OQ-2`. The KPI/Penders scope-gating, Credit Point
formula and Team Type filter ACs already generalized to "TPC/PTPC" in v1.7.0
and needed no amendment; the struck-through goal/visual-chart bullets in both
stories are confirmatory of the existing `showGoal:false` PTPC config and the
shipped value-only gauge face, not new scope. This revision explicitly does
**not** close the chart-design conflict for PTPC — it remains open exactly as
it is for TPC, pending one product/UX ruling covering both metrics.

**v1.10.0** reconciles the CASE_COUNT drill-down with two further signed-off
Jira stories, ARVIJ-20 (Self) and ARVIJ-158 (Team) — CASE_COUNT's counterpart
to v1.7.0's TPC stories and v1.9.0's PTPC stories. Because CASE_COUNT has no
repricing or breakdown capability, this reconciliation is narrower: the
KPI/Penders element set becomes scope-dependent (`AC-P4-02-37`, reusing the
`AC-P4-02-31`/`-32` shape) — Self renders three KPI elements with **no**
Penders anywhere (not even in the chart legend, narrower than TPC/PTPC's
Self case); Team gains a fourth, Penders, as its own COUNT KPI card. A
default-goal formula (previous year's achieved Case Count) is documented for
the first time in this spec chain (`AC-P4-02-38`) — spec-only, unrenderable
on this screen until the chart-design conflict below is resolved. Team Type
filter traceability is confirmatory only, reusing `AC-P4-02-34`. This
revision explicitly does **not** resolve the chart-design conflict — both
stories specify a **stacked bar/segment chart** (NB / NB Penders /
Endorsement, each with count + %), a structurally different chart type from
the TPC/PTPC donut disagreement, logged as a third open chart-design question
for product/UX rather than assumed resolved by any pending TPC/PTPC ruling.

**v1.11.0** reconciles the FYP drill-down with two further signed-off Jira
stories, ARVIJ-107 (Self) and ARVIJ-165 (Team), both signed off 19-Aug-2026 —
FYP's counterpart to v1.7.0's TPC stories, v1.9.0's PTPC stories and v1.10.0's
CASE_COUNT stories. Structurally, FYP is closest to TPC/PTPC (gauge +
comparison + a product breakdown), but two things diverge and are documented
as their own rules rather than folded into the existing TPC/PTPC/CASE_COUNT
patterns: (1) the KPI element set is confirmed **not** scope-dependent — both
`scope=SELF` and `scope=TEAM` render the same three elements, and Penders
stays gauge-legend-only money content at both scopes with no Penders KPI
card ever added (`AC-P4-02-39`), a simpler, confirmatory divergence from the
TPC/PTPC/CASE_COUNT scope-gating shape (`AC-P4-02-31`/`-32`/`-37`), not a gap;
(2) FYP's product breakdown activates the **old 7-product set**
(`LINKED_PREMIUM`, `REGULAR_PREMIUM`, `PSA`, `SINGLE_PREMIUM`,
`CREDIT_POINTS`, `UNIT_TRUST`, `GROUP_PREMIUM`) that TPC/PTPC moved away from
in v1.9.0 (`AC-P4-02-40`) — `CREDIT_POINTS` here is a **plain** `weightPct`
row, not the capped formula `AC-P4-02-33`/`mongodb.md` D-19 specifies for
TPC/PTPC only. This also resolves v1.9.0's `OQ-43` (the "orphaned"
`UNIT_TRUST`/`GROUP_PREMIUM` codes now have a consuming metric). A default-goal
formula — last year's achieved FYP **+ 20% growth** — is documented for FYP
(`AC-P4-02-41`, `mongodb.md` D-21) as its **own** rule, explicitly distinct
from `AC-P4-02-38`'s "previous year's achieved" default for CASE_COUNT (and,
by extension, TPC/PTPC): confirms rather than resolves the "formula family"
open question v1.10.0 raised (`OQ-47`) — the two families are confirmed
different, not the same. This revision explicitly does **not** resolve the
chart-design conflict — both stories specify the same two-tone
(collected/penders/remaining-to-goal/achieved-green) donut ARVIJ-19/157
specified for TPC, logged under the same open TPC/PTPC chart-design question
(not a new one) with a note that it now also covers FYP (and will need to
cover FYC when that story lands).

**v1.12.0** (authored after v1.13.0, filling its reserved slot) reconciles the
three Persistency drill-downs with their Self/Team story pairs: ARVIJ-111/170
(Current Year), ARVIJ-113/172 (First Year) and ARVIJ-115/174 (Second Year).
All six were signed off 19-Aug-26, and their 08-Sep green changes were
acknowledged 10-Sep-26. The 08-Sep "Removed year on year comparison" change
**contradicts** the prior contract: `AC-P4-02-03`'s "+2pp" and the §1
matrix's `comparison.primary` cell for `PERSISTENCY_*`. It is recorded as
such, not silently dropped. **`AC-P4-02-46`**: persistency renders no
`comparison.primary` at either scope, because the domain omits the
already-optional `comparison`, so there is no schema change. This amends
`AC-P4-02-03` and `-25` and supersedes traceability row 8.
**`AC-P4-02-47`**: persistency is always YTD, whatever the dashboard period.
The BFF requests `period=YTD` and returns `context.period=YTD`, so the
existing Time pill is the "YTD tag". Back keeps the dashboard's own period.
This fixes today's EMPTY result on MTD/QTD entry (requester decision,
24-Sep-26).
Confirmatory only:
- the CY 90 / Y1 85 / Y2 80 thresholds and the semi-circle gauge;
- the threshold staying on Team (Loke Wee Wong's query, answered by Shreya
  Jain);
- the RAG ring, which is already the existing `sentiment` → `tone.success`/
  `tone.danger` tint, green at or above the threshold;
- AM/UM hierarchy (`AC-P4-02-34`).

The "Persistency is calculated annually" card text is S-P4-01's, cross-screen.
Open: `OQ-58`–`OQ-62`. ACTIVITY_RATIO and all other metrics are unaffected.

**v1.13.0** reconciles the Team-only MANPOWER drill-down with ARVIJ-159
(`1.12.0` was reserved for the Persistency reconciliation, since filled
above). The 08/10-Sep green changes replace Opening/Closing
Manpower with a single **Total Manpower** = Existing Agents + New Recruits.
`bars.primary` becomes a **stacked** chart (new optional C3 fields
`BarComparisonSectionVM.layout`/`totals`, VM v1.6.0; measures
`EXISTING_AGENTS`/`NEW_RECRUITS`; the total and its chip come from `totals[]`)
— `AC-P4-02-42`/`-43`, superseding the grouped Opening/Closing cell and
amending `AC-P4-02-11`/`-12`. MANPOWER's change is shown **as a percentage
everywhere**: the catalog `changeDisplay` flips ABS → PCT, which also moves the
S-P4-01 card delta and the S-P4-03 MoM header (`AC-P4-02-44`). The first
metric opts into the new shared **`R-PCT-ROUNDUP`** rule in widget-contracts
§2, which rounds away from zero (23.4 → 24) and is applied by the producer
(`AC-P4-02-45`). No goal. Evidence note: ARVIJ-159 *does* carry a dated
19-Aug sign-off sentence, but every changed requirement rests on the 10-Sep
"acknowledge … please proceed" alone (`OQ-52`). Blocking: no upstream
existing-agents value (`OQ-51`). Open: `OQ-53`–`OQ-57`.

**v1.14.0** reconciles the Team-only ACTIVITY_RATIO drill-down with ARVIJ-160.
Most of it confirms what is already specified:
- the 0–100% threshold gauge;
- the 90 GTE marker, which is kept although the story never mentions it
  (requester decision, `OQ-64`);
- no goal;
- the current / previous-year / change KPI set on `comparison.primary`;
- the up/down/neutral indicator (`DeltaVM.direction`);
- the AM/UM hierarchy (`AC-P4-02-34`) and EMPTY state.

The one behavioral change is the 09/10-Sep green "Percentage to be shown":
- The catalog `changeDisplay` flips **PP → PCT** (`AC-P4-02-48`, `mongodb.md`
  D-24). The change is the **relative** % of the ratio (72.4 vs 61.8 →
  +18%), not the pp difference (requester decision, 24-Sep-26).
- ACTIVITY_RATIO becomes the second metric to opt into `R-PCT-ROUNDUP`
  (`AC-P4-02-49`), by reference only.
- Because the flip is catalog-level, it also moves S-P4-01's card delta and
  S-P4-03's MoM header.
- There is no C2/C3/C4 schema change. Description notes are updated, and a
  new fixture `metric-detail-activity-ratio.json` is added.

Evidence note: ARVIJ-160 does have a dated 19-Aug sign-off comment, but the
changes rest on the 10-Sep acknowledgement (`OQ-63`). Open: `OQ-63`–`OQ-65`;
`OQ-54`/`OQ-56` are extended.

**v1.15.0** reconciles the Team-only PRODUCTIVITY drill-down with ARVIJ-161
(signed off 19-Aug-26; the green changes were acknowledged 10-Sep-26).
- The change is shown as a **relative %**. The catalog `changeDisplay` flips
  **ABS → PCT** (`AC-P4-02-50`, `mongodb.md` D-25), so 9.7 vs 9.3 shows as
  **+5%**, not "+0.4" (requester decision, 24-Sep-26). The values stay
  DECIMAL with no "%" (`AC-P4-02-14`).
- PRODUCTIVITY is the third metric to opt into `R-PCT-ROUNDUP`
  (`AC-P4-02-51`), by reference only.
- Because the flip is catalog-level, it also moves S-P4-01's card delta and
  S-P4-03's MoM header.
- There is no C2/C3/C4 schema change. Description notes are updated, and a
  new fixture `metric-detail-productivity.json` is added.
- No goal. Navigation, Team Type and EMPTY are confirmatory.

🔴 **`OQ-66`:** AC4 asks for a **bar chart**, while the A1 matrix has
PRODUCTIVITY on `gauge.primary` (DECIMAL). This is a chart-type conflict, and
the widget is **not** switched. Evidence note: same as `OQ-63` (`OQ-67`).
Open: `OQ-66`–`OQ-68`; `OQ-54`/`OQ-55`/`OQ-56` are extended.

**v1.16.0** reconciles the Team-only AVERAGE_CASE_SIZE drill-down with
ARVIJ-162 (signed off 19-Aug-26; the green changes were acknowledged
10-Sep-26).
- The change is shown as a **relative %**. The catalog `changeDisplay` flips
  **ABS → PCT** (`AC-P4-02-52`, `mongodb.md` D-26), so RM 5,200 vs RM 4,800
  shows as **+9%**, not "+RM 400" (requester decision, 24-Sep-26). The values
  stay MONEY via `formatMoney`.
- The change row label moves from "Absolute Change" to the new key
  `insights.comparison.averageCaseSizeChange` ("Average Case Size Change",
  the story's wording; requester decision, 24-Sep-26). `absoluteChange` is
  kept as a reserved key.
- AVERAGE_CASE_SIZE is the fourth metric to opt into `R-PCT-ROUNDUP`
  (defined in v1.13.0) (`AC-P4-02-53`), by reference only.
- Because the flip is catalog-level, it also moves S-P4-01's card delta and
  S-P4-03's MoM header. After it, only NEW_RECRUIT_CONTRACTED stays ABS.
- There is no C2/C3/C4 schema change. Description notes, one en.json key
  and a new fixture `metric-detail-average-case-size.json` are added.
- No goal. Navigation, Team Type and EMPTY are confirmatory.

🔴 **`OQ-66` (extended):** AC4 asks for a **bar chart**, while the A1 matrix
has AVERAGE_CASE_SIZE on `gauge.primary` (MONEY). This is the **same root
conflict** as PRODUCTIVITY's, and one ruling covers both. A switch for this
metric would additionally need a MONEY axis unit and money abbreviation
(`OQ-25`). The widget is **not** switched.
Evidence note: the % display rests only on the 10-Sep acknowledgement, as
for MANPOWER (`OQ-69`). The request said AC15 still lists Goal/Target
Value; the 22-Sep export shows it struck. The open point is that this strike
was saved after the acknowledgement (`OQ-70`, quoted from the Jira thread).
Open: `OQ-66` (extended), `OQ-69`–`OQ-71`; `OQ-54`/`OQ-55`/`OQ-56` are
extended.

**v1.17.0** resolves README `OQ-25` for this screen, for TPC, PTPC, FYC,
FYP and AVERAGE_CASE_SIZE only (requester decision, 25-Sep-26;
`AC-P4-02-54`). Every MONEY value for those metrics renders compact with no
currency prefix, using the existing dashboard rule (widget-contracts §2
`R-MONEY-COMPACT`). That covers:
- the gauge collected value and penders line;
- the comparison current and prior values;
- the With Repricing value;
- breakdown product rows and the Total, in both tables.

The breakdown rows are compact too (24,690 → "24.7K"), deliberately unlike
the screenshot. The delta line, COUNT values (e.g. the Team penders card) and
all other metrics are unchanged. There is no C1–C4 shape, copy or fixture
change. The screenshot cited by the request was not received. Open:
`OQ-72` — the screenshot shows "Credit Points" without "(10%)", but the
TPC fixture has `weightPct: 10`. Not decided; the suffix stays.

**v1.18.0** corrects one field of v1.17.0 (requester, 25-Sep-26;
`AC-P4-02-55`, superseding `AC-P4-02-54` item 7). Breakdown **product rows**
show the plain value with no currency prefix and no K/M ("24,690"), as the
screenshot shows. Only the breakdown **Total** stays compact ("80.1K").
Open: `OQ-73`. Amounts with cents keep them ("4,250.70") until a whole-number
rule is decided.

**v1.19.0** gives the TPC/PTPC Team Penders card its link face (requester
screenshot, 25-Sep-26; `AC-P4-02-56`/`-57`). The value reads "6 Cases" (new
key `insights.detail.pendersCases`) with a trailing external-link icon
(`icon.external-link-line`, Remix substitute). Both are in the
screenshot-sampled `color.link` (`#1D4ED8`, unapproved). C3 1.7.0 adds an
optional `PendersSectionVM.nav`. The BFF omits it until `OQ-30` (destination)
is answered, so the card looks like a link but is not interactive. CASE_COUNT's
Team card keeps its bare count. There is no backend or fixture change.
Resolves `OQ-31`. Open: `OQ-30`, `OQ-74` (singular "1 Cases"), `OQ-75`
(link colour approval), `OQ-76` (icon Figma node and size).

**v1.20.0** shows the TPC/PTPC Penders card at **Self and Team** for every
persona (requester, 25-Sep-26; `AC-P4-02-58`/`-59`). At Self, the value is
the agent's own case count, with the same "{count} Cases" link face and the
same desktop pairing as Team. This supersedes the Self half of
`AC-P4-02-31`/`-32`. CASE_COUNT Self (`AC-P4-02-37`) and FYP (`AC-P4-02-39`)
are unchanged. There is no C1/C3 shape change. The backend fills
`pendersCaseCount` at Self, and the frontend changes tests only. Open:
`OQ-77` (Self count source), `OQ-78` (Self link destination), `OQ-30`.

**v1.21.0** simplifies the header and the breakdown table on every metric
(requester ASCII layout, 26-Sep-26; `AC-P4-02-60`–`-62`).
- No Direct/Group tag at any scope, Team included. This supersedes
  `AC-P4-02-10`. `context.teamView` is still sent and still drives the data.
- The Product pill reads "Both" for `ALL` (`insights.businessLine.ALL`), not
  "Insurance + Takaful". `ALL.chip` is now a reserved key with no consumer.
- Breakdown tables (TPC, PTPC, FYP) have no visible header row. The header
  stays in the table for screen readers only.

This amends `AC-P4-02-22` and `-35`. It is display only, with no C1–C4, copy
or fixture change and no backend work. No new open questions.

## Domain dependencies

- `domains/insights/api/insights.v1.yaml`
- `domains/insights/bff/performance-vm.ts`
- `domains/insights/config/countries/MY/performance.config.json`
- `domains/insights/common/frontend/widget-contracts.md`
- `domains/insights/data/mongodb.md`
