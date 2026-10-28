#!/usr/bin/env bash
# Build Executor (68k Mac emulator, no ROM needed) for the browser with Emscripten.
# From scratch: installs emsdk, clones Executor at a pinned commit, applies
# patches/{executor,syn68k,PowerCore}, builds Boost, builds Executor, copies
# executor.js/.wasm to web/executor/. Needs: git, cmake, ninja, bison, python3, node.
# Re-runnable; set CLEAN=1 to re-clone Executor.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
V="$ROOT/vendor"
EXECUTOR_COMMIT=3e8e02a564f579850d22faa0b79e731f76c17c4e   # autc04/executor master
EMSDK_VERSION=${EMSDK_VERSION:-latest}                      # tested with emcc 6.0.12
BOOST_VERSION=1.86.0
mkdir -p "$V"

# emsdk
[ -d "$V/emsdk" ] || git clone -q https://github.com/emscripten-core/emsdk "$V/emsdk"
if ! [ -x "$V/emsdk/upstream/emscripten/emcc" ]; then
  "$V/emsdk/emsdk" install "$EMSDK_VERSION"
  "$V/emsdk/emsdk" activate "$EMSDK_VERSION"
fi
# shellcheck disable=SC1091
source "$V/emsdk/emsdk_env.sh" >/dev/null 2>&1

# Executor + submodules at pinned commits, patched
[ "${CLEAN:-0}" = 1 ] && rm -rf "$V/executor" "$V/build-executor-wasm"
if ! [ -d "$V/executor" ]; then
  git clone -q https://github.com/autc04/executor "$V/executor"
  git -C "$V/executor" checkout -q "$EXECUTOR_COMMIT"
  git -C "$V/executor" submodule update -q --init --recursive
  git -C "$V/executor/syn68k"    am -q "$ROOT"/patches/syn68k/*.patch
  git -C "$V/executor/PowerCore" am -q "$ROOT"/patches/PowerCore/*.patch
  git -C "$V/executor/multiversal" am -q "$ROOT"/patches/multiversal/*.patch
  git -C "$V/executor"           am -q "$ROOT"/patches/executor/*.patch
fi

# Boost (filesystem, program_options) as static wasm libs
if ! [ -d "$V/boost-wasm" ]; then
  [ -d "$V/boost-$BOOST_VERSION" ] || curl -sL \
    "https://github.com/boostorg/boost/releases/download/boost-$BOOST_VERSION/boost-$BOOST_VERSION-cmake.tar.xz" \
    | tar -xJ -C "$V"
  emcmake cmake -S "$V/boost-$BOOST_VERSION" -B "$V/build-boost" -G Ninja -DCMAKE_BUILD_TYPE=Release \
    -DBOOST_INCLUDE_LIBRARIES="filesystem;program_options" -DBUILD_SHARED_LIBS=OFF \
    -DCMAKE_INSTALL_PREFIX="$V/boost-wasm" -DCMAKE_CXX_FLAGS="-fexceptions -DBOOST_HAS_PTHREADS"
  ninja -C "$V/build-boost" install
fi

# Executor
emcmake cmake -S "$V/executor" -B "$V/build-executor-wasm" -G Ninja -DCMAKE_BUILD_TYPE=Release \
  -DFRONT_ENDS=wasm -DBoost_DIR="$V/boost-wasm/lib/cmake/Boost-$BOOST_VERSION" \
  -DCMAKE_FIND_ROOT_PATH="$V/boost-wasm" -DCMAKE_C_FLAGS="-fexceptions" -DCMAKE_CXX_FLAGS="-fexceptions"
ninja -C "$V/build-executor-wasm" executor-wasm
cp "$V/build-executor-wasm/executor.js" "$V/build-executor-wasm/executor.wasm" "$ROOT/web/executor/"
echo "Built $ROOT/web/executor/executor.{js,wasm}"
