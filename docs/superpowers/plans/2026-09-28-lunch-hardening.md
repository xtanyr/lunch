# Lunch Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close administrative API access gaps and deliver the approved Lunch reliability, privacy, and frontend-loading improvements.

**Architecture:** Add a small server-side admin-session module that issues short-lived signed HttpOnly cookies and middleware scoped to Omsk or the shared admin code. Wire the actual Express app to this module and exercise routes against temporary data, then update browser guards and finish the type, logging, and build improvements.

**Tech Stack:** Express 5, Node.js crypto/http, React 19, TypeScript 5.7, Vite 6, Vitest 5.

**Spec:** `docs/superpowers/specs/2026-09-25-lunch-hardening-design.md`

## Global Constraints

- Cookies use `HttpOnly`, `SameSite=Strict`, `Path=/`, an 8-hour lifetime, and `Secure` in production.
- Limit failed code submissions to 10 per scope and client IP within a 60-second window; derive forwarded IP only behind an explicitly trusted proxy (`LUNCH_TRUST_PROXY`, default `loopback`). Respond with `429` and `Retry-After`.
- Omsk has its own admin code; Petersburg and other cities use the existing shared admin code.
- Configure codes on the backend as `OMSK_ADMIN_CODE` and `GENERIC_ADMIN_CODE`; do not rely on the old `VITE_ADMIN_CODE` fallback.
- Public employee order submission and menu/order reads remain available without an admin cookie.
- Preserve employee ordering and own-order cancellation. Store only a nullable cancellation-token hash with each new order; keep public order response/list shapes free of that hash.
- Do not log employee names, departments, or order contents.
- No public sourcemap is emitted by default in production; an explicit diagnostic build option may enable it.
- `.git` is read-only in this workspace; preserve changes in the working tree and do not attempt staging or commits.

## Review Focus

- A missing or empty configured admin code must never authenticate an absent/empty supplied code; Task 1 tests both scopes.
- Tampered, duplicate-name, wrong-scope, and expired cookies must be rejected; Task 1 tests each case through Express middleware.
- A failed administrative request must not reach its handler or change data; Task 2 tests unauthenticated writes against temporary files.
- A valid admin session must reach the appropriate endpoint, while a cookie for the other scope must not; Tasks 1 and 2 test both.
- Public employee order creation must still succeed without an admin cookie; Task 2 tests the real route.
- Public order-list reads currently expose employee names, departments, and order contents; keep this for the existing shared employee flow and record it as a privacy limitation.
- A new order can be cancelled only with its one-time cancellation token or an admin session; tests prove the token is not exposed in list responses or accepted for another order.

---

### Task 1: Admin session module

**Files:**
- Create: `src/server/adminAuth.ts`
- Test: `src/server/adminAuth.test.ts`

**Interfaces:**
- Produces `AdminScope = 'omsk' | 'generic'`.
- Produces `createAdminAuth({ codes, secureCookies, now? })`, returning `verify(scope)`, `require(scope)`, and `logout(scope)` Express handlers.
- Session tokens are random, HMAC-signed, tracked in a process-local map, and scoped to the cookie name and role. The optional `now` clock is only for deterministic expiry tests.

- [x] **Step 1: Write failing behavior tests** for login, missing/wrong code, cookie flags, authenticated access, cross-scope rejection, tampering, duplicate cookies, expiry, logout revocation, unset server credentials, and per-client login throttling.
- [x] **Step 2: Run** `npm test -- src/server/adminAuth.test.ts`; expected: FAIL because `createAdminAuth` does not exist.
- [x] **Step 3: Implement** the smallest tested middleware and verification/logout handlers using Node `crypto`; use timing-safe credential/signature comparisons and reject ambiguous cookie headers.
- [x] **Step 4: Run** `npm test -- src/server/adminAuth.test.ts`; expected: all focused tests PASS (9 tests).

### Task 2: Protect the real Express routes

**Files:**
- Modify: `server.js`
- Modify: `src/database.ts`
- Test: `src/server/adminRoutes.test.ts`
- Create: `src/server/orderDeletion.ts`
- Test: `src/server/orderDeletion.test.ts`

**Interfaces:**
- Consumes Task 1's `createAdminAuth` handlers.
- Uses `LUNCH_DATA_DIR` for JSON and SQLite data paths, defaulting to the current `data` directory.
- Persists only a one-way hash of each cancellation token; an admin session remains a valid delete credential for legacy/no-token orders.
- Integration tests launch the real `tsx server.js` process on an ephemeral port from a temporary working directory; they never import the production server into the Vitest process.

- [x] **Step 1: Write failing integration tests** that launch the real server on an ephemeral port with a temporary working/data directory; assert unauthenticated generic/SPB/Omsk administrative writes and exports return 401, valid scoped cookies reach handlers, cross-scope cookies fail, and an invalid public `POST /api/orders` reaches ordinary 400 validation without a cookie. Also test create/list/delete cancellation-token flow for generic orders.
- [x] **Step 2: Run** `npm test -- src/server/orderDeletion.test.ts`; expected: FAIL because the cancellation-token module does not exist yet. (The real-server integration fixture depends on isolated data-directory wiring and is run after that wiring is in place.)
- [x] **Step 3: Implement** data-directory injection for JSON/SQLite files, configure `/api/omsk/admin/verify` and `/api/admin/verify` for login/session verification, add logout endpoints, protect every admin-only mutation/export route (including `/api/omsk/orders-range`), and accept order deletion only with its matching cancellation token or a scoped admin cookie.
- [x] **Step 4: Run** `npm test -- src/server/adminRoutes.test.ts`; expected: focused integration tests PASS without reading or writing the repository's real data files.
- [x] **Step 5: Run** `npm test`; expected: all old and new tests PASS.

### Task 3: Move browser admin guards to cookies

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/AdminAccess.tsx`
- Modify: `src/components/OmskAdminLogin.tsx`
- Modify: `src/components/SpbAdminLogin.tsx`
- Modify: `src/components/OmskAdmin.tsx`
- Modify: `src/vite-env.d.ts`
- Create: `src/utils/adminSession.ts`
- Test: `src/utils/adminSession.test.ts`
- Create: `src/utils/orderCancellation.ts`
- Test: `src/utils/orderCancellation.test.ts`

**Interfaces:**
- Consumes Task 2's verify/login/logout endpoints; browser requests use same-origin cookies.
- Produces `loginAdmin(scope, code)`, `verifyAdminSession(scope)`, and `logoutAdmin(scope)` client helpers.

- [x] **Step 1: Write failing helper tests** proving login sends the code only to the server, verification sends no stored code, and logout calls the scope-specific endpoint.
- [x] **Step 2: Run** `npm test -- src/utils/adminSession.test.ts`; expected: FAIL because the helpers do not exist.
- [x] **Step 3: Implement** the helpers and update all admin login/guard flows to use them; remove admin codes from browser `localStorage`, remove `VITE_ADMIN_CODE` client comparison, and remove `x-admin-code` request headers from the Omsk admin UI. Store returned cancellation tokens and send them only for matching employee-side deletions; hide delete controls for orders without a local token.
- [x] **Step 4: Run** `npm test -- src/utils/adminSession.test.ts`; expected: focused tests PASS.
- [x] **Step 5: Run** `npx tsc --noEmit`; expected: no auth/cancellation client type errors; the pre-existing Omsk date-block nullability diagnostic is handled in Task 4.

### Task 4: Type safety and order-log privacy

**Files:**
- Modify: `src/components/OmskOrderForm.tsx`
- Modify: `src/database.ts`
- Modify: `package.json`
- Test: add a focused test for date-block selection in `src/utils/orderDateBlock.test.ts` if the existing helper must be extracted.

- [x] **Step 1: Write a failing unit test** for the selected-date case where all dates are blocked and the displayed blocking message comes from a blocked date.
- [x] **Step 2: Run** the focused test; expected: FAIL before the shared date-block calculation is exposed.
- [x] **Step 3: Compute blocked-date info once per render, use an explicitly optional message fallback, remove full order-object logging, and add `npm run typecheck` (`tsc --noEmit`).
- [x] **Step 4: Run** the focused test and `npm run typecheck`; expected: PASS with zero TypeScript diagnostics.

### Task 5: Route code splitting and production build output

**Files:**
- Modify: `src/App.tsx`
- Create: `src/components/OrderPage.tsx` if extraction is needed to split the generic city route.
- Modify: `vite.config.ts`
- Create: `scripts/check-build-output.mjs`
- Modify: `package.json`

- [x] **Step 1: Write** `scripts/check-build-output.mjs` to assert that the HTML entry script is under 500 KiB, route chunks exist, and no `.map` assets are emitted by default; add `npm run verify:build` to run the production build followed by this check.
- [x] **Step 2: Run** `node scripts/check-build-output.mjs` against the previous output; expected: FAIL because the entry script is 615.1 KiB.
- [x] **Step 3: Implement** lazy route imports for large city/admin applications with a loading fallback. Remove the ineffective `xlsx` external rule and make production sourcemaps opt-in via `GENERATE_SOURCEMAP=true`.
- [x] **Step 4: Run** `npm run verify:build`; expected: PASS, lazy chunks emitted, entry script 286.4 KiB, no source maps.
- [x] **Step 5: Run** `npm test` and `npm run typecheck`; all 38 tests and typecheck passed.

## Execution Notes

- Work inline in the existing `new-version` checkout as requested. `.git` access is read-only, so task commits and branch-cleanup actions are unavailable here.
- The security boundary investigation is read-only and runs before the first product-code edit. A separate fresh reviewer checks the security patch after its focused tests; a fresh whole-change reviewer runs after all tasks.
- If any command is blocked by the sandbox, request only the required command permission and preserve the exact command output in the execution ledger.
