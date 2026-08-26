import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { createHash } from 'node:crypto';

const manifestPath = resolve('public/spec-assets/MY/manifest.json');
if (!existsSync(manifestPath)) throw new Error('Spec assets not vendored; run immutable Spec sync before validation');
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const ids = new Set();
for (const asset of manifest.assets) {
  if (ids.has(asset.assetId)) throw new Error(`Duplicate assetId ${asset.assetId}`); ids.add(asset.assetId);
  const path = join(dirname(manifestPath), asset.file);
  if (!existsSync(path)) throw new Error(`Missing asset ${asset.file}`);
  const actual = createHash('sha256').update(readFileSync(path)).digest('hex');
  if (actual !== asset.sha256) throw new Error(`Checksum mismatch ${asset.file}`);
  if (asset.mediaType === 'image/svg+xml') {
    const svg = readFileSync(path, 'utf8');
    if (/<script|<foreignObject|\son[a-z]+\s*=|(?:href|src)=["']https?:/i.test(svg)) throw new Error(`Unsafe SVG ${asset.file}`);
  }
}
console.log(`Validated ${manifest.assets.length} local Spec assets.`);