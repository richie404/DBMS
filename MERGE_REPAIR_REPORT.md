# RentNest conflict repair

## Git state
The initial working tree was clean and `git ls-files -u` was empty. Seven tracked files contained conflict markers committed as ordinary text. Labels were `Updated upstream` and `Stashed changes`; these labels alone do not prove which Git operation introduced them. Current MERGE_HEAD, REBASE_HEAD, CHERRY_PICK_HEAD, REVERT_HEAD, rebase-merge, rebase-apply, and sequencer paths are absent. The stash list is empty. No Git operation requires continuation. Nothing was staged, committed, pushed, reset, or reseeded.

## Files repaired
- `src/App.tsx`: reconciled competing monolithic and modular screens around the existing SQL-backed discovery, renter, owner, admin, bookings, calendar, favorites, notification, and messaging components. Removed duplicate competing implementations while retaining public browsing and role guards.
- `src/auth/AuthContext.tsx`: unified the consumer contract, backend session restoration, real identity and roles, checking/authenticated/guest states, expiry handling, cross-tab invalidation, and shared logout. Preserved session/request revision checks; added unmount invalidation and invalidation before logout. Both session-expired and session-ended events remain supported.
- `src/lib/api.ts`: retained credentials, CSRF, no-store, stale-response protection, the upstream request timeout, and access-denied event. Added a revision check after asynchronous CSRF retrieval to prevent a request prepared for an old account being sent for a new one.
- `src/services/auth.ts`: retained actual profile persistence and the shared auth service contract.
- `src/services/properties.ts`: reconciled public listing/detail/favorite results and owner information with current components, removed competing type declarations, and retained query serialization for existing consumers.
- `backend/src/app.js`: retained the modern public property, favorites, sessions, owner listing, rental, and workspace route mounts together with authentication and health routes.
- `backend/src/routes/rental.routes.js`: retained the role-aware booking, availability, summary, conversation/message/read-receipt, and notification APIs consumed by the modular UI.
- `backend/src/routes/auth.routes.js`: restored the authenticated, CSRF-protected PATCH profile route for the retained profile client.

Six required modules were missing from HEAD although current components/routes imported them. Their existing implementations were inspected and restored from commit `060fa1e`, rather than replaced with mock implementations:
- `src/properties/PropertyCard.tsx`
- `src/rentals/DashboardCards.tsx`
- `src/rentals/useDashboardSummary.ts`
- `shared/rental-dates.d.ts`
- `backend/src/routes/favorite.routes.js`
- `backend/src/services/availability.service.js`

Availability retains approved/confirmed reservations, checkout-exclusive intervals, shared calendar-month arithmetic, overlap validation, and transaction locks. Existing owner isolation and messaging membership checks remain in place.

## Verification
- Project source/configuration conflict-marker scan: no matches. Dependencies, generated output, and temporary repair scripts excluded.
- Git unmerged index entries: none.
- `git diff --check`: passed (Git also emitted normal LF/CRLF conversion notices).
- `node node_modules/typescript/bin/tsc --noEmit`: passed.
- `npm.cmd run build`: passed. Existing Vite native-config warnings remain; see MERGE_REPAIR_BUILD_OUTPUT.txt.
- Current-contract backend tests: 31 passed, zero failed; includes auth, profiles, session security, public filters/favorites, availability/competing reservations, owner CRUD/isolation, messages, and notifications. See MERGE_REPAIR_TEST_OUTPUT.txt.
- Full `npm.cmd --prefix backend test`: 34 passed, 13 failed. See MERGE_REPAIR_ALL_TEST_OUTPUT.txt. Legacy rentals/workspace tests expect the alternative API contract (creation status 201 versus 200, old favorites/booking/session/payment response shapes and routes, and old message/read inputs). Their failed property creation assertions also prevented fixture IDs being recorded, causing a cleanup foreign-key failure; only that exact run's temporary fixtures were subsequently removed. One full-suite session test hit Node fetch's randomly assigned forbidden-port error; it passed in the current-contract run. The full suite is not claimed clean and those legacy tests were not rewritten to conceal failures.
- Browser: public database browsing without a dashboard or Vite overlay; anonymous guards for all roles; renter/owner/admin login, actual dashboard data, refresh session restoration, logout and private-route denial; owner-to-renter access denial; same-browser account switching and favorite isolation; mobile public discovery. All passed without page errors. See MERGE_REPAIR_BROWSER.json.
- Browser race: a delayed successful /auth/me response could not restore authentication after shared AuthContext logout; the actual backend session subsequently returned 401. Passed. See MERGE_REPAIR_RACE_BROWSER.json.

The existing frontend remains available on http://localhost:8443. The backend was restarted with the repaired source and its health endpoint returned success. No manual visual review on physical mobile hardware was performed; mobile verification used a browser viewport. No merge/rebase continuation is needed.
