#!/usr/bin/env python3
"""Print Apple's Mac OS 8 floppy disk icon as SVG paths for web/index.html.

The icon is the generic floppy icon (kFloppyIconResource): 'icl8' and 'ICN#'
id -3998 in the System file of Mac OS 8.1. Our copy came from the System
Folder in "Mac OS 8.1 for a Mac IIfx" on the Macintosh Garden:
https://macintoshgarden.org/apps/mac-os-81-a-mac-iifx-or-maybe-just-a-68030

    unar IIfx_Mac_OS_8.1_volume.sit
    hmount "IIfx Mac OS 8.1 volume.iso"
    hcopy -m ":System Folder:System" System.bin   # MacBinary keeps the resource fork
    humount
    scripts/floppy-icon.py System.bin

Paste the output into the <symbol id="floppy"> element in web/index.html.
"""
import re
import struct
import sys


def resource_fork(macbinary):
    data_len, rsrc_len = struct.unpack('>II', macbinary[83:91])
    start = 128 + (data_len + 127) // 128 * 128
    return macbinary[start:start + rsrc_len]


def get_resource(fork, want_type, want_id):
    data_off, map_off = struct.unpack('>II', fork[:8])
    m = fork[map_off:]
    types_off = struct.unpack('>H', m[24:26])[0]
    ntypes = struct.unpack('>H', m[types_off:types_off + 2])[0] + 1
    for t in range(ntypes):
        typ, count, refs = struct.unpack('>4sHH', m[types_off + 2 + 8 * t:types_off + 10 + 8 * t])
        if typ != want_type:
            continue
        for k in range(count + 1):
            rid, _, attrs_off = struct.unpack('>hHI', m[types_off + refs + 12 * k:types_off + refs + 12 * k + 8])
            if rid != want_id:
                continue
            # 8.1 stores these icons uncompressed; the floppy-disk System 8.0 compresses them with 'dcmp' 3
            assert not attrs_off >> 24 & 1, 'resource is compressed'
            off = data_off + (attrs_off & 0xFFFFFF)
            length = struct.unpack('>I', fork[off:off + 4])[0]
            return fork[off + 4:off + 4 + length]
    raise KeyError((want_type, want_id))


def mac_palette():
    """The standard 8-bit Mac color table (clut 8)."""
    v = [0xFF, 0xCC, 0x99, 0x66, 0x33, 0x00]
    p = [(v[i // 36], v[i // 6 % 6], v[i % 6]) for i in range(215)]
    ramp = [0xEE, 0xDD, 0xBB, 0xAA, 0x88, 0x77, 0x55, 0x44, 0x22, 0x11]
    p += [(x, 0, 0) for x in ramp] + [(0, x, 0) for x in ramp] + [(0, 0, x) for x in ramp]
    p += [(x, x, x) for x in ramp] + [(0, 0, 0)]
    assert len(p) == 256
    return p


def main(path):
    fork = resource_fork(open(path, 'rb').read())
    pixels = get_resource(fork, b'icl8', -3998)
    icn = get_resource(fork, b'ICN#', -3998)
    assert len(pixels) == 1024 and len(icn) == 256
    palette = mac_palette()
    # one letter per pixel: the palette index, or None outside the ICN# mask
    rows = []
    for y in range(32):
        mask = int.from_bytes(icn[128 + 4 * y:132 + 4 * y], 'big')
        rows.append([pixels[32 * y + x] if mask >> (31 - x) & 1 else None for x in range(32)])
    out = []
    for index in sorted({c for row in rows for c in row if c is not None}):
        d = ''
        for y, row in enumerate(rows):
            line = ''.join('x' if c == index else '.' for c in row)
            for run in re.finditer('x+', line):
                n = len(run.group())
                d += f'M{run.start()} {y}h{n}v1h-{n}z'
        out.append('<path fill="#%02x%02x%02x" d="%s"/>' % (*palette[index], d))
    print(''.join(out))


if __name__ == '__main__':
    main(sys.argv[1])
