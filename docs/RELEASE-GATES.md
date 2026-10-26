# GABA WaterWatch v0.6 — Competition evidence and release gates

Updated 23 October 2026. All place names, water notices, readings, health scenarios and review decisions in this app are SYNTHETIC. No municipality has approved or verified GABA's seeded data.

| Gate | Evidence | Status |
| --- | --- | --- |
| Resident mobile-first UI, area filter, awareness, health education | PWA files and local routes | Implemented; manual device QA pending |
| Offline report queue and reconnect flow | Browser storage, Node tests | 9 backend tests passed; physical phone test pending |
| Protected operator login and mutation CSRF | Node auth route tests | Local demo verified; no production identities or MFA |
| Independent municipal-style review training desk | Different credential and role, audited decisions | Simulated only; NO real municipal handoff |
| Field evidence required before simulated closure | Tests and audit history | Local demo verified |
| Medical and water safety guidance source attribution | WHO and CDC URLs | Educational; never a local advisory |
| Actual municipal confirmation and notice publishing | Written authority and provider feed | NOT CONNECTED |
| Data durability across production instances | Hosted SQL, backups, encryption, monitoring | NOT IMPLEMENTED; local JSON only |
| Production HTTPS /gabafnbhackaton/ URL | Existing Last Dices domain routing | NOT DEPLOYED |
| Android installable debug APK | Local Gradle assembleDebug produced 4MB file | Compiled; no device installation test; debug signature |
| Android signed release/AAB | Release keystore, distribution policy | NOT CREATED |
| iOS distributable app/TestFlight | Xcode signing and provisioning | NOT CREATED |
| Security / privacy / penetration test | BLANCO ASSURE and third-party evidence | PARTIAL; no certification claim |

## Never imply live water safety
A synthetic sensor cannot certify drinking water safety, and no resident report automatically informs the City. Operators in this app are demonstrators, not real municipal employees. Boil-water guidance does not apply to confirmed chemical contamination. Unknown restoration estimates must stay unknown.

## Production prerequisites
1. Decide and authorise the operating water provider, service area and data-processing agreement.
2. Implement secure production identity (per-user accounts, MFA and organisation/role scoping).
3. Use durable PostgreSQL with private tables, RLS/least privilege, retention and audit exports.
4. Build mutually authenticated municipal ingestion and acknowledgement adapters, after authorisation.
5. Publish only source-labelled, dated, operator-approved public advisories with expiry.
6. Deploy frontend and protected API under tested HTTPS and verify offline and real-device flows.
7. Complete security/privacy QA, backup/restore and emergency contact verification.
