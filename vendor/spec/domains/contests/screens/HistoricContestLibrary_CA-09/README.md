# Historic Contest Library — CA-09

| Property | Value |
|---|---|
| Screen ID | `CA-09` |
| Legacy alias | `CA-DRAFT-09` |
| Package | `HistoricContestLibrary_CA-09` |
| Status | **DRAFT** |
| Route | `/contest-admin/historic-contests` |

## Identity correction

The legacy Historic Contest document incorrectly used `CA-DRAFT-05`. Numeric alias policy assigns Historic Contest Library to `CA-09` with alias `CA-DRAFT-09`; its acceptance criteria are now `AC-CA-09-*`.

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
