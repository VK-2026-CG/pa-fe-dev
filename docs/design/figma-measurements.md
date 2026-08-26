# Figma extraction — measured values (source of truth for the DLS stub)

Source: `od7f65KVKBKaettyAhNU2Z` (PRU Dashboard — Wireframes), section
**6588:16549 "P2, P3 - Uplifted Screens with Global DLS"** (page "Uplifted
Malaysia screens"), pulled via Figma MCP `get_metadata` and stored at
`/mnt/user-data/tool_results/…get_metadata….json`. Every number below is read
from that dump (node ids cited). Nothing here is invented.

> ⚠️ The P4 section (node `6588-9981`) could not be re-fetched — the Figma
> MCP hit the **Starter-plan tool-call limit** mid-task. These screens use the
> same Global-DLS components; verify P4-specific deltas + export icons via
> `download_assets` (ids in `public/icons/MANIFEST.json`) once quota resets.
> Colors/radii are NOT in metadata dumps; current color tokens come from the
> earlier screenshot review and are flagged for DLS replacement.

## Global frame
- Design width **375**, height 812 (`6588:16550`). Status bar 44
  (`Status_bar/white 6588:17312`), sheet/app header **375×56**
  (`Sheet Part / Header 6588:17313`); content top ≈ 99–102.
- Gutter **16** → content width **343**. Hairlines 343×1.

## Dashboard (Agent Leader - Self `6588:16550`; Team `6588:16929`)
- Quick-link rail (`6588:16556`): 4 tiles **80×122**, pitch **87.67** (gap
  7.67); icon tile **62×62** (glyphs 25×22–36×36); label 12/16 centered at
  y=78, 2-line capable.
- Section-title row (`6588:16578`): 343×24, title 16/24, trailing 12/16 link
  ("Customize Metric", hidden in Self).
- Recommendations (`Component 2 6588:16581`): **collapsed by default** — bar
  343×**44**, 16 pad, 16×16 sparkle, 14/20 title, 18×18 chevron; expanded
  body 343×299, pad 16: flags block 311×50 (line 24h + 🚨 18w), highlight
  ("152K TPC secured" + "200K Goal (76%)" + bar + "8% above run-rate"),
  insight rows w/ `arrow-right-s` trailing 24, CTA row (dot + "View Team
  Drilldown"), footer strip (refresh 18 + "Generated on …" 12/16 + thumbs).
- Priority header (`6588:16637`): "Priority Metrics (4)" 14/20; period Button
  ("YTD" + arrow-down-s); `more-horiz` button 35×35. Scheme `Switch-B` row
  343×**40** at y=47.
- **Priority metric row = CAROUSEL** (`Metrics row 6588:16671` / expanded
  `6588:17629`): cards **308×166**, pitch **324** (gap 16) inside the 343
  viewport → one card + ~19px peek. Card anatomy (pad **12**): header 36
  (title 14/20 + variant 12/16 muted, corner `arrow-right-up-line` **24×24**
  top-right); value block y=44 h=48 (value 20/28 bold + "/ goal|No Goal Set"
  14/20); delta row y=119 h=30 ("+27%" 14/20 tone + "vs last year" 14/20
  muted, then progress bar **343→284×6** rounded, fill e.g. 145/284).
- Focus row: label "Other Focus Metrics (n)" 12/16; **carousel of 280×80**
  simple cards (pitch 296) — value + delta, never goal.
- Priority Milestones (`6588:16764`): header 35h (title 14/20, "Set Goal"
  12/16 link, `add` icon-button 35×35/21); **carousel of 308×238** cards,
  pitch 320: pad 12; header 36 (program 14/20 + variant 12/16 + corner
  arrow); status row y=63 h=52 → two label/value pairs ("Current status"
  12/16 muted over value 16/24; right pair right-aligned) + progress 284×6;
  measures y=142 h=64: 3 columns **81w** at x 0/101.5/203 (label 12/16,
  achieved 16/24, "/target" 14/20 muted).
- Team adds `Switch button` scope pill **108×38** top-right (`6588:16960`).
- Footer row (`Customer Summary Card 6588:17798`): 343×**52** link card.

## Metric drilldown (TPC `6588:18604`)
- Context strip 343×**28**: `Tag` chips h28 gap 8; as-of Tag right-aligned.
- Gauge card: pad 16, title 16/24; `Gauge chart` **270×220** centered;
  legend pairs (7×6 dot + label 12/16 + value 16/24).
- YoY card 343×212: title 14/20; rows **38h** ("YTD 2026" 14/20 over
  "Collected" 12/16 muted; right value 16/24); 1px separators; growth row
  24h with right `Tag` badge 47×24. With-repricing card = 102h (one row).
- Breakdown: section label 14/20; table header row **40h**, body rows
  **48h**; first col **177**, value cols **116**; row width 525 → horizontal
  scroll.

## History (`6588:17261`)
- Filter pills h**32**, horizontally scrollable strip (extends past frame).
- "Data" bar 24h + window Button 24h (`arrow-left/right-s` 16 + label 12/16).
- Table: header 40h, rows 48h; CURRENT_YEAR cols 80 / 116 / 147
  (Month / 2026 / MoM). Footer `Icon button` 48×48 bottom-right.

## Sheets & menus
- Bottom sheet: header 375×56; option rows 343×**52** — leading icon 20,
  label 14/20 at x36, trailing `arrow-right-s` 20, 1px hairline.
- More-Action rows: Flag / Cached / Monitoring leading icons (see manifest).
- Dropdown menu 300w; rows per `6588:17223`.

## Customize Metrics (`S-P4-04`, screenshot reference)

> ⚠️ Unlike the sections above, these values are **screenshot-derived**, not
> Figma metadata. The supplied reference is 750 px wide at approximately 2×
> density, so the implementation targets the corresponding 375-base geometry.
> Replace these tokens with measured DLS exports when the source frame is
> available. The screenshot also contains API/FYI/Case Count 1800, which are not
> in the vendored contract; the UI intentionally renders the BFF metric list.

- White full-height sheet with content gutter **16**, header **56** high, page
  title 20/28 and a right-aligned 32×32 Close target.
- Section gap **24**; heading 20/28; supporting copy 14/20 muted.
- Metric rows are separate rounded pills: minimum **56** high, **18** radius,
  18 horizontal padding, 14 vertical gap, neutral 1px border and soft shadow.
- Selection box **20×20**, 5 radius. Checked/locked priority uses a soft pink
  fill with white check; focus uses a dark neutral 2px outline.
- Priority rows alone show a six-dot (2×3) drag grip. The grip supports pointer
  drag and ArrowUp/ArrowDown keyboard reordering.
- Save remains explicit in a sticky action bar because S-P4-04 persists via PUT;
  Close and Cancel discard unsaved state.
