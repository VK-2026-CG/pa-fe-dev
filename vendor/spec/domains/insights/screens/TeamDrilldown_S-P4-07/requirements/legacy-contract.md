# S-P4-07 — Team Drilldown ("My Team")

| | |
|---|---|
| Screen ID / Version | `S-P4-07` · `specVersion 0.2.0` · Status: **DRAFT** |
| Work item | [SPEC-2026-004](../../../../../work-items/SPEC-2026-004/README.md) |
| Route | `insights/team-drilldown` |
| BFF endpoint | `GET /api/bff/v1/performance/team-drilldown?teamView&basis&query&sortBy&badges&parentAgentId&period&businessLine&performanceBasis` → `TeamDrilldownVM` |
| Domain ops | `listTeamMembers` (C2 1.6.0), `getTeamMemberDashboard` |
| Config | `domains/insights/config/countries/MY/team-drilldown.config.json` (0.2.0) |
| Personas | Agent Leaders only — AM (P2) and UM (P3) |
| UX source | 17 requester MY frames, 2026-09-24 (mobile 375, desktop 1024 and 1440; screenshot-derived at 1.3× export scale) — see work item |

## 1. Purpose

Let a leader see their team ("My Team"): every direct report with
qualification badges, goal status and TPC/PTPC, team KPI tiles, sorting and
badge filtering; open a member-leader's own team (subteam drawer); and open
any member's Performance dashboard read-only (S-P4-01 viewing mode, §3.5).

The hierarchy basis (`AGENT|AM|UM`) stays a dedicated axis, independent from
the Performance `basis` (`STANDARD|SCHEME`).

## 2. Traceability

| # | UI element | VM field (`TeamDrilldownVM`) | Domain API field | Status |
|---|---|---|---|---|
| 1 | ~~Team-view selector (Direct/Group)~~ | `filters.teamView` | `teamView` query | UI **superseded** in 0.2.0 (not in UX); API/gating retained (AC-P4-07-01) |
| 2 | ~~Hierarchy basis selector~~ | `filters.basis` | `basis` query | UI **superseded** in 0.2.0; UI omits `basis` ⇒ all levels (C2 1.6.0); validation retained (AC-P4-07-02) |
| 3 | Search input | `filters.search` | `query` query | 0.1.0 |
| 4 | Member card identity (avatar, name, role, agent code) | `members[].{photoUrl,displayName,hierarchyBasis,agentId}` | `items[]` (`TeamMember`) | 0.1.0 + `photoUrl` 0.2.0 |
| 5 | ~~Selected-member preview~~ | `selectedMember` | `TeamMemberDashboard` | **superseded** by #12 (AC-P4-07-04 → AC-P4-07-14) |
| 6 | Badge row | `members[].badges` | `TeamMember.badges` | 0.2.0 — stub only (OQ-79) |
| 7 | Goal status | `members[].goalStatus` | `TeamMember.goalStatus` | 0.2.0 — stub only (OQ-79) |
| 8 | TPC / PTPC row | `members[].tpc`, `members[].ptpc` | `TeamMember.tpc/ptpc` | 0.2.0 |
| 9 | Subteam button (team icon + count + caret) | `members[].directReportCount` | `TeamMember.directReportCount` | 0.2.0 — stub only (OQ-79) |
| 10 | KPI tiles | `summary[]` | `TeamMemberList.summary` | 0.2.0 |
| 11 | Filter / Sort chips + Filters sheet | `filters.{sortBy,badges}`, `filterOptions` | `sortBy`, `badges` query; C4 `memberList.badgeGroups` | 0.2.0 |
| 12 | Card tap → viewing mode | `members[].nav` | — (BFF-composed) | 0.2.0 |
| 13 | Subteam drawer title | `parent`, `filters.parentAgentId` | `parentMemberAgentId` query, `TeamMemberList.parent` | 0.2.0 |
| 14 | "As of" date | `meta.asOfDate` | — | 0.1.0 |

## 3. Behaviour

### 3.1 Access and gating (unchanged)

`scope=TEAM` context is required; non-leaders are rejected (403). `teamView`
gating follows D-14: P3 leaders are DIRECT-only; P2 may use DIRECT or GROUP.
The 0.2.0 UI always requests DIRECT (no team-view control in the UX).

### 3.2 List, sorting and filtering (BFF/domain)

- Members = the caller's direct reports of every hierarchy level when `basis`
  is omitted (UMs and agents together for an AM).
- `sortBy` (default C4 `memberList.defaultSortBy` = `TPC`) orders members
  descending by that metric; ties by `displayName` ascending; members without
  the metric sort last.
- `badges` filter: a member matches when it holds **any** selected badge
  (D-P4-07-02). Absent/empty = all members ("All Agent"). `VIOLET` is
  display-only and is rejected as a filter value (400).
- `summary[]` tiles (C4 `summary.metrics`: MANPOWER, ACTIVITY_RATIO,
  PRODUCTIVITY, AVERAGE_CASE_SIZE) are computed over the **filtered** member
  set (D-P4-07-02). A tile without an available value has no `value`.
- `badges`, `goalStatus`, `directReportCount` and `photoUrl` have no approved
  upstream source (OQ-79): memory/stub mode serves deterministic fixtures;
  source mode omits them and never synthesizes them (D-P4-07-04).

### 3.3 Screen layout (UI)

Breakpoints follow the app convention: *mobile* < 1024px (tablet 768–1023 is
unevidenced and follows mobile, OQ-81) and *desktop* ≥ 1024px.

| Region | Mobile (< 1024) | Desktop (≥ 1024) |
|---|---|---|
| Header | Back action + "As of dd/mm/yyyy" right-aligned on one row; page title below | Breadcrumb `Performance > My Team` + "As of" right-aligned; page title below |
| Search row | Search field + square icon-only Filter button (brand-tinted funnel) | Search field + outlined "Filter" button with funnel icon |
| Chips | `Filters {All Agent \| selected badges}` · `Sort By {TPC\|PTPC}` — static labelled chips (S-P4-01 summary-pill style) that open the Filters sheet | same |
| KPI tiles | Horizontal scroll row, tiles 184 wide with peek | 4 equal columns, 16 gap |
| Member cards | Single column, cards directly on page background | 2-column grid, 16 gap, inside one white panel (16 padding, 16 radius) |
| Recommendations | Out of scope for this screen (OQ-83) | — |

Member card face (`w.team-drilldown.member-card`), top to bottom:
1. Badge row (hidden when `badges` absent/empty).
2. Identity: 36px avatar (photo, else initials), display name, role label
   (`insights.teamDrilldown.basis.{hierarchyBasis}`), agent code.
   *Mobile:* name + role on line 1; agent code + divider + goal status on line 2.
   *Desktop:* name + role + divider + agent code on one line; goal status
   top-right of the card, aligned with the badge row.
3. Values row: `TPC {value} | PTPC {value}`; the subteam button is
   right-aligned on this row when `directReportCount > 0`.

Goal status: `SET` = success check icon + "Goal set"; `NOT_SET` = warning
info icon + "Goal not set"; absent = nothing.

Badge tones: PV and ROOKIE use the *info* badge tone (blue); MDRT group,
PruWealth Planner group and VIOLET use the *qualification* tone (violet);
unknown codes use the neutral tone.

Values: member TPC/PTPC and KPI tiles render **compact** (K/M, one decimal,
half-up) — D-P4-07-05 answers OQ-25 for S-P4-07 only. TPC/PTPC render
without a currency prefix ("172K"); other MONEY tiles keep it ("RM 560K").
A missing value renders the no-value placeholder.

### 3.4 Filters sheet and subteam drawer (UI)

- **Filters** opens as a bottom sheet (mobile) or a right side drawer 608px
  wide with a scrim (desktop). Title "Filters" + close. Sections: *Sort By*
  card (radio TPC/PTPC; stacked on mobile, two columns on desktop); *All
  Agent* master checkbox; one card per C4 badge group (group checkbox +
  child checkboxes; one column on mobile, two columns on desktop); footer
  Cancel / Confirm.
- Selection is **staged**: nothing applies until Confirm. Cancel, close,
  scrim and Escape discard. A group checkbox is checked when at least one
  child is checked and toggles all its children; *All Agent* is checked only
  when every filterable badge is checked and toggles all of them. Confirming
  with all or none selected = "All Agent" (no `badges` param).
- **Subteam drawer**: the subteam button opens a drawer (desktop: right,
  608px; mobile: full-height sheet, OQ-81) titled
  `{name}'s Team ({count})` (`parent.displayName`,
  `parent.directReportCount`) with a close action, a search field and that
  member's direct reports as single-column cards of the same face (no KPI
  tiles, no chips). Search is scoped to the subteam.
- All list state (search, sortBy, badges, open subteam) is kept in the URL so
  Back / Exit View restores it.

### 3.5 Viewing mode (S-P4-01 2.1.0 addendum)

Tapping a card navigates to `members[].nav` (S-P4-01 with
`subjectAgentId`). The BFF proves the member is in the caller's downline
(else 403 BFF-4033) and composes the member's dashboard read-only with scope
following the member's role (D-P4-07-03): an agent ⇒ SELF; a member with
direct reports ⇒ TEAM/DIRECT. See S-P4-01 AC-P4-01-82–86.

## 4. Acceptance criteria

Append-only. 0.1.0 criteria keep their ids.

- **AC-P4-07-01** `teamView=GROUP` returns 403 for P3-level callers.
- **AC-P4-07-02** `basis` accepts only `AGENT|AM|UM`; values outside that set
  fail with 400. *(0.2.0: an omitted `basis` means all levels.)*
- **AC-P4-07-03** Search is case-insensitive for both member id and display
  name.
- **AC-P4-07-04** ~~Selected-member preview preserves requested performance
  dimensions in response context.~~ **Superseded (0.2.0) for the UI by
  AC-P4-07-14**; the BFF behaviour stays for compatibility.
- **AC-P4-07-05** Package remains DRAFT until row-level hierarchy evidence for
  `my_agent_hierarchy` linkage is attached.
- **AC-P4-07-06** *(BFF)* Without `basis`, the list contains direct reports of
  every level, each with its own `hierarchyBasis`; `directReportCount > 0`
  only for members who lead a team.
- **AC-P4-07-07** *(BFF)* `sortBy=TPC|PTPC` orders members descending (ties by
  name ascending); default TPC; any other value → 400.
- **AC-P4-07-08** *(BFF)* `badges` matches members holding ANY listed badge;
  `summary[]` is recomputed over the filtered set; `VIOLET` or an unknown code
  → 400.
- **AC-P4-07-09** *(BFF)* `parentAgentId` returns that member's direct reports
  with `parent` populated and no `summary`; a member outside the caller's
  downline → 403 BFF-4033.
- **AC-P4-07-10** *(UI)* Header, search/filter row, chips, KPI tiles and member
  grid follow §3.3 at mobile and desktop; the KPI tiles render `summary[]` in
  order with `insights.teamDrilldown.summary.{code}` labels.
- **AC-P4-07-11** *(UI)* Member card renders badges, goal status, identity,
  compact TPC/PTPC and the subteam button per §3.3; each optional field that
  is absent removes its element without an error.
- **AC-P4-07-12** *(UI)* The Filters sheet/drawer stages Sort By and badge
  selections and applies them only on Confirm; chips then read
  `Filters {All Agent|MDRT, TOT, PV}` and `Sort By {TPC|PTPC}`.
- **AC-P4-07-13** *(UI)* The subteam button opens the `{name}'s Team ({count})`
  drawer with scoped search; close restores the list unchanged.
- **AC-P4-07-14** *(UI)* Tapping a member card (main list or subteam drawer)
  opens that member's S-P4-01 viewing mode; Exit View returns to the list with
  its search/sort/filter state intact.
- **AC-P4-07-15** *(UI)* Every visible string resolves from `insights.*` keys;
  no raw colours or sizes outside the DLS stub.
- **AC-P4-07-16** *(UI, v0.3.0)* The header Back action always navigates
  directly to `insights/performance` (replacing the current history entry,
  not a browser-history "back") regardless of how the screen was reached or
  what search/sort/filter/subteam state accumulated in the URL along the
  way. In-screen state changes (search, sort, badge filter, subteam drawer)
  also replace the current history entry rather than pushing a new one, so
  Back always exits the drilldown in one step instead of unwinding through
  intermediate filter states.

## 5. Analytics

0.1.0 events unchanged: `insights_team_drilldown_viewed {teamView,basis}` ·
`insights_team_drilldown_member_selected {memberAgentId}` ·
`insights_team_drilldown_search_changed {queryLength}`.
0.2.0 adds: `insights_team_drilldown_filters_applied {sortBy,badgeCount}` ·
`insights_team_drilldown_subteam_opened {directReportCount}` ·
`insights_viewing_exited {}`. No agent codes beyond the existing
`memberAgentId`, no money values.

## 6. Decisions (SPEC-2026-004, requester-selected 2026-09-24)

| ID | Decision |
|---|---|
| D-P4-07-01 | `VIOLET` is a real badge shown on cards but not filterable; its business meaning is owned by Product (OQ-80). |
| D-P4-07-02 | Badge filter = ANY-match; "All Agent" = no filter; KPI tiles are recomputed over the filtered set (evidence: f10 Manpower 100 → 40). |
| D-P4-07-03 | Viewing mode scope follows the member's role (agent ⇒ SELF, leader ⇒ TEAM/DIRECT) and is read-only. |
| D-P4-07-04 | Badges, goal status, subteam counts and photos use stub data for now; source mode omits them (OQ-79). |
| D-P4-07-05 | OQ-25 answered for S-P4-07 only: member and KPI values render compact; TPC/PTPC without currency prefix. OQ-25 stays open for S-P4-01/02. |
| D-P4-07-06 | Development-only exception to "source mode never synthesizes" (requester-approved 2026-09-24): with `INSIGHTS_TEAM_DRILLDOWN_MOCK=true` (default off, refused in production) the Mongo source mode serves Team Drilldown hierarchy/card data from the deterministic mock tree with the caller as AM root, and viewing a mock member composes from the memory engine. Login identity stays the Mongo allowlist only; the caller's own Performance data stays Mongo. Mock photos are cropped from the requester frames (`public/mock-avatars/`, not approved assets). Removed when OQ-79 is answered. |

## 7. Open questions

- OQ-P4-07-01: confirm final role/basis mapping rules from
  `my_agent_hierarchy` rows for AGENT/AM/UM derivation. *(open)*
- OQ-P4-07-02: ~~recommendations parity in the selected-member preview~~ —
  **moot** (preview superseded by viewing mode).
- OQ-P4-07-03: confirm finalized responsive and visual baseline package.
  *(open — 0.2.0 frames are screenshot-derived; tablet unevidenced, OQ-81)*
- README OQ-79 🔴 upstream source for badges / goal status / subteam counts / photos (Data owner).
- README OQ-80 🟡 business meaning of VIOLET (Product).
- README OQ-81 🟡 tablet (768–1023) and mobile subteam-drawer baselines (UX).
- README OQ-82 🟡 frame inconsistencies recorded, not implemented: f07 "Rank By"
  (implemented "Sort By"); f09 *All Agent* checked with a partial selection;
  f16 one-column children at 1440 vs two columns at 1024 (f08/f09); f10 filter
  result showing a non-matching member; "+" on Other Focus Metric in viewing
  frames vs read-only (D-P4-07-03) (UX).
- README OQ-83 🟡 "AI Recommendations" bar/FAB on the mobile My Team frame has
  no Team Drilldown VM source or behaviour (Product/UX).

## 8. Revision history

| Version | Date | Source | Compatibility | Summary |
|---|---|---|---|---|
| 0.1.0 | 2026-09-23 | Legacy contract | ADDITIVE | Initial draft: member list, hierarchy basis, selected-member preview. |
| 0.2.0 | 2026-09-24 | SPEC-2026-004 — 17 requester frames + requester decisions | BREAKING on this DRAFT surface only (omitted `basis` = all levels, `filters.basis` optional); other C2/C3 fields additive; UI supersedes teamView/basis selectors and preview | "My Team" UX: badges, goal status, TPC/PTPC, KPI tiles, sort, badge filter, subteam drawer, viewing mode; AC-P4-07-06–15; D-P4-07-01–05; OQ-79–83. |
| 0.3.0 | 2026-09-29 | Frontend implementation (`pa-fe-dev`) | ADDITIVE — UI-only navigation behavior, no VM/API change | Back always exits directly to `insights/performance` via history replace, not browser back; in-screen filter/search/subteam changes also replace rather than push. AC-P4-07-16. |
