# Threat model

Derived from [`security-standard.md`](security-standard.md) §1–§2 and narrowed to
this repository's surface: a Next.js app that serves UI **and** a BFF
(`/api/bff/v1/*`) in front of the Insights domain service.

## Objectives

- Protect financial data
- Enforce least privilege
- Prevent token leakage
- Maintain auditability
- Support multi-country compliance (MY, VN, PH, ID)

## Risks and current position

| Risk | Control | State here |
|---|---|---|
| **Authorization bypass** — an agent reads a leader's team data | Entitlement enforced server-side in `src/lib/bff.ts` (D-14): TEAM ⇒ leader, GROUP ⇒ P2, else 403 | Enforced; locked by `tests/api/dashboard.spec.ts` |
| **Injected/invalid lens input** | `parseLens()` allow-lists period, businessLine, basis, scope, teamView → 400 `BFF-4000` | Enforced; locked by `tests/api/lens-validation.spec.ts` |
| **Misconfigured market config** | `getLbuContext()` validates `LBU_CODE` and throws on anything unsupported | Enforced (fail-closed); locked by `tests/unit/architecture.spec.ts` |
| **BFF bypass / direct downstream calls** | The domain client is server-side only; the browser only reaches `/api/bff/v1/*` | Structurally true; not yet mechanically enforced with `server-only` |
| **Session hijacking** | Opaque HttpOnly Secure cookie, SameSite, refresh, timeouts | **Not implemented** — persona is a plain stub cookie (`pa_persona`) |
| **Token exposure** | No tokens in browser storage | No tokens exist in this app yet |
| **XSS** | React escaping, no `dangerouslySetInnerHTML`, strict CSP | Escaping yes; CSP **not implemented** |
| **CSRF** | SameSite + CSRF token on state-changing requests | **Not implemented** — customize PUT and feedback POST have no CSRF token |
| **Data exfiltration via logs/telemetry** | Redaction, PII masking, no PII in analytics | No analytics or structured logging in this app yet |
| **Endpoint abuse** | Rate limiting, lockout, generic errors, bot mitigation | **Not implemented** |
| **Unreviewed AI-generated code** | No auto-merge; review required | Process control, outside the codebase |

## Trust boundaries

```
Browser (untrusted)
  │  only /api/bff/v1/* + pages; stub pa_persona cookie today
Next.js server + BFF route handlers (trusted)
  │  validates lens input, enforces D-14 entitlement
  │  server-only domain client, INSIGHTS_API_URL
Insights domain service (trusted, internal)
```

The browser is never trusted. Any check performed in a CDK page is for usability
only; the BFF repeats every decision that matters.

## When you change something

- Adding a BFF route → validate every input and apply the entitlement guard, then
  add an `tests/api/*` case for both the allowed and the rejected path.
- Adding a market → the config must fail closed for unknown values.
- Adding a mutation → treat CSRF as an open gap; do not assume SameSite alone is
  the agreed answer. Raise it rather than silently shipping.
