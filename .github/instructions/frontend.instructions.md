---
applyTo: "src/{app,cdk,components,dls-stub,headless,config}/**/*.{ts,tsx,css}"
---

# Frontend instructions

Canonical contract: `AGENTS.md`. Rationale: ADR 0001 / ADR 0002 in
`docs/architecture/decisions/`.

## Layer direction (never invert)

```
app → cdk → components → dls-stub → headless
```

`components`, `dls-stub`, `headless` and `lib` must never import `@/cdk` or
`@/app`.

## Ownership

- `src/app/**/page.tsx` — routing only: read search params and the persona
  cookie, call `resolveCdk(feature)`, render. No fetching, no composition, no
  market conditionals.
- `src/cdk/<feature>/<Feature><LBU|Common>.tsx` — **the page**: page state, data
  loading, layout. Market variant first (`PerformanceMY.tsx`), otherwise
  `<Feature>Common.tsx`. All currently vendored pages are MY-specific and must
  use `<Feature>MY.tsx`; add `Common` only after multiple supported LBUs prove
  the page identical. Do not suggest recreating `src/screens/`.
- `src/cdk/<feature>/parts/` — page-local pieces. Shared by two or more features
  → `src/components/`.
- `src/dls-stub/dls.css` — the only file that may contain raw colors or sizes.
  Keep `src/app/globals.css` as a single `@import`.
- `src/headless/` — behavior and accessibility only.
- `src/config/lbu.ts` — validated, fail-closed `LBU_CODE` plus the route/feature
  manifest.

## Screen packages and reuse

- Read the Screen-ID package summary, reuse discovery and component decisions
  before implementation. Reuse mapped DLS/headless/domain components and BFF
  patterns before creating local code.
- Do not manually copy Figma icons/images into Web. Immutable Spec sync owns
  `public/spec-assets` and the generated typed registry.
- Visual details include exact typography, color, alpha, gradients, every shadow
  layer, border/radius, spacing, layout, image treatment, motion and all state
  variants. Missing approval is a Spec blocker, not a license to approximate.

## Content and data rules

- Contract changes require a validated frontend handoff and receipt evidence; never infer a missing field or country behavior.

- All user-visible strings go through `t('insights.…')`; new keys must be added to
  `vendor/spec/en.json` and the spec repo together.
- Import view-models from `@spec/performance-vm`; never redeclare or hand-write
  them.
- Money is a decimal string — format with `src/lib/format.ts`, never `parseFloat`.
- Render sections in BFF order; skip unknown types instead of throwing.
- Read `DeltaVM.display` for units; never infer them.

## Do not suggest

- Tailwind, CSS-in-JS, a component library, or a state-management library.
- Inline hex/rgb values or hard-coded pixel sizes outside `dls-stub/dls.css`.
- Fetch calls inside `src/app/**/page.tsx`.
