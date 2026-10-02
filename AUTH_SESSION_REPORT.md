# Authentication, sessions, and public browsing

## Root causes

1. The renter Session & security menu navigated directly to a static `Session expired` page. No backend expiration had occurred, so returning Home correctly still found the cookie session. This was misleading navigation, not a real session timeout.
2. Route restoration recognized only a subset of private/public views and could fall back to an authenticated dashboard. Public discovery also used a dashboard shell for signed-in users. Exact role guards covered owner/admin prefixes but missed renter-only pages.
3. Authentication refresh cleared the user on any request failure, including network/server failures. There was no cross-tab synchronization, and delayed API responses had no account-generation check.
4. Session-management displays contained hardcoded devices. The old `/account/sessions` client referenced an unmounted endpoint, while actual authentication used `/auth/me`. Authentication responses also lacked explicit no-store handling.

The reported fresh-guest dashboard redirect was not reproduced with a clean browser in the inspected checkout. A retained valid cookie restores authentication even before logging in again in that tab; the previous signed-in discovery shell then displayed a renter workspace. Public discovery now always has public navigation, and fresh-cookie-free browsing is verified separately.

## Implementation

- AuthContext remains the sole source of truth, with checking/authenticated/guest state. Startup, refresh, focus, and the periodic check validate `/api/auth/me`. No localStorage user or default renter proves authentication.
- Only confirmed invalid sessions (401) or explicit unavailable accounts clear authentication. Ordinary role/CSRF 403, 404, network errors, and server errors remain separate. A failed session check displays retry; private content is withheld while that error is unresolved. Public browsing remains accessible.
- An authentication generation invalidates stale API results after logout or account switching. User-scoped component trees unmount, abort reads, and clear favorites, counts, messages, bookings, and profile state. Logout also clears pending return information and user search caches; guest return intent survives refreshing the login page.
- A localStorage change event contains only a notification nonce, never a token or user identity. Other tabs clear private state and revalidate the actual shared cookie. Backend revocation remains authoritative.
- Public `Discover` and `Listing details` routes use existing database components and public navigation, regardless of role. Browse Properties never implies dashboard navigation. Existing search/filter/sort/pagination APIs remain unchanged.
- Query and legacy hash navigation preserve explicit requested pages. Renter/owner/admin route guards use the backend role and exact existing route mapping. Unknown roles never default to renter. Access denied returns to the user's own dashboard.
- Guest private actions store a bounded numeric property ID. Protected page returns accept only known internal views and validated numeric identifiers; external return URLs are rejected. Returning to a property never submits a booking automatically.
- Real session security is shared by all roles. `GET /api/auth/sessions` lists only the authenticated user's active records without token hashes. `DELETE /api/auth/sessions/:id` revokes an owned session and clears the cookie when current. `POST /api/auth/sessions/revoke-others` preserves the current session. Mutations require existing CSRF protection.
- All API calls retain `credentials: include`; authentication and API fetches use no-store. Existing CORS origin, HttpOnly/SameSite cookie policy, environment-based secure flag, and shared cookie/database session duration are preserved. No migrations or demo user authentication were added.

## Files changed for this task

- `src/App.tsx`: public shell, exact role guards, session security menu/page, safe login return, logout landing navigation, and honest error/denied states.
- `src/auth/AuthContext.tsx`: shared state lifecycle, failure distinction, request generations, cache cleanup, and tab synchronization.
- `src/auth/SessionSecurity.tsx`: real session list and revocation UI using existing card/button styling.
- `src/auth/navigation.ts`: known route list and internal return-path validation.
- `src/rentals/useWorkspaceNavigation.ts`: query/hash restoration and Back/Forward behavior without dashboard fallback for explicit views.
- `src/lib/api.ts`: no-store requests, stale-response rejection, and scoped invalid-session events.
- `src/services/workspace.ts`: session helpers point at the mounted session API.
- `backend/src/routes/auth.routes.js`: no-store authentication responses.
- `backend/src/routes/sessions.routes.js`: authenticated session listing and CSRF-protected scoped revocation.
- `backend/src/app.js`: session route registration.
- `backend/tests/session-security.test.js`: real database session authorization/revocation/expiry checks with fixture cleanup.

## Verification

- TypeScript and production build pass; existing Vite configuration warnings remain.
- All 30 tests for mounted APIs pass, covering authentication/CSRF/profile, real sessions, public filters/pagination, favorites, booking availability/concurrency, messaging, and owner isolation.
- `AUTH_SESSION_BROWSER_VERIFICATION.json` records 16 passing browser checks with no JavaScript page errors: guest public browsing, direct protected URLs for all roles, legacy hash guards, real session security, failed session-check handling, current-session revocation across tabs, public browsing after revocation, account switching, role denial, ordinary sidebar logout returning Home, and Back after logout.
- Additional browser checks cover a guest favorite returning to property 26 after refreshing login, actual database expiry with a clear login message, unsafe external return rejection, and a delayed successful `/auth/me` response being discarded after revocation. No booking is automatically submitted.
- Browser checks have no JavaScript page errors. The two older suites `rentals.test.js` and `workspace.test.js` still target unmounted legacy routes or incompatible contracts, as documented in `BOOKING_FULL_TEST_OUTPUT.txt`; the complete default test command is not claimed to pass.
- Cross-tab behavior was verified in Chrome under one browser origin. Multiple different browsers rely on backend session checks/401 responses and the existing 60-second session poll rather than shared localStorage events. Production HTTPS was not tested locally.

The local frontend, backend API, and database remain running. Temporary database accounts from automated tests are removed; seeded listings, bookings, messages, ownership, and migration history are preserved.
