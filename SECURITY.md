# Security

This repository implements the PRUAction Performance module (UI + BFF) against a
financial-services security standard.

- **Standard:** [`docs/security/security-standard.md`](docs/security/security-standard.md)
- **Threat model:** [`docs/security/threat-model.md`](docs/security/threat-model.md)
- **What is enforced here today vs. still a target:** [`docs/security/README.md`](docs/security/README.md)

## Non-negotiable guardrails

- No tokens in browser storage (`localStorage` / `sessionStorage`).
- No direct downstream integration from the browser; nothing bypasses the BFF.
- Authorization is authoritative at the BFF — UI gating is advisory only.
- No PII in logs or analytics.
- No market branching in security logic.
- No runtime config without validation; unknown market config fails closed.

## Reporting a vulnerability

This is an internal Prudential project. Report suspected vulnerabilities through
the internal security channel for the PRUAction programme — do not open a public
issue and do not include sensitive data in a pull request.

> No public disclosure address is defined for this repository. Confirm the
> correct internal contact with the programme's security owner and record it here.

## Status of authentication in this repository

Authentication is a **stub**: the persona is read from a plain `pa_persona`
cookie so the designed states can be demonstrated. Real IdP integration, session
management, CSRF tokens, security headers, and rate limiting are **not**
implemented here. See `docs/security/README.md` for the full list before making
any claim about this app's security posture.
