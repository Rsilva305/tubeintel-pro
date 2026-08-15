#!/bin/bash
set -euo pipefail

SRC_APK="/workspace/xapk_extracted/com.cyphergames.royalsmash.apk"
DECODE_DIR="/workspace/apk_analysis/apktool"
APKTOOL="/workspace/tools/apktool.jar"
BT="/workspace/android-sdk/build-tools/34.0.0"
KS="/workspace/royalsmash.keystore"

if [ ! -f "$KS" ]; then
  keytool -genkeypair -v -keystore "$KS" -alias royalsmash -keyalg RSA -keysize 2048 -validity 10000 \
    -storepass royalsmash -keypass royalsmash -dname "CN=RoyalSmash Mod, OU=Mod, O=Mod, L=NA, ST=NA, C=US"
fi

echo "==> Decompile (smali only)"
rm -rf "$DECODE_DIR"
java -jar "$APKTOOL" d -r -f -o "$DECODE_DIR" "$SRC_APK"

echo "==> Apply patches"
python3 /workspace/patch_license.py
python3 /workspace/patch_ads.py

echo "==> Build dex via apktool"
java -jar "$APKTOOL" b "$DECODE_DIR" -o /workspace/apk_analysis/royalsmash-dex-only.apk
zip -q -d /workspace/apk_analysis/royalsmash-dex-only.apk assets.dex || true

echo "==> Merge patched dex into ORIGINAL base APK (preserves resources)"
cp /workspace/apk_analysis/royalsmash-dex-only.apk /workspace/apk_analysis/royalsmash-noads-unsigned.apk
python3 /workspace/merge_dex_into_original.py

echo "==> Sign all split APKs"
rm -rf /workspace/xapk_final
mkdir -p /workspace/xapk_final
cp /workspace/apk_analysis/royalsmash-noads-merged.apk /workspace/xapk_final/com.cyphergames.royalsmash.apk
cp /workspace/xapk_extracted/config.arm64_v8a.apk /workspace/xapk_extracted/UnityDataAssetPack.apk /workspace/xapk_final/

cd /workspace/xapk_final
for f in *.apk; do zip -q -d "$f" 'META-INF/*' || true; done
for f in *.apk; do
  "$BT/zipalign" -f -p 4 "$f" "${f%.apk}-aligned.apk"
  "$BT/apksigner" sign --ks "$KS" --ks-key-alias royalsmash \
    --ks-pass pass:royalsmash --key-pass pass:royalsmash \
    --out "${f%.apk}-signed.apk" "${f%.apk}-aligned.apk"
done

VERSION="${1:-v5}"
OUT="/workspace/RoyalSmash-no-ads-${VERSION}.xapk"
rm -rf "/workspace/xapk_out"
mkdir -p "/workspace/xapk_out"
cp /workspace/xapk_extracted/manifest.json /workspace/xapk_extracted/icon.png /workspace/xapk_out/
cp com.cyphergames.royalsmash-signed.apk /workspace/xapk_out/com.cyphergames.royalsmash.apk
cp config.arm64_v8a-signed.apk /workspace/xapk_out/config.arm64_v8a.apk
cp UnityDataAssetPack-signed.apk /workspace/xapk_out/UnityDataAssetPack.apk
cd /workspace/xapk_out && zip -r "$OUT" .
ls -lh "$OUT"
echo "Built $OUT"
