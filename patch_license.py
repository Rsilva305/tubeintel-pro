#!/usr/bin/env python3
"""Minimal license bypass patches only (less invasive than full patch_ads.py)."""

from pathlib import Path

BASE = Path("/workspace/apk_analysis/apktool")


def patch_file(rel_path: str, old: str, new: str, label: str) -> None:
    path = BASE / rel_path
    text = path.read_text()
    if old not in text:
        raise SystemExit(f"PATCH FAILED [{label}]: pattern not found in {rel_path}")
    path.write_text(text.replace(old, new, 1))
    print(f"OK: {label}")


patch_file(
    "smali_classes2/com/pairip/licensecheck/LicenseClient.smali",
    """    sget-object v0, Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;->CHECK_REQUIRED:Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;

    sput-object v0, Lcom/pairip/licensecheck/LicenseClient;->licenseCheckState:Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;""",
    """    sget-object v0, Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;->FULL_CHECK_OK:Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;

    sput-object v0, Lcom/pairip/licensecheck/LicenseClient;->licenseCheckState:Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;""",
    "default license state",
)

patch_file(
    "smali_classes2/com/pairip/licensecheck/LicenseClient.smali",
    """.method public static checkLicense(Landroid/content/Context;)V
    .locals 2
    .annotation system Ldalvik/annotation/MethodParameters;
        accessFlags = {
            0x0
        }
        names = {
            "context"
        }
    .end annotation

    .line 168
    const-string v0, "LicenseClient\"""",
    """.method public static checkLicense(Landroid/content/Context;)V
    .locals 1
    .annotation system Ldalvik/annotation/MethodParameters;
        accessFlags = {
            0x0
        }
        names = {
            "context"
        }
    .end annotation

    sget-object v0, Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;->FULL_CHECK_OK:Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;

    sput-object v0, Lcom/pairip/licensecheck/LicenseClient;->licenseCheckState:Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;

    return-void

    .line 168
    const-string v0, "LicenseClient\"""",
    "checkLicense bypass",
)

patch_file(
    "smali_classes2/com/pairip/licensecheck/LicenseClient.smali",
    """.method private handleError(Lcom/pairip/licensecheck/LicenseCheckException;)V
    .locals 2
    .annotation system Ldalvik/annotation/MethodParameters;
        accessFlags = {
            0x0
        }
        names = {
            "ex"
        }
    .end annotation

    .line 652
    sget-object v0, Lcom/pairip/licensecheck/LicenseClient;->mainThreadRunner:Lcom/pairip/licensecheck/LicenseClient$ImmediateTaskExecutor;""",
    """.method private handleError(Lcom/pairip/licensecheck/LicenseCheckException;)V
    .locals 2
    .annotation system Ldalvik/annotation/MethodParameters;
        accessFlags = {
            0x0
        }
        names = {
            "ex"
        }
    .end annotation

    return-void

    .line 652
    sget-object v0, Lcom/pairip/licensecheck/LicenseClient;->mainThreadRunner:Lcom/pairip/licensecheck/LicenseClient$ImmediateTaskExecutor;""",
    "handleError bypass",
)

patch_file(
    "smali_classes2/com/pairip/licensecheck/LicenseClient$1.smali",
    """.method public run()V
    .locals 1

    const/4 v0, 0x0

    .line 82
    invoke-static {v0}, Ljava/lang/System;->exit(I)V""",
    """.method public run()V
    .locals 1

    return-void

    const/4 v0, 0x0

    .line 82
    invoke-static {v0}, Ljava/lang/System;->exit(I)V""",
    "exitAction bypass",
)

patch_file(
    "smali_classes2/com/pairip/licensecheck/LicenseClient.smali",
    """.method public initializeLicenseCheck()V
    .locals 3

    .line 245
    sget-object v0, Lcom/pairip/licensecheck/LicenseClient;->licenseCheckState:Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;""",
    """.method public initializeLicenseCheck()V
    .locals 1

    sget-object v0, Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;->FULL_CHECK_OK:Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;

    sput-object v0, Lcom/pairip/licensecheck/LicenseClient;->licenseCheckState:Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;

    return-void

    .line 245
    sget-object v0, Lcom/pairip/licensecheck/LicenseClient;->licenseCheckState:Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;""",
    "initializeLicenseCheck bypass",
)

patch_file(
    "smali_classes2/com/pairip/licensecheck/LicenseClient.smali",
    """.method static stopTrial(Landroid/content/Context;)V
    .locals 2
    .annotation system Ldalvik/annotation/MethodParameters;
        accessFlags = {
            0x0
        }
        names = {
            "context"
        }
    .end annotation

    .line 181
    const-string v0, "LicenseClient\"""",
    """.method static stopTrial(Landroid/content/Context;)V
    .locals 2
    .annotation system Ldalvik/annotation/MethodParameters;
        accessFlags = {
            0x0
        }
        names = {
            "context"
        }
    .end annotation

    return-void

    .line 181
    const-string v0, "LicenseClient\"""",
    "stopTrial bypass",
)

patch_file(
    "smali_classes2/com/pairip/licensecheck/LicenseActivity.smali",
    """.method protected exitApp()V
    .locals 1

    .line 122
    invoke-virtual {p0}, Lcom/pairip/licensecheck/LicenseActivity;->finishAndRemoveTask()V""",
    """.method protected exitApp()V
    .locals 1

    invoke-virtual {p0}, Lcom/pairip/licensecheck/LicenseActivity;->finish()V

    return-void

    .line 122
    invoke-virtual {p0}, Lcom/pairip/licensecheck/LicenseActivity;->finishAndRemoveTask()V""",
    "LicenseActivity.exitApp bypass",
)

print("License patches applied.")
