#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ ! -f android/gradlew ]]; then
 echo "Android scaffold missing. Initialise using npx cap add android" >&2; exit 1
fi
npx cap copy android
cp native-judges/index.html native-judges/auth.html native-judges/auth.js native-judges/community.html native-judges/mobile-session.js native-judges/app.js android/app/src/main/assets/public/
GABA_API_BASE="https://uskemdfbmuilvirqudml.supabase.co/functions/v1/waterwatch-api" node scripts/configure-native-api.mjs
JAVA_HOME="${JAVA_HOME:-$HOME/Library/Java/JavaVirtualMachines/jbr-21.0.11/Contents/Home}"
export JAVA_HOME
export PATH="$JAVA_HOME/bin:$PATH"
"$JAVA_HOME/bin/javac" -version
cd android
./gradlew assembleDebug --offline --no-daemon "-Dorg.gradle.java.home=$JAVA_HOME"
printf 'APK created at: %s\n' "$PWD/app/build/outputs/apk/debug/app-debug.apk"
