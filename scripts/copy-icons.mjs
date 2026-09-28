/**
 * Copies the icon glyphs the Figma layers name (Remix Icon + Material Symbols
 * ids, verbatim from the design's layer names) into public/icons/{token}.svg.
 * Replace any file with a DLS export later — the manifest maps each token to
 * its Figma node id for `download_assets`.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);

const RX = (p) => require.resolve(`remixicon/icons/${p}`);
const MD = (p) => require.resolve(`@material-design-icons/svg/${p}`);

const MAP = {
  // quick links (Figma 6588:16560/16564/16568/16575)
  'quick.MILESTONES': RX('Business/medal-line.svg'),
  'quick.INTRODUCER_DRILLDOWN': RX('User & Faces/group-line.svg'),
  'quick.COMP_BEN': RX('Finance/trophy-fill.svg'),            // layer literally "trophy-fill"
  'quick.LEADERBOARD': RX('Business/bar-chart-grouped-line.svg'),
  'quick.TEAM_DRILLDOWN': RX('User & Faces/team-line.svg'),
  'quick.VIEW_MOC': RX('Finance/trophy-line.svg'),
  // card + chrome
  'arrow-right-up-line': RX('Arrows/arrow-right-up-line.svg'), // card corner (6588:17652)
  'external-link-line': RX('System/external-link-line.svg'),   // Penders link glyph (S-P4-02 v1.19.0; Figma node pending, OQ-76)
  'arrow-up-s': RX('Arrows/arrow-up-s-line.svg'),              // "Arrow Up" 6588:16586
  'arrow-down-s': RX('Arrows/arrow-down-s-line.svg'),
  'arrow-left-s': RX('Arrows/arrow-left-s-line.svg'),
  'arrow-right-s': RX('Arrows/arrow-right-s-line.svg'),        // "Arrow forward ios"
  'arrow-upward': MD('filled/arrow_upward.svg'),               // "Arrow Upward" 6588:16608
  'more-horiz': MD('filled/more_horiz.svg'),                   // "More Horiz" 6588:16669
  'refresh': MD('filled/refresh.svg'),                         // 6588:16630
  'thumb-up': MD('outlined/thumb_up.svg'),                     // 6588:16633
  'thumb-down': MD('outlined/thumb_down.svg'),
  'add': MD('filled/add.svg'),                                 // milestones "+" 6588:16769
  'sparkle': RX('Weather/sparkling-2-fill.svg'),               // reco bar glyph 6588:16584
  'close': MD('filled/close.svg'),                             // "Cancel"
  'check': MD('filled/check.svg'),                             // Customize selection tick
  'info': MD('filled/info.svg'),                               // "Info Filled"
  // More-Action sheet leading icons (6588:16901/16908/16915)
  'sheet.SET_GOALS': MD('outlined/flag.svg'),                  // "Flag"
  'sheet.CUSTOMIZE_METRICS': MD('outlined/cached.svg'),        // "Cached"
  'sheet.HISTORICAL_DATA': MD('outlined/insights.svg'), // classic stand-in for Symbols "Monitoring"
  // focus header trio (6588:17637/17639/17642)
  'activity': RX('Health & Medical/pulse-line.svg'),
  'hourglass-2-line': RX('System/hourglass-2-line.svg'),
  'flag': MD('outlined/flag.svg'),
  // Desktop Filter action (v1.4.0, screenshot-derived — no Figma node id)
  'filter': RX('System/filter-line.svg'),
  // Scope switcher trigger icon (S-P4-01 v1.5.9, AC-P4-01-42) — unapproved
  // placeholder pending a Figma-exported avatar asset (README OQ-24).
  'scope-avatar': RX('User & Faces/user-line.svg'),
};

mkdirSync('public/icons', { recursive: true });
let n = 0;
for (const [token, src] of Object.entries(MAP)) {
  const dest = `public/icons/${token}.svg`;
  if (!existsSync(src)) { console.warn('missing source', token, src); continue; }
  copyFileSync(src, dest); n++;
}
console.log(`copied ${n} icons`);
