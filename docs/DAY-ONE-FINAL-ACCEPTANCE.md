# GABA WaterWatch — Day One Final Acceptance and Staff Provisioning
Date: 2026-10-23. This is an FNB synthetic competition demo, not an official municipal service.

## Verified now
- Public site: https://www.lastdicesptyltd.co.za/gabafnbhackaton
- Isolated Supabase Edge API: https://cdjtcvuwlwebckrfczbe.supabase.co/functions/v1/waterwatch-api
- Cloud health 200, synthetic feed 200, anonymous staff overview 401.
- Cloud synthetic report creation 201, status read 200, duplicate replay 200 with duplicate=true and same ID.
- No private report details in public responses.
- Local project suite: 13 tests passed.
- NOT YET VERIFIED LIVE: operator login, review role, simulated provider confirmation, field evidence, closure, resident final status.
- NO AUTHORISED MUNICIPALITY CONNECTED. Never assert report reaches municipality.

## Exact remaining account step (must be performed by authorised project owner)
1. Open Supabase Dashboard > project cdjtcvuwlwebckrfczbe > Authentication > Users.
2. Create two **distinct test-only users**, operator and simulated reviewer, using two mailbox addresses under your control. Confirm both email addresses through their normal inboxes. Do NOT create or use actual municipal staff accounts for the demo.
3. In the same project > SQL Editor, inspect the SQL in docs/DAY-ONE-STAFF-PROVISION.sql. Replace its two explicit placeholder email addresses with your verified test email addresses; run it.
4. It looks up exactly those two auth.users IDs, checks they are distinct and confirmed, and assigns only the existing isolated public.fnb_staff_roles roles. It does not give anyone access to unrelated Blanco Studio tables.
5. Do not paste passwords, service-role keys, JWTs or Supabase access tokens into ChatGPT, Sonke, GitHub or screenshots. Use the password fields directly in the app or environment variables locally.
6. Operator: `https://www.lastdicesptyltd.co.za/gabafnbhackaton?view=operator`
7. Separate simulated reviewer: `https://www.lastdicesptyltd.co.za/gabafnbhackaton/review`

## Verify live six-step process from Terminal
Run from `apps/gaba-waterwatch-fnb`:

```sh
GABA_PUBLIC_API_BASE='https://cdjtcvuwlwebckrfczbe.supabase.co/functions/v1/waterwatch-api' \
GABA_TEST_OPERATOR_EMAIL='your-verified-test-operator@example.com' \
GABA_TEST_OPERATOR_PASSWORD='your-private-operator-password' \
GABA_TEST_REVIEWER_EMAIL='your-verified-test-reviewer@example.com' \
GABA_TEST_REVIEWER_PASSWORD='your-private-reviewer-password' \
node scripts/day-one-cloud-acceptance.mjs
```

Use a local private terminal only; preferably set secrets with interactive input or your local password manager instead of putting them into shell history. The runner **does not print credentials or tokens**.

Expected stages:
1. Resident creates synthetic report into Supabase Postgres.
2. Tracking token reads status from that same cloud record.
3. Operator login succeeds and sees the report in the protected inbox.
4. Operator marks Investigating and routes case to simulated reviewer.
5. Independent demo reviewer confirms fictional cause; field evidence recorded.
6. Operator marks Resolved; resident tracking returns Resolved. Every result remains labelled simulated and unaffiliated with a real municipality.

## Recording a 2–3 minute Sonke video
- 00:00 Public site and clear synthetic demonstration notice.
- 00:15 Resident app: area → submit fictional leak → tracking ID.
- 00:45 Operator (separate login): open the same report → Investigating → route to demo review.
- 01:15 Simulated reviewer login: review and confirm. Show disclaimer "NOT MUNICIPAL VERIFICATION".
- 01:45 Operator: add synthetic field evidence → close.
- 02:10 Resident Activity: refresh and show report status Resolved, no resident details disclosed publicly.
- 02:35 Water health educational notice; distinguish microbial boil-water from chemical do-not-use, link to CDC/WHO. End with utility-funded model.
- Film only fictional reports, never private real customer details.

## Sonke completion
The Sonke team dashboard must show saved Lean Business Canvas, SSDLC, progress update, submitted files/links and submission confirmation. An app URL being live does not itself submit to Sonke. Confirm the exact deadline on Sonke.

## Production honesty
Supabase service currently processes anonymous reports but is not security-certified or an authorised municipal channel. Its demo review records must never be presented as official municipal statements. No water quality safety certification or accurate restoration ETA is available.
