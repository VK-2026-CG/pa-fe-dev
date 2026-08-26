# Documentation

| Area | Start here |
|---|---|
| Architecture | [`architecture/README.md`](architecture/README.md) |
| Decisions (ADRs) | [`architecture/decisions/README.md`](architecture/decisions/README.md) |
| Security | [`security/README.md`](security/README.md) |
| Testing | [`testing/playwright.md`](testing/playwright.md) |
| Design measurements | [`design/figma-measurements.md`](design/figma-measurements.md) |

## Precedence (who wins when documents disagree)

1. `vendor/spec/*` — product contracts: VM types, i18n bundle, screen config
2. [`../AGENTS.md`](../AGENTS.md) — the shared, tool-neutral engineering contract
3. `docs/architecture/*` — rationale and target state
4. `docs/security/*` — security requirements
5. Tool entry points — [`../CLAUDE.md`](../CLAUDE.md), `.claude/rules/*`,
   `.github/copilot-instructions.md`, `.github/instructions/*`
6. [`../README.md`](../README.md) — developer onboarding, not normative

Tool-specific files never redefine shared rules; they only say how that tool
applies them.

## Reading the architecture docs

`architecture/system-overview.md` and `architecture/frontend-architecture.md`
describe the **full PRUAction platform target**, which is broader than this
repository. Each has a "Status in this repository" section separating what is
implemented here from what is still a target. Treat unimplemented sections as
direction, not as a description of current code.
