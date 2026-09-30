# Contest Portfolio — CA-01

| Property | Value |
|---|---|
| Screen ID | `CA-01` (legacy `CA-DRAFT-01`) |
| Version | `0.2.0` |
| Status | **DRAFT** |
| Domain / Country | Contest Administration / MY |
| Route | `/contest-admin/contests` |
| Primary persona | Contest Maker |
| UX approval | Pending Figma/DLS completion |

## Executive summary

Contest Portfolio is the entry workspace for authorized Contest Administration users. It presents portfolio-wide metrics, actionable attention, URL-addressable search and filters, row-owned navigation, and two explicit creation origins: blank draft and brochure import. Metrics are domain-owned and must not be derived from visible rows. A supporting attention failure must leave the contest list usable.

## Requirements and approach

The frontend remains a thin App Router shell resolving the MY Contest CDK. The screen composition reuses the Contest shell, page header, async state, status adapter, domain client, governed VM, and canonical operations. The existing monolithic `ContestAdminMY.tsx` is implementation evidence, not permission to duplicate helpers. New visual values are forbidden: typography, colors, gradients, shadows, borders, radii, spacing, icons, motion and responsive behavior must resolve from this package or common tokens.

The BFF composes `ContestPortfolioVM` from `listContests` and `getContestOverview`; blank creation reuses `createContest`, while brochure creation reuses `startContestBrochureImport`. The browser never selects country or calls the domain directly.

## Required states

Loading, ready, no contests, empty filtered result, partial attention, denied, network/domain error with trace ID, overflow, unknown status, desktop table, and semantic mobile cards. Loading skeletons must preserve final geometry. All interactive elements require default, hover, focus-visible, pressed, disabled and busy definitions.

## Reuse summary

| Need | Decision | Reusable item |
|---|---|---|
| Contest shell | Reuse | `component.contests.shell` |
| Page header | Extend common after comparison | `component.global.page-header` |
| Loading/error state | Extend common after comparison | `component.global.async-state` |
| Status visuals | Reuse with Contest mapping | `component.global.status-tag` + `component.contests.status-adapter` |
| Domain calls | Reuse | `bff.contests.domain-call` |
| Portfolio composition | Keep screen-local | `portfolio()` in Contest service |
| Contest row/table composition | Create screen-local pending common table audit | No approved match yet |

## Existing implementation to inspect

- `src/cdk/contest-admin/ContestAdminMY.tsx`
- `src/dls-stub/index.tsx` and `src/headless/index.tsx`
- `src/lib/contest-admin/contest-service.ts`
- `src/lib/contest-admin/domain-client.ts`
- `domains/contests/common/fixtures/portfolio.json`

## Design source and blockers

The detailed files under `ux/`, `design/`, and `assets/` are the contract. Exact Contest Figma frames, approved font package, desktop breakpoints, state baselines, and exact icon exports are not yet available; therefore this package is intentionally DRAFT and cannot support a pixel-perfect completion claim.

## Acceptance summary

Completion requires URL round-trip, row-owned IDs, portfolio-wide metrics, partial-failure usability, safe unknown statuses, distinct creation origins, WCAG 2.2 AA behavior, approved responsive states, zero raw visual values, complete assets, and all required visual baselines passing.
