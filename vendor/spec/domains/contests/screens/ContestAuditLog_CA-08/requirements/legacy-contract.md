# CA-08 — Contest Audit Log

| | |
|---|---|
| Screen | `CA-08` (legacy alias `CA-DRAFT-08`) · `0.1.0` · **Draft** |
| Route/BFF | `/contest-admin/audit` · `GET .../audit` → `AuditLogVM` |
| Domain | `listContestAuditEvents` (+ export operation before Ready) |
| Design | `app/page.tsx:276-281` |

Search/filter immutable configuration, workflow, publication and calculation
events. Detail disclosure is scope-restricted; export includes manifest and
hash-chain verification. Search terms stay out of telemetry.

**AC-CA-08-01** Cursor/date/type filtering preserves deterministic order.
**AC-CA-08-02** Restricted details remain hidden without audit scope.
**AC-CA-08-03** Export cannot claim success before verified job completion.
**AC-CA-08-04** Hash verification failure is visible and operationally alerted.
OQ-CA-15 defines retention/export format.
