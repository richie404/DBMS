# RentNest frontend integration report

The existing visual system and global CSS are retained. Functional application records now come from MySQL-backed APIs; mutations report success only after the server confirms them. The frontend uses `VITE_API_BASE_URL` from `.env.local` (currently http://localhost:5000/api), credentialed requests, and session-bound CSRF tokens for writes.

## Database-backed pages and endpoints

Paths below are relative to `/api`.

| Page / UI | Read endpoints | Persisted operations |
|---|---|---|
| Landing / featured properties | GET /properties?limit=6 | Search forwards selected filters into public browse |
| Public browse / discovery | GET /properties with search, type, price, bedroom, availability, sort, page filters | Public access; no renter dashboard redirect |
| Property details / gallery / similar homes | GET /properties/:id, GET /properties; scoped GET /owner/properties/:id or /admin/properties/:id for management | Favorites, booking request, POST /conversations with actual property ID; authentication required for writes |
| Renter dashboard | GET /auth/me, /favorites, /bookings?limit=3, /properties?limit=3 | Live favorite, booking summary and available-property data |
| Favorites | GET /favorites | POST /favorites/:propertyId, DELETE /favorites/:propertyId |
| Renter bookings / booking details | GET /bookings, /bookings/:id | POST /bookings, POST /bookings/:id/cancel |
| Owner dashboard | GET /auth/me, /owner/properties, /owner/bookings | All records scoped by authenticated owner on server |
| Owner listings / create / edit | GET /owner/properties, /owner/properties/:id, /amenities | POST /owner/properties, PATCH /owner/properties/:id, DELETE /owner/properties/:id (archive); hosted photo URLs retained |
| Owner requests / details | GET /owner/bookings, /owner/bookings/:id | POST /owner/bookings/:id/approve, /reject, /cancel |
| Owner earnings | GET /owner/payments | Real payment statement CSV; no fabricated occupancy/payout forecast |
| Admin overview | GET /admin/overview | Refresh and CSV from measured counts/activity; active sessions are labelled signed-in accounts, not online presence |
| Admin users / inspection | GET /admin/users | PATCH /admin/users/:id/status; suspending/banning revokes sessions; protected admin accounts cannot be restricted |
| Admin listings | GET /admin/properties, /admin/properties/:id | PATCH /admin/properties/:id/moderation |
| Admin bookings | GET /admin/bookings, /admin/bookings/:id | Inspection; no unsupported admin booking mutation controls |
| Admin payments / reports | GET /admin/payments | CSV export of real filtered records; PDF control opens print dialog instead of faking generated PDF success |
| Admin analytics | GET /admin/analytics?range=Today / This Week / This Month / This Year | Actual date-bucket aggregates with safe zero/one-point charts |
| Admin activity | GET /admin/activity | Real log export; unsupported cryptographic/retention claims removed |
| Messages (renter and owner) | GET /conversations, /conversations/:id/messages | POST /conversations, POST /conversations/:id/messages, PATCH /conversations/:id/read; real participant names, property links, unread totals/read receipts |
| Notifications / dropdown | GET /notifications | PATCH /notifications/:id/read, /notifications/read-all |
| Navigation badges | GET /workspace/summary; GET /favorites | Unread messages, unread notifications, pending requests/listings, favorite count; refresh after mutations and periodic reads |
| Renter / owner / admin profile | GET /account and authenticated identity | PATCH /account for name, username, email, phone, hosted avatar URL; no fake verification/member-since fields |
| Preferences | GET /account | PATCH /account/preferences |
| Session/security controls | GET /account/sessions | DELETE /account/sessions/:id; POST /account/sessions/revoke-others; PATCH /auth/password |
| Admin configuration | GET /admin/settings | PATCH /admin/settings; preserves actual configured fields |
| Login / registration / recovery | GET /auth/me; POST /auth/login | POST /auth/register, /auth/logout, /auth/forgot-password, /auth/reset-password |

Successful booking creation/transitions and listing create/edit/moderation now create notifications and activity records within the same database transaction. Profile and administration changes also create real activity logs. Financial BDT summaries count only BDT records; transaction tables retain individual currencies. Completed charges represent recorded volume, not platform commission or an inferred payout.

## Refresh and access verification

- TypeScript check and production Vite build passed. Existing Vite config compatibility warnings are unrelated to this pass.
- All 38 backend tests passed (30 existing plus 8 workspace integration tests).
- Headless Chrome rendered 23 pages without JavaScript errors; details are in `FRONTEND_INTEGRATION_VERIFICATION.json`.
- Browser reload checks covered favorites, property create/edit/archive, listing approval/rejection, booking create/approval/rejection/cancellation, message send/read receipt, notification read state, profile save, and preferences.
- Favorite, cancellation, message, profile and preference actions were exercised through visible UI controls. Property CRUD and moderation actions also used real API calls followed by browser reload checks. Backend tests cover session revocation, admin user restriction, and settings persistence with fresh subsequent requests and SQL checks.
- Disposable browser/test records were removed; demo profile and preference edits were restored. No migration file was changed.
- Access tests cover anonymous access, wrong role, another owner's data, another user's notifications/conversations/sessions, CSRF, and malicious profile fields. 401 clears invalid session state and protected views lead to login. 403 shows access denied. 404 uses record-not-found UI; network/500 errors use existing error states.
- The `agent-browser` CLI was unavailable in the local cache; browser verification used the already installed Chrome DevTools Puppeteer driver and local Chrome instead.

## Remaining static datasets: final audit

No functional record page retains mock rows or fabricated metrics.

| Remaining static source | Classification | Why it remains |
|---|---|---|
| `showcaseHomes` in App.tsx, displayed only by DesignSystem property-card/table examples | B showcase | Explicit component demonstrations; never used for public or account listings |
| DesignSystem color swatches, typography specimens, field values, role-menu samples, status examples, table timestamps/pagination | B showcase | Demonstrates visual components, including deliberate dummy data |
| `componentCatalog` and variant/state/category definitions in src/components/system.tsx | B showcase/configuration | Describes reusable UI components; not application records |
| About-page `team` personas | C decorative | Explicitly labelled illustrative classroom-project personas; not authenticated users |
| Hero/About artwork and login testimonial | C decorative | Marketing illustration/copy; does not represent database listing or account data |
| Navigation, filter/status/role/type options, action labels, FAQ-like explanatory copy and footer links | C configuration/copy | Defines available UI/schema choices and explanatory text |
| Skeleton counts, design specimens, wizard step labels and transition-animation phases | B/C presentation | Loading placeholders and form progress; never presented as database totals |
| `rentalImage` SVG fallback | C presentation | Honest unavailable-photo placeholder when an image is absent or remote loading fails |

## Unsupported operations, explicitly disabled or disclosed

These are capability gaps, not mock data pages: administrator provisioning, message attachments, account deletion, system-data deletion, and maintenance access enforcement. Session/device lists use stored browser user-agent descriptions; no location/IP or online-presence information is invented. Email delivery remains the existing unconfigured backend adapter; recovery UI states that limitation and accepts only a real valid reset token. Platform settings persist configured values; live session lifetime still uses backend SESSION_DURATION_HOURS. The stored timeout setting does not override that environment configuration. Remote image URLs require network access and have an honest local fallback.

## Files changed in this pass

- src/App.tsx
- src/services/workspace.ts (new)
- src/hooks/useApiData.ts
- src/lib/api.ts
- backend/src/app.js
- backend/src/routes/workspace.routes.js (new)
- backend/src/services/activity.service.js (new)
- backend/src/services/booking.service.js
- backend/src/services/property.service.js
- backend/tests/workspace.test.js (new)
- backend/tests/rentals.test.js (fixture cleanup for transactional notifications/activity)
- FRONTEND_DATA_AUDIT.md (initial classification)
- FRONTEND_INTEGRATION_REPORT.md (this report)
- FRONTEND_INTEGRATION_VERIFICATION.json (browser verification evidence)
- frontend-home-check.png, frontend-renter-check.png, frontend-admin-check.png (visual verification artifacts)
