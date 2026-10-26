# GABA v0.5 — demonstrable controls and limitations

## Implemented and verified locally

- Operator login requires a startup-configured high-entropy password. In loopback development only, a fresh random 96-bit URL-safe password is printed in the terminal when no value is configured.
- Operator sessions use 256-bit random opaque HttpOnly cookies with SameSite=Strict; Secure is set in production mode. Session expires after eight hours or explicit logout.
- CSRF token required for privileged PATCH and reset/logout requests. Same-origin checks reject cross-site operator actions.
- Operator overview/inbox and write endpoints require an authenticated session. Sensitive reporter details are excluded from public feed and public report-status responses.
- Public reports require fixed demonstration area/category, nontrivial description, UUID client request IDs, request size limits, rate limits and idempotency. Only fictional reports should be entered.
- Fixed CORS list applies to public endpoints. No credentialed cross-origin operator endpoints are permitted.
- Security headers include CSP, no sniff, clickjacking prevention, referrer policy and HSTS in production mode.
- State persistence is an atomic write to a local JSON file. Audit records are synthetic evidence trails, not cryptographically signed or tamper-proof.
- Functional contract tests cover denied unauthenticated reads/updates, login, CSRF, origin checks, public feed redaction, reporting idempotency, incident transitions, logout and static shell headers.

## Not implemented / do not claim

- Per-employee user management, MFA and fine-grained RBAC.
- Distributed rate limiting, intrusion detection, penetration testing or third-party security certification.
- Shared sessions, PostgreSQL, true high availability, proven recovery/backup tests.
- Official water authority feeds, real sensor evidence, municipal reports, hydraulic simulation validation or live dispatch.
- Signed native APK / TestFlight builds or device-level installation testing.

## Evidence procedure for judges

1. Start locally and collect operator password displayed in the terminal.
2. Open `?view=operator` and show the sign-in panel.
3. Show that unauthenticated operator `/api/overview` yields HTTP 401.
4. Sign in using the local demo password, review a simulated incident and approve human inspection.
5. Show audit entry and resident report status updates.
6. Sign out and show dashboard locked again.
7. Explain that every signal is synthetic and consequential control is disabled.
