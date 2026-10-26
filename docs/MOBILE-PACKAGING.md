# Android APK and iOS route — local competition starter

## Important

A 4 MB signed-by-debug-key **Android debug APK** was built on 23 October 2026 for installation testing. It is NOT a production release and has not been physical-device tested. iOS native distribution is NOT built. The repository contains the web/PWA source and native packaging scaffold. Both platforms need a public HTTPS API before remote shared state will work on mobile devices.

## PWA (fastest installation path)

1. Deploy the `public/` assets to the correct HTTPS path, then ensure relative paths and service-worker scope remain under `/gabafnbhackaton/`.
2. Open the site in Chrome on Android or Safari on iOS, while online.
3. Android: use *Install app* if supported. iOS: Share → Add to Home Screen.
4. Launch again offline; validate cached shell and locally queued report.
5. Restore connectivity, sync report, confirm same client UUID is not duplicated.

A localhost URL on your Mac is **not** publicly accessible to judges; the HTTPS site must be separately deployed and tested.

## Android with Capacitor (requires Android Studio)

```sh
npm install
npx cap add android
npx cap sync android
npx cap open android
```

Install Android SDK/platform tools via Android Studio. Run on a physical Android device or emulator and export a signed release APK/AAB according to the event's allowed format. Verify the backend endpoint and routing. With a native scheme, `public/config.js` may point to a **secured HTTPS API prefix**; never embed secrets or admin tokens. The config file is intentionally blank now.

## iOS with Capacitor (requires macOS + Xcode)

```sh
npm install
npx cap add ios
npx cap sync ios
npx cap open ios
```

Signing and TestFlight distribution require appropriate Apple credentials and review. A PWA Add to Home Screen demo can be used before the native binary is available, if competition rules permit it.

## Device acceptance checklist

- Opening and navigation work on iPhone and Android at narrow widths.
- Keyboard doesn't obscure Submit report.
- Area selection survives refresh.
- Synthetic source label is always visible; no unsupported water-safety assurance.
- An offline report can be drafted and remains in Activity after app restart.
- Sync sends exactly one copy of the same client ID on reconnect.
- Operator action is reflected on resident Activity only after successful backend fetch.
- App permissions are minimal; location, camera and notifications are not required for this prototype.


## Public API in Capacitor builds

The browser version reads its external Supabase endpoint from the live hosted `config.js`. Native distributions bundle files and must be configured **after each Capacitor sync**: `GABA_API_BASE=https://<public-function-host>/functions/v1/waterwatch-api npm run native:configure-api`. Never embed service-role keys, operator passwords, or admin tokens. This script writes only a public HTTPS API base into the two native web asset copies. The Android virtual host uses `http://localhost` solely inside the embedded WebView to match the approved CORS origin; all API traffic still uses HTTPS. The iOS virtual host uses `capacitor://localhost`. The backend must authorise those origins explicitly. Both bundles can still open from packaged assets while offline; report sync requires connectivity.
