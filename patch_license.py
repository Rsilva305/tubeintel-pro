#!/usr/bin/env python3
"""License bypass patches (PairIP). Replaces whole methods to avoid VerifyError."""

from pathlib import Path

from patch_utils import patch_method_file, replace_method

BASE = Path("/workspace/apk_analysis/apktool")
LICENSE_CLIENT = BASE / "smali_classes2/com/pairip/licensecheck/LicenseClient.smali"
LICENSE_ACTIVITY = BASE / "smali_classes2/com/pairip/licensecheck/LicenseActivity.smali"
LICENSE_CLIENT_1 = BASE / "smali_classes2/com/pairip/licensecheck/LicenseClient$1.smali"

FULL_OK = """    sget-object v0, Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;->FULL_CHECK_OK:Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;

    sput-object v0, Lcom/pairip/licensecheck/LicenseClient;->licenseCheckState:Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;

    return-void"""


def patch_static_init() -> None:
    text = LICENSE_CLIENT.read_text()
    old = """    sget-object v0, Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;->CHECK_REQUIRED:Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;

    sput-object v0, Lcom/pairip/licensecheck/LicenseClient;->licenseCheckState:Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;"""
    new = """    sget-object v0, Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;->FULL_CHECK_OK:Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;

    sput-object v0, Lcom/pairip/licensecheck/LicenseClient;->licenseCheckState:Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;"""
    if old not in text:
        raise SystemExit("PATCH FAILED [default license state]: pattern not found")
    LICENSE_CLIENT.write_text(text.replace(old, new, 1))
    print("OK: default license state")


patch_static_init()

patch_method_file(
    LICENSE_CLIENT,
    "checkLicense(Landroid/content/Context;)V",
    f""".method public static checkLicense(Landroid/content/Context;)V
    .locals 1
    .annotation system Ldalvik/annotation/MethodParameters;
        accessFlags = {{
            0x0
        }}
        names = {{
            "context"
        }}
    .end annotation

{FULL_OK}
.end method""",
    "checkLicense bypass",
)

patch_method_file(
    LICENSE_CLIENT,
    "handleError(Lcom/pairip/licensecheck/LicenseCheckException;)V",
    """.method private handleError(Lcom/pairip/licensecheck/LicenseCheckException;)V
    .locals 0
    .annotation system Ldalvik/annotation/MethodParameters;
        accessFlags = {
            0x0
        }
        names = {
            "ex"
        }
    .end annotation

    return-void
.end method""",
    "handleError bypass",
)

patch_method_file(
    LICENSE_CLIENT,
    "initializeLicenseCheck()V",
    f""".method public initializeLicenseCheck()V
    .locals 1

{FULL_OK}
.end method""",
    "initializeLicenseCheck bypass",
)

patch_method_file(
    LICENSE_CLIENT,
    "stopTrial(Landroid/content/Context;)V",
    """.method static stopTrial(Landroid/content/Context;)V
    .locals 0
    .annotation system Ldalvik/annotation/MethodParameters;
        accessFlags = {
            0x0
        }
        names = {
            "context"
        }
    .end annotation

    return-void
.end method""",
    "stopTrial bypass",
)

patch_method_file(
    LICENSE_CLIENT_1,
    "run()V",
    """.method public run()V
    .locals 0

    return-void
.end method""",
    "exitAction bypass",
)

patch_method_file(
    LICENSE_ACTIVITY,
    "exitApp()V",
    """.method protected exitApp()V
    .locals 0

    invoke-virtual {p0}, Lcom/pairip/licensecheck/LicenseActivity;->finish()V

    return-void
.end method""",
    "LicenseActivity.exitApp bypass",
)

print("License patches applied.")
