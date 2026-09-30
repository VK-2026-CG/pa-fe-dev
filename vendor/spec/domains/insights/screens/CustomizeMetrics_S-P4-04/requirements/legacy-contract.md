# S-P4-04 — Customize Metrics

| | |
|---|---|
| Screen ID / Version | `S-P4-04` · `specVersion 1.2.0` · Status: **Ready for build** |
| Route | `insights/customize-metrics` (from dashboard ⋯ overflow) |
| BFF endpoints | `GET /api/bff/v1/performance/customize` → `CustomizeMetricsVM` · `PUT` same route (`SaveCustomizeRequest`) → `CustomizeMetricsVM` |
| Domain ops | `listMetricDefinitions` + `getMetricPreferences` (GET) · `putMetricPreferences` (PUT) |
| Config | `screens.customize` (priority min/max/editable, focus min/max) |
| Mock | Image 9 |

## 1. Purpose
Agent chooses and orders the metrics shown on S-P4-01. Two lists: **Priority
Metrics** (drive the card row) and **Other Focus Metrics**. In MY the priority
set is locked (greyed checks, `editable=false`) but reorderable; focus metrics
are freely selectable up to `focus.max`.

## 2. Traceability

| # | UI element | VM field (`CustomizeMetricsVM`) | Domain API | Mongo |
|---|---|---|---|---|
| 1 | Priority rows "TPC without repricing…" | `priority[].{metricCode,variant}` → i18n | `listMetricDefinitions` (category, repricing capability) + `getMetricPreferences.priorityMetricCodes` (order) | `metric_definitions`, `metric_preferences` |
| 2 | Greyed locked checkbox | `priority[].locked=true` | `MetricDefinition.customizable=false` ∧ `config.priority.editable=false` | `metric_definitions.customizable` |
| 3 | Red selectable checkbox (FYC, Current Year Persistency checked) | `focus[].selected` | preferences `focusMetricCodes` ∪ catalog `defaultSelected` | `metric_preferences.focusMetricCodes` / `metric_definitions.defaultSelected` |
| 4 | Drag handles (both lists) | `*[].reorderable`, `*[].order` | preferences order (fallback `defaultOrder`) | same |
| 5 | Save Changes | `PUT` body `SaveCustomizeRequest` | `putMetricPreferences` (200/422) | `metric_preferences` upsert |
| 6 | Cancel | local revert | — | — |

## 3. Behaviour & validation
- List membership comes from the catalog (`category` PRIORITY/FOCUS); the BFF merges saved order/selection over catalog defaults (`source=DEFAULT` on first use).
- Save button enabled only when dirty **and** constraints satisfied:
  `priority.count` within `[config.priority.min, config.priority.max]`; `focus.selected ≤ config.focus.max`; no duplicates across lists.
- Client validation mirrors server; server remains authoritative — a 422 (Problem `INS-4220..4223`) maps to inline field errors, nothing partially saved (full-replace semantics).
- Successful save returns the canonical VM; on back-navigation the dashboard refetches so card row order reflects the save immediately.
- Unsaved changes + back ⇒ discard-confirmation sheet.

## 4. Acceptance criteria
- **AC-P4-04-01** Locked rows are not toggleable (tap is inert, checkbox greyed) but remain drag-reorderable.
- **AC-P4-04-02** Attempting to exceed `focus.max` blocks the toggle with inline DLS hint `insights.customize.maxFocusReached`.
- **AC-P4-04-03** PUT sends the **rendered order** of both lists; reload of S-P4-01 shows priority cards in that order (ties to AC-P4-01-05).
- **AC-P4-04-04** Server 422 for an unknown/retired metric code surfaces a row-level error and preserves the user's other edits.
- **AC-P4-04-05** First-time users (no saved doc) see catalog defaults with `defaultSelected` pre-checked (mock: FYC, Current Year Persistency).
- **AC-P4-04-06** Reorder is fully operable via screen reader (move up/down actions) per widget contracts §4.

## 5. Analytics
`insights_customize_viewed` · `insights_customize_toggled {metricCode, selected}` ·
`insights_customize_reordered {list}` · `insights_customize_saved {priorityCount, focusCount}` ·
`insights_customize_save_failed {code}`.

## 6. NFR
GET p95 ≤ 400 ms (catalog cached at BFF 10 min); PUT idempotent full-replace; optimistic UI disallowed (save waits for 200).


---

# v1.1.0 addendum — per-scope customization (P2/P3)

Figma 6588:17856 / 6588:17897 + Toast 6588:17938.

- The screen edits **one scope's preference document** (`?scope=` from the
  entry context; leader SELF and TEAM docs are independent).
- Catalog lists derive per scope: membership = `scopes ∋ scope`, category/
  order after `scopeOverrides` (NEW_RECRUIT_CONTRACTED: FOCUS@SELF →
  PRIORITY@TEAM — *superseded in v2.0.0: FOCUS at both scopes*).
- MY TEAM: 9 locked priority rows (the four P4 metrics + MAPA + NRC),
  reorderable; focus list = FYC ✓, PERSISTENCY_CY ✓, Y1 ☐, Y2 ☐.
  *Superseded in v2.0.0: 8 locked priority rows (NRC removed); focus list
  adds NEW_RECRUIT_CONTRACTED ☐.*
- Save success fires `w.toast` (`insights.customize.saved`) and returns to the
  dashboard of the same scope, which refetches (extends AC-P4-04-03).

**Added ACs**
- **AC-P4-04-07** Lists reflect the entry `scope`; switching dashboard scope later never mutates the other scope's saved doc.
- **AC-P4-04-08** (superseded by AC-P4-04-38, v2.0.0) TEAM shows exactly 9 locked, reorderable priority rows in MY; save PUTs with `?scope=TEAM`.
- **AC-P4-04-09** A metric outside the scope's catalog (`scopes` mismatch) never appears; server 422 `INS-4224` guards races.
- **AC-P4-04-10** Success toast shows once per save (`insights.toast.focusMetricsAdded` when focus selection changed, else `insights.customize.saved`); failure keeps the sheet open with inline errors (no toast).

**Analytics** add `scope` to every existing customize event.

---

# v1.4.0 addendum — Responsive overlay contract (bottom sheet / side sheet)

First versioned geometry contract for the Customize Metrics **overlay chrome**
itself (header/footer/scroll container) — until now only `w.customize.list`'s
row-level contract existed; the overlay shipped as an unversioned,
non-breakpoint-aware full-height page (`CustomizeSurface`, `min-height: 100dvh`
at every viewport, in `pa-fe-dev`). This addendum defines three explicit
breakpoint treatments and introduces widget `w.customize.overlay`
(`bottom-sheet` / `side-sheet` variants, `widget-contracts.md` §1). No VM,
API, or data change — `CustomizeMetricsVM`, `CustomizeItemVM`,
`CustomizeConstraintsVM`, `SaveCustomizeRequest` are all unchanged; every
existing behavioral AC (§3, `AC-P4-04-01`…`10`) is preserved and now
explicitly reaffirmed at every breakpoint rather than left implicit.

⚠ Desktop and mobile geometry are requester-supplied screenshot references
("Sidesheet.png", "Sheet (Mobile) - B.png"), not Figma exports — tracked
under the existing "Strict UX source approval is incomplete" blocker.
**Tablet has no visual baseline at all** — see `OQ-26` below; the tablet
geometry in this addendum is a provisional recommendation, not a
requester-confirmed layout.

## B1. Breakpoint ownership

Uses the existing shared tokens (`common/ux/tokens/breakpoint.tokens.json`):
`breakpoint.mobile` (≤767px), `breakpoint.tablet` (768–1023px),
`breakpoint.desktop` (≥1024px).

| Breakpoint | Overlay mode | Anchor |
|---|---|---|
| Mobile (≤767px) | `w.customize.overlay` variant `bottom-sheet` | bottom, viewport-width, rounded top corners |
| Tablet (768–1023px) | `w.customize.overlay` variant `side-sheet` (provisional, `OQ-26`) | right edge, `width: min(420px, 100vw)`, full viewport height |
| Desktop (≥1024px) | `w.customize.overlay` variant `side-sheet` | right edge, fixed 420px width, full viewport height |

- **AC-P4-04-11** The overlay renders as a bottom sheet below
  `breakpoint.tablet` and a right-anchored side sheet at `breakpoint.tablet`
  and above; resizing the viewport across the breakpoint while the overlay
  is open re-renders the correct mode without closing the overlay or
  discarding unsaved local state.

## B2. Mobile (<768px) — bottom sheet

- **AC-P4-04-12** The sheet is viewport-width, anchored to the bottom, with
  rounded top corners and a squared bottom edge; content height is bounded
  to the viewport and the row list scrolls independently while the header
  and action area stay fixed (non-scrolling).
- **AC-P4-04-13** The header shows `insights.customize.title` ("Customize
  Metrics") and a Close control (`insights.customize.close`); the action
  area is pinned to the sheet's bottom edge (sticky, `env(safe-area-inset-bottom)`-aware,
  per the existing `.cust-actions` pattern) and shows only the primary Save
  Changes button (`insights.customize.save`) — **no Cancel button** at this
  breakpoint. Discarding unsaved changes happens through Close (X) or device
  back, which — when the form is dirty — opens the existing
  discard-confirmation sheet (§3) exactly as back-navigation already does;
  Close on a clean form dismisses immediately.
- **AC-P4-04-14** Save Changes renders its DLS disabled visual state (reduced
  opacity, non-interactive, `aria-disabled="true"`) whenever the existing
  enablement rule (§3: dirty ∧ constraints satisfied) evaluates false, and
  its enabled state otherwise — a rendering assertion on the pre-existing
  rule, not a new enablement rule.
- **AC-P4-04-15** Metric rows render as compact rounded rectangles (existing
  `w.customize.list` / `card-rows` geometry, `.cust-row`) with checkbox,
  label, and a reorder grip where `reorderable=true` — unchanged from the
  current row contract; this addendum changes only the surrounding overlay
  chrome, not row geometry.

## B3. Tablet (768–1023px) — side sheet (provisional)

⚠ Provisional: no tablet visual reference was supplied (`OQ-26`). The
recommended default below carries the same `UX_APPROVED_INFERENCE` status as
`breakpoint.tablet` itself in the token file — it is not requester-confirmed
pixel geometry.

- **AC-P4-04-16** The overlay renders as a right-anchored side sheet with
  `width: min(420px, 100vw)` and `height: 100vh` (full viewport height,
  matching desktop's vertical treatment rather than mobile's bottom-anchored
  partial height).
- **AC-P4-04-17** The footer shows both Cancel (`insights.customize.cancel`)
  and Save Changes (`insights.customize.save`), matching the desktop footer
  composition (B4) rather than mobile's Save-only footer; Cancel discards
  local unsaved state and closes without confirmation when clean, and opens
  the discard-confirmation sheet when dirty (same semantics as mobile's
  Close, restated for the visible Cancel control).
- **AC-P4-04-18** The row list scrolls independently of the sticky header
  and footer, identically to mobile (`AC-P4-04-12`) and desktop
  (`AC-P4-04-21`).

This tablet treatment remains **DRAFT** pending UX sign-off (`OQ-26`); do not
claim pixel-perfect tablet compliance until it resolves.

## B4. Desktop (≥1024px) — side sheet

- **AC-P4-04-19** The overlay renders as a fixed, right-anchored,
  full-viewport-height side sheet, white surface (`var(--color-surface)`),
  420px visual width, with a left-edge border/separation from the underlying
  dashboard (`var(--color-border)`, 1px) — supersedes the prior full-page
  (`100dvh`, edge-to-edge) treatment at this breakpoint.
- **AC-P4-04-20** The header is ~72px tall, showing
  `insights.customize.title`, the Close control, and a bottom divider (1px,
  `var(--color-border)`) separating it from the scrollable content;
  horizontal content padding is ~24px (`var(--cust-gutter)`).
- **AC-P4-04-21** The metric list scrolls independently within the sheet
  body; header and footer remain fixed/sticky during that scroll.
- **AC-P4-04-22** "Priority Metrics" and "Other Focus Metrics" section
  headings (`insights.customize.priorityHeading`/`focusHeading`) render in
  compact desktop typography (existing `.cust-section h2` token,
  `var(--fs-cust-section)`) — unchanged token, explicitly reaffirmed at this
  breakpoint rather than left to CSS default.
- **AC-P4-04-23** Metric rows are ~56px tall (`var(--cust-row-h)`) with 8px
  corner radius (`var(--cust-row-radius)`) and a 1px neutral border
  (`var(--cust-row-border)`) by default; each row shows its checkbox, the
  metric label, and — when `reorderable=true` — a right-aligned six-dot
  reorder grip (`.cust-grip`). This restates the existing row geometry
  tokens as breakpoint-explicit rather than introducing new values.
- **AC-P4-04-24** A locked priority row (`locked=true`) renders a disabled,
  grey, checked checkbox (`var(--color-check-locked-bg)` fill, no brand
  tint) — extends `AC-P4-04-01`'s behavioral "greyed" description with the
  specific visual token. Corrected against a newer Figma reference: the fill
  is a lighter grey than the checkbox outline/border shade
  (`var(--color-check-border)`), which stays reserved for the neutral
  unchecked-box border and the drag-grip dots.
- **AC-P4-04-25** A selected, unlocked focus row (`selected=true`,
  `locked=false`) renders a brand-red checked checkbox
  (`var(--color-check-on)`) and a stronger selected-row border treatment — a
  dark neutral border (`var(--color-text)`; corrected from an earlier
  brand-red-border draft of this AC against a production reference
  screenshot — the border reads as near-black, not red, distinct from the
  red checkbox fill), thicker than the default; an unselected focus row
  keeps the default neutral 1px outline (`AC-P4-04-23`).
- **AC-P4-04-32** The "Priority Metrics" section heading renders on a
  shaded band (light grey background, full sheet width, not inset with the
  row cards below it); the "Other Focus Metrics" heading does **not** — it
  renders on the plain sheet background, identically to `AC-P4-04-22`'s
  original description. This asymmetry is confirmed by a production
  reference screenshot (PRUForce live app) supplied after the initial
  Sidesheet.png/Sheet-Mobile-B.png evidence; it corrects `AC-P4-04-22`,
  which had assumed both headings render identically.
- **AC-P4-04-26** The footer is sticky to the sheet's bottom edge with a top
  divider (1px, `var(--color-border)`), containing Cancel (outline) and
  primary Save Changes, right-aligned; Save Changes shows its disabled state
  per `AC-P4-04-14`'s rule, restated for this breakpoint.

## B5. Accessibility & motion (every breakpoint)

- **AC-P4-04-27** On open, focus moves into the overlay (to the Close
  control or the first interactive row) and is trapped within it
  (Tab/Shift+Tab cycle inside the overlay) until it closes, at which point
  focus returns to the control that opened it (the dashboard's ⋯ overflow
  entry). Background dashboard content cannot receive pointer or keyboard
  focus while the overlay is open, and the backdrop blocks background
  pointer interaction — the existing `Layer`/`BottomSheet` behavior, now a
  contractual requirement rather than an implementation detail.
- **AC-P4-04-28** Escape closes the overlay with the same discard semantics
  as Close/Cancel (`AC-P4-04-13`/`17`): immediate close when clean,
  discard-confirmation sheet when dirty.
- **AC-P4-04-29** Drag reordering remains available via pointer/touch **and**
  the existing screen-reader move-up/move-down fallback (`AC-P4-04-06`,
  widget-contracts §4) at every breakpoint — this addendum does not change
  reorder mechanics, only confirms they are breakpoint-independent.
- **AC-P4-04-30** The overlay opens and closes with no animated page-level
  transition (instant state change), consistent with every other sheet on
  this screen family (Filter, More actions) — so there is no motion for
  `prefers-reduced-motion: reduce` to override by construction. If a slide
  transition is added later (mobile slide-up / tablet-desktop
  slide-in-from-right), it must be disabled under `prefers-reduced-motion:
  reduce` at that time. Row reorder drag feedback is unaffected either way
  (not a page-level transition).
- **AC-P4-04-31** Mobile sheet content respects
  `env(safe-area-inset-bottom)` in the sticky action area (existing
  `.cust-actions` pattern), consistent with the Filter sheet's safe-area
  handling (S-P4-01, `.sheet` padding-bottom).

## OQ-26 (new, 🔴 blocking tablet visual sign-off only — does not block the mobile/desktop ACs above)

No tablet-specific visual reference was supplied for Customize Metrics
(unlike S-P4-01's Filter sheet, which already has an approved responsive
pattern to follow). `AC-P4-04-16`/`17`/`18` above are a **recommended
default** (side sheet, `min(420px, 100vw)` width, full height, Cancel+Save
footer) chosen for chrome consistency with desktop and with S-P4-01's own
tablet-uses-desktop-chrome convention (v1.5.6 addendum) — not a
requester-confirmed layout.

Options: (a) accept the recommended side-sheet default as-is; (b) supply a
tablet Figma frame/screenshot for exact geometry; (c) tablet falls back to
the mobile bottom-sheet treatment instead. **Recommendation: (a)**, for
chrome consistency with the rest of the responsive P4 pack. Owner:
UX/product. Until resolved, the package stays `DRAFT` and
`AC-P4-04-16`/`17`/`18` carry the same screenshot-derived/provisional
caveat as the v1.4.0 desktop-chrome precedent on S-P4-01.

**`OQ-26` resolved in v1.5.0 below** — see that addendum for the closing
evidence and rationale.

---

# v1.5.0 addendum — Persistent overlay at tablet/desktop (closes OQ-26)

Closes `OQ-26`: a production PRUForce screenshot ("Tablet (3).png",
requester-supplied) confirms the `AC-P4-04-16`/`17`/`18` side-sheet geometry
as-is — those ACs' "provisional" caveat is lifted; their values are
unchanged. What's new in this addendum is a separate, previously-unspecified
requirement the same screenshot evidences: at `breakpoint.tablet` and
`breakpoint.desktop`, the overlay must render **in place over the
still-mounted Performance Dashboard**, not behind a route navigation.

Until now, opening Customize Metrics (from S-P4-01's "⋯ More actions" sheet
or its "+ add focus metric" affordance) was a full route change
(`insights/customize-metrics`), which unmounted and destroyed the dashboard
and, on return, remounted and refetched it from scratch — discarding
filters, scope, scroll position, and already-loaded data. This addendum
supersedes that navigation model **at tablet/desktop only**; mobile
(`<768px`) is explicitly out of scope and keeps its existing route/bottom-
sheet mechanism (`AC-P4-04-11`–`15`, unchanged). No VM, API, BFF, or data
contract change — `CustomizeMetricsVM`, `SaveCustomizeRequest`, list
membership, selection limits, validation, ordering, and analytics are all
unchanged; this addendum is an interaction-architecture change only.

- **AC-P4-04-33** At `breakpoint.tablet` and `breakpoint.desktop`, opening
  Customize Metrics (from either dashboard entry point on S-P4-01) renders
  `w.customize.overlay` (`side-sheet` variant) in place over the still-live
  Performance Dashboard — no route navigation occurs, and the dashboard is
  not unmounted, remounted, or refetched merely to open or close the
  overlay. Its filters, scope, scroll position, and already-rendered card
  data remain exactly as they were before the overlay opened.
- **AC-P4-04-34** The backdrop dims and blocks all pointer and keyboard
  interaction with the dashboard while the overlay is open (extends
  `AC-P4-04-27`'s generic focus-trap/backdrop contract — now meaningful
  here specifically because the dashboard is provably still mounted and
  interactive underneath, not merely visible mid-unmount).
- **AC-P4-04-35** Close, Cancel, and Escape return focus to the dashboard
  control that opened the overlay (the "⋯" more-actions row or the "+ add
  focus metric" icon) without any dashboard rerender — restates
  `AC-P4-04-27`/`28` for this architecture, where the trigger control still
  exists in the DOM to receive that focus.
- **AC-P4-04-36** On successful Save, the dashboard's `priorityMetrics` and
  `focusMetrics` sections refetch and update in place using the same GET
  dashboard call the existing Filter-apply flow already issues
  (`AC-P4-01-38`'s `refetch`) — the rest of the dashboard (header, filter
  pills, scroll position) is undisturbed, and there is no interim full-page
  loading-skeleton state (unlike a filter change, which intentionally shows
  skeletons per I-01 — a Customize save is scoped to just the metric
  sections, so the previously-rendered cards stay visible until the
  refreshed data arrives).
- **AC-P4-04-37** (superseded by AC-P4-04-41, v2.0.0) Below `breakpoint.tablet`
  (<768px), none of the above applies: Customize Metrics still opens via its
  existing route and closes by navigating back, exactly as `AC-P4-04-11`–`15`
  already describe.

`widget-contracts.md`'s `w.customize.overlay` entry is updated (further
amended in v2.0.0 below): the `bottom-sheet` variant remains route-based
(mobile); the `side-sheet` variant is now documented as non-navigating/in-place
(tablet/desktop) — a real behavioral split between the two variants, not only
a CSS one.

See also the correlated S-P4-01 v1.5.15 addendum, which amends
`AC-P4-01-21`/I-03 to note this same exception for the "Customize Metrics"
more-action row at tablet/desktop.

# v2.0.0 addendum — TEAM Focus metric change + overlay opens in place everywhere (SPEC-2026-003)

**Breaking.** Requester instruction (conversation, 2026-09-24): when a user
selects New Recruit Contracted in SELF, TEAM must not show it under Priority
Metrics; it is an Other Focus Metric at TEAM too. The catalog drops the TEAM
category override (C1 2.0.0, C2 1.5.1), and MY config TEAM priority
constraints change from 9/9 to 8/8 (C4 3.0.0). SELF is unchanged.

Separately, the requester asked that opening Customize Metrics from the
Dashboard's More Actions row never navigate away from the Dashboard, at any
breakpoint. `AC-P4-04-37`'s mobile route-based entry is superseded: mobile
now opens the same `.cust-surface` overlay in place, rendered as the existing
bottom sheet (`B2` chrome, unchanged). The standalone `insights/customize-metrics`
route is kept as a direct-link fallback at every breakpoint (unchanged from
`AC-P4-04-37`'s prior text), including for the empty Other Focus Metrics "+"
control (S-P4-01 AC-P4-01-80).

- MY TEAM priority rows, all locked and reorderable: TPC, PTPC, CASE_COUNT,
  FYP, MANPOWER, ACTIVITY_RATIO, PRODUCTIVITY, AVERAGE_CASE_SIZE.
- MY TEAM focus list: FYC ✓, PERSISTENCY_CY ✓, PERSISTENCY_Y1 ☐,
  PERSISTENCY_Y2 ☐, NEW_RECRUIT_CONTRACTED ☐ (unselected by default).

**Added ACs**
- **AC-P4-04-38** (replaces AC-P4-04-08) TEAM shows exactly 8 locked,
  reorderable priority rows in MY — the list above, never
  NEW_RECRUIT_CONTRACTED; `constraints.priority` is `{ min: 8, max: 8,
  editable: false }`; save PUTs with `?scope=TEAM` and 8 priority codes.
- **AC-P4-04-39** At TEAM, NEW_RECRUIT_CONTRACTED renders in Other Focus
  Metrics as unlocked and unselected by default, and can be selected and
  saved within `constraints.focus.max`. Selecting or saving it at SELF never
  changes the TEAM lists (restates AC-P4-04-07 for this metric).
- **AC-P4-04-40** A TEAM preference document saved before 2.0.0 that lists
  NEW_RECRUIT_CONTRACTED in `priorityMetricCodes` is migrated per C1 2.0.0
  §5: GET returns the 8 remaining priority codes in their saved order, the
  metric appears unselected in focus, and the next Save succeeds.
- **AC-P4-04-41** (replaces AC-P4-04-37) Below `breakpoint.tablet` (<768px),
  the More Actions "Customize Metrics" row opens `.cust-surface` in place
  (bottom sheet, `B2` chrome unchanged) instead of navigating; Close/Cancel/
  Escape return to the Dashboard without a route change, restating
  `AC-P4-04-33`–`36` for this breakpoint. The `insights/customize-metrics`
  route continues to work as a direct-link fallback at every breakpoint.

Fixture `fixtures/customize-team.json` is updated to the 8 + 5 shape.
`widget-contracts.md`'s `w.customize.overlay` entry is updated: both the
`bottom-sheet` and `side-sheet` variants are now non-navigating/in-place; the
route is a fallback entry point only, not a variant-specific mechanic.

# v2.1.0 addendum — Section subheading copy removed (content-only)

The frontend's 2026-09-29 implementation drops the descriptive subtext under
each section heading ("Shown on homepage, in this order" under Priority
Metrics; "Tap to add to other focus metrics" under Other Focus Metrics) —
both sections now render the heading only, with no body copy beneath it.
Content keys `insights.customize.priorityDescription` and
`insights.customize.focusDescription` are retired.

- **AC-P4-04-42** Both `CustomizeSection` headings ("Priority Metrics",
  "Other Focus Metrics") render with no subheading/description text beneath
  them. The rows and their existing behavior (`AC-P4-04-01`–`41`) are
  unchanged; only the removed subtext is in scope here.

Not addressed by this addendum: the same frontend change also drops the
`shaded` prop from the Priority Metrics section, which `AC-P4-04-32`
documents as a shaded band distinguishing it from Other Focus Metrics. That
visual asymmetry is unconfirmed as intentionally removed rather than an
incidental side effect of this edit — recorded as **OQ-87** 🟡 (owner:
Product/UX); `AC-P4-04-32` stands unchanged pending confirmation.
