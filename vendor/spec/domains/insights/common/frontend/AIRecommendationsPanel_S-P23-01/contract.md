# S-P23-01 — AI Performance Recommendations Panel

| | |
|---|---|
| Screen ID / Version | `S-P23-01` · `specVersion 1.0.0` · Status: **Ready for build** (engine contract pending OQ-14) |
| Surface | Expandable panel inside S-P4-01 (region R3), both scopes |
| Widget | `w.reco.panel` · props `RecommendationsPanelVM` |
| BFF | Part of `PerformanceDashboardVM.recommendations.panel`; `POST /api/bff/v1/performance/recommendations/:id/feedback` |
| Domain ops | `listRecommendations` (panel payload) · `submitRecommendationFeedback` |
| Config | `dashboard.scopes.{scope}.features.recommendations.aiPanel` |
| Figma | 6588:16581 (collapsed banner) · 6588:16587 subtree (expanded, hidden state) |

## 1. Purpose
An engine-generated briefing pinned under the banner: what changed, why it
matters, one tap to act. Content is **data + codes**; only `trend.text` and
`narrative` arrive as engine-generated prose (pre-localised — OQ-14).

## 2. Anatomy & traceability

```
▾ Performance Recommendations            (banner, chevron)
┌──────────────────────────────────────────────┐
│ F1 Flag chips     "Performance drops flagged 🚨" "Historic pace exceeded"
│ F2 Highlight      "152K TPC secured" · "200K Goal (76%)" ▓▓▓░ · "8% above run-rate"
│ F3 Insight cards  "Average case size ↑ 5 spots this month"        ›
│                   "Critical Anomalies ↑ 5 spots this month"       ›
│                   "4 agents in your unit have hit critical …"
│ F4 CTA            ● View Team Drilldown                            ›
│ F5 Footer         ⟳ Generated on 2026-07-13 at 02:06        👍 👎
└──────────────────────────────────────────────┘
```

| # | Element | VM field | Domain API | Mongo (`recommendations`) |
|---|---|---|---|---|
| 1 | Flag chips (+severity tone) | `flags[].{code,severity}` → i18n `insights.reco.flag.{code}` | `panel.flags[]` | `panel.flags` |
| 2 | Highlight value ("152K TPC secured") | `highlight.{metricCode,achieved}` | `panel.highlight` | `panel.highlight` |
| 3 | Goal line + bar ("200K Goal (76%)") | `highlight.goal` | same | same |
| 4 | Run-rate line ("8% above run-rate") | `highlight.runRateDeltaPct` | same | same |
| 5 | Insight title + trend chip | `insights[].{titleCode,trend}` | `panel.insights[]` | `panel.insights` |
| 6 | Insight narrative | `insights[].narrative` | same | same |
| 7 | Insight tap → drilldown | `insights[].nav` | `insights[].cta.route` | same |
| 8 | Panel CTA ("View Team Drilldown") | `cta.{labelCode,nav}` | `panel.cta` | `panel.cta` |
| 9 | Generated timestamp | `generatedAt` → `insights.reco.generatedAt` | `panel.generatedAt` | `panel.generatedAt` |
| 10 | 👍/👎 (sticky selection) | `feedback` + POST `{rating}` | `submitRecommendationFeedback` | `recommendation_feedback` |

## 3. Behaviour & states
- Collapsed by default; expand state persists per session. Collapsed banner = v1.0.0 `RecommendationsEntryVM` behavior.
- `aiPanel=false` or `panel` absent ⇒ banner-only (nav to the list route). Panel fetch failure degrades to banner (`meta.failedSections += ["recommendations.panel"]`), never blocks the dashboard.
- TEAM scope panel targets team insights; the CTA route comes from the payload — never hard-coded.
- Feedback: optimistic highlight, POST fires, revert + toast on failure; one rating per generation, replaceable.
- Empty `insights[]` with flags present renders F1+F2+F5 only.

## 4. Acceptance criteria
- **AC-P23-01-01** Flag chip tone maps severity (CRITICAL→danger, WARNING→warning, INFO→info); order preserved from payload.
- **AC-P23-01-02** Highlight renders only supplied parts (no goal ⇒ no bar; no runRateDeltaPct ⇒ no run-rate line); "above/below" phrasing from the sign via i18n plural/select rules.
- **AC-P23-01-03** Insight cards without `nav` render non-tappable (no chevron).
- **AC-P23-01-04** A second 👍/👎 tap replaces the rating (idempotent POST); selection survives dashboard refetch via `feedback`.
- **AC-P23-01-05** Panel content never blocks or reflows priority cards while loading (skeleton within the panel shell).
- **AC-P23-01-06** All engine text renders as-is (no client truncation below 3 lines; ellipsis + expand beyond).

## 5. Analytics
`insights_reco_panel_expanded` · `insights_reco_insight_tapped {code}` ·
`insights_reco_cta_tapped` · `insights_reco_feedback {rating}`.

## 6. NFR & open questions
Panel adds ≤ 6 KB to the dashboard payload; feedback POST p95 ≤ 300 ms.
OQ-14 (engine ownership, localization pipeline, regeneration cadence — the
"⟳" glyph implies refresh; a manual-refresh op is **not** in v1.1.0).
