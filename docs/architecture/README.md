# Architecture

| Document | Scope |
|---|---|
| [`system-overview.md`](system-overview.md) | Platform-wide: product, LBUs, BFF, data, deployment |
| [`frontend-architecture.md`](frontend-architecture.md) | Target Next.js folder/layer model and LBU resolution |
| [`decisions/`](decisions/README.md) | ADRs for the decisions actually taken in this repo |

## Implemented layering in this repository

```
src/app/**/page.tsx        routing only — read route inputs, resolveCdk(), render
        ↓
src/cdk/<feature>/         THE PAGE — page state, data loading, layout
        ↓
src/components/            reusable product widgets shared across pages
        ↓
src/dls-stub/              the only styled layer (DLS swap target)
        ↓
src/headless/              behavior + accessibility primitives, zero styling
```

Never let a lower layer import an upper one.

Supporting modules:

| Path | Responsibility |
|---|---|
| `src/config/lbu.ts` | Deployment `LBU_CODE` context + route/feature manifest, fail-closed |
| `src/cdk/registry.ts` | Feature → LBU page, with `common` fallback |
| `src/cdk/types.ts` | Typed props contract per feature |
| `src/lib/compose/*` | Pure, VM-typed BFF composition |
| `src/lib/bff.ts` | Lens validation + D-14 entitlement enforcement |
| `src/lib/domain-client.ts` | Server-only client for the Insights domain service |
| `vendor/spec/*` | Vendored contracts (VM types, i18n, MY screen config) |

## Adding a market

A new LBU is a `src/config/lbu.ts` entry, its CDK pages, and its spec. Never
fork `src/app`, `src/components`, `src/dls-stub` or `src/headless`.

## Known gaps versus the target architecture

These are deliberate and tracked, not oversights:

1. **Client-side data loading.** CDK pages are Client Components that fetch
   their own Route Handler after hydration. The target is SSR-first with a
   server-only data-access layer.
2. **Eager CDK imports.** `registry.ts` statically imports every page, so all
   insight routes share one bundle. Lazy per-feature registration would restore
   route-level code splitting.
3. **No middleware gate.** Route-manifest enforcement happens inside
   `resolveCdk()`, not at the edge. Persona/device shells (P1 desktop) do not
   exist yet.
4. **Single market.** Only `my` is registered, because only the MY spec is
   vendored.
5. **Untyped domain responses.** `src/lib/domain-client.ts` returns `any` for
   several endpoints; public BFF output is still VM-typed.
