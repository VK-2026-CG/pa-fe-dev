---
name: develop-frontend
description: Implement PRUAction frontend and BFF behavior by Spec ID or Jira ID, using the spec as reference.
argument-hint: "<spec-id-or-jira-id> [context]"
---

Execute `docs/agent-workflows/develop-frontend.md`; obey `AGENTS.md` and
path-scoped `.claude/rules/`. The request is `$ARGUMENTS`. Consult the relevant
Spec as reference (no READY/approval status needed), implement the behavior, run
internal synchronization and all validation, and report evidence. Do not stop at
a plan when edits are allowed.