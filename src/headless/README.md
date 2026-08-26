# headless/ — behavior only, zero styling

Unstyled primitives: state + a11y wiring (including pointer/keyboard reorder), rendering only the elements they
must, all visuals injected via `className`/`style`/render props. The styled
skin lives in `src/dls-stub/` — **when the real Prudential DLS arrives,
replace `src/dls-stub/` and leave this folder and the screens untouched.**
