#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
SPEC="${SPEC_DIR:-../pa-spec-dev}"
git -C "$SPEC" rev-parse --git-dir >/dev/null 2>&1 || { echo "PruactionSpec Git repo not found at $SPEC (set SPEC_DIR)"; exit 1; }
COMMIT="$(git -C "$SPEC" rev-parse HEAD)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP" "${STAGE:-}"' EXIT
# Specs are reference material, not gates: a missing spec artifact or asset
# checksum mismatch only warns and that item is skipped (the existing vendored
# copy is kept). Unsafe SVGs remain a hard error.
warn() { echo "Warning: $*" >&2; }
extract() { if [ -e "$SPEC/$1" ]; then cp "$SPEC/$1" "$2"; else warn "skipping missing spec artifact $1"; fi; }
copy_tree() { if [ -e "$1" ]; then cp -R "$1" "$2"; else warn "skipping missing spec path ${1#"$SPEC/"}"; fi; }
required=(
  domains/insights/bff/performance-vm.ts
  domains/insights/content/en.json
  domains/contests/content/en.json
  domains/insights/config/countries/MY/performance.config.json
  domains/insights/config/screen-config.schema.json
  domains/contests/bff/contest-admin-vm.ts
  domains/contests/api/contests.v1.yaml
  domains/contests/config/countries/MY/contest-admin.config.json
  domains/contests/common/fixtures
  common/registry.json
  common/assets/MY/manifest.json
  common/ux/tokens
  common/bff/registry.json
  common/domain/operations/registry.json
  domains/contests/common/registry.json
  domains/contests/screens/screen-registry.json
  domains/contests/screens/ContestPortfolio_CA-01/screen.manifest.json
  schemas/ux
)
for artifact in "${required[@]}"; do [ -e "$SPEC/$artifact" ] || warn "Spec workspace lacks Web artifact: $artifact (skipped; existing vendored copy kept)"; done
mkdir -p "$TMP/vendor" "$TMP/spec/domains/contests/common" "$TMP/packages"
extract domains/insights/bff/performance-vm.ts "$TMP/vendor/performance-vm.ts"
extract domains/insights/content/en.json "$TMP/vendor/insights.en.json"
extract domains/contests/content/en.json "$TMP/vendor/contests.en.json"
node - "$TMP/vendor" <<'NODE'
const fs=require('fs'),path=require('path'),dir=process.argv[2];const read=f=>{const p=path.join(dir,f);if(!fs.existsSync(p))return null;const v=JSON.parse(fs.readFileSync(p));fs.unlinkSync(p);return v;};const insights=read('insights.en.json'),contests=read('contests.en.json');if(insights&&contests)fs.writeFileSync(path.join(dir,'en.json'),JSON.stringify({...insights,...contests},null,2)+'\n');else console.warn('Warning: a spec content bundle is missing; vendor/spec/en.json not refreshed');
NODE
extract domains/insights/config/countries/MY/performance.config.json "$TMP/vendor/performance.config.json"
extract domains/insights/config/screen-config.schema.json "$TMP/vendor/screen-config.schema.json"
extract domains/contests/bff/contest-admin-vm.ts "$TMP/vendor/contest-admin-vm.ts"
extract domains/contests/api/contests.v1.yaml "$TMP/vendor/contests.v1.yaml"
extract domains/contests/config/countries/MY/contest-admin.config.json "$TMP/vendor/contest-admin.config.json"
copy_tree "$SPEC/domains/contests/common/fixtures" "$TMP/spec/domains/contests/common/"
mkdir -p "$TMP/packages"
copy_tree "$SPEC/common" "$TMP/packages/"
mkdir -p "$TMP/packages/domains/contests" "$TMP/packages/domains/insights" "$TMP/packages/schemas"
for dir in domains/contests/common domains/contests/screens; do copy_tree "$SPEC/$dir" "$TMP/packages/domains/contests/"; done
for dir in domains/insights/common domains/insights/screens; do copy_tree "$SPEC/$dir" "$TMP/packages/domains/insights/"; done
copy_tree "$SPEC/schemas/ux" "$TMP/packages/schemas/"
node - "$TMP/packages" <<'NODE'
const fs=require('fs'),path=require('path'),crypto=require('crypto');const root=process.argv[2],manifestPath=path.join(root,'common/assets/MY/manifest.json');if(!fs.existsSync(manifestPath)){console.warn('Warning: spec asset manifest missing; asset checks skipped');process.exit(0);}const manifest=JSON.parse(fs.readFileSync(manifestPath));for(const asset of manifest.assets){const file=path.join(path.dirname(manifestPath),asset.file);if(!fs.existsSync(file)){console.warn('Warning: missing Spec asset '+asset.file+' (skipped)');continue;}const actual=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');if(actual!==asset.sha256)console.warn('Warning: asset checksum mismatch '+asset.file);if(asset.mediaType==='image/svg+xml'&&/<script|<foreignObject|\son[a-z]+\s*=|(?:href|src)=["']https?:/i.test(fs.readFileSync(file,'utf8')))throw new Error('Unsafe SVG '+asset.file);}
NODE
printf '%s\n' '1.3.0' > "$TMP/vendor/SPEC_VERSION"
if [ -e "$TMP/vendor/contests.v1.yaml" ]; then grep -m1 'version:' "$TMP/vendor/contests.v1.yaml" | awk '{print $2}' > "$TMP/vendor/CONTEST_SPEC_VERSION"; fi
printf '%s\n' "$COMMIT" > "$TMP/vendor/SPEC_COMMIT"
cp -R "$TMP/vendor/." vendor/spec/
if [ -e "$TMP/spec/domains/contests/common/fixtures" ]; then
  rm -rf vendor/spec/contest-admin-fixtures
  cp -R "$TMP/spec/domains/contests/common/fixtures" vendor/spec/contest-admin-fixtures
fi
STAGE="$(pwd)/.spec-sync-stage.$$"
rm -rf "$STAGE"
mkdir -p "$STAGE/vendor/spec/domains/contests" "$STAGE/vendor/spec/domains/insights" "$STAGE/vendor/spec/schemas" "$STAGE/public/spec-assets" "$STAGE/src/generated" "$STAGE/backups"
stage_tree() { [ -e "$1" ] && cp -R "$1" "$2"; return 0; }
stage_tree "$TMP/packages/common" "$STAGE/vendor/spec/common"
stage_tree "$TMP/packages/domains/contests/common" "$STAGE/vendor/spec/domains/contests/common"
stage_tree "$TMP/packages/domains/contests/screens" "$STAGE/vendor/spec/domains/contests/screens"
stage_tree "$TMP/packages/domains/insights/common" "$STAGE/vendor/spec/domains/insights/common"
stage_tree "$TMP/packages/domains/insights/screens" "$STAGE/vendor/spec/domains/insights/screens"
stage_tree "$TMP/packages/schemas/ux" "$STAGE/vendor/spec/schemas/ux"
stage_tree "$TMP/packages/common/assets/MY" "$STAGE/public/spec-assets/MY"
[ -e "$STAGE/public/spec-assets/MY/manifest.json" ] && node - "$STAGE" <<'NODE'
const fs=require('fs'),path=require('path');const stage=process.argv[2],manifest=JSON.parse(fs.readFileSync(path.join(stage,'public/spec-assets/MY/manifest.json'),'utf8'));const entries=manifest.assets.filter(asset=>fs.existsSync(path.join(stage,'public/spec-assets/MY',asset.file))).map(asset=>[asset.assetId,{src:`/spec-assets/MY/${asset.file}`,type:asset.type,mediaType:asset.mediaType,sha256:asset.sha256,sourceStatus:asset.sourceStatus,intrinsic:asset.intrinsic,rendering:asset.rendering,accessibility:asset.accessibility}]);fs.writeFileSync(path.join(stage,'src/generated/spec-assets.ts'),`/* Generated by scripts/generate-spec-assets.mjs; do not edit. */\nexport const specAssets = ${JSON.stringify(Object.fromEntries(entries),null,2)} as const;\nexport type SpecAssetId = keyof typeof specAssets;\n`);
NODE
targets=(vendor/spec/common vendor/spec/domains/contests/common vendor/spec/domains/contests/screens vendor/spec/domains/insights/common vendor/spec/domains/insights/screens vendor/spec/schemas/ux public/spec-assets/MY src/generated/spec-assets.ts)
swapped=()
rollback_packages() {
  local target key
  for ((i=${#swapped[@]}-1; i>=0; i--)); do
    target="${swapped[$i]}"; key="${target//\//__}"
    rm -rf "$target"
    [ -e "$STAGE/backups/$key" ] && { mkdir -p "$(dirname "$target")"; mv "$STAGE/backups/$key" "$target"; }
  done
}
for target in "${targets[@]}"; do
  key="${target//\//__}"
  # Keep the existing vendored copy for anything skipped above.
  [ -e "$STAGE/$target" ] || continue
  mkdir -p "$(dirname "$target")"
  [ -e "$target" ] && mv "$target" "$STAGE/backups/$key"
  if ! mv "$STAGE/$target" "$target"; then rollback_packages; echo "Spec package sync rolled back after failing to replace $target"; exit 1; fi
  swapped+=("$target")
done
rm -rf "$STAGE"
# Remove the retired pre-domain package root only after the canonical swap succeeds.
rm -rf vendor/spec/screens
echo "Synced spec artifacts from working tree $SPEC. Review the diff and run application checks."