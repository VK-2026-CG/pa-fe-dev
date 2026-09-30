# Qualification Rule Editor — CA-03

| Property | Value |
|---|---|
| Screen ID | `CA-03` |
| Legacy alias | `CA-DRAFT-03` |
| Package | `QualificationRuleEditor_CA-03` |
| Status | **DRAFT** |
| Route | `/contest-admin/contests/:contestId/versions/:versionId/rules/:ruleId` |

## Purpose and implementation contract

The behavioral contract migrated from the prior Contest Administration screen document is preserved in [requirements/legacy-contract.md](requirements/legacy-contract.md). It remains authoritative for existing behavior and acceptance criteria after the identity correction.

This package is not yet a pixel-accurate vertical contract. Before implementation readiness, it requires approved Figma frames, DLS/font sources, detailed UX states, responsive behavior, assets, reuse discovery, fixtures, traceability, accessibility evidence, and visual baselines.

## Existing code and contracts to inspect

- `domains/contests/api/contests.v1.yaml`
- `domains/contests/bff/contest-admin-vm.ts`
- `domains/contests/config/countries/MY/contest-admin.config.json`
- `domains/contests/common/frontend/widget-contracts.md`
- `domains/contests/common/registry.json`

## Delivery status

Structural migration is complete. UX and design readiness remain blocked; no pixel-perfect or `READY` claim is permitted.
