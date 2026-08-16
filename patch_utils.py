#!/usr/bin/env python3
"""Helpers for safe smali method replacement (no dead code after return)."""

from __future__ import annotations


def replace_method(text: str, method_token: str, new_method: str, label: str) -> str:
    """Replace one method whose header contains method_token.

    method_token should uniquely identify the method, e.g.
    'initializeLicenseCheck()V' or 'public static checkLicense'.
    """
    idx = 0
    while True:
        start = text.find(".method ", idx)
        if start == -1:
            raise SystemExit(f"PATCH FAILED [{label}]: method not found ({method_token})")
        line_end = text.find("\n", start)
        header = text[start:line_end]
        if method_token in header:
            end = text.index(".end method", start) + len(".end method")
            return text[:start] + new_method + text[end:]
        idx = line_end + 1


def patch_method_file(path, method_token: str, new_method: str, label: str) -> None:
    text = path.read_text()
    updated = replace_method(text, method_token, new_method, label)
    path.write_text(updated)
    print(f"OK: {label}")
