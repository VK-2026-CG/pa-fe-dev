---
name: fix-frontend-bug
description: Investigate, localize, classify and fix a PRUAction frontend or BFF bug.
argument-hint: "<bug-jira-id> [spec-id] [context]"
---

Execute `docs/agent-workflows/fix-frontend-bug.md` and
`docs/agent-workflows/bug-localization.md`; obey `AGENTS.md` and path-scoped
rules. The request is `$ARGUMENTS` (`$0` is normally the bug Jira and `$1` the
optional Spec ID). Classify and localize before editing; do not assume frontend
ownership merely because this skill was invoked here.