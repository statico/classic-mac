#!/usr/bin/env bash
# Package a prepared game (games/prepared/<id>/appledouble-percent) into an
# Emscripten preload bundle web/executor/games/<id>.{js,data}, mounted at /games/<id>.
# Usage: scripts/package-executor-game.sh <id>   (e.g. scarab-of-ra)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
id=$1
source "$ROOT/vendor/emsdk/emsdk_env.sh" >/dev/null 2>&1
mkdir -p "$ROOT/web/executor/games"
cd "$ROOT/web/executor/games"
python3 "$EMSDK/upstream/emscripten/tools/file_packager.py" "$id.data" \
  --preload "$ROOT/games/prepared/$id/appledouble-percent@/games/$id" --js-output="$id.js"
# GitHub and Vercel refuse files over 100 MB. Split big bundles into 45 MB
# parts (<id>.data.aa, .ab, ...); web/executor/index.html joins them.
if [ "$(wc -c < "$id.data")" -gt 50000000 ]; then
  rm -f "$id.data".??
  split -b 45m "$id.data" "$id.data."
  rm "$id.data"
fi
