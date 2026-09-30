# CA-04 — Contest Review and Submission

| | |
|---|---|
| Screen | `CA-04` (legacy alias `CA-DRAFT-04`) · `0.1.0` · **Draft** |
| Route | `/contest-admin/contests/:contestId/versions/:versionId/review` |
| BFF | `.../review` → `ReviewVM` |
| Domain | version/diff/validate; `submitContestVersion` |
| Design | `app/page.tsx:243-258` |

## 1–3
Review all sections, blocking/warning validations, semantic changes, frozen
approval route and impact evidence before attestation. Submit uses ETag and
idempotency key; success navigates to immutable approval instance. Blocking
issue, stale version or missing attestation disables/rejects submission.

Traceability: `sections`→configuration; `changes`→version diff;
`validation`→validation run; `approvalStages`→route snapshot;
`impact`→simulation; all persist in version/approval/run collections.

## 4. Acceptance criteria
- **AC-CA-04-01** Every builder section links to its exact step.
- **AC-CA-04-02** Material diff uses stable domain paths and base version.
- **AC-CA-04-03** Blocking validation or unchecked attestation prevents submit.
- **AC-CA-04-04** Submit freezes checksum and creates one approval on retries.
- **AC-CA-04-05** Concurrent edit returns conflict and does not submit stale content.

Analytics uses outcome/counts, never diff values/comments. OQ-CA-05/08 apply.
