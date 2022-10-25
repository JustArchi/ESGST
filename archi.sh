#!/usr/bin/env sh
set -eu

cd "$(dirname "$0")"

#git pull

pnpm i
pnpm run build-userscript

mkdir -p hosted

cp "dist/userscript.user.js" "hosted/ESGST.user.js"
cp "dist/userscript.meta.js" "hosted/ESGST.meta.js"

#git reset
#git add -A "hosted"
#git commit -m "Automatic A-ESGST build | $(date -u)"
#git push
