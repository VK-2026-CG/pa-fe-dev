# CA-09 — Historic Contest Library

| | |
|---|---|
| Screen | `CA-09` (legacy alias `CA-DRAFT-09`) · `0.1.0` · **Draft** |
| Route/BFF | `/contest-admin/historic-contests` · `GET .../historic-contests` → `HistoricContestLibraryVM` |
| Domain | `listHistoricContests`, `archiveContest`, `reactivateContest`, `getContestBrochure` |
| Design | `app/page.tsx:261-270` |

Browse `COMPLETED`, `CANCELLED` and `ARCHIVED` contests. Search/filter are
server-side. `TRACKING` is excluded. Delete performs audited soft archive and
never removes versions, results, runs, approvals, brochures or audit evidence.
Reactivate selects an immutable base version, requires rationale and creates a
new mutable draft with base ID/checksum provenance. Brochure metadata is listed
without fetching PDF bytes; View streams the authorized PDF through the BFF.

**AC-CA-09-01** Historic list contains only terminal/archived contests and round-trips server filters.
**AC-CA-09-02** Delete archives with ETag/idempotency and preserves all immutable evidence.
**AC-CA-09-03** Reactivate creates a new draft and never unlocks the selected base version.
**AC-CA-09-04** Brochure metadata renders safely; PDF is fetched only on explicit View.
**AC-CA-09-05** Missing/unavailable brochure and unknown status render safely.
**AC-CA-09-06** Active/tracking archive/reactivation conflicts surface without local state loss.
Events contain IDs/status/action only, never brochure filename/content, search
text, configuration or rule values. OQ-CA-04/15/16 apply.
