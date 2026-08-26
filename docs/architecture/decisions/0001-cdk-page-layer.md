# ADR 0001 — `src/cdk` is the page layer; `src/app` is routing only

**Status:** Accepted

## Context

The app originally had `src/app/insights/*/page.tsx` importing screens from
`src/screens/*`. When the multi-LBU model from
[`../frontend-architecture.md`](../frontend-architecture.md) was adopted, a
`src/cdk` layer was added — but at first it only *wrapped* the screens:

```
route → CDK wrapper (one line) → src/screens/DashboardScreen → components
```

That wrapper added a layer without adding meaning, and it contradicted the
reference architecture, where the CDK folder holds the page implementations
themselves.

## Decision

`src/cdk/<feature>/<Feature><LBU|Common>.tsx` **is** the page. `src/screens` is
deleted.

- `src/app/**/page.tsx` reads route inputs (search params, persona cookie),
  calls `resolveCdk(feature)`, and renders it. Nothing else.
- A CDK page owns page state, data loading and layout, and composes
  `src/components`, `src/dls-stub` and `src/headless`.
- Market-specific page → `performance/PerformanceMY.tsx`. No market variation →
  `<feature>/<Feature>Common.tsx`, registered under the `common` key.
- Current repository state: only MY page specs are vendored, so every current
  page is an explicit `<Feature>MY.tsx` registration. The `common` fallback is
  retained for a future page verified identical across multiple supported LBUs.
- Page-local building blocks belong in `src/cdk/<feature>/parts/`. Anything used
  by two or more features moves to `src/components/`.
- CDK pages never define raw colors or sizes.

## Consequences

- One less indirection: the file named after the feature contains the screen.
- Adding a market means adding a CDK page plus a `src/config/lbu.ts` entry — no
  fork of `src/app`, `src/components`, `src/dls-stub` or `src/headless`.
- `tests/unit/architecture.spec.ts` locks resolution: LBU page first, then
  `common`, and every manifest feature must resolve.
- Because `registry.ts` imports every page eagerly, all insight routes currently
  share one bundle. Accepted for now; lazy registration is the follow-up.

## Alternatives considered

- **Keep `src/screens` and thin CDK wrappers.** Rejected: pure indirection, and
  it invites market logic to drift into shared screens.
- **Put pages directly in `src/app`.** Rejected: routes would then carry market
  branching, which is what the CDK registry exists to prevent.
