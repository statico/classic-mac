#!/bin/bash
# Download game archives from Macintosh Garden mirrors and extract them into
# native-fork trees (macOS: resource fork in ..namedfork/rsrc, FinderInfo xattr)
# Needs: curl, unar/lsar (brew install unar), hfsutils (brew install hfsutils).
# Output: games/raw/<game>/  (gitignored, untrusted data, never executed)
set -euo pipefail
cd "$(dirname "$0")/.."
RAW=games/raw
MIRROR=https://old.mac.gdn/games   # also gardenmirror.oldapplestuff.com/games, or Garden FTP

fetch() { # dir file md5
  mkdir -p "$RAW/$1"
  local f="$RAW/$1/$2"
  [ -f "$f" ] || curl -sSfL -A "Mozilla/5.0" -o "$f" "$MIRROR/$2"
  [ "$(md5 -q "$f" 2>/dev/null || md5sum "$f" | cut -d' ' -f1)" = "$3" ] || { echo "MD5 mismatch: $f" >&2; exit 1; }
}
extract() { # archive outdir   (-k fork => native forks; -k hidden drops FinderInfo of rsrc-less files)
  rm -rf "$2"; mkdir -p "$2"; unar -q -k fork -o "$2" "$1"
}

# Scarab of Ra 1.4 (Rick Holzgrafe) -- latest version on the Garden
fetch scarab-of-ra scarab_of_ra.sit 3f49dc2ad5e0be07581499710ad90550
extract "$RAW/scarab-of-ra/scarab_of_ra.sit" "$RAW/scarab-of-ra/extracted"

# Dark Castle 1.1 (Silicon Beach), single-800K install
fetch dark-castle Dark_Castle_0_0.sit 987ede675faf4a7f9c6b68248ae2a4a3
extract "$RAW/dark-castle/Dark_Castle_0_0.sit" "$RAW/dark-castle/extracted"

# SimCity 2000 1.1 floppy (68k-only). Archive holds DiskCopy 4.2 images whose
# files are Compact Pro .sea archives; strip the 84-byte DC42 header, copy the
# .sea out as MacBinary with hfsutils, then unar it.
fetch simcity-2000 SimCity_2000_1.1.hqx 2be203260837573ade7db58e66defc80
S=$RAW/simcity-2000
extract "$S/SimCity_2000_1.1.hqx" "$S/disks"
rm -rf "$S/sea" "$S/extracted"; mkdir -p "$S/sea" "$S/extracted/SimCity 2000"
for d in Program Scenario; do
  tail -c +85 "$S/disks/SimCity 2000 PowerMac/SimCity 2000™ $d Disk.img" > "$S/sea/$d.hfv"
done
hmount "$S/sea/Program.hfv" >/dev/null
hcopy -m ':SimCity2000? 1.1.sea' "$S/sea/program.sea.bin"
hcopy -m ':SimCity 2000? 1.1 Read Me' "$S/sea/readme.bin"
humount
hmount "$S/sea/Scenario.hfv" >/dev/null
hcopy -m ':Cities.sea' "$S/sea/cities.sea.bin"
humount
unar -q -k fork -o "$S/extracted/SimCity 2000" "$S/sea/program.sea.bin"
unar -q -k fork -o "$S/extracted/SimCity 2000" "$S/sea/readme.bin"
unar -q -k fork -o "$S/extracted/SimCity 2000" "$S/sea/cities.sea.bin"
mv "$S/extracted/SimCity 2000/cities.sea" "$S/extracted/SimCity 2000/Cities"
# The Oregon Trail CD 1.2 (MECC, 1993), 68k only. The archive holds a raw HFS
# CD image. Copy the app and 'Oregon Data' off it as MacBinary, then unar them.
fetch oregon-trail-cd OregonTrail1.2.sit_.bin 28a8aae1c5a454ea070896ed1cef3c3c
O=$RAW/oregon-trail-cd
extract "$O/OregonTrail1.2.sit_.bin" "$O/x"
rm -rf "$O/bin" "$O/extracted"; mkdir -p "$O/bin/Oregon Data" "$O/extracted/Oregon Trail/Oregon Data"
hmount "$O/x/OregonTrail(1.2).img" >/dev/null
hcopy -m ":Oregon Trail CD" "$O/bin/Oregon Trail CD.bin"
for f in "Graphics "{1..4} "Guide Book "{1..3} "Oregon Sound "{1..5}; do
  hcopy -m ":Oregon Data:$f" "$O/bin/Oregon Data/$f.bin"
done
humount
unar -q -k fork -o "$O/extracted/Oregon Trail" "$O/bin/Oregon Trail CD.bin"
for f in "$O/bin/Oregon Data"/*.bin; do unar -q -k fork -o "$O/extracted/Oregon Trail/Oregon Data" "$f"; done

# Glider 4.06 (John Calhoun, Casady & Greene, 1991): the 68K folder of the
# Glider 4.0 Pack, with its two houses and art files.
fetch glider-4 Glider_42.SIT d8d3b629a1fba76e1362b132232fe412
extract "$RAW/glider-4/Glider_42.SIT" "$RAW/glider-4/x"
rm -rf "$RAW/glider-4/extracted"; mkdir -p "$RAW/glider-4/extracted"
ditto "$RAW/glider-4/x/Glider 4.0 Pack/Glider 4.06 - for 68K Macs" "$RAW/glider-4/extracted/Glider 4"
rm -f "$RAW/glider-4/extracted/Glider 4/Icon"$'\r'

# EV Nova 1.0.2 (Ambrosia, 2002). The app is fat (68k CODE + Carbon PEF);
# Executor runs the 68k code. Drop the docs and the four race movies.
fetch ev-nova EV_Nova_1.0.2.sit fd15b3ff14bd14173681094ae3c2850b
E=$RAW/ev-nova
extract "$E/EV_Nova_1.0.2.sit" "$E/extracted"
rm -rf "$E/trimmed"; mkdir -p "$E/trimmed/EV Nova"
for f in "EV Nova" "Nova Files" "Nova Plug-ins" Pilots; do
  ditto "$E/extracted/EV Nova 1.0.2/$f" "$E/trimmed/EV Nova/$f"
done
rm -f "$E/trimmed/EV Nova/Nova Files"/*.mov
find "$E/trimmed" -name .DS_Store -delete

echo "fetched + extracted into $RAW"
