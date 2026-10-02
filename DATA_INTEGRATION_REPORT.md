# RentNest database integration audit — 2026-10-02

All functional renter, owner, and admin screens now read existing database records through the backend. Existing burgundy styling, authentication, ownership, public browsing, chat and booking date rules are preserved. No production/demo population data was added, reset, reimported, or backfilled. Automated mutation tests used temporary records with cleanup; final counts exactly match the starting snapshot.

## Database source and schema

- Running backend: localhost:5000; configured database: rentnest; database system timezone: Asia/Dhaka; session timezone: SYSTEM.
- Frontend .env.local points to http://localhost:5000/api; browser requests reached that backend.
- All 18 tracked migrations are applied. Checked migration table columns and every existing foreign key against the live schema: no missing columns, no orphaned FK references.
- Corrected mysql2 DATETIME serialization using the database storage offset (+06:00, configurable with DB_TIMEZONE). Existing records stay untouched; ISO timestamps now describe the correct instant rather than shifting displayed events by six hours.
- Admin reporting reads platform_settings.timezone (currently Asia/Dhaka). Stored DATETIME clock and reporting timezone are distinct. Calendar lifecycle remains the established Asia/Dhaka date-only convention.
- No SQL export exists in the repository or supplied attachments; requested its local path and received no path. Comparison against that export could not be performed. The live database was compared with all existing migrations instead.
- No migrations, backfills, constraints or indexes were added. Existing constraints and indexes are retained.

## Inclusion policies

- Users: non-deleted records, including active/suspended/banned; role breakdown uses the same inclusion policy as User Management.
- Listings: non-deleted records, including drafts, pending, approved and rejected; pending approvals mean moderation_status=pending.
- Active bookings: non-deleted approved/confirmed bookings whose exclusive end date is after today. Future reservations are included. Completed rentals use those statuses with end date on/before today. Pending requests must also end after today.
- Owner records: properties/bookings use current property.owner_id; conversation access uses immutable conversation participants. Payments use their actual payee, not a inferred current owner.
- Renter favorites: saved listings still publicly visible under the same visibility predicate as the favorites destination; bookings use renter_id; unread messages exclude the user's outgoing messages.
- Today activity: existing activity_logs events in the configured application day; not sessions, synthetic traffic, notifications, or invented history.
- Aggregate subqueries avoid multiplying users/bookings by image/message joins. Pagination never limits summary totals.

## SQL / API / rendered UI verification

Accounts: admin 102 (Nafisa Ahmed), owners 94/95 (Rezaul Chowdhury/Shamima Begum), renters 79/80 (Ayesha Rahman/Tanvir Hasan).

| Account ID | Metric | SQL | API | UI | Result |
|---|---|---:|---:|---:|---|
| 102 | users | 25 | 25 | 25 | Pass |
| 102 | renters | 15 | 15 | 15 | Pass |
| 102 | owners | 8 | 8 | 8 | Pass |
| 102 | admins | 2 | 2 | 2 | Pass |
| 102 | listings | 36 | 36 | 36 | Pass |
| 102 | pendingListings | 4 | 4 | 4 | Pass |
| 102 | activeBookings | 18 | 18 | 18 | Pass |
| 102 | activityToday | 38 | 38 | 38 | Pass |
| 94 | totalProperties | 5 | 5 | 5 | Pass |
| 94 | availableProperties | 4 | 4 | 4 | Pass |
| 94 | pendingRequests | 2 | 2 | 2 | Pass |
| 94 | activeBookings | 3 | 3 | 3 | Pass |
| 94 | unreadMessages | 2 | 2 | 2 | Pass |
| 95 | totalProperties | 5 | 5 | 5 | Pass |
| 95 | availableProperties | 4 | 4 | 4 | Pass |
| 95 | pendingRequests | 1 | 1 | 1 | Pass |
| 95 | activeBookings | 3 | 3 | 3 | Pass |
| 95 | unreadMessages | 3 | 3 | 3 | Pass |
| 79 | savedProperties | 5 | 5 | 5 | Pass |
| 79 | activeBookings | 2 | 2 | 2 | Pass |
| 79 | pendingRequests | 1 | 1 | 1 | Pass |
| 79 | unreadMessages | 0 | 0 | 0 | Pass |
| 80 | savedProperties | 1 | 1 | 1 | Pass |
| 80 | activeBookings | 2 | 2 | 2 | Pass |
| 80 | pendingRequests | 0 | 0 | 0 | Pass |
| 80 | unreadMessages | 2 | 2 | 2 | Pass |

Unread conversation subtotals were also compared between SQL and API. All four analytics series (users/listings/bookings/completed charges) match independent SQL daily grouping and rendered chart buckets, including zero days. Both owners have no completed payout metric to display; no estimated earnings are invented.

## Database-backed pages and endpoints

| Page / area | Endpoints |
|---|---|
| Public landing, renter available properties, public search | GET /api/properties; GET /api/properties/locations |
| Property details and availability | GET /api/properties/:id; GET /api/properties/:id/availability |
| Renter dashboard | GET /api/dashboard/summary; GET /api/bookings; GET /api/favorites; GET /api/notifications; GET /api/properties |
| Favorites | GET /api/favorites; PUT/DELETE /api/favorites/:id |
| Renter/owner/admin bookings | GET /api/bookings?filter=…; GET /api/bookings/quote; POST /api/bookings; PATCH /api/bookings/:id/cancel or /decision |
| Owner dashboard/listings/editor | GET /api/owner/summary; GET/POST /api/owner/properties; GET/PATCH/DELETE /api/owner/properties/:id; GET /availability; GET /api/owner/amenities |
| Owner payments/profile | GET /api/owner/payments; GET/PATCH /api/owner/preferences; PATCH /api/auth/profile |
| Messages | GET/POST /api/conversations; GET/POST /api/conversations/:id/messages; PATCH /api/conversations/:id/read; POST /api/bookings/:id/conversation |
| Notifications | GET /api/notifications; PATCH /api/notifications/:id/read or /read-all |
| Admin overview | GET /api/admin/overview |
| Admin users | GET /api/admin/users; PATCH /api/admin/users/:id/status |
| Admin listings and private review | GET /api/admin/properties; GET /api/admin/properties/:id; GET /api/admin/properties/:id/availability; PATCH /api/admin/properties/:id/moderation |
| Admin payments / analytics / logs | GET /api/admin/payments; GET /api/admin/analytics?range=…; GET /api/admin/activity |
| Renter/admin profile, preferences, security | GET /api/account; PATCH /api/account/preferences; PATCH /api/auth/profile; PATCH /api/auth/password; GET/DELETE /api/auth/sessions… |
| Admin platform configuration | GET/PATCH /api/admin/settings |

Admin Refresh Data performs real fetches. Users, financial records, activity and analytics CSV exports use the complete authorised matching datasets rather than the visible pagination slice. Charts show accurately labelled daily/hourly records; unsupported growth percentages and Live claims were removed. Overview/listing badges share pending counts. Error states hide unavailable metrics, support Retry, and never substitute demo rows or zero success values.

Existing owner/renter mutations await API confirmation. Favorites and message send/read now dispatch data-change events; booking/property/moderation events and polling refresh related lists/counts. Account-scoped hooks abort obsolete reads; workspace remounting, AuthContext and API revision guards prevent cross-account response leaks. Same-browser switching from renter 79 to 80 showed one actual favorite rather than renter 79's five.

## Financial semantics and logging

Payments remain separate by currency, record_type and status. Completed charges, completed payouts and refunds are not interchangeable. Booking rent snapshots and separate quoted deposits are reservation values, not paid revenue. The schema has no rent/deposit payment allocation or outstanding-balance model; those unsupported values are clearly identified rather than estimated. Payment provider processing is not implemented.

Future registration, profile edits, booking requests/transitions and message sends now record activity using the existing activity_logs mechanism. Listing CRUD/moderation and user administration already log their committed operations. No historical log backfill was performed. Message content is not copied into administrative activity descriptions.

## Missing attributes / relationship checks

No orphaned FK references, invalid conversation message participants, owner-transfer ambiguity, incomplete published listings or incomplete drafts were found. Optional avatar_url is NULL for users 79–103; preserve NULL, render real-name initials, and offer URL-based profile editing. No missing phone records were found. Owner/property/booking/conversation names resolve through stored IDs. Unknown optional descriptions/source IPs/transaction times remain Not provided; no identity, amount, image or timestamp is invented.

## Remaining hardcoded data

No mock application record arrays or metrics remain in src. The legacy homes, initialBookings, fake chat participants, fake admin rows, chart data, inflated totals, hardcoded dates, ratings and testimonial identity were removed together with dormant duplicate mock page implementations.

- Design System only: color tokens, typography specimens, illustrative form input values (Sunlit apartment/Gulshan/RN-2048/incorrect-email), component status examples, navigation label examples and loading skeleton dimensions. These demonstrate appearance and are not presented as database records. Its property cards now use public database listings; its invented management rows/totals were removed.
- Navigation/actions/options: route labels, icons, role/status/type/sort allowlists, preference labels, pagination sizes, whole-month duration controls. These are UI configuration, not records.
- Decorative copy: headings, how-it-works steps, trust explanations and landing/auth background images. Real property cards/photos always use actual property_images records or an honest missing-photo state.
- AuthContext Math.random remains solely a cross-tab session invalidation nonce; it produces no displayed statistics.

No renter, owner or admin functional page remains mock. Unsupported destructive account/system reset actions and fake password success flows were removed; real password/profile/preferences/session actions use their APIs. Development reset token creation exists but email delivery is not configured, explicitly stated by the UI. Maintenance enforcement/session lifetime from platform settings is not implemented; the settings screen identifies backend-environment session control and does not pretend to change public access.

## Verification

- TypeScript: pass.
- Production Vite build: pass (existing configLoader/native-config compatibility warnings only).
- Existing active backend tests: 31/31 pass, including booking overlap/concurrent approval, date arithmetic, ownership/private conversations, CRUD/media persistence, favorites, profile, registration, CSRF, password and session behavior. Temporary fixtures are cleaned; cleanup was updated to remove their newly logged actor events before deleting fixture users.
- Browser: 35 checks pass, zero page JavaScript errors; 26 SQL/API/UI metric comparisons pass; actual charts and all-page CSV export validated.
- Browsing/old About redirect/one guest availability calendar, two owners/two renters, count destinations, reload, empty data filters, every role's summary failure/Retry, same-browser account switching and 390px mobile width checked.
- SQL/API record IDs match: 25 users, 36 properties, 45 bookings, 9 payments, 83 activity records. Final full database counts equal the initial snapshot: {"users":25,"properties":36,"bookings":45,"favorites":56,"conversations":18,"messages":72,"notifications":153,"payments":9,"activity_logs":83}.
- git diff --check: pass, with Windows line-ending conversion warnings only.
- Backend health 200; frontend 200; both services running.

Could not verify the missing SQL export. Two older suites (rentals.test.js and workspace.test.js) target superseded DTO/route contracts and were excluded; their relevant active workflows are covered by the 31-test suite and current audits. No physical-device/manual multi-browser or payment-provider test was performed.

## Files changed in this integration pass

Frontend:
- src/App.tsx
- src/admin/AdminWorkspace.tsx
- src/admin/admin.css
- src/auth/AccountSettings.tsx
- src/hooks/useDatabaseData.ts
- src/rentals/RenterRecords.tsx
- src/rentals/Messages.tsx
- src/rentals/Bookings.tsx
- src/properties/Discovery.tsx
- src/properties/FavoritesContext.tsx
- src/properties/FavoritesPage.tsx
- src/properties/ListingCollection.tsx
- src/properties/PropertyDetails.tsx
- src/properties/AvailabilityCalendar.tsx
- src/properties/AvailabilitySummary.tsx
- src/services/properties.ts
- src/services/workspace.ts

Backend:
- backend/src/app.js
- backend/src/config/database.js
- backend/src/controllers/profile.controller.js
- backend/src/routes/owner-properties.routes.js
- backend/src/routes/rental.routes.js
- backend/src/routes/workspace.routes.js
- backend/src/services/auth.service.js

Fixture cleanup adjustments in existing tests:
- backend/tests/availability.test.js
- backend/tests/csrf.test.js
- backend/tests/forgot-password.test.js
- backend/tests/login-session.test.js
- backend/tests/password-change.test.js
- backend/tests/profile.test.js
- backend/tests/property-discovery.test.js
- backend/tests/registration.test.js
- backend/tests/rental-actions.test.js
- backend/tests/rentals.test.js
- backend/tests/reset-password.test.js
- backend/tests/workspace.test.js
- backend/tests/owner-workspace.test.js
- backend/tests/session-security.test.js

Evidence: DATABASE_SOURCE_AUDIT.json, DATA_INTEGRATION_SCHEMA_AUDIT.json, DATA_INTEGRATION_API_AUDIT.json, DATA_INTEGRATION_BROWSER_VERIFICATION.json, DATA_INTEGRATION_EXTRA_BROWSER.json, DATA_INTEGRATION_FINAL_AUDIT.json, DATA_INTEGRATION_TEST_OUTPUT.txt, DATA_INTEGRATION_BUILD_OUTPUT.txt, data-integration-admin-mobile.png.
