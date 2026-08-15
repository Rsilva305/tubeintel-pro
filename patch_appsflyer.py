#!/usr/bin/env python3
"""Bypass AppsFlyer Play license verification (classes8.dex)."""

from pathlib import Path

BASE = Path("/workspace/apk_analysis/apktool")
path = BASE / "smali_classes8/com/appsflyer/internal/AFf1eSDK.smali"
text = path.read_text()

old = """.method public final AFAdRevenueData(JLandroid/content/Context;Lcom/appsflyer/internal/AFf1eSDK$AFa1tSDK;)Z
    .locals 1
    .param p3    # Landroid/content/Context;
        .annotation build Landroidx/annotation/NonNull;
        .end annotation
    .end param
    .param p4    # Lcom/appsflyer/internal/AFf1eSDK$AFa1tSDK;
        .annotation build Landroidx/annotation/NonNull;
        .end annotation
    .end param

    .line 18
    :try_start_0"""

new = """.method public final AFAdRevenueData(JLandroid/content/Context;Lcom/appsflyer/internal/AFf1eSDK$AFa1tSDK;)Z
    .locals 1
    .param p3    # Landroid/content/Context;
        .annotation build Landroidx/annotation/NonNull;
        .end annotation
    .end param
    .param p4    # Lcom/appsflyer/internal/AFf1eSDK$AFa1tSDK;
        .annotation build Landroidx/annotation/NonNull;
        .end annotation
    .end param

    const/4 v0, 0x0

    return v0

    .line 18
    :try_start_0"""

if old not in text:
    raise SystemExit("PATCH FAILED: AppsFlyer LVL pattern not found")
path.write_text(text.replace(old, new, 1))
print("OK: AppsFlyer LVL bypass")
