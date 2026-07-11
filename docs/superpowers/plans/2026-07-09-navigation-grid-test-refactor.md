# Navigation Grid Test Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the largest navigation UI files into focused hooks/components and add minimal automated coverage for search engines, reorder, import/export, and login rate limiting.

**Architecture:** Keep behavior stable while moving stateful navigation concerns into local feature hooks and moving LinkGrid card rendering/drag logic into separate files. Add Vitest for focused Worker unit tests using an in-memory D1 test double instead of a live Cloudflare runtime.

**Tech Stack:** React 19, Vite, TanStack Query, Cloudflare Workers-style Request/Response APIs, TypeScript, Vitest.

## Global Constraints

- Preserve existing public UI behavior and API response shapes.
- Keep refactors local to `src/features/navigation`, `worker/routes`, `worker/auth`, and test setup unless a narrow shared helper is required.
- Write failing tests before production behavior changes.
- Do not introduce a browser UI test dependency for this pass; requested tests are route/auth-level minimal coverage.

---

### Task 1: Test Harness And Worker Coverage

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`
- Create: `tests/worker/testDb.ts`
- Create: `tests/worker/searchEngines.test.ts`
- Create: `tests/worker/reorder.test.ts`
- Create: `tests/worker/importExport.test.ts`
- Create: `tests/worker/loginRateLimit.test.ts`

**Interfaces:**
- Produces: `createTestEnv(initialState)` fake Env with `DB.prepare().bind().first()/all()/run()` and `DB.batch()`.
- Produces: `npm test -- --run` to execute the minimal suite.

- [ ] Add Vitest and a test script.
- [ ] Add tests for invalid search engine templates and delete fallback to Bing.
- [ ] Add tests for group/link reorder updates.
- [ ] Add tests for import rejecting a link with a missing group and settings-only custom search engine validation.
- [ ] Add tests for login lockout after repeated failures and reset after success.
- [ ] Run tests and verify they fail because the harness/tests are new.

### Task 2: NavigationPage Hook Extraction

**Files:**
- Modify: `src/features/navigation/NavigationPage.tsx`
- Create: `src/features/navigation/useNavigationSearch.ts`
- Create: `src/features/navigation/useNavigationWeather.ts`
- Create: `src/features/navigation/useNavigationMutations.ts`

**Interfaces:**
- Produces: `useNavigationSearch({ links, groups, settings, searchEngines, update })`.
- Produces: `useNavigationWeather(settings)`.
- Produces: `useNavigationMutations({ groups, links, update })`.

- [ ] Move search state, derived sections, keyboard focus, and web search handling into `useNavigationSearch`.
- [ ] Move geolocation and weather query state derivation into `useNavigationWeather`.
- [ ] Move group/link/delete/reorder/settings mutations and drawer draft helpers into `useNavigationMutations`.
- [ ] Keep `NavigationPage` as composition and rendering glue.

### Task 3: LinkGrid Card And Drag Split

**Files:**
- Modify: `src/features/navigation/LinkGrid.tsx`
- Create: `src/features/navigation/LinkCard.tsx`
- Create: `src/features/navigation/useLinkDragReorder.ts`

**Interfaces:**
- Produces: `LinkCard` memoized presentational component.
- Produces: `useLinkDragReorder({ sections, onReorderLinks })`.

- [ ] Move `LinkVisual`, tile class, target, and card rendering into `LinkCard.tsx`.
- [ ] Move drag state, refs, and callbacks into `useLinkDragReorder.ts`.
- [ ] Keep `LinkGrid` responsible for empty states and group section layout.

### Task 4: Verification

**Files:**
- Read/verify: all modified files.

- [ ] Run `npm test -- --run`.
- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build`.
- [ ] Confirm the requested files are split and tests cover all four named backend areas.
