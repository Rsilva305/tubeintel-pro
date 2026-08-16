#!/usr/bin/env python3
"""Apply ad-removal patches to decompiled Royal Smash APK."""

from pathlib import Path

from patch_utils import patch_method_file, replace_method

BASE = Path("/workspace/apk_analysis/apktool")
MANAGER = BASE / "smali/com/applovin/mediation/unity/MaxUnityAdManager.smali"
FULLSCREEN = BASE / "smali/com/applovin/impl/mediation/ads/MaxFullscreenAdImpl.smali"


# Always report ads as ready
for method in ["isRewardedAdReady", "isInterstitialReady", "isAppOpenAdReady"]:
    patch_method_file(
        MANAGER,
        f"{method}(Ljava/lang/String;)Z",
        f""".method public {method}(Ljava/lang/String;)Z
    .locals 1

    const/4 p1, 0x1

    return p1
.end method""",
        method,
    )

# Block banner / MREC / load methods
for method in [
    "loadBanner",
    "showBanner",
    "loadMRec",
    "showMRec",
    "startBannerAutoRefresh",
    "startMRecAutoRefresh",
    "loadAppOpenAd",
    "loadInterstitial",
    "loadRewardedAd",
]:
    patch_method_file(
        MANAGER,
        f"{method}(Ljava/lang/String;)V",
        f""".method public {method}(Ljava/lang/String;)V
    .locals 0

    return-void
.end method""",
        f"{method} noop",
    )

for method in ["createBanner", "createMRec"]:
    for sig in [
        "(Ljava/lang/String;Ljava/lang/String;Z)V",
        "(Ljava/lang/String;FFZ)V",
        "(Ljava/lang/String;Ljava/lang/String;)V",
        "(Ljava/lang/String;FF)V",
    ]:
        token = f"{method}{sig}"
        text = MANAGER.read_text()
        if token not in text:
            continue
        patch_method_file(
            MANAGER,
            token,
            f""".method public {token}
    .locals 0

    return-void
.end method""",
            f"{token} noop",
        )

patch_method_file(
    MANAGER,
    "showCmpForExistingUser()V",
    """.method public showCmpForExistingUser()V
    .locals 0

    return-void
.end method""",
    "showCmpForExistingUser noop",
)

patch_method_file(
    MANAGER,
    "showRewardedAd(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V",
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

patch_method_file(
    MANAGER,
    "showInterstitial(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V",
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

patch_method_file(
    MANAGER,
    "showAppOpenAd(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V",
    """.method public showAppOpenAd(Ljava/lang/String;Ljava/lang/String;Ljava/lang/String;)V
    .locals 0

    return-void
.end method""",
    "showAppOpenAd bypass",
)

patch_method_file(
    FULLSCREEN,
    "isReady()Z",
    """.method public isReady()Z
    .locals 1

    const/4 v0, 0x1

    return v0
.end method""",
    "MaxFullscreenAdImpl.isReady always true",
)

patch_method_file(
    FULLSCREEN,
    "showAd(Ljava/lang/String;Ljava/lang/String;Landroid/app/Activity;)V",
    """.method public showAd(Ljava/lang/String;Ljava/lang/String;Landroid/app/Activity;)V
    .locals 0

    return-void
.end method""",
    "MaxFullscreenAdImpl.showAd noop",
)

print("All ad patches applied.")
