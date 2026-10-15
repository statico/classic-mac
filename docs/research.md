# Prior-art research

Researched 2026-10-14. Goal: run one 68k Mac app (Scarab of Ra, SimCity 2000) in a
browser page with Executor compiled by Emscripten. No Apple ROM or System.

## TL;DR

- **Someone has already ported Executor to Emscripten:**
  [codebutler/executor](https://github.com/codebutler/executor) (Jul-Oct 2026).
  Start from that fork, or copy its patches. Do not redo the port.
- **Advanced Mac Substitute (AMS) has no browser build** and supports only 1-bit
  graphics, MFS, and 1984-era apps. It cannot run SimCity 2000. Executor is the
  right base.
- **infinite-mac** is the reference for the browser side: a Web Worker,
  SharedArrayBuffer, `Atomics.wait` for idle, an AudioWorklet ring buffer, and
  `putImageData`. It does not use ASYNCIFY.
- **Afterglow** is a native macOS app, not a web app. Its design is the same as
  ours (Musashi plus a partial Toolbox for one kind of program), which shows the
  approach works.
- **Upstream Executor has no sound driver except ALSA.** We must write a
  `SoundDriver` for Web Audio (or SDL2 audio).
- I found **no published compatibility report** for SimCity 2000 or Scarab of Ra
  under Executor. Executor contains a hack written for the Dark Castle demo.

## 1. Afterglow (morphing.cloud/afterglow)

- Source: <https://morphing.cloud/afterglow/>, help page `/afterglow/help/`.
- It is a **native macOS 14+ app** (a .dmg download) that runs the original 68k
  code of *After Dark* screen-saver modules (Flying Toasters and others). The
  page has no JS or wasm, and there is no browser version.
- CPU: [Musashi](https://github.com/kstenerud/Musashi) 68k interpreter.
- OS: a **subset of the Toolbox and OS reimplemented** from scratch, just enough
  for After Dark modules. No ROM or System needed.
- Input: imports module files, disk images, and archives. Output: a macOS
  screen saver or a full-screen window with a CRT shader.
- What it means for us: it is the same pattern as AMS and Executor (CPU core plus
  HLE Toolbox, with one app as the whole world), for a narrow API surface. It is
  closed source, so there is nothing to copy.

## 2. infinite-mac: browser wiring

Repos: [mihaip/infinite-mac](https://github.com/mihaip/infinite-mac) (TS
front end) and [mihaip/macemu](https://github.com/mihaip/macemu), branch
`infinite-mac-kanjitalk755` (C++ glue).

Architecture: the emulator runs **in a dedicated Web Worker**. Its `main()` is
an ordinary blocking loop. It is **not ASYNCIFY and not pthreads**. C++ calls
out through `EM_ASM({ workerApi.foo(...) })`, where `workerApi` is a global that
the worker script sets up. The UI thread talks to the worker through a
SharedArrayBuffer. This needs COOP/COEP headers (`same-origin` /
`require-corp`, see `vite.config.ts` and `worker/index.ts`). When
SharedArrayBuffer is not available, there is a `postMessage` fallback.

| Concern | How | Files to copy from |
|---|---|---|
| Video | Emulator converts to RGBA and calls `workerApi.blit(ptr,size)`. The worker copies into a SAB. The UI reads it on rAF, calls `ctx.putImageData`, and the canvas uses `image-rendering: pixelated`. | `macemu/BasiliskII/src/Unix/JS/video_js.cpp`, `src/emulator/worker/video.ts`, `src/emulator/ui/video.ts`, `ui/ui.ts` (`#drawScreen`) |
| Input | UI writes mouse x/y/button and key events into a shared `Int32Array` with a lock word. The emulator polls `acquireInputLock` / `getInputValue` once per tick. | `macemu/.../JS/input_js.cpp`, `src/emulator/ui/input.ts`, `src/emulator/worker/input.ts`, `common/key-codes.ts` (JS code to Mac keycode) |
| Audio | `workerApi.didOpenAudio(rate,bits,ch)` and `enqueueAudio(ptr,len)` write into a SAB **ring buffer**. An `AudioWorkletNode` named "emulator-playback-processor" reads from it. The emulator throttles itself with `audioBufferSize()`. | `macemu/.../JS/audio_js.cpp`, `src/emulator/worker/audio.ts`, `src/emulator/ui/audio.ts`, `src/emulator/emulator-audio-worklet.ts` |
| Idle/sleep | `workerApi.idleWait()` runs `Atomics.wait` on the input lock word, with a timeout up to the next expected blit. Any input event wakes it (`Atomics.notify`). The fallback does a sync XHR to `./worker-idlewait?timeout=` that the service worker holds open. | `macemu/BasiliskII/src/Unix/timer_unix.cpp`, `src/emulator/worker/worker.ts` (`idleWait`, `#idleWait`), `worker/input.ts`, `emulator-service-worker.ts` |
| Disk | Disk images are cut into 256 KiB content-addressed chunks plus a JSON manifest. The worker loads chunks on demand with **synchronous XHR** (allowed in workers). | `src/emulator/worker/chunked-disk.ts`, `worker/disks.ts`, `scripts/import-disks.py` (`CHUNK_SIZE`) |
| Build | `-s MODULARIZE -s EXPORT_ES6 -s ENVIRONMENT=worker -s INITIAL_MEMORY=…`, no pthreads. | `macemu/BasiliskII/src/Unix/Makefile.in` (`ifeq ($(EMSCRIPTEN),yes)`), `_emconfigure.sh` |

A minimal front end needs only: ui/video + ui/input + ui/audio +
audio-worklet + worker/input + worker/audio + worker/video. That is about 900
lines of TS. For one game in one small image, we can skip chunked disks and
put the files into MEMFS (or `--preload-file`).

## 3. Existing Toolbox-HLE ports to wasm

### codebutler/executor: an Executor Emscripten port (most important)

- <https://github.com/codebutler/executor>, a fork of autc04/executor. Commit
  `11419e9f` (2026-07-28) is "wasm: emscripten port". Later work adds rootless
  windows, scrap/clipboard, MacTCP, Platinum appearance, and QuickDraw fixes.
  It is active (last push 2026-10-05). It is built for a host project called
  "Yore" (a browser desktop that shows each Mac window as its own host window).
- Build: `emcmake cmake -DFRONT_ENDS=sdl2`, target `executor-sdl2`, which
  produces `executor.mjs`. Link flags in `src/CMakeLists.txt`:
  `-pthread -fwasm-exceptions -sPROXY_TO_PTHREAD -sPTHREAD_POOL_SIZE=8
  -sALLOW_MEMORY_GROWTH -sINITIAL_MEMORY=256MB -sMAXIMUM_MEMORY=1GB
  -sMODULARIZE -sEXPORT_ES6 -sEXPORT_NAME=createExecutorModule
  -sEXPORTED_RUNTIME_METHODS=FS,callMain,...` plus IDBFS. It uses
  **pthreads** (main on a pthread, emulator on a second thread, timer on a
  third), so it needs COOP/COEP. It does not use ASYNCIFY.
- Host codegen tools (syngen, map_to_c, mkseedtables, ...) are themselves built
  with Emscripten and run under node through `CMAKE_CROSSCOMPILING_EMULATOR`
  (`-sNODERAWFS`).
- `patches/wasm/{syn68k,PowerCore,multiversal}.patch` plus
  `scripts/apply-wasm-patches.sh`. The syn68k patch adds `__wasm__` as
  little-endian, and adds a **tag-safe `SYN68K_TO_US`** that removes 24-bit
  master-pointer flag bits when an address falls outside the wasm heap. Older
  non-32-bit-clean apps (MacPaint is the example given) need this. Scarab of
  Ra could also need it.
- syn68k on wasm runs as the portable threaded interpreter (`NONNATIVE`,
  `NONDIRECT` uses a switch instead of computed goto). There is no JIT.
- What it does not have: a **sound driver** (upstream has only ALSA and a fake
  driver), and a plain "one fullscreen app" page. Its SDL2 front end changes
  are for the rootless Yore bridge (`src/wind/yorebridge.*`, `pcbridge.*`).
- **Recommendation:** vendor this fork, or cherry-pick `11419e9f`, `bd2a057a`
  and the QuickDraw/dialog fixes. Then add (a) a non-rootless framebuffer
  path to a canvas, (b) a Web Audio `SoundDriver`, (c) autolaunch of one app.

I found no other Executor or syn68k wasm port: I checked the other autc04
forks, GitHub search, and autc04 issues (no wasm, SimCity, or Scarab issues).

### Advanced Mac Substitute (AMS), by Josh Juran

- <https://www.v68k.org/ams/>, source in
  [jjuran/metamage_1](https://github.com/jjuran/metamage_1) (`68k/ams`,
  v68k CPU), binaries in [jjuran/ams-68k-bin](https://github.com/jjuran/ams-68k-bin).
- Design: a back end (v68k emulator plus Toolbox written as 68k code modules:
  ams-core, ams-qd, ams-ui, ams-fs, ams-snd, ...) and a front end, which is a
  "bitmapped terminal" (SDL2, native macOS, X11, Linux fbdev, VNC). It launches
  straight into the app.
- **No web/WASM build** exists: there is nothing in the repo tree and nothing on
  the site. An SDL2 front end exists, so a port is possible, but nobody has
  done one.
- Scope: **1-bit QuickDraw only, MFS, Mac 128K/512K/Plus-era apps.** Known
  working: MacPaint, Lode Runner, The Fool's Errand (prologue), System's
  Twilight, Amazing, Solitaire, Missile, IAGO. No mention of Scarab of Ra,
  Dark Castle, or SimCity.
- **Executor vs AMS:**
  - SimCity 2000 needs Color QuickDraw, 8-bit, System 7 era, GWorlds, and the
    Palette Manager. AMS cannot run it. Executor has Color QuickDraw and
    partial System 7 support.
  - Scarab of Ra (1-bit, System 6, 1987) could run on AMS in theory. Dark
    Castle could too. But Executor runs both and already builds for wasm.
  - **Use Executor for both games.** Keep AMS only as a fallback for Scarab of
    Ra if Executor fails on it.

## 4. Game compatibility under Executor

- **Dark Castle:** Executor contains a hack written for it.
  `src/wind/windInit.cpp` `C_NewWindow` has `DARK_CASTLE_HACK` (ctm, 1997)
  because the Dark Castle demo calls `NewWindow(nil, ...)` and then treats the
  window as a `DialogRecord`. So ARDI tested Dark Castle (at least the demo).
- **Scarab of Ra** (Rick Holzgrafe, Semicolon Software, 1987-88): monochrome,
  System 6.0 up to 9.2. I found no Executor report. Risk: it may not be 32-bit
  clean (see the tag-safe patch above) and may use sound.
- **SimCity 2000** (Mac 68k, 1994): I found no Executor report in the repo, the
  docs, the old FAQ, or a web search. Risks: no FPU (Executor reports
  `gestaltNoFPU`, which is fine if SC2K does not need one), Sound Manager
  sampled sound, palette animation, and System 7 traps. It is known to run
  under Basilisk II on infinite-mac.
- The ARDI compatibility database is archived on Wayback
  (`ardi.com/compat_detail.php?app_id=N`, about 590 pages).
  I could fetch only 25 of these pages before Wayback started refusing
  connections. None of those 25 named the target games. To search the rest, run
  the CDX query `url=www.ardi.com/compat_detail.php*` again and fetch the pages
  slowly.
- Executor's documented gap is that it cannot run extensions or control panels
  tightly coupled to the OS. That does not matter for these games.

## Plan impact

1. Do not port from scratch. Start from `codebutler/executor` (pthreads and
   PROXY_TO_PTHREAD, so serve with COOP/COEP).
2. Add a Web Audio `SoundDriver` (copy the infinite-mac AudioWorklet ring buffer).
3. For video and input, use the SDL2 canvas path, or copy infinite-mac's
   SAB `putImageData` blit plus its input buffer.
4. Test Scarab of Ra first: it is 1-bit and System 6, so it is the easier
   target. Expect SimCity 2000 to need QuickDraw and Sound Manager fixes.
