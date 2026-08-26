---
paths:
  - "src/app/api/**"
  - "src/lib/bff.ts"
  - "src/lib/persona.ts"
  - "src/lib/domain-client.ts"
  - "src/config/**"
---

# Security rules

Canonical contract: `AGENTS.md`. Standard: `docs/security/security-standard.md`.
Current posture and gaps: `docs/security/README.md`. Risks:
`docs/security/threat-model.md`.

## Enforce, don't assume

- **Authorization is authoritative at the BFF.** D-14 lives in `src/lib/bff.ts`:
  TEAM requires a leader; GROUP requires P2; otherwise 403 with
  `BFF-4031`/`BFF-4032`. UI gating is advisory only.
- **Never weaken a guard** to make a screen or a test pass. If a screen needs
  wider access, that is a spec question.
- **Validate every input** before calling downstream. `parseLens()` allow-lists
  period, businessLine, basis, scope and teamView → 400 `BFF-4000`. New routes
  follow the same pattern.
- **Fail closed on config.** Unknown `LBU_CODE` throws in `src/config/lbu.ts`.
  Never add a permissive fallback.
- **Server-only downstream access.** `src/lib/domain-client.ts` is server-side;
  the browser only ever calls `/api/bff/v1/*`. Never import the domain client
  into a client component, and never let the browser reach the domain service.
- **No tokens in browser storage.** No `localStorage`/`sessionStorage` for
  credentials.
- **No PII in logs or telemetry** — no names, ids, phone numbers or addresses.
- **No market branching in security logic.**

## Test every guard

New or changed BFF behavior needs `tests/api/*` coverage for both the allowed and
the rejected path, with the AC id in the title. See
`tests/api/dashboard.spec.ts` (entitlement) and
`tests/api/lens-validation.spec.ts` (input).

## Do not overstate the posture

Authentication here is a **stub** `pa_persona` cookie. Real IdP integration,
session management, CSRF tokens, security headers and rate limiting are **not
implemented**. Do not describe them as done, and do not add a mutation while
assuming CSRF is already handled — raise it instead.
