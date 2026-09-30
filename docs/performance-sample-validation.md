# Performance mock-sample browser fix — SPEC-2026-002 0.2.0-draft

## Defect and reproduction

The imported values were present in MongoDB and available through the backend.
Browser reproduction on the existing port-3600 dashboard showed HTTP 200 for
`businessLine=ALL&basis=STANDARD&scope=SELF`, with the configured production
identity header, zero populated cards and six EMPTY cards. The approved backend
profile supports INSURANCE, not an inferred combined ALL total. This was a
frontend initial-filter and sample-selection gap, not missing imported values.

Existing uncommitted frontend fixed-agent headers, persona comments, Vite env
configuration and their tests were preserved and extended, not overwritten.
No backend source values, collection mappings, identities or authorization rules
were changed by this browser fix. No additional database writes were performed.

## Implementation

- `src/lib/performanceMock.ts`: validates configured profiles; stores only the
  selected profile ID; resolves initial sample lenses and safe offline defaults.
- `src/lib/apiClient.ts`: attaches the selected configured identity to existing
  Performance requests only. Explicit request headers remain respected; Contest
  identity behavior is unchanged. No filter rewriting or metric calculation.
- `src/cdk/performance/PerformanceMY.tsx`: initializes the supported mock lens;
  uses the sample selector when configured and the existing persona picker otherwise.
- `src/cdk/performance/parts/PerformanceSamplePicker.tsx`: reuses existing native
  select styling; reloads the dashboard when selecting a different source agent.
- `vite.config.ts`: reads a local profile file only for the development server;
  all builds exclude that profile list. Fixed-agent support is preserved.
- Five `insights.dev.sample.*` keys are identical in the Spec domain bundle and
  vendored frontend copy. No new visual values, assets, API endpoints or VM fields.
- Playwright orchestration uses cross-platform process/env configuration, isolated
  offline regression ports, and explicitly disables local mock settings for those
  regression tests. Live mock tests own a separate Vite server, not the user's API.

## Verification results

| Check | Result |
|---|---|
| Initial browser reproduction | Confirmed six empty cards caused by ALL |
| `npm run typecheck` | PASS |
| `npm run test:unit` | PASS — 29 pure-module tests |
| Full Playwright suite on isolated ports 3603/4603 | PASS — 76 tests, including unit/mobile/desktop regression projects |
| `npm run test:mock` | PASS — 6 mobile/desktop checks against the real imported-source API |
| `npm run build` | PASS |
| Production preview | PASS — development sample selector absent |
| Production bundle scan | PASS — configured MAPA/persistency identities not bundled |
| Existing dev page, port 3600 | PASS — selector visible and production TPC displays RM 48,546.12 |
| New i18n copy | PASS — all five keys match canonical Spec copy |

Live browser checks assert production TPC RM 48,546.12, PTPC RM 29,248.02,
FYP RM 68,779.01 and case count 8. MAPA asserts manpower 12, activity 12%,
productivity 1.0 and average case size RM 3,922. Persistency asserts CY 100%
and Y1 detail 88%, including reload/detail identity preservation. Console errors
and missing-i18n warnings were absent in the touched live browser journeys.
Unavailable FYC and cross-source values remain EMPTY; no values are fabricated.

## Acceptance traceability

| AC | Tests |
|---|---|
| AC-PA-DIRECT-12 | Unit initial-lens test; production browser scenario |
| AC-PA-DIRECT-13 | Unit profile/lens test; MAPA browser scenario |
| AC-PA-DIRECT-14 | Unit Group profile test; persistency browser detail scenario |
| AC-PA-DIRECT-15 | Unit stored-ID/fallback/Contest-header tests; browser reload/navigation |
| AC-PA-DIRECT-16 | Unit unconfigured behavior plus full offline regression suite |
| AC-PA-DIRECT-17 | Unit development/build gate; production bundle and preview checks |

Unit tests: `tests/unit/performance-mock.spec.ts`, preserving the pre-existing
`tests/unit/api-client.spec.ts`. Browser tests:
`tests/mock/performance-samples.spec.ts` (mobile and desktop projects).

## Limits and handoff state

Profiles are explicitly configured development selectors, not authentication.
The backend allowlist and tier guards remain authoritative. The production,
MAPA and persistency inputs belong to different agents; a combined complete
dashboard is not implied. Unsupported filters legitimately show EMPTY.

Spec and implementation remain uncommitted (informational only; handoff/receipt
status does not gate this work). No production readiness or pixel-perfect claim
is made. The Spec structure validator still has its pre-existing hardcoded
content-count and Windows path-exclusion failures; the five new copy keys do not
resolve those checks. API/VM versions and schemas are unchanged in this task.