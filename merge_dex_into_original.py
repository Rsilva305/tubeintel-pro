#!/usr/bin/env python3
"""Merge patched DEX files into the original base APK (preserves resources byte-for-byte)."""

import shutil
import sys
import zipfile
from pathlib import Path

ORIGINAL = Path("/workspace/xapk_extracted/com.cyphergames.royalsmash.apk")
PATCHED = Path("/workspace/apk_analysis/royalsmash-noads-unsigned.apk")
OUTPUT = Path("/workspace/apk_analysis/royalsmash-noads-merged.apk")

# Only replace dex we actually patch (ads + license)
DEX_TO_REPLACE = {"classes.dex", "classes2.dex"}


def main() -> None:
    if not ORIGINAL.exists() or not PATCHED.exists():
        sys.exit("Missing original or patched APK")

    patched_dex: dict[str, bytes] = {}
    with zipfile.ZipFile(PATCHED, "r") as z:
        for name in DEX_TO_REPLACE:
            try:
                patched_dex[name] = z.read(name)
            except KeyError:
                print(f"WARN: {name} not in patched APK")

    shutil.copy2(ORIGINAL, OUTPUT)
    entries: list[tuple[zipfile.ZipInfo, bytes]] = []
    with zipfile.ZipFile(ORIGINAL, "r") as zin:
        for info in zin.infolist():
            data = patched_dex[info.filename] if info.filename in patched_dex else zin.read(info.filename)
            entries.append((info, data))

    with zipfile.ZipFile(OUTPUT, "w") as zout:
        for info, data in entries:
            new_info = zipfile.ZipInfo(filename=info.filename, date_time=info.date_time)
            new_info.compress_type = info.compress_type
            new_info.external_attr = info.external_attr
            new_info.flag_bits = info.flag_bits
            new_info.create_system = info.create_system
            zout.writestr(new_info, data)

    print(f"Merged {len(patched_dex)} dex file(s) into {OUTPUT}")
    print(f"Output size: {OUTPUT.stat().st_size / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
