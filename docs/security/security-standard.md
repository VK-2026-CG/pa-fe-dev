# Security Standard
PruAction Web Platform
Industry: Financial Services
Framework: Next.js (SSR-first)

---

## 1. Security Objectives
- Protect financial data
- Enforce least privilege
- Prevent token leakage
- Maintain auditability
- Support multi-country compliance (MY, VN, PH, ID)

Architecture reference:
→ architecture.md

---

## 2. Threat Model
Primary risks:
- Session hijacking
- Authorization bypass
- XSS / CSRF
- Token exposure
- Data exfiltration
- Abuse of search/auth endpoints
- Misconfigured country config

---

## 3. Authentication
- External IdP (PingID / Azure AD)
- HTTP-only Secure cookies preferred
- SameSite enforcement
- Session refresh centrally handled
- Idle + absolute timeout policies
- Step-up authentication support for sensitive actions

Tokens must never be stored in localStorage/sessionStorage.

---

## 4. Authorization
Enforced at:
1) UI (advisory gating)
2) BFF (authoritative enforcement)

Rules:
- Least privilege
- Explicit allow-lists
- Country-specific entitlement config
- No UI-only enforcement

---

## 5. Service-to-Service Security (New)
Between Next.js server and BFF:
- mTLS preferred
- Strong service authentication
- Strict allowlist of BFF domains
- Correlation ID propagation
- Rate limiting
- Circuit breaker policies

---

## 6. Web Security Controls
Mandatory headers:
- HSTS
- CSP (strict script-src)
- frame-ancestors
- X-Content-Type-Options
- Referrer-Policy
- Permissions-Policy

Recommended:
- Trusted Types (where feasible)

---

## 7. CSRF Protection
If cookies used for auth:
- SameSite enforcement
- CSRF token validation for state-changing requests

---

## 8. Data Protection & DLP (Enhanced)
Must implement:
- Log redaction policies
- Masking of PII
- No PII in analytics
- Hashing where identifiers required
- Country-specific retention rules

Telemetry must never include:
- Full names
- IDs
- Phone numbers
- Addresses

---

## 9. Abuse Protection
Protect:
- /auth endpoints
- /cases/search
- /clients/search
- Goal settings endpoints

Controls:
- Rate limiting per IP + user
- Brute force detection
- Generic error responses
- Lockout thresholds
- Bot mitigation

---

## 10. Config Integrity Controls (New)
Market config must:
- Be schema validated
- Fail closed
- Be versioned
- Be auditable
- Be fetched over secure channel

No runtime config injection without validation.

---

## 11. Observability & Audit
Required:
- Structured logs
- Correlation IDs
- User + role tagging (masked if required)
- Error categorization
- Security event logging

Audit logs retained per market regulation.

---

## 12. CI/CD Security Controls
- SAST
- Dependency scanning
- Secret scanning
- Environment isolation
- Artifact signing (recommended)
- No auto-merge of AI-generated code

---

## 13. Incident Response Preparedness
Must support:
- Log search by correlation ID
- Rapid config rollback
- Market-specific isolation
- Rate-limit escalation
- Feature flag disablement

---

## 14. Security Guardrails
Non-negotiable:
- No token in browser storage
- No direct downstream integration
- No bypass of BFF
- No PII in logs or analytics
- No market branching for security logic
- No config without schema validation
