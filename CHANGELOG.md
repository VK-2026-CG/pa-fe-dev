# Changelog

## 2026-10-01
- Typography vs the Figma Customize Metric and Metric Detail (mobile) frames: audited 186 text elements across the dashboard, More Actions, Customize sheet and six metric-detail screens. Only the SVG chart text was off-scale: the gauge centre value is now Heading 1 (32/44 Bold, was 26px), bar/point value labels 12px (was 11.5px), and chart values, deltas and points got Figma line heights. Added tokens `--fs-subtitle1` (16/24 Bold) and `--ls-heading2` (-0.25px).
- Typography audit against the Figma text styles (477 rendered text elements on 9 screens at mobile and desktop): every element is now Open Sans in a Figma size/line-height/weight. Snapped Team Drilldown (title 21/34px → 20/28 Bold; names 18/20 Medium → 18/24 Bold; role, ID, KPI, breadcrumb, badge, subteam, "As of" and avatar text), the viewing banner (17 → 18/24), the desktop Performance title (28 → 20/28), scope label and count badge (Bold → SemiBold), Filter label (16 → 14/20) and the primary Team Drilldown button (Button Text 16/24). Layout inside Team Drilldown shifts slightly where text got smaller.
- Typography aligned to the Figma DLS text styles (Open Sans; fonts only): added tokens `--fw-*` (Regular 400 / Medium 500 / SemiBold 600 / Bold 700), `--fs-heading1/5`, `--fs-button`/`--lh-button`/`--ls-button` (16/24, -0.15px), `--fs-caption-xs` and `--fs-caption1`. All 131 `font-weight` declarations now use the scale (650→600; 750/800/850/900→700). Buttons use Button Text (16/24 SemiBold). No colours, spacing or layout changed in this step.
- Mobile Performance dashboard (<768px) aligned to Figma frame 1171276044:
  - Layout: 16px top padding and 24px section spacing; Performance title 20/28.
  - Scope button 60×38 with 24px user icon; quick-link tiles 76×100 with 76×64 icon cards (radius 16, Elevation-Card shadow).
  - Metric Tracking 18/24 with 40×40 Filter/More buttons (24px icons); Business/Period chips 28px at 14/20.
  - Metric panels radius 16 with a 24px header and 20px count badge; metric cards 84px, border-only, title 14/20 #52525B, value 18/24 700.
  - Colour tokens moved to the Figma zinc palette on all breakpoints: text #18181B, muted #71717A, border #E4E4E7, success #15803D; new tokens for button border, card title, icon, badge and elevation shadow.
  - Desktop layout is unchanged. Hooks `perf-head`, `perf-quick` and `perf-tracking` were added to the dashboard sections.
- Typography: the app font is Open Sans (variable 300–800, self-hosted via the new `@fontsource-variable/open-sans` dependency, loaded in `src/main.tsx`; `--font-stack` in `dls.css`). Contest Admin headings now use the same stack instead of Georgia. Weights 850/900 render at 800. Quick-link labels wrap between words only and may use 8px of the side gap, so "Compensation & Benefits" no longer splits mid-word.
- Specs are reference material, not gates: rewrote AGENTS.md, CLAUDE.md, Copilot/rules/skills/workflow and handoff docs; spec asset/sync integrity mismatches now warn instead of failing (unsafe-SVG checks still fail). Security, authorization and environment safeguards unchanged.
- Filter & Selection sheet: restored the Group toggle (AC-P4-01-57) at tablet/desktop for leaders whose VM has `teamViewToggleVisible` (P2). Before, an AM could not reach the Group view above mobile. Mobile keeps its View-sheet Direct/Group selector, and the Scheme toggle stays hidden.

## 2026-09-30
- Replaced READY-handoff development requirements with direct sync from the
  canonical spec working tree; changelog and application checks remain the local
  development record.
- Validation: `npm run sync:specs` passed; typecheck/tests/build could not run
  because this checkout has no `node_modules` (`tsc` unavailable).