# File formats Executor accepts (wasm build)

Executor reads Mac files from its host filesystem. In the browser that is
Emscripten's in-memory FS (MEMFS), filled from a `file_packager` bundle.
Executor mounts `/` as a volume, so any path in MEMFS works. The front end
launches the app by passing its path to `callMain`. The format is picked per
file in this order (`src/file/localvolume/localvolume.cpp`):

| Format | Layout on host FS | Notes |
|---|---|---|
| AppleSingle | one file with an AppleSingle header | |
| **AppleDouble, `%` scheme (default)** | `Name` (data fork) + `%Name` (AppleDouble header: resource fork and Finder info) | Recommended. Executor uses this layout when it writes files. Our bundles use `games/prepared/<id>/appledouble-percent/`. |
| AppleDouble, `._` scheme | `Name` + `._Name` | Same as the `%` scheme. This is the layout macOS and `ditto` produce. |
| Basilisk II / SheepShaver | `Name` + `.rsrc/Name` (resource fork) + `.finf/Name` | |
| MacBinary I/II/III | `Name.bin` | Needs the `.bin` extension and a valid header. It is checked after the sidecar formats. |
| Plain file | `Name` | Data fork only. Type/creator are guessed from the extension. |

Sidecar files (`%*`, `._*`, `.rsrc`) are hidden from the Mac side.
macOS-native resource forks (`MacItemFactory`) are used only in `__APPLE__`
builds, so the wasm build does not read them.

**HFS disk images** (`.hfv`, `.dsk`: raw HFS volume images) are not opened as files. They are mounted as extra
volumes from every file in the `MacVolumes` directory. That defaults to
`~/.executor/images`, which is `/home/web_user/.executor/images` in the wasm
build. To change it, set the `MacVolumes` env var. In wasm, set it in `Module.preRun` with `ENV.MacVolumes = '/images'`.
The `games/prepared/<id>/<Name>.hfv` images work this way, but the shipped
front end uses the AppleDouble bundles instead.

Executor writes preferences and save files back into MEMFS. They are lost when
the page reloads (no IDBFS persistence yet).

## Packaging a game for web/executor

```sh
scripts/package-executor-game.sh <id>   # -> web/executor/games/<id>.{js,data}, mounted at /games/<id>
```

Then add the app path and options to `GAMES` in `web/executor/index.html`.
Useful options: `--applzone 16M` (application heap; SimCity 2000 needs this),
`--bpp 1|8` (screen depth; Dark Castle needs `1`), and `--size 800x600`.
