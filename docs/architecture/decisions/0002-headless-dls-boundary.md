# ADR 0002 — `headless` owns behavior; `dls-stub` is the replaceable styled layer

**Status:** Accepted

## Context

The real Prudential DLS is not available to this repository yet, but the screens
are built from measured Figma frames
([`../../design/figma-measurements.md`](../../design/figma-measurements.md)). We need
to build the UI now and adopt the real DLS later without rewriting pages.

## Decision

Two separate layers, with the styled one isolated as the swap target.

- `src/headless/` — behavior + accessibility only: Carousel, Collapse, Tabs,
  Switch, Checkbox, ReorderHandle (mouse/touch/pen + keyboard), Layer,
  RadioGroup, `clampPct`. No colors, no sizes, no class opinions; every visual
  hook arrives via `className`, `style` or render props.
- `src/dls-stub/` — the **only** styled layer. `dls.css` holds every raw value
  (color tokens are screenshot-derived; geometry tokens are measured from Figma).
  `index.tsx` exports the skinned primitives: Icon, Tag, ProgressBar,
  CarouselRow, BottomSheet, SheetRow, ScopePill, ToggleRow, MenuPopover,
  IconButton, PeriodButton, SectionTitleRow, RadioSheetList.
- CDK pages and `src/components/*` compose those two.
- Icons are `public/icons/{token}.svg`, tinted via CSS mask by `Icon`.
  `public/icons/MANIFEST.json` maps each token to its Figma node id.

**To adopt the real DLS:** replace `src/dls-stub/` keeping the export names and
props, and swap the SVGs in `public/icons/`. Nothing else changes.

## Consequences

- The DLS swap is contained to one folder plus the icon assets.
- Behavior and accessibility survive the swap, because they live in `headless`.
- Dependency direction is enforced by review and by the layer order in
  `AGENTS.md`: `app → cdk → components → dls-stub → headless`.
- Some inline layout styles still live in pages and in a few headless primitives.
  Those should migrate into `dls-stub` as DLS layout primitives appear.

## Alternatives considered

- **Tailwind or a component library.** Rejected: the DLS is the eventual owner of
  visual language; a second styling system would have to be removed later.
- **One combined UI folder.** Rejected: styling and behavior would be entangled,
  so swapping the DLS would put accessibility wiring at risk.
