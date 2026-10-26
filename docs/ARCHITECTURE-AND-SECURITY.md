# GABA WATERWATCH — SYSTEM ARCHITECTURE AND SSDLC GATES

## Current local data flow

```text
Responsive web UI / PWA
  ├── Operator dashboard (read/review/approve incidents)
  └── Resident interface (view/report/track)
           |
  Web fetch (same-origin /gabafnbhackaton/api)
           |
  Node HTTP server (server.js)
           |
  JSON file data/state.json (small, single-process demonstration)
           |
   Simulated incidents / report records / event log

Offline resident action → localStorage queue → API retry on connection
```

## Backend interface

| Method | Path | Behaviour |
| --- | --- | --- |
| GET | `/api/health` | Basic synthetic-mode health |
| GET | `/api/overview` | Incidents, community reports, audit events |
| POST | `/api/reports` | Validate, create and dedupe resident issue by clientId |
| PATCH | `/api/reports/REP-xxxx/status` | Enforced demo transitions Received → Investigating → Resolved |
| PATCH | `/api/incidents/INC-xxxx/status` | Enforced demo operator status transitions |
| POST | `/api/demo/reset` | Restore seed data (local-only demo control; disable in production) |

All APIs are available with or without the `/gabafnbhackaton` prefix in the local server. The site assets and API must share a compatible origin/HTTPS setup to perform synchronous requests. The web app falls back to bundled synthetic data when it cannot reach the local service.

## Current risk boundaries (explicitly incomplete)

- **Authentication:** none; UI 'operator' and 'resident' modes are navigational demos, **not identity/role authorisation**.
- **Data:** fictional synthetic records; never feed operational credentials or real personal information.
- **Persistence:** JSON file is for one local prototype process, not multi-writer concurrency or high availability.
- **Offline storage:** localStorage queue is suitable for demonstrations, but not large/sensitive attachments; a production app requires durable IndexedDB/native encrypted storage, retention and recovery controls.
- **Audit:** local mutable event log, **not tamper-evident or immutable**.
- **Telemetry:** deterministic illustrative values, **not** calibrated hydraulic measurements.
- **GIS:** illustrated topology, **not** live pipeline positions, surveyed CRS/DEM data or an EPANET-validated hydraulic model.
- **No autonomous actuation:** UI cannot control valves, pump stations or SCADA devices.

## Target production components

1. Identity: secure user accounts, invitation, MFA, session management, tenant-scoped RBAC; secure staff/resident separation.
2. Data: managed Postgres/PostGIS with explicit org/site/zone scopes, migrations, append-only operational log and backups.
3. Time-series: sensor source registry + provenance, ingest tokens per adapter, broker/MQTT, replay protection, outlier detection and stale-data flags.
4. APIs: schema validation, OWASP testing, secure CORS, CSRF protection as applicable, rate limiting, structured logs, idempotent writes, pagination and monitoring.
5. Safety: human-reviewed recommendations, locked down control plane, signed field evidence, no automatic SCADA commands, safe failure modes.
6. Community: moderated report intake, privacy and anti-spam, geocoded user input only with consent, clear distinction between official advisories and unverified community claims.
7. Privacy: POPIA data inventory and basis, purpose limitation, retention/deletion, access requests, Information Officer processes and incident response.
8. Assurance: threat model, SAST, dependency scan, DAST/pentest, backups restore drill, penetration test remediation, E2E multi-role tests.

## Before deploying to a public URL

- Ensure all writable routes are authenticated/authorised or isolated and rate-limited as appropriate, including operator decisions and demo reset.
- Replace filesystem writes with an actual transactional database.
- Do not expose resource identifiers that reveal real water infrastructure locations until appropriate authorisation and information classification is completed.
- Restrict CSP and browser framing; enforce HTTPS/HSTS only when verified on the hosting origin.
- Run security checks; inspect FNB submission terms, intellectual property obligations and credential-delivery rules.

This document describes the readiness gap and does not certify POPIA, ISO 27001, SOC 2 or OWASP compliance.
