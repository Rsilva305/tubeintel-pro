#!/bin/bash
set -euo pipefail

SRC_APK="/workspace/xapk_extracted/com.cyphergames.royalsmash.apk"
DECODE_DIR="/workspace/apk_analysis/apktool"
APKTOOL="/workspace/tools/apktool.jar"
BT="/workspace/android-sdk/build-tools/34.0.0"
KS="/workspace/royalsmash.keystore"

echo "==> Decompile (smali only, keep original resources)"
rm -rf "$DECODE_DIR"
java -jar "$APKTOOL" d -r -f -o "$DECODE_DIR" "$SRC_APK"

echo "==> Apply patches"
python3 /workspace/patch_ads.py

echo "==> Rebuild"
java -jar "$APKTOOL" b "$DECODE_DIR" -o /workspace/apk_analysis/royalsmash-noads-unsigned.apk

echo "==> Remove duplicate assets.dex (causes startup crash)"
zip -q -d /workspace/apk_analysis/royalsmash-noads-unsigned.apk assets.dex || true

echo "==> Sign all split APKs with one key"
rm -rf /workspace/xapk_final
mkdir -p /workspace/xapk_final
cp /workspace/apk_analysis/royalsmash-noads-unsigned.apk /workspace/xapk_final/com.cyphergames.royalsmash.apk
cp /workspace/xapk_extracted/config.arm64_v8a.apk /workspace/xapk_extracted/UnityDataAssetPack.apk /workspace/xapk_final/

cd /workspace/xapk_final
for f in *.apk; do zip -q -d "$f" 'META-INF/*' || true; done
for f in *.apk; do
  "$BT/zipalign" -f -p 4 "$f" "${f%.apk}-aligned.apk"
  "$BT/apksigner" sign --ks "$KS" --ks-key-alias royalsmash \
    --ks-pass pass:royalsmash --key-pass pass:royalsmash \
    --out "${f%.apk}-signed.apk" "${f%.apk}-aligned.apk"
done

echo "==> Package XAPK"
rm -rf /workspace/xapk_noads_v3
mkdir -p /workspace/xapk_noads_v3
cp /workspace/xapk_extracted/manifest.json /workspace/xapk_extracted/icon.png /workspace/xapk_noads_v3/
cp com.cyphergames.royalsmash-signed.apk /workspace/xapk_noads_v3/com.cyphergames.royalsmash.apk
cp config.arm64_v8a-signed.apk /workspace/xapk_noads_v3/config.arm64_v8a.apk
cp UnityDataAssetPack-signed.apk /workspace/xapk_noads_v3/UnityDataAssetPack.apk
cd /workspace/xapk_noads_v3
zip -r /workspace/RoyalSmash-no-ads-v4.xapk .
ls -lh /workspace/RoyalSmash-no-ads-v4.xapk
echo "Done."
