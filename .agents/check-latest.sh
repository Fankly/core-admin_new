#!/usr/bin/env bash
# 对比 package.json 声明版本 与 npm registry 真实 latest
set -uo pipefail
cd "$(dirname "$0")/.."

node -e '
const p = require("./package.json");
for (const [k,v] of Object.entries({...p.dependencies, ...p.devDependencies})) {
  console.log(k + "\t" + v);
}
' > /tmp/decl.txt

fetch() {
  name="$1"; decl="$2"
  latest=$(curl -sf --max-time 20 "https://registry.npmjs.org/-/package/${name}/dist-tags" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{console.log(JSON.parse(s).latest||"?")}catch(e){console.log("NOT_FOUND")}})')
  [ -z "$latest" ] && latest="NOT_FOUND"
  printf '%s\t%s\t%s\n' "$name" "$decl" "$latest"
}
export -f fetch

cat /tmp/decl.txt | while IFS=$'\t' read -r n d; do
  echo "fetch '$n' '$d'"
done | xargs -P 12 -I{} bash -c '{}' > /tmp/latest.txt

sort /tmp/latest.txt | awk -F'\t' '{printf "%-46s %-32s %s\n", $1, $2, $3}'
