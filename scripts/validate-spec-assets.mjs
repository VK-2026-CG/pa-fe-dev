import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

// Specs are reference material, not gates: missing/drifted Spec assets only warn.
// Unsafe SVG content is a security check and still fails.
const manifestPath = resolve('public/spec-assets/MY/manifest.json');
if (!existsSync(manifestPath)) {
  console.warn('Warning: Spec assets not vendored (public/spec-assets/MY/manifest.json missing); run `npm run sync:specs` to refresh. Skipping validation.');
  process.exit(0);
}
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const ids = new Set();
const warnings = [];
const unsafe = [];
for (const asset of manifest.assets) {
  if (ids.has(asset.assetId)) warnings.push(`Duplicate assetId ${asset.assetId}`); ids.add(asset.assetId);
  const path = join(dirname(manifestPath), asset.file);
  if (!existsSync(path)) { warnings.push(`Missing asset ${asset.file}`); continue; }
  const actual = createHash('sha256').update(readFileSync(path)).digest('hex');
  if (actual !== asset.sha256) warnings.push(`Checksum mismatch ${asset.file}`);
  if (asset.mediaType === 'image/svg+xml') {
    const svg = readFileSync(path, 'utf8');
    if (/<script|<foreignObject|\son[a-z]+\s*=|(?:href|src)=["']https?:/i.test(svg)) unsafe.push(`Unsafe SVG ${asset.file}`);
  }
}
for (const warning of warnings) console.warn(`Warning: ${warning}`);
if (unsafe.length) { console.error(unsafe.join('\n')); process.exit(1); }
console.log(`Validated ${manifest.assets.length} local Spec assets${warnings.length ? ` (${warnings.length} warning(s))` : ''}.`);
