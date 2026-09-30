# Dashboard fixture provenance

Both fixtures are **synthetic canonical BFF payloads**, not source records,
mapping approvals, production examples or statements that an ingestion pipeline
is implemented. Never load these figures into a production read model.

| Fixture | Purpose | Provenance / limits |
|---|---|---|
| `dashboard-self.json` | Existing populated dashboard regression | Historical synthetic values retained, including FYC; does not claim that the supplied null-only FYC source is backed. `focusMetrics` wrapper aligned with existing C3 1.5.0; historical screen/config metadata retained |
| `dashboard-mixed-availability.json` | AC-P4-01-89–94: usable, PROCESSING and EMPTY cards together | Existing TPC/PTPC/FYP fixture values reused. FYC/persistency values omitted. PROCESSING is a hypothetical canonical response with approved relevant in-flight evidence; the schema export supplies no such evidence. `generatedAt` intentionally later than `asOfDate` to detect render-time freshness mistakes |

The mixed fixture isolates metric-state rendering: optional quick links/actions
and recommendations are suppressed for this harness, not a new MY configuration.
Metric selections and order reuse the SELF fixture. Scheme visibility is false
for a synthetic principal without segment entitlement; no entitlement ruling is
inferred from `scheme_type: null`. Milestone empty/add behavior reuses C3.

Test variations for AC-P4-01-95 use a CASE_COUNT zero scalar instead of PROCESSING.
For AC-P4-01-96, use the existing canonical TEAM PRODUCTIVITY value `9.7`
from the VM/widget contract; this is not approval to rescale any MAPA integer.
No source-to-canonical numeric sample is invented to resolve an open question.

`scripts/validate-fixtures.ts` registers both JSON files following the existing
cast-based smoke-check convention. `scripts/validate-performance-source.test.mjs`
checks evidence and fixture invariants. These checks do not execute the
application UI or certify the downstream AC implementation tests.