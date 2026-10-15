#!/usr/bin/env python3
"""Pack an extracted classic-Mac folder (native forks, macOS) into:
  <out>/<vol>.hfv                raw HFS volume (no DiskCopy header), built with hfsutils
  <out>/macbinary/...            MacBinary II per file
  <out>/appledouble-percent/...  data fork + %Name AppleDouble header (Executor style)
  <out>/appledouble-dot/...      data fork + ._Name AppleDouble header (macOS/netatalk style)
  <out>/resources.txt            resource types/counts per file, CODE / cfrg check
Usage: prepare-games.py <extracted-dir> <out-dir> <volume-name>
Needs: macOS (reads ..namedfork/rsrc + com.apple.FinderInfo), hfsutils (hformat/hcopy).
"""
import binascii, os, shutil, struct, subprocess, sys

MAC_EPOCH = 2082844800


def finder_info(path):
    r = subprocess.run(["xattr", "-px", "com.apple.FinderInfo", path], capture_output=True, text=True)
    return bytes.fromhex(r.stdout) if r.returncode == 0 else bytes(32)


def read_file(path):
    data = open(path, "rb").read()
    try:
        rsrc = open(path + "/..namedfork/rsrc", "rb").read()
    except OSError:
        rsrc = b""
    return data, rsrc, finder_info(path)[:32].ljust(32, b"\0")


def crc16_xmodem(b):
    return binascii.crc_hqx(b, 0)


def macbinary(name, data, rsrc, finfo, mtime):
    n = name.encode("mac_roman", "replace")[:63]
    d = int(mtime) + MAC_EPOCH
    h = bytearray(128)
    h[1] = len(n); h[2:2 + len(n)] = n
    h[65:73] = finfo[0:8]                      # type, creator
    h[73] = finfo[8] & ~0x01                   # finder flags high byte (clear 'inited')
    h[75:81] = finfo[10:16]                    # location, folder
    struct.pack_into(">IIII", h, 83, len(data), len(rsrc), d, d)
    h[101] = finfo[9]                          # finder flags low byte
    h[122] = h[123] = 129                      # MacBinary II
    struct.pack_into(">H", h, 124, crc16_xmodem(bytes(h[:124])))
    pad = lambda b: b + bytes(-len(b) % 128)
    return bytes(h) + pad(data) + pad(rsrc)


def appledouble(rsrc, finfo):
    hdr = struct.pack(">II16sH", 0x00051607, 0x00020000, b"", 2)
    off = len(hdr) + 2 * 12
    hdr += struct.pack(">III", 9, off, 32) + struct.pack(">III", 2, off + 32, len(rsrc))
    return hdr + finfo + rsrc


def resource_types(rsrc):
    """{type: [(id, size), ...]} from a resource fork."""
    if len(rsrc) < 16:
        return {}
    doff, moff = struct.unpack_from(">II", rsrc, 0)
    tl = moff + struct.unpack_from(">H", rsrc, moff + 24)[0]
    out = {}
    for i in range(struct.unpack_from(">H", rsrc, tl)[0] + 1 & 0xFFFF):
        t, cnt, ref = struct.unpack_from(">4sHH", rsrc, tl + 2 + i * 8)
        items = []
        for j in range(cnt + 1):
            rid, _, attr_off = struct.unpack_from(">hHI", rsrc, tl + ref + j * 12)
            o = doff + (attr_off & 0xFFFFFF)
            items.append((rid, struct.unpack_from(">I", rsrc, o)[0]))
        out[t.decode("mac_roman")] = items
    return out


def main(src, out, vol):
    shutil.rmtree(out, ignore_errors=True)
    files, dirs, report, total = [], [], [], 0
    for root, ds, fs in os.walk(src):
        ds.sort()
        rel = os.path.relpath(root, src)
        if rel != ".":
            dirs.append(rel)
        for f in sorted(fs):
            if f.startswith(".") or f in ("Icon\r",):
                continue
            p = os.path.join(root, f)
            data, rsrc, finfo = read_file(p)
            files.append((os.path.normpath(os.path.join(rel, f)), data, rsrc, finfo, os.stat(p).st_mtime))
            total += len(data) + len(rsrc)

    for rel, data, rsrc, finfo, mtime in files:
        name, sub = os.path.basename(rel), os.path.dirname(rel)
        for kind in ("macbinary", "appledouble-percent", "appledouble-dot"):
            os.makedirs(os.path.join(out, kind, sub), exist_ok=True)
        open(os.path.join(out, "macbinary", rel + ".bin"), "wb").write(macbinary(name, data, rsrc, finfo, mtime))
        for kind, prefix in (("appledouble-percent", "%"), ("appledouble-dot", "._")):
            open(os.path.join(out, kind, rel), "wb").write(data)
            open(os.path.join(out, kind, sub, prefix + name), "wb").write(appledouble(rsrc, finfo))
        types = resource_types(rsrc)
        line = f"{rel}: type={finfo[:4].decode('mac_roman')} creator={finfo[4:8].decode('mac_roman')} data={len(data)} rsrc={len(rsrc)}"
        if types:
            line += "\n  types: " + " ".join(f"{t.strip() or repr(t)}x{len(v)}" for t, v in sorted(types.items()))
            if "CODE" in types:
                line += "\n  CODE: " + " ".join(f"{i}:{s}" for i, s in sorted(types["CODE"]))
            line += f"\n  68k CODE: {'yes' if 'CODE' in types else 'no'}; PPC cfrg: {'yes' if 'cfrg' in types else 'no'}"
        report.append(line)
    open(os.path.join(out, "resources.txt"), "w").write("\n".join(report) + "\n")

    # HFS volume: blank image, hformat, recreate folders, hcopy -m each MacBinary.
    img = os.path.join(out, vol.replace(" ", "-") + ".hfv")
    blocks = max(1600, (total * 12 // 10 + 512 * 1024) // 512)   # >= 800K, ~20% + 512K slack
    with open(img, "wb") as f:
        f.truncate(blocks * 512)
    env = dict(os.environ, HOME=out)  # hfsutils keeps its "current volume" in $HOME/.hcwd
    run = lambda *a: subprocess.run(a, check=True, env=env, stdout=subprocess.DEVNULL)
    run("hformat", "-l", vol, img)
    for d in dirs:
        run("hmkdir", ":" + d.replace("/", ":"))
    for rel, *_ in files:
        sub = os.path.dirname(rel)
        run("hcopy", "-m", os.path.join(out, "macbinary", rel + ".bin"), ":" + (sub.replace("/", ":") + ":" if sub else ""))
    print(subprocess.run(["hls", "-lR"], env=env, capture_output=True, encoding="mac_roman").stdout)
    run("humount")
    os.remove(os.path.join(out, ".hcwd"))
    print("\n".join(report))


if __name__ == "__main__":
    main(*sys.argv[1:4])
