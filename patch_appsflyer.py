#!/usr/bin/env python3
"""Bypass AppsFlyer Play license verification (classes8.dex)."""

from pathlib import Path

from patch_utils import patch_method_file

BASE = Path("/workspace/apk_analysis/apktool")
path = BASE / "smali_classes8/com/appsflyer/internal/AFf1eSDK.smali"

patch_method_file(
    path,
    "AFAdRevenueData(JLandroid/content/Context;Lcom/appsflyer/internal/AFf1eSDK$AFa1tSDK;)Z",
    """.method public final AFAdRevenueData(JLandroid/content/Context;Lcom/appsflyer/internal/AFf1eSDK$AFa1tSDK;)Z
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
.end method""",
    "AppsFlyer LVL bypass",
)

print("AppsFlyer patch applied.")
