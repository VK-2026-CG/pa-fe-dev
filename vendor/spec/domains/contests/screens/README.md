# Contest Administration screen catalog

Screen packages use `<MeaningfulPascalCaseName>_<StableID>`. The stable `CA-xx` identity survives lifecycle changes; `DRAFT`, `READY`, and later statuses belong only in registry/manifest fields. Existing `CA-DRAFT-xx` references are aliases during migration and must not be emitted as new IDs.

See [`../../../docs/spec-agent-input-guide.md`](../../../docs/spec-agent-input-guide.md) before requesting a new or changed screen.

`screen-registry.json` is the naming and alias registry. `ContestPortfolio_CA-01` is the first complete vertical pilot. Entries marked `PLANNED` intentionally have no empty package: create one from `templates/screen-package` only when enough contract material exists to produce a useful human summary and explicit blockers.