# CA-07 — Approval Inbox

| | |
|---|---|
| Screen | `CA-07` (legacy alias `CA-DRAFT-07`) · `0.1.0` · **Draft** |
| Route | `/contest-admin/approvals?inbox=ASSIGNED|SUBMITTED|COMPLETED` |
| BFF | `GET .../approvals` → `ApprovalInboxVM` |
| Domain | `listApprovals`, `getApproval`, `decideApproval` |
| Design | `app/page.tsx:274` and review approval panel |

Inbox shows material changes, validation, risk, effective date and SLA. Decision
view reads frozen checksum; approve/return/reject requires assigned current
stage, fresh ETag and idempotency key. Return requires comment. Self-decision is
hidden and rejected server-side.

**AC-CA-07-01** Tabs/counts reflect domain inbox, not client filtering.
**AC-CA-07-02** Creator/submitter cannot decide (`CON-4032`).
**AC-CA-07-03** Stale stage/checksum cannot decide (`CON-4092`).
**AC-CA-07-04** Duplicate idempotent decision creates one record.
**AC-CA-07-05** Return requires comment and creates a new editable draft path.
Telemetry excludes comments, names and diff values. OQ-CA-04/05 apply.
