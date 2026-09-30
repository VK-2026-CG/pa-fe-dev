# S-P4-05 — Milestones & Benefits

| | |
|---|---|
| Screen ID / Version | `S-P4-05` · `specVersion 0.9.0` · Status: **Draft** (contract ownership pending OQ-17/18) |
| Route | `insights/milestones` — the MILESTONES quick link + milestone-card ↗ destination |
| Widgets | `w.reco.banner` · tab bar · `w.benefit.card` |
| Figma | P4 uplift canvas, right column (Bonus & Benefits list + empty Key Contests) |

## 1. Purpose & anatomy
Programs and monetary benefits behind the dashboard milestone cards. Tabs:
**Bonus & Benefits** (benefit cards) · **Key Contests** (empty state designed;
content pack pending). Performance Recommendations banner persists on top.

## 2. Benefit card contract (proposed)

| Element | Field (proposed `BenefitCardVM`) | Notes |
|---|---|---|
| Title "High Producer Fringe Benefit (HPFB)" | `benefitCode` → i18n `insights.benefit.{code}.title` | |
| Rate chip "HPFB Rate: 3%" / "0%" | `rate.pct` + `rate.sentiment` | 0% renders danger tone in mock |
| "Assessment Year: 2026" | `assessmentYear` | |
| Progress bar 60K —▮70K— 89K | `progress?: { min, current, max }` (MetricScalar) | present on qualifying-band benefits only |
| Left accent (green/red, no bar) | `statusSentiment` | variant `accent` |
| "♡ Pin to home" | `pinned: boolean` + toggle action | pinning surfaces the item on S-P4-01 Priority Milestones — this is the dashboard "+" counterpart |
| "View details ›" | `nav` | detail screen not in this pack |

## 3. Contract placement (decision needed)
Benefit *facts* (rates, assessment bands, amounts) belong to a
**benefits/compensation bounded context**, not Insights. Proposed split:
- `GET /benefits/v1/agents/{agentId}/benefits?tab=BONUS|CONTESTS` → cards.
- Pinning is an Insights preference: proposed
  `PUT /insights/v1/agents/{agentId}/milestone-pins { pinnedCodes[] }`
  feeding `milestone_progress.priority` / a `milestone_pins` doc (OQ-17).
Until owners confirm, this spec is the requirements source; no OpenAPI edits.

## 4. Acceptance criteria (UI-level, contract-agnostic)
- **AC-P4-05-01** Rate chip tone: pct > 0 → success, = 0 → danger.
- **AC-P4-05-02** Progress bar renders min/max scale labels and the current value pinned to its position; absent `progress` ⇒ accent variant.
- **AC-P4-05-03** Pin toggle is optimistic with rollback + error toast; pinned state round-trips to the dashboard on next dashboard fetch.
- **AC-P4-05-04** Key Contests shows the designed empty card when the tab payload is empty.
- **AC-P4-05-05** Reco banner behaves exactly as S-P23-01 (shared instance).
- **AC-P4-05-06** Until real tablet/desktop baselines land (manifest blocker
  "Responsive/state visual baselines are incomplete" stays open), this
  screen stays pinned to its fluid mobile width (`--screen-max`, centered)
  at every breakpoint instead of inheriting `.shell`'s ≥768px width bump —
  this is a regression fix (the mobile-measured cards were stretching
  edge-to-edge and becoming unreadable above 768px), not a new tablet/
  desktop design. No VM/API change.

## 5. Analytics
`insights_benefits_viewed {tab}` · `insights_benefit_pinned {benefitCode, pinned}` · `insights_benefit_details_tapped {benefitCode}`.
