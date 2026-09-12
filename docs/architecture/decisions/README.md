# Architecture Decision Records

Short records of decisions that are easy to undo by accident. If you intend to
reverse one, update the ADR in the same pull request.

| ADR | Decision |
|---|---|
| [0001](0001-cdk-page-layer.md) | `src/cdk` is the page layer; `src/app` is routing only |
| [0002](0002-headless-dls-boundary.md) | `headless` owns behavior; `dls-stub` is the replaceable styled layer |
| [0003](0003-playwright-test-platform.md) | Playwright is the only test runner (unit + API + browser) |
| [0004](0004-vite-spa-and-bff-extraction.md) | Next.js removed: Vite + React Router SPA here, BFF folded into pa-be-dev |

Format: Status · Context · Decision · Consequences · Alternatives.
