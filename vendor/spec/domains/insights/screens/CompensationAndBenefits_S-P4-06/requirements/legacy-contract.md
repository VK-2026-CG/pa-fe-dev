# S-P4-06 — Compensation & Benefits

| | |
|---|---|
| Screen ID / Version | `S-P4-06` · `specVersion 0.9.0` · Status: **Draft** (domain ownership pending OQ-18) |
| Route | `insights/comp-ben` — the Comp & Ben quick link destination |
| Widgets | tab bar · `w.notice.banner` (INFO variant) · `w.comp.bonus-row` |
| Figma | P4 uplift canvas, bottom-right pair |

## 1. Anatomy
Tabs **Paid Commission** · **Retirement**. Rows (mock):
1st Year Persistency Bonus — RM 45,000 — **Paid** on Aug 12, 2026 (green accent);
2nd Year Persistency Bonus — RM 27,000 — Pending (amber);
HPFB — RM 33,495.7 — Pending. Chevron → detail (not in this pack).
Variant B prepends an INFO banner: "Values reflected are not up to date. These
will be updated on an ongoing basis" + "As on Date 2026-03-09" — i.e. a
**stale-data notice with its own watermark**, distinct from the header asOfDate.

## 2. Row contract (proposed `CompBonusRowVM`)

| Element | Field | Notes |
|---|---|---|
| Title | `bonusCode` → i18n `insights.compben.{code}.title` | codes e.g. PERSISTENCY_BONUS_Y1/Y2, HPFB |
| Amount | `amount: MoneyValue` | decimal string (33495.70 shows the 1-dp mock value verbatim — 2 dp max rule holds) |
| Status | `status: 'PAID' \| 'PENDING'` + `paidOn?: IsoDate` | accent + line ("Paid on {date}" / "Pending") |
| Stale notice | screen-level `staleness?: { asOnDate: IsoDate }` | renders the INFO banner via `w.notice.banner` |

## 3. Contract placement
Compensation facts come from the payout/commission system — proposed
`GET /benefits/v1/agents/{agentId}/compensation?tab=PAID_COMMISSION|RETIREMENT`.
Not an Insights read model; this spec is the requirements source until the
owning team lands its OpenAPI (OQ-18). Amounts must arrive as decimal strings
(D-04 applies across domains).

## 4. Acceptance criteria
- **AC-P4-06-01** Accent + status line derive solely from `status`/`paidOn` (PAID → success + "Paid on {date}"; PENDING → warning + "Pending").
- **AC-P4-06-02** The stale-data banner renders only when `staleness` is present, showing its own `asOnDate` — it never replaces or hides row data.
- **AC-P4-06-03** Tab switch refetches; empty tab uses the standard DLS empty state.
- **AC-P4-06-04** Amounts format via `formatMoney` (RM 33,495.70 from "33495.70") — no client rounding of the source string.

## 5. Analytics
`compben_viewed {tab}` · `compben_row_tapped {bonusCode}`.
