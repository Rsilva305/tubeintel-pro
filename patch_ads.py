#!/usr/bin/env python3
"""Apply ad-removal patches to decompiled Royal Smash APK."""

from pathlib import Path

BASE = Path("/workspace/apk_analysis/apktool")

def patch_file(rel_path: str, old: str, new: str, label: str) -> None:
    path = BASE / rel_path
    text = path.read_text()
    if old not in text:
        raise SystemExit(f"PATCH FAILED [{label}]: pattern not found in {rel_path}")
    path.write_text(text.replace(old, new, 1))
    print(f"OK: {label}")


# Bypass PairIP / Play license check (required for resigned APK)
patch_file(
    "smali_classes2/com/pairip/licensecheck/LicenseClient.smali",
    """    sget-object v0, Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;->CHECK_REQUIRED:Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;

    sput-object v0, Lcom/pairip/licensecheck/LicenseClient;->licenseCheckState:Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;""",
    """    sget-object v0, Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;->FULL_CHECK_OK:Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;

    sput-object v0, Lcom/pairip/licensecheck/LicenseClient;->licenseCheckState:Lcom/pairip/licensecheck/LicenseClient$LicenseCheckState;""",
    "LicenseClient default state FULL_CHECK_OK",
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
    "LicenseClient.checkLicense bypass",
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

patch_file(
    "smali_classes2/com/pairip/licensecheck/LicenseContentProvider.smali",
    """.method public onCreate()Z
    .locals 1

    .line 12
    invoke-virtual {p0}, Lcom/pairip/licensecheck/LicenseContentProvider;->getContext()Landroid/content/Context;

    move-result-object v0

    invoke-static {v0}, Lcom/pairip/licensecheck/LicenseClient;->checkLicense(Landroid/content/Context;)V

    const/4 v0, 0x1

    return v0
.end method""",
    """.method public onCreate()Z
    .locals 1

    const/4 v0, 0x1

    return v0
.end method""",
    "LicenseContentProvider bypass",
)

MANAGER = "smali/com/applovin/mediation/unity/MaxUnityAdManager.smali"

# Always report ads as ready
for method in ["isRewardedAdReady", "isInterstitialReady", "isAppOpenAdReady"]:
    old = f""".method public {method}(Ljava/lang/String;)Z
    .locals 0

    """
    # read method from file and replace whole method
    path = BASE / MANAGER
    text = path.read_text()
    start = text.index(f".method public {method}(Ljava/lang/String;)Z")
    end = text.index(".end method", start) + len(".end method")
    new_method = f""".method public {method}(Ljava/lang/String;)Z
    .locals 1

    const/4 p1, 0x1

    return p1
.end method"""
    path.write_text(text[:start] + new_method + text[end:])
    print(f"OK: {method}")

# Block banner / MREC ads
for method in [
    "loadBanner",
    "showBanner",
    "loadMRec",
    "showMRec",
    "startBannerAutoRefresh",
    "startMRecAutoRefresh",
]:
    patch_file(
        MANAGER,
        f""".method public {method}(Ljava/lang/String;)V
    .locals 1

    .line""",
        f""".method public {method}(Ljava/lang/String;)V
    .locals 1

    return-void

    .line""",
        f"{method} noop",
    )

for method in ["createBanner", "createMRec"]:
    for sig in [
        "(Ljava/lang/String;Ljava/lang/String;Z)V",
        "(Ljava/lang/String;FFZ)V",
        "(Ljava/lang/String;Ljava/lang/String;)V",
        "(Ljava/lang/String;FF)V",
    ]:
        old = f""".method public {method}{sig}
    .locals 6

    .line"""
        path = BASE / MANAGER
        text = path.read_text()
        if old not in text:
            continue
        text = text.replace(
            old,
            f""".method public {method}{sig}
    .locals 6

    return-void

    .line""",
            1,
        )
        path.write_text(text)
        print(f"OK: {method}{sig} noop")

# Skip rewarded ads but grant reward instantly
patch_file(
    MANAGER,
    """.method public showRewardedAd(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    .locals 1

    .line 498
    invoke-direct {p0, p1}, Lcom/applovin/mediation/unity/MaxUnityAdManager;->retrieveRewardedAd(Ljava/lang/String;)Lcom/applovin/mediation/ads/MaxRewardedAd;

    move-result-object p1

    .line 499
    invoke-static {}, Lcom/applovin/mediation/unity/MaxUnityAdManager;->getCurrentActivity()Landroid/app/Activity;

    move-result-object v0

    invoke-virtual {p1, p2, p3, v0}, Lcom/applovin/mediation/ads/MaxRewardedAd;->showAd(Ljava/lang/String;Ljava/lang/String;Landroid/app/Activity;)V

    return-void
.end method""",
    """.method public showRewardedAd(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    .locals 2

    invoke-direct {p0, p1}, Lcom/applovin/mediation/unity/MaxUnityAdManager;->getAd(Ljava/lang/String;)Lcom/applovin/mediation/MaxAd;

    move-result-object v0

    if-eqz v0, :cond_fake

    invoke-virtual {p0, v0}, Lcom/applovin/mediation/unity/MaxUnityAdManager;->onAdDisplayed(Lcom/applovin/mediation/MaxAd;)V

    invoke-static {}, Lcom/applovin/impl/mediation/MaxRewardImpl;->createDefault()Lcom/applovin/mediation/MaxReward;

    move-result-object v1

    invoke-virtual {p0, v0, v1}, Lcom/applovin/mediation/unity/MaxUnityAdManager;->onUserRewarded(Lcom/applovin/mediation/MaxAd;Lcom/applovin/mediation/MaxReward;)V

    invoke-virtual {p0, v0}, Lcom/applovin/mediation/unity/MaxUnityAdManager;->onAdHidden(Lcom/applovin/mediation/MaxAd;)V

    return-void

    :cond_fake
    new-instance v0, Lorg/json/JSONObject;

    invoke-direct {v0}, Lorg/json/JSONObject;-><init>()V

    const-string v1, "name"

    const-string p2, "OnRewardedAdDisplayedEvent"

    invoke-static {v0, v1, p2}, Lcom/applovin/impl/sdk/utils/JsonUtils;->putString(Lorg/json/JSONObject;Ljava/lang/String;Ljava/lang/String;)V

    const-string p2, "adUnitId"

    invoke-static {v0, p2, p1}, Lcom/applovin/impl/sdk/utils/JsonUtils;->putString(Lorg/json/JSONObject;Ljava/lang/String;Ljava/lang/String;)V

    invoke-static {v0}, Lcom/applovin/mediation/unity/MaxUnityAdManager;->forwardUnityEvent(Lorg/json/JSONObject;)V

    new-instance v0, Lorg/json/JSONObject;

    invoke-direct {v0}, Lorg/json/JSONObject;-><init>()V

    const-string p2, "OnRewardedAdReceivedRewardEvent"

    invoke-static {v0, v1, p2}, Lcom/applovin/impl/sdk/utils/JsonUtils;->putString(Lorg/json/JSONObject;Ljava/lang/String;Ljava/lang/String;)V

    const-string p2, "adUnitId"

    invoke-static {v0, p2, p1}, Lcom/applovin/impl/sdk/utils/JsonUtils;->putString(Lorg/json/JSONObject;Ljava/lang/String;Ljava/lang/String;)V

    const-string p1, "rewardLabel"

    const-string p2, ""

    invoke-static {v0, p1, p2}, Lcom/applovin/impl/sdk/utils/JsonUtils;->putString(Lorg/json/JSONObject;Ljava/lang/String;Ljava/lang/String;)V

    const-string p1, "rewardAmount"

    const-string p2, "1"

    invoke-static {v0, p1, p2}, Lcom/applovin/impl/sdk/utils/JsonUtils;->putString(Lorg/json/JSONObject;Ljava/lang/String;Ljava/lang/String;)V

    invoke-static {v0}, Lcom/applovin/mediation/unity/MaxUnityAdManager;->forwardUnityEvent(Lorg/json/JSONObject;)V

    new-instance v0, Lorg/json/JSONObject;

    invoke-direct {v0}, Lorg/json/JSONObject;-><init>()V

    const-string p2, "OnRewardedAdHiddenEvent"

    invoke-static {v0, v1, p2}, Lcom/applovin/impl/sdk/utils/JsonUtils;->putString(Lorg/json/JSONObject;Ljava/lang/String;Ljava/lang/String;)V

    const-string p2, "adUnitId"

    invoke-static {v0, p2, p1}, Lcom/applovin/impl/sdk/utils/JsonUtils;->putString(Lorg/json/JSONObject;Ljava/lang/String;Ljava/lang/String;)V

    invoke-static {v0}, Lcom/applovin/mediation/unity/MaxUnityAdManager;->forwardUnityEvent(Lorg/json/JSONObject;)V

    return-void
.end method""",
    "showRewardedAd bypass",
)

# Skip interstitial ads
patch_file(
    MANAGER,
    """.method public showInterstitial(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    .locals 1

    .line 422
    invoke-direct {p0, p1}, Lcom/applovin/mediation/unity/MaxUnityAdManager;->retrieveInterstitial(Ljava/lang/String;)Lcom/applovin/mediation/ads/MaxInterstitialAd;

    move-result-object p1

    .line 423
    invoke-static {}, Lcom/applovin/mediation/unity/MaxUnityAdManager;->getCurrentActivity()Landroid/app/Activity;

    move-result-object v0

    invoke-virtual {p1, p2, p3, v0}, Lcom/applovin/mediation/ads/MaxInterstitialAd;->showAd(Ljava/lang/String;Ljava/lang/String;Landroid/app/Activity;)V

    return-void
.end method""",
    """.method public showInterstitial(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    .locals 2

    invoke-direct {p0, p1}, Lcom/applovin/mediation/unity/MaxUnityAdManager;->getAd(Ljava/lang/String;)Lcom/applovin/mediation/MaxAd;

    move-result-object v0

    if-eqz v0, :cond_fake

    invoke-virtual {p0, v0}, Lcom/applovin/mediation/unity/MaxUnityAdManager;->onAdDisplayed(Lcom/applovin/mediation/MaxAd;)V

    invoke-virtual {p0, v0}, Lcom/applovin/mediation/unity/MaxUnityAdManager;->onAdHidden(Lcom/applovin/mediation/MaxAd;)V

    return-void

    :cond_fake
    new-instance v0, Lorg/json/JSONObject;

    invoke-direct {v0}, Lorg/json/JSONObject;-><init>()V

    const-string v1, "name"

    const-string p2, "OnInterstitialHiddenEvent"

    invoke-static {v0, v1, p2}, Lcom/applovin/impl/sdk/utils/JsonUtils;->putString(Lorg/json/JSONObject;Ljava/lang/String;Ljava/lang/String;)V

    const-string p2, "adUnitId"

    invoke-static {v0, p2, p1}, Lcom/applovin/impl/sdk/utils/JsonUtils;->putString(Lorg/json/JSONObject;Ljava/lang/String;Ljava/lang/String;)V

    invoke-static {v0}, Lcom/applovin/mediation/unity/MaxUnityAdManager;->forwardUnityEvent(Lorg/json/JSONObject;)V

    return-void
.end method""",
    "showInterstitial bypass",
)

# Skip app open ads
patch_file(
    MANAGER,
    """.method public showAppOpenAd(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    .locals 0

    .line 460
    invoke-direct {p0, p1}, Lcom/applovin/mediation/unity/MaxUnityAdManager;->retrieveAppOpenAd(Ljava/lang/String;)Lcom/applovin/mediation/ads/MaxAppOpenAd;

    move-result-object p1

    .line 461
    invoke-virtual {p1, p2, p3}, Lcom/applovin/mediation/ads/MaxAppOpenAd;->showAd(Ljava/lang/String;Ljava/lang/String;)V

    return-void
.end method""",
    """.method public showAppOpenAd(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    .locals 0

    return-void
.end method""",
    "showAppOpenAd bypass",
)

print("All patches applied.")
