---
applyTo: "src/{app/api/**,lib/bff.ts,lib/persona.ts,lib/domain-client.ts,config/**}"
---

# Security instructions

Canonical contract: `AGENTS.md`. Standard:
`docs/security/security-standard.md`. Current posture and gaps:
`docs/security/README.md`. Risks: `docs/security/threat-model.md`.

## Enforce server-side

- **Authorization is authoritative at the BFF.** D-14 in `src/lib/bff.ts`: TEAM
  requires a leader, GROUP requires P2, otherwise 403 `BFF-4031`/`BFF-4032`. UI
  gating is advisory only — never rely on it alone.
- **Never weaken or bypass a guard** to make a screen or test pass.
- **Validate all input** before calling downstream: `parseLens()` allow-lists
  period, businessLine, basis, scope, teamView → 400 `BFF-4000`. Apply the same
  pattern to any new route.
- **Fail closed on configuration.** An unknown `LBU_CODE` throws in
  `src/config/lbu.ts`. Do not add a permissive default.
- **Server-only downstream access.** `src/lib/domain-client.ts` must never be
  imported by a client component; the browser only calls `/api/bff/v1/*`.
- **No tokens in `localStorage` / `sessionStorage`.**
- **No PII in logs, errors or telemetry** — no names, ids, phone numbers,
  addresses.
- **No market branching in security logic.**

## Tests are required

Any new or changed BFF behavior needs `tests/api/*` cases for both the allowed and
the rejected path, titled with the AC id. Examples:
`tests/api/dashboard.spec.ts`, `tests/api/lens-validation.spec.ts`.

## Do not overstate

Authentication is a **stub** `pa_persona` cookie. IdP integration, session
management, CSRF tokens, security headers and rate limiting are **not
implemented** in this repository. Do not generate code or comments claiming they
are, and flag CSRF explicitly when adding a state-changing endpoint.
