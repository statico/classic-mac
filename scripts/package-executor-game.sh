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
