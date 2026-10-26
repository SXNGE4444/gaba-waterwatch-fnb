# FNB APP OF THE YEAR 2026 — THREE-PHASE UPDATE PLAN

**Date:** Friday, 23 October 2026. The Sonke deadline is controlled by its actual countdown; confirm it in the portal. The phases below are a proposed **single-day preparation and update sequence**, not three officially mandated judging phases.

## Phase 1 — Platform demonstration and business evidence

**Deliverable:** A reliable public path, a local fallback bundle, Lean Business Canvas and SSDLC summary.

1. Test the supplied local service and preview (`npm run check`).
2. Check the existing hosting origin and whether `/gabafnbhackaton/*` can be routed without changing the rest of Last Dices.
3. Configure a *demo-only* deployment for the operator + resident UI. **Do not deploy unprotected writable backend endpoints to production.**
4. Verify the site from a non-owner device and mobile browser under HTTPS.
5. Capture the operator overview and risk-brief screenshots. Submit/update progress in Sonke, if the portal supports staged updates.

**Acceptance gate:** Site loads with no browser errors; synthetic disclaimer clearly visible; navigation works; incident list and community view render.

## Phase 2 — Resident offline experience and packaging

**Deliverable:** Demonstrable resident flow, offline queue, installation method, mobile screenshots.

1. Submit a fictional resident issue while online and show it in the community inbox.
2. Use test offline mode to queue a new fictional report, then reconnect and confirm it is synced only once.
3. Verify Safari Add to Home Screen on an actual iPhone and Android PWA installation where supported.
4. If native developer tooling and signing are ready, compile an Android **debug APK**, install and test it. Build/sign iOS through Xcode and TestFlight if feasible.
5. Label browser-frame visuals as *previews*, not actual native screenshots.

**Acceptance gate:** Offline queue persists through app reload and syncs on reconnect; no unverified live municipal alerts are shown; judge can install/use the app through a valid route.

## Phase 3 — End-to-end operations, security review and final evidence

**Deliverable:** Four-minute narrated walkthrough, reproducible incident workflow, evidence ledger and final demo ZIP.

1. Operator opens synthetic incident `INC-1042` and inspects evidence.
2. Operator approves inspection. Work order appears in Field operations.
3. Operator verifies simulated completion. Backend audit trail records the transition.
4. Resident submits a fictional service report. Operator moves it from Received → Investigating → Resolved.
5. Review security limitations: no public real data, no production authorisation, no false savings claims.
6. Upload the screenshots, video, local ZIP/APK (if actually built), accurate URLs, and the project description required by Sonke.

**Acceptance gate:** Judges can run it independently, with sample data and instructions; no confidential credentials need to be shared; submit before the portal deadline.

## Judge-facing disclosure

GABA WaterWatch v0.4 is a functional synthetic-data prototype. Resident reports and operator approvals can be demonstrated locally; the native installers, real infrastructure data connections and audited municipal deployment are not yet complete. Scenario accuracy and monetary/water savings must not be inferred from synthetic values.
