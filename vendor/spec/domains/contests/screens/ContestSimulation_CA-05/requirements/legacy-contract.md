# CA-05 — Contest Simulation

| | |
|---|---|
| Screen | `CA-05` (legacy alias `CA-DRAFT-05`) · `0.1.0` · **Draft** |
| Route | `/contest-admin/contests/:contestId/versions/:versionId/simulations` |
| BFF | `.../simulations` → `SimulationWorkspaceVM` |
| Domain | `startContestSimulation`, `getContestSimulation` |
| Design | rule sample card and review impact panel |

Run synthetic participant explanation or source-snapshot portfolio impact.
Portfolio runs are async, pinned to version/checksum, source business date,
mapping/LOV and engine versions. Results show counts and movement, with
restricted participant detail.

**AC-CA-05-01** Request records every pinned input version.
**AC-CA-05-02** Polling stops at terminal state and tolerates reload.
**AC-CA-05-03** Explanation reports each rule node and rejected higher tier.
**AC-CA-05-04** Failed/quarantined records reconcile with processed population.
**AC-CA-05-05** Analytics contains job type/status/count band only—no inputs/results.
OQ-CA-09/10/12/16 apply.
