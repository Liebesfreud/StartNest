# Asset MIME Stability Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent stale Vite asset requests from receiving HTML responses after deployments.

**Architecture:** Remove document caching from the Service Worker so old HTML is not served stale-first. Add a Worker guard that treats file-like static asset requests differently from SPA routes and converts HTML fallback responses for those assets into 404 responses. Keep SPA fallback behavior for extensionless application routes.

**Tech Stack:** React 19, Vite 7, Cloudflare Workers, Cloudflare Workers Assets, TypeScript, Service Worker Cache API.

---

## File Structure

- Modify `public/sw.js`: bump cache namespace and remove document request caching. Keep icon and Google Font stale-while-revalidate caching.
- Modify `worker/index.ts`: add helpers for static asset detection and HTML response detection, then guard `env.ASSETS.fetch(request)` responses for file-like assets.
- Verify with `npm run typecheck` and `npm run build`.

## Task 1: Stop caching HTML documents in Service Worker

**Files:**
- Modify: `public/sw.js:1-72`

- [ ] **Step 1: Replace the cache version and remove document handling**

Replace the full contents of `public/sw.js` with:

```js
const VERSION = 'startnest-static-v2'
const RUNTIME_CACHE = `runtime-${VERSION}`
const ICON_CACHE = `icons-${VERSION}`
const FONT_CACHE = `fonts-${VERSION}`

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys()
    await Promise.all(
      keys
        .filter((key) => ![RUNTIME_CACHE, ICON_CACHE, FONT_CACHE].includes(key))
        .map((key) => caches.delete(key)),
    )
    await self.clients.claim()
  })())
})

function isGoogleFont(url) {
  return url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com'
}

function isIconRequest(url) {
  return url.origin === self.location.origin && url.pathname === '/api/icon'
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName)
  const cached = await cache.match(request)

  const networkPromise = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        void cache.put(request, response.clone())
      }
      return response
    })
    .catch(() => null)

  if (cached) {
    void networkPromise
    return cached
  }

  const response = await networkPromise
  if (response) return response
  throw new Error('Network unavailable')
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  if (isIconRequest(url)) {
    event.respondWith(staleWhileRevalidate(request, ICON_CACHE))
    return
  }

  if (isGoogleFont(url)) {
    event.respondWith(staleWhileRevalidate(request, FONT_CACHE))
  }
})
```

- [ ] **Step 2: Inspect the Service Worker change**

Run:

```bash
git diff -- public/sw.js
```

Expected:
- `VERSION` changes from `startnest-static-v1` to `startnest-static-v2`.
- The branch handling `request.destination === 'document'` is removed.
- `/api/icon` and Google Font caching remain.

## Task 2: Guard static asset responses in the Worker

**Files:**
- Modify: `worker/index.ts:13-92`

- [ ] **Step 1: Add static asset helper functions**

In `worker/index.ts`, after `getIdFromPath()` and before `export default`, insert:

```ts
const STATIC_ASSET_PREFIXES = ['/assets/']
const STATIC_ASSET_PATHS = new Set([
  '/favicon.ico',
  '/manifest.webmanifest',
  '/robots.txt',
  '/sw.js',
])

function isStaticAssetRequest(pathname: string) {
  if (STATIC_ASSET_PATHS.has(pathname)) return true
  if (STATIC_ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true
  return /\/[^/]+\.[^/]+$/.test(pathname)
}

function isHtmlResponse(response: Response) {
  return response.headers.get('content-type')?.toLowerCase().includes('text/html') ?? false
}

function staticAssetNotFound(pathname: string) {
  return new Response(`Static asset not found: ${pathname}`, {
    status: 404,
    headers: {
      'content-type': 'text/plain; charset=UTF-8',
      'cache-control': 'no-store',
    },
  })
}
```

The top of the file should then have this shape:

```ts
function getIdFromPath(pathname: string) {
  const segments = pathname.split('/').filter(Boolean)
  return segments.at(-1) ?? ''
}

const STATIC_ASSET_PREFIXES = ['/assets/']
const STATIC_ASSET_PATHS = new Set([
  '/favicon.ico',
  '/manifest.webmanifest',
  '/robots.txt',
  '/sw.js',
])

function isStaticAssetRequest(pathname: string) {
  if (STATIC_ASSET_PATHS.has(pathname)) return true
  if (STATIC_ASSET_PREFIXES.some((prefix) => pathname.startsWith(prefix))) return true
  return /\/[^/]+\.[^/]+$/.test(pathname)
}

function isHtmlResponse(response: Response) {
  return response.headers.get('content-type')?.toLowerCase().includes('text/html') ?? false
}

function staticAssetNotFound(pathname: string) {
  return new Response(`Static asset not found: ${pathname}`, {
    status: 404,
    headers: {
      'content-type': 'text/plain; charset=UTF-8',
      'cache-control': 'no-store',
    },
  })
}
```

- [ ] **Step 2: Guard the Assets response**

In `worker/index.ts`, replace:

```ts
      return await env.ASSETS.fetch(request)
```

with:

```ts
      const assetsResponse = await env.ASSETS.fetch(request)

      if (isStaticAssetRequest(url.pathname) && isHtmlResponse(assetsResponse)) {
        return staticAssetNotFound(url.pathname)
      }

      return assetsResponse
```

- [ ] **Step 3: Inspect the Worker change**

Run:

```bash
git diff -- worker/index.ts
```

Expected:
- Static asset helper functions exist before `export default`.
- `env.ASSETS.fetch(request)` response is assigned to `assetsResponse`.
- HTML responses for static assets are converted to 404.
- SPA routes without file extensions still return `assetsResponse` unchanged.

## Task 3: Verify build and behavior

**Files:**
- Verify only: `public/sw.js`, `worker/index.ts`, `dist/*`

- [ ] **Step 1: Run TypeScript typecheck**

Run:

```bash
npm run typecheck
```

Expected:
- Command exits successfully.
- No TypeScript errors.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected:
- Command exits successfully.
- Vite emits `dist/index.html` and current hashed assets.

- [ ] **Step 3: Confirm Service Worker output in dist**

Run:

```bash
Select-String -Path "dist\sw.js" -Pattern "startnest-static-v2|request.destination|document|api/icon|fonts.googleapis"
```

Expected:
- Finds `startnest-static-v2`.
- Finds `/api/icon` behavior and Google Font matching.
- Does not find a document-caching branch such as `request.destination === 'document'`.

- [ ] **Step 4: Confirm current asset names**

Run:

```bash
Select-String -Path "dist\index.html" -Pattern "/assets/index-.*\.js|/assets/index-.*\.css"
```

Expected:
- Shows the current Vite hashed JS and CSS files referenced by `dist/index.html`.

## Task 4: Final review and commit

**Files:**
- Modify: `public/sw.js`
- Modify: `worker/index.ts`
- Created earlier: `docs/superpowers/specs/2026-04-26-asset-mime-stability-design.md`
- Created: `docs/superpowers/plans/2026-04-26-asset-mime-stability.md`

- [ ] **Step 1: Check working tree**

Run:

```bash
git status --short
```

Expected:
- Modified `public/sw.js`.
- Modified `worker/index.ts`.
- The spec and plan files may be untracked.
- `home.220131.xyz.har` may remain untracked and must not be committed.

- [ ] **Step 2: Review full diff**

Run:

```bash
git diff -- public/sw.js worker/index.ts docs/superpowers/specs/2026-04-26-asset-mime-stability-design.md docs/superpowers/plans/2026-04-26-asset-mime-stability.md
```

Expected:
- Diff matches the approved design.
- No unrelated files are included.

- [ ] **Step 3: Commit only relevant files if requested**

Run only if the user asks to commit:

```bash
git add public/sw.js worker/index.ts docs/superpowers/specs/2026-04-26-asset-mime-stability-design.md docs/superpowers/plans/2026-04-26-asset-mime-stability.md
git commit -m "fix: prevent html fallback for stale assets"
```

Expected:
- Commit succeeds.
- `home.220131.xyz.har` remains untracked.

## Self-Review

- Spec coverage: Task 1 removes stale HTML document caching and bumps SW cache version. Task 2 prevents HTML fallback responses for static assets while preserving SPA routes. Task 3 verifies typecheck, build, Service Worker output, and Vite asset output.
- Placeholder scan: No TBD/TODO/fill-in placeholders remain. Each code change includes concrete code.
- Type consistency: Helper names are consistent: `isStaticAssetRequest`, `isHtmlResponse`, and `staticAssetNotFound` are defined before use.
