# GABA WaterWatch — FNB App of the Year 2026

Independent hackathon application by Last Dices (Pty) Ltd.

This repository is the **standalone WaterWatch Android and community-web source tree** extracted from the private Andulusia GABA monorepo at source commit `f24e68a`, with its own Git history. It is **not** the full Andulusia Water Intelligence / hydraulic digital twin / enterprise platform.

## Try the approved Android app

- **Official Android installer (v0.9.7):** https://www.lastdicesptyltd.co.za/gabafnbhackaton/GABA-WaterWatch-FNB-v0.9.7.apk
- **App and installation instructions:** https://www.lastdicesptyltd.co.za/gabafnbhackaton/download.html
- **Published APK SHA-256:** `f5070618833f29cf89345f6e0e5509d1114bed6831827727d6fa78b0755a4a0b`
- Original Android app package: `za.co.lastdices.gabawaterwatch.fnb`.

**Important:** The original, working APK is preserved unchanged. Public source code is provided for review and is **not a replacement for the signed installer**. A new build requires the same private signing key to update an existing installation.

## Application overview

- Community water incident reporting and status tracking
- Registration, verified login, password recovery, resident-owned reports using Supabase Auth
- Offline queue and cloud sync capabilities
- Role-protected operational and simulated-review workflows
- Clearly labelled synthetic water telemetry and demonstration incidents

**No live municipal integration, field-validated water savings, or public-health advisory is claimed.**

## Developer quickstart

1. `npm ci`
2. `npm run check`
3. `npm start` (local synthetic demonstration)

Android release workflow: `scripts/build-judges-android.sh` using JDK 21 / Android SDK and a trusted local signing process; see `docs/REPAIR-v0.9.7.md`.

## Safe publication boundary

- Do not add secrets, resident data, private keys, signing keystores, infrastructure diagrams, or unpublished Andulusia enterprise components.
- `.env.example` contains placeholders only; keep real `.env` private.
- Supabase publishable keys may be present in web client code; no `service_role` key should ever be shipped.
- Source is maintained separately from `SXNGE4444/GABA`. Changes here **do not automatically modify that original repository or its deployments**.

## Attribution

Last Dices (Pty) Ltd. FNB hackathon community application. All sample reports and modelled incidents are fictional unless explicitly described otherwise.
