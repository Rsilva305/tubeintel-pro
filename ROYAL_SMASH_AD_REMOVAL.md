# Royal Smash — Ad Removal Mod

Modified build of **Royal Smash! v1.9.226** (`com.cyphergames.royalsmash`) with ads disabled.

## What was changed

The game uses **AppLovin MAX** (Unity plugin) for interstitial, rewarded, banner, MREC, and app-open ads. Patches were applied to:

- `MaxUnityAdManager` — skip ad display; rewarded ads grant reward instantly
- `LicenseClient.checkLicense` — bypass PairIP/Play licensing check (required after re-signing)

Ad SDKs still ship in the APK but are no longer shown for MAX-mediated formats.

## Install (XAPK)

This is a **split APK / XAPK** bundle. You need an installer that supports XAPK:

1. **SAI** (Split APKs Installer)
2. **APKPure** app (XAPK install)
3. **XAPK Installer** from Play Store

Steps:

1. Download `RoyalSmash-no-ads.xapk`
2. Uninstall the Play Store version first (signatures differ)
3. Open the XAPK with your XAPK installer and install all splits

## Rebuild from source APK

```bash
python3 patch_ads.py
java -jar tools/apktool.jar b apk_analysis/apktool -o royalsmash-noads-unsigned.apk
java -jar tools/uber-apk-signer.jar --apks royalsmash-noads-unsigned.apk
# Repackage with config.arm64_v8a.apk and UnityDataAssetPack.apk from original XAPK
```

## Notes

- Re-signed with a debug key — not updatable from Play Store
- Online/server validation may still apply for some rewards
- For personal/offline use only; support the developer if you enjoy the game
