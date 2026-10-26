# GABA WaterWatch — Limise Watch Supabase cutover (LIVE PUBLIC API)

User-selected Supabase project: **uskemdfbmuilvirqudml**
Dashboard: https://supabase.com/dashboard/project/uskemdfbmuilvirqudml
Intended Edge API: https://uskemdfbmuilvirqudml.supabase.co/functions/v1/waterwatch-api

## Verified on 23 October 2026
- Connected Supabase account `watch` owns project `uskemdfbmuilvirqudml`; project ACTIVE_HEALTHY.
- Five isolated `fnb_` tables deployed with RLS and no direct `anon` table read grants; three simulated incidents seeded.
- `waterwatch-api` Edge Function ACTIVE with internal staff JWT and role checks (public endpoints explicitly permitted; `verify_jwt=false` at the function gateway).
- New cloud API health 200, fictional feed 200, unauthenticated operator overview 401, report intake 201, resident tracking 200, duplicate prevention verified.
- Both Last Dices and GitHub Pages public website `config.js` now point to this project, verified on their public endpoints.
- Android competition debug APK v0.8.0-limise-watch rebuilt with new project URL embedded; released on GitHub.
- Remaining: Supabase Auth test operator + separate simulation reviewer (0 roles assigned), cloud full six-step acceptance, physical Android report check, Sonke file submission.
- Older Supabase resources remain unchanged. The previous v0.7 APK continues pointing to the older project; use v0.8 only.
- Supabase Security Advisor returns 5 INFO notices about RLS enabled without policies; intentional deny-all direct table access, since Edge Function uses server-side service-role access behind auth checks. [Supabase advisory](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

## Non-destructive migration runbook
1. **Account access:** In ChatGPT Settings → Plugins → Supabase, add/reconnect the Supabase account that can open the target project, and select that account for the GABA deployment. Do not share passwords, access tokens or service-role keys in chat.
2. **Verify ownership and inspect schema:** check target project id, organization, whether any `fnb_` tables already exist and whether a `waterwatch-api` Edge Function is already deployed; take a rollback inventory. Never modify unrelated app tables.
3. **Database:** apply the additive isolated migration in `supabase/migrations/20261023_fnb_waterwatch.sql`. It defines five `fnb_` tables, RLS and restricted grants. If any tables exist, reconcile rather than overwrite; do not erase data.
4. **Edge Function:** deploy `supabase/functions/waterwatch-api/index.ts` to target as `waterwatch-api` with `verify_jwt=false` **only because** it implements its own Supabase Auth token validation and server-side staff-role checks on privileged routes. Verify required project-managed server-only env and strict origin handling; never publish elevated keys.
5. **Smoke:** GET `/api/health` returns 200 and Supabase Postgres storage; GET `/api/public/feed` is clearly synthetic; unauthenticated GET `/api/overview` returns 401. POST a clearly synthetic report, GET its token-scoped status, repeat with same client ID to verify idempotency, and check RLS/permissions.
6. **Roles:** create two *distinct test-only* confirmed Supabase Auth users controlled by the project owner; assign `operator` and `demo_reviewer` via the prepared `docs/DAY-ONE-STAFF-PROVISION.sql` after checking the IDs. Do not grant roles to any existing user whose identity or ownership is uncertain.
7. **Cloud acceptance:** set `GABA_PUBLIC_API_BASE=https://uskemdfbmuilvirqudml.supabase.co/functions/v1/waterwatch-api` in a local/private shell and run `npm run check:cloud` with test credentials in the documented environment variables. Require all six stages to pass.
8. **Cutover after success:** replace the public website's `config.js` API URL; build and sign a new versioned Android APK with the new URL embedded (and iOS package if applicable); verify installed APK hash and bundled config. Do not mislabel the older v0.7 APK as migrated.
9. **Acceptance:** test a report from actual Android device and public website to the same operator inbox, independent simulated review, inspection, closure and resident status across installations. Confirm all sample reports are fictional.
10. **Submission:** update Sonke judges' links/instructions only after cutover passes and keep the competition deadline in mind. Do not claim a real municipality is connected.

## Important staging protection
The previously selected Supabase projects (`cdjtcvuwlwebckrfczbe` and `yjkqabrgszpyhmnvkugv`) must not be used for new GABA deployments or further edits without explicit instruction. No automatic deletion was attempted. Preserve the working public website until the new target passes acceptance.
