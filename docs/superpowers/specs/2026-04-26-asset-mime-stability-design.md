# Asset MIME Stability Fix Design

Date: 2026-04-26

## Problem

After deployments, browsers sometimes request an old Vite hashed JavaScript asset such as `/assets/index-OLD.js`. The asset no longer exists in the current `dist` output, but Cloudflare Assets is configured with SPA fallback. That fallback can return `index.html` with `Content-Type: text/html` for a JavaScript module request. Browsers reject that response with strict module MIME checking.

A separate `ERR_BLOCKED_BY_CLIENT` from Cloudflare Insights is caused by client-side blocking and is outside this fix.

## Goals

- Prevent JavaScript/CSS/static asset requests from receiving HTML fallback responses.
- Stop the Service Worker from serving stale HTML documents that reference deleted hashed assets.
- Preserve SPA routing for application routes such as `/settings`.
- Keep icon and font caching behavior.

## Non-Goals

- Offline app-shell support is intentionally removed. Stability after deploys is more important for this private navigation app.
- Cloudflare Web Analytics blocking is not fixed; users' blockers control that behavior.

## Design

### Service Worker

`public/sw.js` will be changed so it no longer intercepts or caches document requests. It will continue using stale-while-revalidate for `/api/icon` and Google Fonts only.

The cache version will be bumped from `startnest-static-v1` to a new version so activation deletes older runtime caches, including stale document caches from the previous strategy.

### Worker Static Asset Guard

`worker/index.ts` will distinguish file-like static asset requests from SPA route requests before returning the response from `env.ASSETS.fetch(request)`.

Static asset requests include:

- `/assets/*`
- `/sw.js`
- common root static files such as icons or manifest files
- any pathname ending in a file extension

For these requests, the Worker must not allow an HTML fallback response to masquerade as the requested file. If `env.ASSETS.fetch(request)` returns `text/html` for a static asset request, the Worker will return a `404 Not Found` text response instead.

SPA routes without file extensions will continue to use Cloudflare Assets fallback. For example, `/settings` can still return `index.html`.

### Auth Interaction

The existing Access check currently applies before static assets are served. This design keeps that behavior unchanged: unauthenticated requests can still receive the Access unauthorized HTML. The static asset guard focuses on authenticated users and Cloudflare SPA fallback returning `index.html` for missing build assets.

## Data Flow

Normal load:

1. Browser requests `/`.
2. Worker serves fresh HTML from Assets.
3. Browser requests `/assets/index-CURRENTHASH.js`.
4. Worker serves JavaScript with a JavaScript MIME type.

Old asset after deployment:

1. Browser requests `/assets/index-OLDHASH.js`.
2. Cloudflare Assets may fallback to `index.html`.
3. Worker detects this is a static asset request with an HTML response.
4. Worker returns 404 instead of HTML.
5. Browser receives a clear missing asset response instead of a module MIME error.

## Testing

- Run `npm run typecheck`.
- Run `npm run build`.
- Inspect `public/sw.js` to confirm document caching is removed.
- Inspect Worker logic to confirm SPA routes still pass through while file-like static assets are guarded against HTML responses.

## Risks

- Users who are fully offline will no longer receive a cached HTML app shell.
- If Cloudflare Access removes auth context for static asset requests, unauthorized HTML can still be returned. That is an existing authentication behavior and not part of this fix.
