# WaterWatch 0.9.7 repair — 24 October 2026

This is a compatibility-preserving repair of the login-required 0.9.6 code, which uses the same Android package and signing certificate as the proven 0.9.2 APK.

## Changes
- Preserve saved sessions on network failures, throttling and server outages; discard rejected credentials only after authentication rejection.
- Return expired native sessions to sign-in when report synchronization needs authentication.
- Remove contradictory optional-login wording from the secondary Android auth screen.
- Exclude APK/ZIP downloads from service-worker interception, preventing an offline HTML fallback from masquerading as an installer.
- Permit Android-only builds without requiring an iOS bundle.

## Evidence from this repair
- Existing live 0.9.6 download: HTTP 200, 4,342,723 bytes, identical to saved release.
- 0.9.7: 21 automated tests pass, including session renewal, network outage preservation, rejected refresh tokens and binary-download exclusion.
- APK signature verified; package za.co.lastdices.gabawaterwatch.fnb, versionCode 16, Android API 24+.
- Certificate SHA-256 5fa11dd6e0e717946670107c69c7e1bd6e2698f3786aa4c79017b454a88790c8 matches 0.9.2.
- Emulator update installation: Success. Cold launch: Status ok. Login screen visually inspected.

## Acceptance still outstanding
Fresh real-inbox signup, confirmation, APK login, authenticated cloud report, account isolation, logout and password recovery have NOT been tested together during this repair. No test credentials were supplied. Supabase log access is denied for the connected accounts; Resend dashboard is signed out. Prior source commit 03ba497 documents SMTP repair and successful verification earlier today; this is historical evidence, not a new test.

This APK retains the original debug signer for update compatibility. Source archives omit the private signing key. A new local build will only update an existing install when signed with that same key.

## Rebuild
Use Node with npm, JDK 21, Android SDK platform 36 and build tools 36. Run npm ci, then JAVA_HOME=/your/jdk21 bash scripts/build-judges-android.sh. The script uses offline Gradle; on a fresh machine first populate Gradle dependencies with an online build. Output: android/app/build/outputs/apk/debug/app-debug.apk. Native login and reporting use the production Supabase endpoint. The standalone server.js is the separate synthetic local demo backend, not production Auth.
