# Game files

Classic Mac 68k games prepared for Executor. The files are kept for archive and demo use only. They come from Macintosh Garden, which hosts abandonware.

## Regenerate

```sh
brew install unar hfsutils
scripts/fetch-games.sh            # download (MD5-checked) + extract into games/raw/ (gitignored)
for g in "scarab-of-ra:Scarab of Ra" "dark-castle:Dark Castle" "simcity-2000:SimCity 2000" "glider-pro:Glider PRO"; do
  python3 -I scripts/prepare-games.py "games/raw/${g%%:*}/extracted" "games/prepared/${g%%:*}" "${g#*:}"
done
```

You must run the scripts on macOS. Extraction uses native resource forks (`unar -k fork`), and the scripts read `..namedfork/rsrc` and the `com.apple.FinderInfo` xattr. Do not use `unar -k hidden`, because it drops the type and creator of files that have no resource fork.

## Layout (`games/prepared/<game>/`)

| Path | Format |
|---|---|
| `<Name>.hfv` | Raw HFS volume (no DiskCopy header) that contains the game folder. hfsutils builds it. |
| `macbinary/<folder>/<file>.bin` | MacBinary II, one file for each Mac file. Executor reads `*.bin` directly (`src/file/localvolume/macbinary.cpp`). |
| `appledouble-percent/` | Data fork + `%Name` AppleDouble v2 header (FinderInfo + resource fork). This is Executor's default scheme. |
| `appledouble-dot/` | The same data, with `._Name` headers (macOS/netatalk style). Executor also reads this. |
| `resources.txt` | Resource types for each file, the CODE ids/sizes, and the CODE and `cfrg` check. |

Executor also accepts Basilisk-style `.rsrc/` directories (`basilisk.cpp`). We did not make them. Note that macOS `cp`/`tar` can merge `._` files into xattrs. Use `git` or `rsync` to move `appledouble-dot/`.

Verification: we read each `.hfv` back with python `machfs` and unpacked each `.bin` with `unar`. The data fork, resource fork, type and creator are byte-identical to the extracted source for all files.

## Scarab of Ra 1.4

- Source: https://macintoshgarden.org/games/scarab-of-ra, DL #1 `scarab_of_ra.sit` (89.7 KB, MD5 `3f49dc2ad5e0be07581499710ad90550`). This is the latest version on the Garden. 1.3 and 1.2 are also listed.
- Author: Rick Holzgrafe (the `vers` resource says "1.4 Copyright © 1987-1992 Rick Holzgrafe"). Shareware, B&W.
- Files: `Scarab of RA 1.4/Scarab of RA 1.4` (APPL/SSRA, data 0, rsrc 188,006) and `Dean's List` (SSRS/SSRA, high scores).
- Resources: 34 CODE (0–45 with gaps). 68k only, no `cfrg`. SIZE is 300 K.

## Dark Castle 1.1

- Source: https://macintoshgarden.org/games/dark-castle, DL #1 `Dark_Castle_0_0.sit` (540.9 KB, MD5 `987ede675faf4a7f9c6b68248ae2a4a3`). This is the single-800K install of 1.1 (Silicon Beach Software, 1986/87).
- Files: `Dark Castle` (APPL/DCAS, rsrc 1,784), `Data A` (rsrc 347,923), `Data B` (rsrc 394,301), `Castle Preferences`. All the data forks are empty.
- Resources: the APPL is only a stub, with CODE 0 and CODE 1 (542 bytes) and SIZE 20 K. **The real game code is CODE 0–7 in `Data A`** (SIZE 488 K pref / 384 K min). We think the stub runs that code from `Data A`, because the stub has no other code. We did not trace it. Executor must open that file as a resource file and load CODE from it. `Data B` has the graphics and sounds (PPCT, SOUN). There is no `cfrg`.

## SimCity 2000 1.1 (floppy, 68k)

- Source: https://macintoshgarden.org/games/simcity-2000-v10-11, DL #2 `SimCity_2000_1.1.hqx` (3.95 MB, MD5 `2be203260837573ade7db58e66defc80`).
- What is in the archive: three DiskCopy 4.2 images. `Program Disk` holds a Compact Pro `.sea` with the 68k app and a Read Me. `Scenario Disk` holds `Cities.sea`. `SimCity 2000 PPC.img` holds `SimCityPPC`, a separate native PowerPC build from Oct 1994, which we did not use. To extract, the script strips the 84-byte DC42 header, runs `hcopy -m`, then runs `unar`.
- Files: `SimCity 2000/SimCity2000™ 1.1` (APPL/SCDH, data 0, rsrc 2,789,098), `SimCity 2000™ 1.1 Read Me`, and `Cities/` (5 SCEN scenarios + 5 CITY files).
- Resources: 16 CODE (0–15). 68k only, no `cfrg`. SIZE is 2500 K. This version needs System 7 and a color display.
- Why 1.1: it is the installed floppy release (no installer) and it is pure 68k. 1.0 has bugs that break the game.
- Alternatives we did not use:
  - 1.2 floppy (`SimCity_2000_1.2.hqx`) is an Installer VISE package. `unar` cannot extract it.
  - The CD Collection folder (`simcity2000.sit`, 8.8 MB, MD5 `8b4ac368b906c38174110eaa4fcc6286`) contains `SimCity 2000® 1.2` (data 416,129 + rsrc 3,812,611). This is a fat build: the data fork is a PEF (`Joy!peff`) with a `cfrg`, and the resource fork has full 68k CODE 0–3 (CODE 2 is 280 KB, 297 KB of CODE in total). It also contains the SCURK app and many cities. The download is in `games/raw/simcity-2000-cd/` if a later version is wanted.
  - We avoided the Special Edition (75 MB CD).

## Glider PRO 1.1.2

- Source: https://macintoshgarden.org/games/glider-pro, `glider_pro_1_1_2.zip` (46.4 MB, MD5 `1023ad632df89c19cb03067fa8e2558b`). It holds a raw HFS CD image (`GliderPRO_1_1_2.toast`, no partition map).
- Author: John Calhoun (Casady & Greene, 1994–96).
- Files: `Glider PRO/Glider PRO™` (APPL/ozm5, data 384,604 + rsrc 3,448,010) and three houses in `Houses/`: Slumberland, Demo House and Castle o' the Air, each with its `.mov` file.
- Resources: fat app. The data fork is a PEF (`Joy!peff`) with a `cfrg`, and the resource fork has 68k CODE 0–14. Executor runs the 68k code unless you pass `--ppc`.
- We did not use the 1.0.x floppies (`glider_pro_v100_v101_v102.sit`), because they hold only a StuffIt installer.

## EV Nova 1.0.2

- Source: https://old.mac.gdn/games/EV_Nova_1.0.2.sit (MD5 `fd15b3ff14bd14173681094ae3c2850b`).
- Author: Ambrosia Software (2002). Shareware.
- Files: `EV Nova/EV Nova` (the app), `Nova Files/`, `Nova Plug-ins/` and `Pilots/`. `fetch-games.sh` removes the documents and the four `Race *.mov` movies.
- Resources: fat app with 12 68k CODE resources and a Carbon PEF (`carb`). Executor runs the 68k code.
- The game data is 170 MB. This is more than the 100 MB file limit of GitHub, so git does not keep `games/prepared/ev-nova/` or `web/executor/games/ev-nova.*`. To make them again, do these steps:

```sh
scripts/fetch-games.sh
python3 -I scripts/prepare-games.py games/raw/ev-nova/trimmed games/prepared/ev-nova "EV Nova"
scripts/package-executor-game.sh ev-nova
```

- The game must have Mac OS 8.1 or later. The page starts Executor with `--system 8.1`. With this setting, Gestalt also reports QuickTime 3.0. Executor has only stubs for the Movie Toolbox.
