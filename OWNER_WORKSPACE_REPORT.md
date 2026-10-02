# Owner dashboard and workflow integration

The owner workspace now uses authenticated, owner-scoped database records. The burgundy theme, public browsing, shared authentication, favorites, messaging and whole-month booking calendar are retained.

## Root causes fixed

- The routed owner dashboard lacked real summary cards; dormant owner screens contained fabricated users, metrics, activity, bookings and earnings. Those unused owner screens were removed.
- Add Property simulated success, while the edit route showed the whole collection rather than loading the selected ID. The active owner API exposed only a narrow edit operation despite existing schema, validation, moderation and archival services.
- Owner content edits could bypass the existing reapproval policy. Full CRUD now reuses the property service, owner-session identity, validation, media ordering and moderation policy.
- Availability edits could exclude existing reservations. A property lock and reservation check now reject an incompatible earliest move-in date.
- Booking actions did not immediately notify all interested UI data hooks, and an owner could not initiate a conversation from a booking without an existing thread.
- Owner payments were fabricated; the owner profile contained a static property count and incomplete preference controls.
- Notification navigation did not open linked records, unread badges counted only the latest response subset, and selected notification filters were lost on refresh.
- Compact legacy owner card CSS used tiny text and buttons. Scoped owner styles now provide readable text, usable controls, focus states and mobile layouts.

## Pages and behavior

- Dashboard: total properties, published listings accepting requests, pending requests, active reservations, unread incoming messages and actual completed payouts. Every card opens its corresponding destination/filter. Failed count requests show a retryable error and suppress the cards.
- My Properties: only the authenticated owner's non-archived listings; title/location search, publication/withdrawal filters, rent sorting and 12-record pagination. Counts cover the full matching collection. URL filters/page selection survive refresh and browser Back/Forward. View/Edit and their return actions preserve listing filters.
- Add/Edit: exact database ID, title, description, location, type, rent, separate deposit, size, rooms, eligibility, furnishing, earliest move-in, request availability, amenities and image URLs. Supports drafts, submission for approval, photo preview/removal/order/primary selection and confirmed archival. Failed saves retain entered fields; controls disable during requests. Ownership cannot be changed through the form or API.
- Availability: owner calendar uses the shared component and owner-scoped availability endpoint, including unpublished/withdrawn listings. Public and owner views use the same approved/confirmed reservation rules and checkout-exclusive convention. Occupancy, publication and accepting future requests remain separate.
- Property preview: unpublished/withdrawn own listings can be inspected privately, with actual description, amenities, photos and owner identity. Foreign private IDs are rejected. Public property owner names and amenities reflect saved database data.
- Booking Management: actual owner-scoped requests/reservations; Pending, Active, Completed, Approved, Confirmed, Rejected and Cancelled filters. Completed is derived from reserved status and checkout date, rather than adding a schema status. Details include the actual renter, period, duration, rent snapshot and separate deposit. Approve/reject/confirm use explicit confirmation and the existing transaction/overlap checks. Competing pending requests are preserved until explicitly decided.
- Messages: existing private messaging UI remains; Message Renter opens/creates the conversation for the actual booking participants. Supplied owner/renter IDs are ignored. Existing conversations retain their participants after ownership changes. Incoming messages are counted and marked read through the established system.
- Notifications/activity: actual owner records; linked bookings, properties and conversations open correctly. Mark-one and mark-all persist. All owner notification records are available to the owner center; the global badge uses the server's unread total. Notification filters persist in the URL.
- Payments: actual records whose payee is the authenticated owner. Completed payouts are shown as payouts received, not booking revenue. No fabricated earnings chart or rows remain on this owner route.
- Profile: actual name, username, email, phone and avatar URL; real preference reads/writes and existing session/security controls. AuthContext updates identity across the workspace after a profile save.
- Admin listing review: the real listing collection now exposes protected approve/reject actions using the existing moderation service so owner submissions can be reviewed. Other admin demo screens were outside this pass.

## Endpoints

| Major page/action | Endpoints |
|---|---|
| Owner identity/session | Existing `/api/auth/me`, `/api/auth/profile`, `/api/auth/sessions` and logout APIs |
| Dashboard/cards | `GET /api/owner/summary`, `GET /api/owner/properties`, `GET /api/notifications` |
| Listings and editor | `GET/POST /api/owner/properties`; `GET/PATCH/DELETE /api/owner/properties/:id`; `GET /api/owner/amenities` |
| Owner availability | `GET /api/owner/properties/:id/availability` |
| Public property details/availability | Existing `GET /api/properties/:id` and `GET /api/properties/:id/availability` |
| Booking management | Existing `GET /api/bookings?filter=...`, `PATCH /api/bookings/:id/decision`; new `POST /api/bookings/:id/conversation` |
| Renter booking validation | Existing `GET /api/bookings/quote`, `POST /api/bookings`, `PATCH /api/bookings/:id/cancel` |
| Conversations | Existing `GET /api/conversations`; `GET/POST /api/conversations/:id/messages`; `PATCH /api/conversations/:id/read` |
| Notifications | Existing `GET /api/notifications`; `PATCH /api/notifications/:id/read`; `PATCH /api/notifications/read-all` |
| Payments | `GET /api/owner/payments` |
| Preferences | `GET/PATCH /api/owner/preferences` |
| Listing approval | `PATCH /api/admin/properties/:id/moderation` |

Every owner endpoint validates the backend session and role. Property, booking and preference mutations require CSRF. Ownership is derived from the session and locked database records.

## Files changed in this pass

Frontend:
- `src/App.tsx`
- `src/owner/OwnerWorkspace.tsx` (new default-exported owner page dispatcher, internal page components and data hooks)
- `src/owner/owner.css` (new)
- `src/properties/AvailabilityCalendar.tsx`
- `src/properties/AvailabilitySummary.tsx`
- `src/properties/BookingForm.tsx`
- `src/properties/ListingCollection.tsx`
- `src/properties/PropertyDetails.tsx`
- `src/rentals/Bookings.tsx`
- `src/rentals/useNotifications.ts`
- `src/rentals/useWorkspaceNavigation.ts`
- `src/services/auth.ts`
- `src/services/properties.ts`
- `src/services/rentals.ts`

Backend:
- `backend/src/controllers/profile.controller.js`
- `backend/src/routes/owner-properties.routes.js`
- `backend/src/routes/property.routes.js`
- `backend/src/routes/rental.routes.js`
- `backend/src/services/booking-filters.js`
- `backend/src/services/property.service.js`
- `backend/src/validators/rental.validator.js`
- `backend/tests/owner-workspace.test.js` (new)

## Verification

- TypeScript no-emit check: passed.
- Production build: passed; output saved in `OWNER_BUILD_OUTPUT.txt`. Existing Vite native-config compatibility warnings remain.
- 31 active backend tests: passed, output in `OWNER_ACTIVE_TEST_OUTPUT.txt`.
- Owner integration test uses two owners with different properties and two renters. It verifies ownership/role/CSRF boundaries, CRUD and photo ordering, moderation policy, matching counts, actual payment scoping, availability edits, withdrawal/archival restrictions, booking notifications and rejection reasons, message membership/read state, booking-based conversation creation and simultaneous overlapping approvals. Exactly one competing approval succeeds and one returns 409.
- 16 owner browser checks: passed, zero page errors, recorded in `OWNER_BROWSER_VERIFICATION.json`. Covers real identity, add/edit and primary-photo persistence after refresh, private previews, matching counts across pagination, filters/Back/Forward, approval/rejection, messaging, profile persistence, direct foreign IDs, logout/account switching and 390px mobile layouts.
- Four error-state browser checks: passed, recorded in `OWNER_ERROR_VERIFICATION.json`. Injected 500 summary response hides counts, Retry recovers, malformed filter URLs stay safe, and notification filters survive refresh.
- 12 public/renter calendar regression browser checks: passed, recorded in `PUBLIC_CLEANUP_BROWSER_VERIFICATION.json`. Includes guest inspection, login continuation, whole-month checkout/rent/deposit, backend overlap rejection, persisted future booking, real owner/description, public navigation and logout.
- Mobile screenshots: `owner-listings-mobile.png` and `owner-form-mobile.png`.
- Git whitespace check: passed.

## Remaining limits

- Photos use the existing schema's URL/local-path image approach. No server file-upload/storage API existed, so a separate upload system was not introduced. URL photo selection, preview, removal, ordering and primary-photo persistence work. External image host availability remains outside the application; shared photo fallback handles failures.
- Listing search/sort/pagination operate over the complete owner-scoped API collection. Server-side pagination would be a future scalability improvement.
- Payment records are displayed; this pass does not introduce a payment provider or invent financial receipts.
- The schema has no owner-blocked-date or temporary-hold model. Existing availability controls and approved/confirmed reservations are used.
- Physical mobile devices were not tested; automated Chrome viewport checks were used.
- The two legacy suites `rentals.test.js` and `workspace.test.js` were excluded because of previously identified failures against older unmounted routes/contracts. The complete default legacy suite is not claimed to pass.
- Unrelated admin demo screens and design-system datasets remain outside this owner-focused pass. Routed owner pages now obtain application records from the database.

No database reset or migration changes were performed. Verification fixtures are removed by their exact generated IDs; existing demo records are preserved.
