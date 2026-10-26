# GABA WaterWatch v0.6 — FNB App of the Year 2026
LAST DICES (PTY) LTD. Technical Minimalist + Reality-First design.

A local synthetic-data competition application for residents, water operators and an independent simulated municipal review desk. **There is no authorised live municipal integration, real water-safety notice or measured water savings.**

## Run and test
From this directory, with Node.js 20 or newer:

```bash
npm start
npm run check
```

A clean checkout creates data/state.json from data/seed.json automatically. Operator and demo-reviewer passwords are printed in the terminal for local development only.

- Resident PWA: http://localhost:4173/gabafnbhackaton/
- Operator: http://localhost:4173/gabafnbhackaton/?view=operator
- Simulation reviewer: http://localhost:4173/gabafnbhackaton/review
- API health: http://localhost:4173/gabafnbhackaton/api/health

## Demonstration flow
Resident submits a fictional report (including offline queue) → operator signs in and investigates → operator queues a simulated review → independent reviewer signs in and records cause/unknown → operator records simulated field evidence → report is resolved → resident sees status in Activity. Every handoff is audited. Review cannot be bypassed for closure.

## Health and source integrity
Public guidance on microbial illness and differing boil-water vs chemical contamination advisories is linked to WHO and CDC. These are educational materials, **not local water advisories**. Local municipal contacts are published for use outside GABA; reporting to GABA does **not** notify the municipality.

Official Cape Town contact: https://www.capetown.gov.za/City-Connect/report/municipal-services-and-maintenance/submit-a-service-request
WHO: https://www.who.int/news-room/fact-sheets/detail/drinking-water
CDC: https://www.cdc.gov/water-emergency/about/drinking-water-advisories-an-overview.html

## Release gates not yet satisfied
No signed APK or IPA, live authoritative notices, authorised municipal acknowledgement, production identity/MFA, persistent production database, independently validated security, public deployment or physical-device acceptance test. The intended https://www.lastdicesptyltd.co.za/gabafnbhackaton/ route remains separate from this codebase until host integration is verified.


## Supabase-backed shared demo (opt-in; not activated on the public website yet)

A prepared **isolated** cloud backend is in `supabase/migrations/20261023_fnb_waterwatch.sql` and `supabase/functions/waterwatch-api/index.ts`.
The backend uses Supabase Auth test accounts with explicit server-checked operator and demo-reviewer roles, RLS-denied public tables, anonymous report intake and a safe status-only public feed.

Read **`docs/SUPABASE-DAY-ONE-INTEGRATION.md`** before deployment. The selected Limise/Blanco Supabase project `cdjtcvuwlwebckrfczbe` has had the isolated schema applied and the Edge Function deployed. Staff roles still require explicit provisioning. `public/config.js` intentionally remains empty in source for local JSON demo mode; the released GitHub Pages and Last Dices site config is separately set to the validated HTTPS Supabase demo API. Use `public/config.supabase.example.js` to configure a verified HTTPS API after approval.

**Never** describe the demo review as municipal verification; there is no authorised municipal integration.


## Nature-led GABA Brand System v0.7

- Website default: `/gabafnbhackaton/`, resident app: `?view=community`, protected operator: `?view=operator`.
- Brand styling: `public/brand-v07.css` (forest green, ivory, sage, quiet gold, Georgia display).
- Image: `public/assets/gaba-waterfall.jpg`, cropped from the original GABA brand reference supplied for this project (additional branding material.png).
- Web and native Capacitor experiences share the same UI and the existing secure API. No changes to Supabase schema or credentials.
- Public water status and illustrations remain synthetic, not municipality verified.
