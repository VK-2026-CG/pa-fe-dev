# Cross-layer bug localization

Do not assume a visible browser symptom is a frontend defect. Compare expected
and actual values through:

`Spec -> interaction/render -> UI state/request -> BFF VM composition ->
Backend API -> service/calculation -> data source/Mongo -> runtime config`.

Use the approved traceability table, route, labels, VM/API fields, operation IDs
and AC IDs. Reproduce with the smallest Playwright test, request or endpoint
call. The first boundary that diverges from the approved contract identifies the
likely owning layer. Never add a UI fallback that conceals an upstream error.

Classify before editing as `IMPLEMENTATION_DEFECT`, `TEST_DEFECT`, `DATA_DEFECT`,
`CONFIGURATION_DEFECT`, `SPEC_DEFECT`, `NEW_REQUIREMENT` or `UNKNOWN`.
`SPEC_DEFECT` and `NEW_REQUIREMENT` require `/update-spec`; `UNKNOWN` requires a
prioritized evidence request. Separate emergency containment from permanent
behavior.

Before editing, report bug Jira, Spec/version/AC, classification, owner/layer,
confidence, evidence and proposed correction. If backend owns the first failing
boundary, stop frontend work and recommend
`/fix-backend-bug <BUG-JIRA> <SPEC-ID>`.