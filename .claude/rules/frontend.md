---
paths:
  - "src/app/**"
  - "src/cdk/**"
  - "src/components/**"
  - "src/dls-stub/**"
  - "src/headless/**"
  - "src/config/**"
---

# Frontend rules

Canonical contract: `AGENTS.md`. Rationale: ADR 0001 and ADR 0002 in
`docs/architecture/decisions/`.

## Layer direction

```
app → cdk → components → dls-stub → headless
```

Never let a lower layer import an upper one. `components`, `dls-stub`,
`headless` and `lib` must not import `@/cdk` or `@/app`.

## Ownership

- `src/app/**/page.tsx` — routing only: read search params and the persona
  cookie, call `resolveCdk(feature)`, render. No fetching, no composition, no
  market branching.
- `src/cdk/<feature>/<Feature><LBU|Common>.tsx` — **the page**: page state, data
  loading, layout. Market-specific first (`PerformanceMY.tsx`), else
  `<Feature>Common.tsx`. All currently vendored pages are MY-specific and use
  `<Feature>MY.tsx`; add `Common` only after multiple supported LBUs prove the
  page identical. Do not create `src/screens/`.
- `src/cdk/<feature>/parts/` — page-local blocks. Used by two or more features →
  move to `src/components/`.
- `src/dls-stub/dls.css` — the only place raw colors/sizes may live.
  `src/app/globals.css` stays a single `@import`.
- `src/headless/` — behavior and accessibility only; no colors, sizes or class
  opinions.
- `src/config/lbu.ts` — deployment `LBU_CODE`, validated and fail-closed, plus
  the route/feature manifest. Adding a market means a config entry + CDKs + spec,
  never a fork of shared layers.

## Content and data

- Every user-visible string goes through `t('insights.…')`. Add new or changed
  copy to `src/i18n/en.local.json` (app-owned, overlays the vendored bundle);
  mirroring it into the spec is optional.
- Import view-models from `@spec/performance-vm`; never redeclare them.
- Money is a decimal string; format with `src/lib/format.ts`. No `parseFloat`.
- Render sections in BFF order; skip unknown section types rather than throwing.
- Read `DeltaVM.display` for units; never infer them.

## Icons

`public/icons/{token}.svg` via `dls-stub`'s `Icon`. Token → Figma node id is in
`public/icons/MANIFEST.json`. Measurements: `docs/design/figma-measurements.md`.
