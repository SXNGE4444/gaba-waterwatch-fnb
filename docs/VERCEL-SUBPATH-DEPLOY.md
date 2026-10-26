# GABA v0.5 — preserving the Last Dices Vercel website

## Confirmed current configuration (23 October 2026)

The Vercel project `lastdices-ptyltd-projects` lists `www.lastdicesptyltd.co.za` as a domain. This is the **existing company website** and must stay intact. No GitHub repositories, Vercel project settings, domains, or deployments were changed by this local build.

### Target address

`https://www.lastdicesptyltd.co.za/gabafnbhackaton/`

The path is reserved in the prototype only. It is NOT live until routing is configured and verified.

## Deployment method (safe sequence)

1. **Stage the Node service privately** on a persistent Node 20+ host (VPS with reverse proxy, or container hosting with an attached persistent disk). Start with `HOST=127.0.0.1` behind a private reverse proxy or `HOST=0.0.0.0` only when network/firewall allow traffic from the proxy. Require HTTPS at public entrypoint. DO NOT deploy `server.js` unchanged to a short-lived Vercel serverless function; it relies on in-memory authenticated sessions and a local JSON state file.
2. Set `NODE_ENV=production`, a unique high-entropy `GABA_OPERATOR_PASSWORD`, `GABA_PUBLIC_ORIGIN=https://www.lastdicesptyltd.co.za`, and a persistent `GABA_DATA_PATH`. Store secrets in the hosting service's secret manager. Ensure `state.json` exists with restricted filesystem permissions. Restrict operational API access to the secure proxy layer and HTTPS.
3. Before touching Last Dices, open the staging URL and check `GET /gabafnbhackaton/api/health`, public mobile, operator sign-in, authorised updates, report sync, PWA caching, and origin-protected actions. Confirm exact subpath on the staging service.
4. On the existing Next.js Vercel project, add a **scoped external rewrite** for `/gabafnbhackaton` and `/gabafnbhackaton/:path*` to the staging host. Preserve all existing Next.js rewrites and routes. In `next.config.mjs`, the *addition* to the existing rewrites array resembles:

```js
{ source: '/gabafnbhackaton', destination: 'https://YOUR-SECURE-NODE-HOST.example/gabafnbhackaton/' },
{ source: '/gabafnbhackaton/:path*', destination: 'https://YOUR-SECURE-NODE-HOST.example/gabafnbhackaton/:path*' },
```

Do not overwrite any existing `rewrites()` export, redirects, middleware or headers. When using a proxy, preserve the original incoming `Host`, and ensure operator mutation requests carry the correct `Origin`; `GABA_PUBLIC_ORIGIN` is explicitly supported for trusted public origin checks. Verify proxy behavior before accepting sign-in as functional.

5. Deploy to a staging/preview environment first. Verify current root website pages before and after. Promote only after backup/rollback plan and approved public testing. If using a branch preview that invokes third-party backend URL, consider whether Vercel deployment protection affects the judges.
6. After production propagation check both: `/` still renders Last Dices; `/gabafnbhackaton/` loads WaterWatch; `/gabafnbhackaton/api/health` returns protected-synthetic-demo; an unauthenticated `/api/overview` returns 401. Confirm secure login, logout, PWA, screenshot, Android install path.

### Why the website was not directly modified

Publishing into an existing project without a route-aware staging test might replace the company's landing page or expose the old unauthenticated backend. This build **deliberately does not change the production website**. Routing requires access to the active Next.js configuration and an always-on Node hosting target.

### Current limitations

- Single-process JSON data store and in-memory sessions support a judge demonstration, NOT multi-instance production. A restart logs out operators. File backups, failover and operator identities are not fully implemented.
- Strict HTTPS and production header tests must run in the final hosting environment. Do not ingest real resident names, addresses, phone numbers, photos or municipal credentials until privacy/security gates are passed.
- Add PostgreSQL, per-user identities/RBAC, incident moderation, monitoring, privacy notices, backup/restore, audit integrity and rate-limiting at a shared gateway before operational use.
- This system cannot issue real water availability or water-quality advisories.
