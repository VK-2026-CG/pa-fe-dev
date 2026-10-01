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

## Metric drilldown — Figma `22:15202` (desktop 1440×1024, TPC; same frame for PTPC/FYP)
Duplicate file `rOLUH9LzXjrSERiW8dkyIv`. Different variable modes than mobile (see the `--dd-*` overrides in `dls.css`): success `#22c55e`, Text-Subtle `#4b5563`, Text-Information `#3b82f6`, Icon-Information `#2563eb`, chip border `#f4f4f5`, page `#f3f4f6`, card drop `0 4 12 #00000008` only (Y-Outline/Blur-Outline 0); ring `#e5e7eb` outside, breakdown border `#d4d4d8` inside, as on mobile.
- Column 800 centred in the 1199 content area (x=199.5; the 240 nav + 64 header are host chrome). Back row 32h at y=24: back icon in a 32×32 box (`back` export, `#333`), 16, divider 1×24 `#dbdbdb`, 16, "Performance > TPC" 14/20 Regular (`#666`, `>` and the 8px gaps, current `#1a1a1a`); "As of dd/MM/yyyy" 11/16 `#7c7c7c` right. Title 32/44 Bold `#1a1a1a` at y=80; chips 28h at y=136 (12 apart); card y=176.
- Combined card 800×336: padding 24, gap 24; heading 18/24; row 240h = [Collected panel flex-1, centred: "Collected" 14/20 Medium `#71717a` over 32/44 Bold `#18181b`][1px `#e5e7eb` divider 240h][comparison flex-1, centred: "YTD Comparison" 14/20 Bold, rows py 6 (year only — no "Collected"; value 16/24 Bold, delta 12/16 SemiBold + 11/16 SemiBold `#71717a`), 2025 value `#4b5563`]. 
- Pair y=524: With repricing 394×128 and Penders 394×128, 12 apart (Penders: label top-left 14/20, link bottom-left 14/24 SemiBold `#3b82f6` + 16px `#2563eb` open_in_new). Breakdown block y=676 (24 below the pair): heading box y=688, cards y=720, 394×312, rows as on mobile (362 wide).

## Metric drilldown — Figma `1:16115` (mobile, TPC; same frame for PTPC/FYP) — supersedes `6588:18604` below
Duplicate file `rOLUH9LzXjrSERiW8dkyIv`; variables via `get_variable_defs`, edges/colours sampled from a native 375×1374 render.
- Page: bg `#f4f4f5`; host header 48 (not rendered); back row 24h at y=68 (`← Back` 14/20 Medium `#52525b`, as-of 11/16 `#7c7c7c`), title 28h (20/28 Bold, −0.25), chips 28h (Info Chip: 8/4 padding, 4 gap, 12 apart, text `#71717a`, border `#e4e4e7`, radius 8); 12px between blocks.
- Drilldown Card: 343 white box, **ring 1px `#e5e7eb` outside**, radius 16, padding 16, gap 24; shadows 0/1/2 `#0000001f` + 0/2/4 `#0000001a` + inner 0/1/0 `#00000014` over the ring's top row. Heading 18/24 Bold `#1a1a1a`; "Collected" 12/16 Medium `#71717a` over 16/24 Bold; Line = 0-high, 1px `#e5e7eb` drawn 1px above it; "YTD Comparison" 14/20 Bold; year rows py 6 (year 14/20 + "Collected" 11/16 `#71717a`; right value 16/24 Bold, delta 12/16 Medium); 2025 value `#52525b`. Heights: 312 / 128 (With repricing) / 56 (Penders).
- Penders: "Penders" 14/20; link 16/24 SemiBold −0.15 `#1d4ed8` + 16px `open_in_new` (`#3b82f6`) in a 2×4 padded box, 2 gap.
- Breakdown: heading 14/20 Medium `#1a1a1a` with 12px above/below; Content Card 343, **border 1px `#d4d4d8` inside**, radius 16, padding 16 (stroke overlays the padding), gap 16; title 14/20 Bold; rows 20h pair (label Medium `#52525b`, value Medium `#18181b`, halves 149.5 / 12 gap), 11px, 1px `#e5e7eb` hairline, 12px ⇒ 44px pitch; Total 24h (14/20 Bold `#52525b`, 16/24 Bold `#18181b`); card 312h.

## Metric drilldown (TPC `6588:18604`) — earlier measurements, superseded for TPC/PTPC/FYP by `1:16115` above
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

### Team Historical Data (S-P4-03 §B, ARVIJ-1450 — `9:11700` mobile, `9:11300` desktop)
Sources: the requester's Figma duplicate `rOLUH9LzXjrSERiW8dkyIv` (mobile PNG + desktop
1440 image at 2x). The Figma MCP hit its call limit before design context/tokens/fonts could
be read, so sizes come from node metadata and the two images, not tokens. Colours and type use
existing DLS tokens only; values marked *est.* are measured off an image and should be
re-checked against the real DLS.
- Mobile/tablet (<1024): back row (`← Back`, `As of dd/MM/yyyy` right, 11/16 muted), title bar
  (20/28 Bold + two **40×40** bordered icon buttons 8 apart: the red funnel Filter and the dark Download glyph),
  read-only context chips **28h**, 8 gap, scrolling strip. 12 month cards **343 wide**,
  12px gaps, 16px gutters, card **142h** with a change row (94h without one in Figma — we keep
  142 and show a muted "N/A", Jira AC12). Card interior *est.*: padding 12; month 14/20 muted;
  year label 12/16 muted over value 14/20 Bold, evenly spread; 1px hairline; pill **24h**
  (radius 4, 12/16 SemiBold, tone tokens) + 11/16 muted caption. Values have NO currency
  prefix; captions read "vs last month" (Current Year, MoM per Jira AC7) or "vs {year}" (the same month of that year).
- Desktop (>=1024, image at 2x): breadcrumb `Performance › Historical Data` left, `As of` right;
  Heading 1 title (32/44 *est.*) with an **outlined pill Filter button** (funnel + label,
  ~40h *est.*) and a **Download pill** (download glyph + label, same outlined pill) side by side on the right, 8 apart;
  the two read-only chips below the title, white fill, small radius, no visible border.
  One white card (radius 16, padding 24 *est.*) titled with the metric label (18/24 Bold),
  holding a full-width table of **equal-width columns** (six in the 2-year state):
  - header row **56h**, grey fill (`--color-bg`), bold 14/20 labels; `Month | 2026 | 2025 | 2024 |
    % Change vs LY | % Change vs L2Y` (Current Year: `Month | 2026 | MoM % Change` — month-over-month per the
    Jira story, January against the previous December; the other two compare the same month of earlier years);
  - body rows **72h**, hairline between rows (`--color-border-strong` *est.*); Month column
    left-aligned, regular weight, short names ("Jan"); value and change columns centred;
    values keep the currency prefix ("RM 25,246"); `-` for a missing value; plain "N/A" for a
    null change; change pills as on mobile (the image draws the 0% pill green — recorded as an
    open question; we follow the VM tone, neutral);
  - **Total row** (new, approved, AC-P4-03-32): last row inside the table, **56h**, grey fill, bold,
    label "Total", `totals.values` with the RM prefix, `totals.changes` as **bold toned text with no pill
    background** (green/red from the VM tone, plain "N/A" when null; the cell of a LAST_MONTH column
    stays EMPTY); no row when the VM has no `totals`. Desktop only.
  The app shell in the image (left navigation 240, global header 64) is not part of this app's
  pages, same as My Team, so it is not built.
- SELF and TEAM share this one layout (requester ruling): only the BFF scope and the data differ — SELF has
  no `teamView`, five metrics in the sheet, and the same Total row. The old SELF pills/pager/MoM table is gone.
- Download control (S-P4-03 §D, ARVIJ-1450-SP02): the icon button / pill above uses the Remix `download-2-line`
  glyph (`public/icons/download.svg`, manifest node id pending) and the same `.filter-btn` chrome as Filter;
  disabled until the VM has loaded. Its sheet has no Figma frame (Jira flow image only): the Filter sheet's
  `Drawer` + `RadioRows` (bottom sheet <768, 608px right drawer above) with "Selected Metric" / "All Metrics"
  radios, a 48h masked Password field (8 radius, `--color-border-strong`, 14/20), a 12/16 hint, and the red
  primary Download button. The PDF (A4 portrait, Helvetica/Helvetica-Bold, DLS colour tokens read from CSS) is
  a document layout of our own: no design frame exists.
- Tablet 768–1023: no frame; reuses the mobile cards. (OQ)
- Not in the images (taken from the Jira flow image): the Filter & Selection sheet. Built on the
  existing `Drawer` + `RadioRows` (bottom sheet <768, 608px right drawer above).
- Still guessed: pill radius/height on desktop (reused from mobile), the hairline and header
  colours (nearest tokens), table cell/header type size (14/20 *est.* from the image), card
  radius/padding, title sizes, the exact outlined-pill Filter geometry, and the empty-state /
  error / skeleton visuals (no frame).

### My Team (AM/SAM) mobile — requester duplicate `rOLUH9LzXjrSERiW8dkyIv`, frame `32:14048` (375×984)
Content starts at the frame's y=52 (host header not rendered). Rhythm (page-relative): Back row 16 (24h) · title 56 (28h, 20/28 Bold -0.25 `#18181b`) · search row 100 (40h: field `#fcfcfc`, border `#d4d4d8`, radius 8, 24px Search glyph at x9, text at 40, placeholder `#a1a1aa`; 40×40 filter button 12px away) · chips 156 (28h) · KPI tiles 195 (140×66: 8/12 padding, header 24 + 4 + value 20; radius 12, border `#e4e4e7`; 8 apart, scrolls) · panel 272 (343 wide, radius 16, padding 16, Elevation-Card; cards 16 apart).
- Member card (border `#dbdbdb` 1px inside p16, radius 16, 165h with badges): badges row 24 (12/16 Medium `#8b5cf6` on `#f5f3ff`, radius 4) · 16 · identity row (36px avatar radius 24, 16px gap, name 18/24 SemiBold `#1a1a1a` + role 14/20 `#71717a` 8px apart; second line id + 13.5px `#e4e4e7` divider + goal status: 24px Check `#22c55e` / Info `#f59e0b`, 8px gap, 14/20 `#52525b`) · 16 · metrics row 28 (labels `#71717a`, values `#1a1a1a`, 14/20, divider between) with the 30h team-count button at the right (border `#d4d4d8`, radius 7, Group 18 `#3f3f46`, count 14/20 `#52525b`, caret 16).
- The avatar slot is empty in the frame (profile pictures missing); the app uses the requester's default avatar there.

### Metric Detail desktop bar-comparison card — requester duplicate `rOLUH9LzXjrSERiW8dkyIv`, frame `22:16535` (1440×1024)
Same 800px column and header as the TPC desktop frame (22:15202); token mode: Text-Subtle `#4b5563`, Text-Success `#22c55e`, Chart-Information `#3b82f6`, Elevation-Card `0 4px 12px rgba(0,0,0,.03)`. Drill-down card `22:16767`: white box 800×288 with a 1px `#e5e7eb` ring OUTSIDE it (measured from the native 826×314 render: white x13–812, y9–296), padding 24, row gap 24, content row 240 high.
- Legend (card-local x24, y114–173): 8×18 pills (`rgba(219,234,254,.5)` over white = `#edf4fe` for the prior year, `#3b82f6` current), 24 apart, 12/16 SemiBold `#71717a`, 12px pill→label. Chart region x24–427 (403): legend, 40px gap, then the 311×202 plot centred in the remainder (plot origin x113.5, y43). Divider: 240×0 line, stroke `#e5e7eb`, at x451. Comparison column x475–776 (301): "YTD Comparison" 14/20 Bold `#18181b`, 12px gap, rows padded 6px (year 14/20 Regular `#18181b`; value 16/24 Bold `#18181b` / `#4b5563`; delta 12/16 SemiBold with the 11/16 SemiBold caption).
- Plot (311×202): axis labels 9px Bold `#71717a` at x12, gridlines x33–293 every 24px (`#f4f4f5`, zero `#e5e7eb`, 1px on the row's centre), top tick y39, zero y159, 12px per unit; bar columns 40 wide, centres x98.5 / 204.5, gap 66, value label 4px below the bar top (12/16 SemiBold, `#4b5563` prior / white current), year label 12/16 SemiBold `#4b5563` 8px under the bar, delta chip `#f0fdf4` radius 6, padding 4/2, text `#22c55e`, 4px above the bar. Bars: prior `rgba(219,234,254,.5)` over `#d4d4d8` (= `#d8dfeb`), current `#3b82f6`, top radius 8.

### Desktop Performance dashboard — requester duplicate `rOLUH9LzXjrSERiW8dkyIv`, frame `21:8393` (1440×1391)
Content column `21:8398` is **800 wide** (x=199.5 inside the 1199 main area; the app has no nav shell so it is centred in the viewport). Token mode: Rounded 56, Large 24, Text-Subtle `#4b5563`, Text-Success `#22c55e`, Text-Danger `#d2042d`, Outline-Subtle `#f4f4f5`, Elevation-Card `0 4px 12px rgba(0,0,0,.03)`. Panel radius is **24** here (corner arc sampled from the native render reaches the edge after 24px; the mobile frame's panels are 16).
Rows (y from column top): title 24 (h44, 32/44 Bold, scope button 122×40 at the right) · Top Navigation 92 (76×64 cards, gap 64, labels 12/16; glyphs Milestones 25×22 `1:428`, My Team 25×24 `1:432`, Leaderboard 28 `1:443`) · Metric Tracking 200 (h40: 20/28 Bold; Filter pill 100×40, more 40×40 at 8) · chips 252 (h28) · Priority panel 292 (800×456, radius 24: pad 16, header 24, grid 2×376 gap 16, cards 84) · Other Focus 760 (800×422, cards 106, 5 cards).
- Scope button `21:8407`: 16px Group glyph `I21:8407;3963:2465`, label "Team" 14/24 SemiBold, 16px Arrow Down; Filter `I21:8417` 16px glyph; more `I21:8418` 24px More Vert; Arrow Up `21:8524`.

### Historical Data — requester duplicate `rOLUH9LzXjrSERiW8dkyIv`, mobile `9:11700` (375) and desktop `9:11300` (1440)
Supersedes the *est.* values in the Team Historical Data section above where they differ. The two frames resolve different token modes:
mobile Rounded 8 / Text-Subtle `#52525b` / Tag success `#dcfce7`·`#15803d` / danger `#f7e4e8`·`#950320` / Outline-Subtle `#e4e4e7`;
desktop Rounded 56 / Text-Subtle `#4b5563` / Tag success `#f0fdf4`·`#22c55e` / danger `#fcf2f4`·`#d2042d` / Outline-Subtle `#f4f4f5`, Elevation-Card `0 4px 12px rgba(0,0,0,.03)`.
- Mobile (content origin y=52, p16, 12 between sections): Back row 24 (arrow 24 `#3f3f46` + 8 + "Back" 14/20 `#52525b`; "As of" 11/16 `#7c7c7c`) · title bar 40 (20/28 Bold -0.25; two 40×40 radius-8 buttons 8 apart, filter `#ed1b2d`, download `#71717a`) · chips 28 · cards 343×142: border 1px `#e5e7eb` inside p12, month 14/20 `#71717a`, years three 82px columns justify-between (12/16 `#7c7c7c` over 14/20 Bold, first `#1a1a1a`, others `#52525b`), hairline `#e4e4e7` on a 0-height frame (12 above/below), tags 24h radius 4 12/16 + 11/16 caption (`  vs 2025`, gap 2), groups 24 apart.
- Desktop (content origin 36,36): breadcrumb row 20 (14/20 `#71717a`, ">" text, current `#4b5563`; "As of" right) · title block y44: 32/44 Bold `#1a1a1a`, pills min 100×40 radius 56 border `#d4d4d8` px16 gap 2 (16px glyph in a 2px-inset box, label 14/24 SemiBold -0.15 in a 4px-inset box), chips y56 (28h, border `#f4f4f5`) · card y152, 1127×1072: border `#e5e7eb`, 24 padding, title 18/24 Bold at (24,24), table at y72: 6 equal columns, header 56 `#f3f4f6` Bold 14/20 `#4b5563` (Month left, rest centred), body 72 (Month Regular `#18181b`; "RM" Regular + 4px + number; tag 24h radius 8 12/16 SemiBold; "N/A" 14/20), Total row 56 `#f3f4f6` Bold, every row 1px `#d4d4d8` at the bottom.
- Icons: Arrow Back `I9:11729;35448:2031`, mobile Filter `I9:11738;10911:59648;19839:7817`, mobile Download `I9:11739;10911:59648;19839:7817`, desktop 16px Filter `I9:11319;3963:2465`, Download `I9:11320;3963:2465`.

### Mobile Performance dashboard — requester duplicate `rOLUH9LzXjrSERiW8dkyIv`, frame "Mobile" `1:4931` (375×1583)
Read with `get_design_context` (sparse → per-section calls), `get_variable_defs` and 1× `get_screenshot`s. **Trust
`get_variable_defs` and sampled pixels, not the hex/px fallbacks inside generated code**: for this file the code said
radius 24 / success `#22c55e` / title `#4b5563` / border `#f4f4f5`; the resolved tokens are Corner Radius Large **16**,
Rounded/Chip **8**, Text-Success `#15803d`, Text-Subtle `#52525b`, Outline-Subtle `#e4e4e7`, Outline-Default `#d4d4d8`,
Text-Danger = Tag-Danger-Text `#950320`, Icon-Strong `#3f3f46`, Icon-Subtle `#71717a`, Icon-Brand `#ed1b2d`; Elevation-Card =
`0 2px 4px rgba(0,0,0,.10)`, inset `0 1px 0 rgba(0,0,0,.08)`, `0 1px 2px rgba(0,0,0,.12)` (= `--shadow-elevation-card`).
Page content starts at the frame's y=51 (the app has no global header): title row y16 h38 · Top Navigation y78 (3 tiles
76×100, 76×64 card) · Metric Tracking y202 h40 · chips y254 h28 · Priority panel y294 (456) · Other Focus panel y762.
- Title row: "Performance" 20/28 Bold; scope button 60×38, radius 8, border `#d4d4d8`, User glyph 24 at x8.5 (`I1:…` `1:4984`), Arrow Down 16 at x36.5 (`1:4986`).
- Tiles (`I1:5003`): glyphs Milestones 25×22 (`;62:2176`), Compensation & Benefits trophy-fill 36 (`;62:2184`), Leaderboard 28 (`;62:2191`), all `#ED1B2D`; labels 12/16 SemiBold.
- Metric Tracking: 18/24 Bold; Filter (`I1:5012;19839:7817`) and More Vert (`I1:5013;19839:7817`) 40×40 buttons, 24px glyphs, 8 apart.
- Panels: pad 16, radius 16, header 24 (16/24 Bold + 24×20 badge `#f4f4f5` 12/16 SemiBold + Arrow Up 24 `1:5036`), 16 to the list.
- Priority metric card 84h (pad 12 incl. the 1px border, gap 12): title Subtitle 2 14/20 Bold + variant 14/20 Regular `#71717a`; value 18/24 Bold; delta 12/16 SemiBold, box 20h bottom-aligned (text 2px above the row bottom), suffix "vs last year" 12/16.
- Other Focus card **106h** (value row pinned to the bottom, header on top), suffix "vs last year" 10/16; persistency variant adds "/ Threshold: n%" (12/16) and a 10/16 "YTD Persistency as at dd/mm/yyyy" caption (not in `MetricCardVM`).
- Not built (no data/config): Priority Milestones panel (`1:5212`: radius-16 panel, 122h cards, 8h gradient bar, 32×32 add button, Arrow Right 24 `I1:5220;10801:224981`), "View MOC" summary card (`1:5344`: 343×52, `#f0f5fc`, border `#e6f0ff`, radius 12), AI bar, global header.

## Sheets & menus

### S-P4-01 mobile View sheet (v1.5.18 requester PNG)

Screenshot-derived, not measured Figma metadata: 750px source interpreted at
2x on a 375px canvas. Inset 8px, radius 16px, header 72px; option card has
16px gutters, 46px radio rows, 17px leading radios. P2 Team selector is 48px
high with 8px radius; its floating Direct/Group panel has 44px option rows,
16px radius and shadow. Footer buttons are 48px high with 8px gap. The open
menu reserves space above the footer; short viewports scroll the sheet.
Values are scoped to `.scope-sheet`; other sheets and desktop remain unchanged.
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
