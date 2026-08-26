#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
SPEC="${SPEC_DIR:-../PruactionSpec}"
REF="${SPEC_REF:-HEAD}"
HANDOFF_REF="${HANDOFF_REF:-$REF}"
git -C "$SPEC" rev-parse --git-dir >/dev/null 2>&1 || { echo "PruactionSpec Git repo not found at $SPEC (set SPEC_DIR)"; exit 1; }
COMMIT="$(git -C "$SPEC" rev-parse "${REF}^{commit}")"
HANDOFF_COMMIT="$(git -C "$SPEC" rev-parse "${HANDOFF_REF}^{commit}")"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP" "${STAGE:-}"' EXIT
extract() { git -C "$SPEC" show "$COMMIT:$1" > "$2"; }
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
for artifact in "${required[@]}"; do git -C "$SPEC" cat-file -e "$COMMIT:$artifact" 2>/dev/null || { echo "Spec commit $COMMIT lacks required Web artifact: $artifact"; exit 1; }; done
mkdir -p "$TMP/vendor" "$TMP/spec" "$TMP/inbox" "$TMP/packages"
extract domains/insights/bff/performance-vm.ts "$TMP/vendor/performance-vm.ts"
extract domains/insights/content/en.json "$TMP/vendor/insights.en.json"
extract domains/contests/content/en.json "$TMP/vendor/contests.en.json"
node - "$TMP/vendor" <<'NODE'
const fs=require('fs'),path=require('path'),dir=process.argv[2];const insights=JSON.parse(fs.readFileSync(path.join(dir,'insights.en.json'))),contests=JSON.parse(fs.readFileSync(path.join(dir,'contests.en.json')));fs.writeFileSync(path.join(dir,'en.json'),JSON.stringify({...insights,...contests},null,2)+'\n');fs.unlinkSync(path.join(dir,'insights.en.json'));fs.unlinkSync(path.join(dir,'contests.en.json'));
NODE
extract domains/insights/config/countries/MY/performance.config.json "$TMP/vendor/performance.config.json"
extract domains/insights/config/screen-config.schema.json "$TMP/vendor/screen-config.schema.json"
extract domains/contests/bff/contest-admin-vm.ts "$TMP/vendor/contest-admin-vm.ts"
extract domains/contests/api/contests.v1.yaml "$TMP/vendor/contests.v1.yaml"
extract domains/contests/config/countries/MY/contest-admin.config.json "$TMP/vendor/contest-admin.config.json"
git -C "$SPEC" archive "$COMMIT" domains/contests/common/fixtures | tar -x -C "$TMP/spec"
git -C "$SPEC" archive "$COMMIT" common domains/contests/common domains/contests/screens domains/insights/common domains/insights/screens schemas/ux | tar -x -C "$TMP/packages"
node - "$TMP/packages" <<'NODE'
const fs=require('fs'),path=require('path'),crypto=require('crypto');const root=process.argv[2],manifestPath=path.join(root,'common/assets/MY/manifest.json'),manifest=JSON.parse(fs.readFileSync(manifestPath));for(const asset of manifest.assets){const file=path.join(path.dirname(manifestPath),asset.file);if(!fs.existsSync(file))throw new Error('Missing Spec asset '+asset.file);const actual=crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');if(actual!==asset.sha256)throw new Error('Asset checksum mismatch '+asset.file);if(asset.mediaType==='image/svg+xml'&&/<script|<foreignObject|\son[a-z]+\s*=|(?:href|src)=["']https?:/i.test(fs.readFileSync(file,'utf8')))throw new Error('Unsafe SVG '+asset.file);}
NODE
printf '%s\n' '1.3.0' > "$TMP/vendor/SPEC_VERSION"
grep -m1 'version:' "$TMP/vendor/contests.v1.yaml" | awk '{print $2}' > "$TMP/vendor/CONTEST_SPEC_VERSION"
printf '%s\n' "$COMMIT" > "$TMP/vendor/SPEC_COMMIT"
printf '%s\n' "$HANDOFF_COMMIT" > "$TMP/vendor/HANDOFF_COMMIT"
if git -C "$SPEC" cat-file -e "$HANDOFF_COMMIT:handoffs/outbound" 2>/dev/null; then git -C "$SPEC" archive "$HANDOFF_COMMIT" handoffs/outbound | tar -x -C "$TMP/inbox"; fi
cp -R "$TMP/vendor/." vendor/spec/
rm -rf vendor/spec/contest-admin-fixtures
cp -R "$TMP/spec/domains/contests/common/fixtures" vendor/spec/contest-admin-fixtures
STAGE="$(pwd)/.spec-sync-stage.$$"
rm -rf "$STAGE"
mkdir -p "$STAGE/vendor/spec/domains/contests" "$STAGE/vendor/spec/domains/insights" "$STAGE/vendor/spec/schemas" "$STAGE/public/spec-assets" "$STAGE/src/generated" "$STAGE/backups"
cp -R "$TMP/packages/common" "$STAGE/vendor/spec/common"
cp -R "$TMP/packages/domains/contests/common" "$STAGE/vendor/spec/domains/contests/common"
cp -R "$TMP/packages/domains/contests/screens" "$STAGE/vendor/spec/domains/contests/screens"
cp -R "$TMP/packages/domains/insights/common" "$STAGE/vendor/spec/domains/insights/common"
cp -R "$TMP/packages/domains/insights/screens" "$STAGE/vendor/spec/domains/insights/screens"
cp -R "$TMP/packages/schemas/ux" "$STAGE/vendor/spec/schemas/ux"
cp -R "$TMP/packages/common/assets/MY" "$STAGE/public/spec-assets/MY"
node - "$STAGE" <<'NODE'
const fs=require('fs'),path=require('path');const stage=process.argv[2],manifest=JSON.parse(fs.readFileSync(path.join(stage,'public/spec-assets/MY/manifest.json'),'utf8'));const entries=manifest.assets.map(asset=>[asset.assetId,{src:`/spec-assets/MY/${asset.file}`,type:asset.type,mediaType:asset.mediaType,sha256:asset.sha256,sourceStatus:asset.sourceStatus,intrinsic:asset.intrinsic,rendering:asset.rendering,accessibility:asset.accessibility}]);fs.writeFileSync(path.join(stage,'src/generated/spec-assets.ts'),`/* Generated by scripts/generate-spec-assets.mjs; do not edit. */\nexport const specAssets = ${JSON.stringify(Object.fromEntries(entries),null,2)} as const;\nexport type SpecAssetId = keyof typeof specAssets;\n`);
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
  mkdir -p "$(dirname "$target")"
  [ -e "$target" ] && mv "$target" "$STAGE/backups/$key"
  if ! mv "$STAGE/$target" "$target"; then rollback_packages; echo "Spec package sync rolled back after failing to replace $target"; exit 1; fi
  swapped+=("$target")
done
rm -rf "$STAGE"
# Remove the retired pre-domain package root only after the canonical swap succeeds.
rm -rf vendor/spec/screens
rm -rf handoffs/inbox/spec
mkdir -p handoffs/inbox/spec
if [ -d "$TMP/inbox/handoffs/outbound" ]; then cp -R "$TMP/inbox/handoffs/outbound/." handoffs/inbox/spec/; fi
echo "Synced contract $COMMIT and handoff publication $HANDOFF_COMMIT. Review the diff and run npm run handoff:validate."