# CA-06 — Contest Rule Library

| | |
|---|---|
| Screen | `CA-06` (legacy alias `CA-DRAFT-06`) · `0.1.0` · **Draft** |
| Route/BFF | `/contest-admin/rules` · `/contest-admin/rules/:assetId/versions/:ruleVersionId` |
| Domain | `listReusableRules`, `createReusableRule`, `getReusableRuleVersion`, `patchReusableRuleVersion`, `validateReusableRuleVersion` |
| Design | `app/page.tsx:265-272` |

Search/version reusable eligibility, calculation, persistency, governance and
precedence rules. Adoption count is API-derived. Application to a draft pins
the approved rule version/checksum; upgrade requires diff/impact review.

**AC-CA-06-01** Search/type/status filters are server-driven.
**AC-CA-06-02** Only approved versions are normally applicable.
**AC-CA-06-03** Upgrade never silently changes existing snapshots.
**AC-CA-06-04** Unknown rule type remains readable but non-editable.
**AC-CA-06-05** Creating a rule opens its draft version editor; the maker can add nested ALL/ANY/NOT groups and typed predicates, save, and reload the same expression.
**AC-CA-06-06** Only DRAFT rule versions are editable; approved versions are opened read-only and changes require a new version.
No expression values in telemetry. OQ-CA-09 applies.
