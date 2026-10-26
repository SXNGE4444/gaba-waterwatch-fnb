# GABA WaterWatch FNB — Android 0.9.6 (signed sideload APK)

Android package identity: `za.co.lastdices.gabawaterwatch.fnb` (identical to **v0.9.2** working phone package). VersionCode 15. Android 7.0+ (API 24). Uses the same Android debug signing certificate as v0.9.2.

## Resident journeys
1. First run shows the native login/registration/password reset page.
2. Create account via Supabase Auth using a strong unique password.
3. Email confirmation link opens the website's auth callback; verify there, then return to the app and sign in. The confirmation link is a website URL, **not** an Android deep link.
4. Verified session is stored locally and refreshed when its access token expires.
5. WaterWatch Home, Updates, Report, Activity and Guides require a verified resident session.
6. Report write and status lookup also require a valid bearer token on the server. Every new report is tied to its owner's Supabase Auth user ID.
7. Operator and simulated reviewer access require separate staff-role authorisation.

## Authentication verification status
The Resend SMTP 550 error logged earlier on 2026-10-24 was resolved. Supabase Auth logs subsequently recorded successful email signup (HTTP 200 at 11:30:41 UTC), an email-verification redirect (HTTP 303 at 11:30:49 UTC), and a confirmed user in `auth.users`. Both existing accounts are confirmed as of this audit.

**Remaining acceptance check:** Register a fresh judge account, follow the delivered confirmation link, sign in on an actual Android handset, submit a synthetic report as that account, verify the owner-scoped report appears in Activity, sign out, and test password recovery. Existing API checks confirm guest access is blocked, but those steps are not yet jointly certified end to end. Keep all demo reports synthetic.

## Build
Run `bash scripts/build-judges-android.sh` with Android SDK and JDK 21. This uses the locked Capacitor dependencies, layers the login-first web assets into the Android bundle, and builds a debug-signed phone-installable APK. The original signing key is NOT distributed in source.

This application is a **synthetic data demonstration**, not a municipal water-safety advisory.
