# Frontend and BFF bug workflow

Invocation: `/fix-frontend-bug <bug-jira-id> [spec-id] [context]`

1. Analyze accessible Jira PDF, description, route, screenshots/video, viewport,
   console/network output, logs, trace IDs, personas, environment and reproduction
   steps. Do not claim an inaccessible Jira URL was read.
2. Resolve the related Spec entrypoint from an explicit ID or screen, route,
   labels, VM/API fields, operation/AC IDs and supplied evidence. Ask for
   confirmation when ambiguous.
3. Consult the screen/design/VM/BFF/API/content/asset specs as reference and execute
   `bug-localization.md`, using Backend evidence when accessible.
4. Reproduce and classify before edits. If not reproducible, return
   `NEEDS_EVIDENCE` with verified facts and prioritized collection instructions.
5. For a clear UI, BFF, test, asset or frontend-config defect, add a regression
   test named `<AC-ID> / <BUG-JIRA-ID>`, make the smallest correct change and
   remove temporary diagnostics.
6. A spec defect/new requirement does not block a fix; decide on the merits and
   update the spec afterwards if useful. Do not patch UI/BFF when the backend or
   data is the first failing boundary.
7. Run focused checks, then applicable unit/API/E2E, typecheck, assets/design and
   build checks. Record meaningful fixes and verification in `CHANGELOG.md`.
8. Report localization, root cause, correction, visual and test evidence,
   validation, and any containment or backend/spec follow-up.