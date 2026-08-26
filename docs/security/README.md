# Security

| Document | Scope |
|---|---|
| [`security-standard.md`](security-standard.md) | The platform security standard (financial services, SSR-first Next.js) |
| [`threat-model.md`](threat-model.md) | Primary risks and the controls that answer them |

Repository entry point: [`../../SECURITY.md`](../../SECURITY.md).

## What is enforced in this repository today

| Requirement | Where |
|---|---|
| Market config fails closed (standard §10) | `src/config/lbu.ts` — unknown `LBU_CODE` throws |
| Authorization is authoritative at the BFF (§4) | `src/lib/bff.ts` — TEAM ⇒ leader, GROUP ⇒ P2, else 403 `BFF-4031/4032` |
| Input validation before downstream calls | `src/lib/bff.ts` `parseLens()` → 400 `BFF-4000` |
| No direct downstream integration from the browser (§14) | `src/lib/domain-client.ts` is server-side only; pages call `/api/bff/v1/*` |
| Identity resolution | `src/lib/persona.ts` + `getPersona()` (stub `pa_persona` cookie) |
| Entitlement regression lock | `tests/api/dashboard.spec.ts` |
| Invalid-input regression lock | `tests/api/lens-validation.spec.ts` |
| No unexpected client errors | `tests/support/console.ts`, asserted in `tests/e2e/*` |

## Not implemented here (documented targets)

This app is a spec-driven implementation with a **stub persona cookie**, not
production authentication. The following remain requirements for the real
deployment and are not satisfied by this repository:

- External IdP (PingID / Azure AD), opaque HttpOnly session cookies, session
  refresh, idle/absolute timeouts, step-up auth (§3)
- mTLS and service authentication between Next.js and the BFF (§5)
- Security headers: HSTS, CSP, `frame-ancestors`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy` (§6)
- CSRF token validation for state-changing requests (§7)
- Log redaction, PII masking, telemetry restrictions (§8)
- Rate limiting, brute-force detection, lockout, bot mitigation (§9)
- Correlation IDs, structured logs, security event logging, audit retention (§11)
- SAST, dependency/secret scanning, artifact signing (§12)

Do not describe any of the above as done. If you add one, update this table and
add a test.

## Rules for agents and contributors

- Never weaken an entitlement guard to make a screen work.
- Never move authorization into the UI only — the UI may gate for usability, the
  BFF decides.
- Never put tokens in `localStorage` or `sessionStorage`.
- Never add a market branch to security logic.
- Never accept runtime config without validation.
- Never log or emit PII (names, ids, phone numbers, addresses).
