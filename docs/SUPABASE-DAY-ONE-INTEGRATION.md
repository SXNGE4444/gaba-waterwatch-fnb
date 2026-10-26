# Day-one GABA WaterWatch → Supabase Integration Runbook

## Confirmed environment (23 October 2026)
Selected connected account: **Supabase** / Limise Lamani / Blanco Studio. Project `cdjtcvuwlwebckrfczbe` (existing Blanco Studio project), using isolated `fnb_` tables only. Do not modify unrelated Blanco or Workline data. Schema migration `gaba_fnb_waterwatch_day_one` was **applied successfully** and Edge Function `waterwatch-api` deployed **ACTIVE**. The site and the Android debug APK are configured to call this server. **No municipality is connected.**

Public API: `https://cdjtcvuwlwebckrfczbe.supabase.co/functions/v1/waterwatch-api`
Public page: `https://www.lastdicesptyltd.co.za/gabafnbhackaton/`
Cloud smoke checks: GET health 200; GET synthetic feed 200; POST fictional report 201; GET private token status 200; unauthenticated operator overview 401. One synthetic test report was created.

**Outstanding blocker:** `public.fnb_staff_roles` has **0 users**. The cloud operator and separate demo reviewer cannot log in until two controlled Supabase Auth users are created or identified and explicitly assigned. **Do not grant roles to unverified existing users.**

## Isolated source files
- `supabase/migrations/20261023_fnb_waterwatch.sql` creates additive, prefixed tables with RLS and revoked browser access. It does not alter GABA operations tables.
- `supabase/functions/waterwatch-api/index.ts` implements a public read-only *synthetic* feed, private report-status token lookup, anonymous report intake and Supabase Auth-protected operator/reviewer workflows.
- Public/client UI supports a local Node backend by default, or a remote HTTPS Edge API when `window.GABA_API_BASE` is set.
- The existing GitHub Pages deployment remains pointed at the working static DEMO until the cloud API is configured and verified.

## Exact staging operations AFTER project approval
1. **DONE**: migration applied to confirmed Limise/Blanco project; RLS enabled for all 5 new competition tables and browser table access revoked. No unrelated tables were altered.
2. In Supabase Auth > Users, create **two separate test-only users** via normal supported Auth tooling:
    - `operator-test@example.invalid` placeholder — use an actual email address you control, not this example.
    - `reviewer-test@example.invalid` placeholder — use an actual email address you control, not this example.
   Use strong, different passwords and MFA if enabled. Do not put credentials or access tokens in Git.
3. Retrieve the two real `auth.users.id` values from the Supabase dashboard. Insert into `public.fnb_staff_roles (user_id,role)` as operator and demo_reviewer using reviewed IDs:
   `insert into public.fnb_staff_roles (user_id,role) values ('<operator-uuid>','operator'),('<reviewer-uuid>','demo_reviewer');`
   Verify both roles and restrict who can write that table.
4. **DONE**: Edge Function `waterwatch-api` deployed with `verify_jwt=false` **because it internally verifies operator/reviewer JWTs on every privileged request**. Supabase auto-provisioned server-only `SUPABASE_SERVICE_ROLE_KEY` remains server-side. **Never** send it to `config.js`, native packages or Git.
5. Verify by calling `https://<PROJECT_REF>.supabase.co/functions/v1/waterwatch-api/api/health` (HTTP 200 JSON). Check that:
    - Unauthenticated GET `/api/overview` is HTTP 401.
    - Unauthenticated POST `/api/review/reports/REP-XXX/confirm` is HTTP 401.
    - Auth login works only for roles explicitly present in `fnb_staff_roles`.
    - Correct CORS permits the GitHub Pages origin, Last Dices domain and Capacitor localhost.
    - Submit a random **synthetic** report through the client; it appears after authenticated operator login.
    - Operator routes case; separate reviewer confirms simulation; evidence can then be added; status closes; public Activity displays only safe status, not description.
    - Reposting the same client ID is idempotent; malformed inputs and unauthorised transitions are rejected.
    - No reports go to a real municipality or water quality authority.
6. **DONE for resident reporting only:** published `public/config.js` pointing at the HTTPS Edge Function base, e.g.
   `window.GABA_API_BASE = 'https://<APPROVED_REF>.supabase.co/functions/v1/waterwatch-api'`.
   GitHub Pages and Last Dices site are published; Android v0.7 debug APK builds and launches in emulator. **Do not claim operator/reviewer acceptance until staff accounts are explicitly assigned and the full remote workflow passes.**
7. Keep `fnb_` test data isolated. Create a clear expiry/deletion plan for demonstrations. Do not use real resident details in a public hackathon demo.

## Browser/client behaviour
- Local mode (`GABA_API_BASE = ''`) continues to use the single-process local JSON backend and password login shown in the terminal.
- Cloud mode uses Supabase Auth email + password and a short-lived access token in browser **sessionStorage**. The Edge Function verifies the JWT and resolves the staff role from restricted server-side `fnb_staff_roles` on each privileged call.
- The Edge function is a **demo service**. It is not yet independently penetration-tested, production rate limiting is incomplete and it is not an authorised municipal intake channel.
- Operators cannot reset the shared cloud demo, to protect other submitted test reports.

## Municipal handoff
The reviewer is explicitly a **simulated reviewer**. The platform has not been authorised to send data to any municipality. Genuine operator-to-municipality delivery needs written integration permission, protected machine-to-machine credentials, a data processing agreement, verified acknowledgements and published source provenance. No case may be marked municipality-verified without evidence.

## Day-one video (recommended 2–3 minutes)
00:00–00:15 — Open public WaterWatch; show the synthetic-data label and select demo neighbourhood.
00:15–00:40 — Submit fictional leak report; optionally toggle offline, queue, restore, sync. Show tracking number.
00:40–01:10 — Sign in as **test operator**; display the same report in the v0.3 command centre. Change to Investigating; route to simulated reviewer.
01:10–01:35 — Sign in with the **separate reviewer test account** and confirm cause. Point out the NOT MUNICIPAL VERIFICATION disclaimer.
01:35–02:05 — Operator records fictional field inspection evidence, resolves report.
02:05–02:30 — Return to resident Activity; show the new status and explicit source; demonstrate water-health guidance including boiling vs chemical contamination.
02:30–02:45 — Explain the business model: free resident service, enterprise-funded response intelligence. State what is not yet connected.

## Release gates
- SQL applied and Edge Function public endpoints tested: **DONE**; operator/reviewer Supabase Auth roles bound: **PENDING**
- GH Pages and Last Dices subpath connected to cloud public API: **DONE**
- Android debug APK v0.7 rebuilt and launched on emulator: **DONE**; physical-device test: **PENDING**
- Official municipal partnership: **NOT CONNECTED**
- End-to-end local test: available via Node; run `npm run check`.
- Production POPIA/BLANCO ASSURE independent security and privacy assessment: **PENDING**
