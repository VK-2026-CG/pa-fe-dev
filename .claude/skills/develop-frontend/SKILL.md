---
name: develop-frontend
description: Implement an approved PRUAction frontend and BFF specification by Spec ID or Jira ID.
argument-hint: "<spec-id-or-jira-id> [context]"
---

Execute `docs/agent-workflows/develop-frontend.md`; obey `AGENTS.md` and
path-scoped `.claude/rules/`. The request is `$ARGUMENTS`. Resolve the exact
READY Spec, implement its frontend actions, run internal synchronization and all
validation, and update evidence. Do not stop at a plan when edits are allowed.