# Booking dates, availability, and owner identity

Verified on 2 October 2026 against the local RentNest database. Existing styling and migrations were preserved. No seeded listings, ownership assignments, bookings, or private messages were merged or deleted.

## Findings and rules

- October 10 to November 30 is not a whole-calendar-month period. One month checks out November 10; two months checks out December 10. This is a date/duration validation error (400), distinct from overlapping reservations (409).
- The current checkout already contained the whole-month form, quote API, shared date arithmetic, calendar, and current-owner mapping. The active application uses `rental.routes.js`, not the older daily-prorating `booking.service.js`. Older unmounted services and their incompatible tests remain in the repository; they were not used to calculate current bookings.
- Store YYYY-MM-DD in MySQL DATE columns. Move-in is included, checkout excluded: `[start,end)`. Adjacent bookings may start on checkout day. Arithmetic uses UTC date components; the business date is Asia/Dhaka. Supported years are 1000–9999. Add the entire duration to the original move-in month and clamp to the target month's last day, so January 31 plus two months is March 31, including leap years.
- Monthly rental total equals the server's monthly rent times the whole-month duration (1–120). Deposit is displayed and stored separately. Existing historical booking snapshots are preserved rather than repriced.
- Approved and confirmed, nondeleted bookings reserve dates. Pending requests have no hold. Rejected/cancelled/deleted bookings do not reserve; ended reservations do not occupy today. There is no expired status or temporary-hold system in this schema.
- Published properties remain browsable while occupied today. `is_available=0` means owner withdrawal. Earliest move-in is the later of today and `available_from`. Submission and approval/confirmation recheck the entire interval.
- Property locks precede booking locks. Duplicate active requests for the same renter/property/period are rejected. Deadlocks retry the entire database transaction up to three attempts, including validation; failed attempts create no partial notifications or booking events.
- Pending, approved, and confirmed bookings can be cancelled before move-in. Started rentals cannot be cancelled here. Cancellation releases reserved dates. Availability refreshes after successful relevant mutations, on focus, and every ten seconds.
- `properties.owner_id -> users.id` is authoritative for cards, favorites, details, review, management, and bookings. New chats resolve this relationship on the server. Historical conversations retain their original participants; an ownership-change warning distinguishes them from the current listing owner. New owners cannot read the previous owner's private thread. Owner-edit payloads cannot change ownership. No verified-owner badge is used in these components.

## Changes made in this pass

- `shared/rental-dates.js`: reject years outside the database-supported range, avoiding the JavaScript year 0–99 special case.
- `backend/src/services/rental.service.js`: bounded whole-transaction deadlock retry.
- `backend/src/routes/rental.routes.js`: allow future confirmed-booking cancellation, reject cancellation after move-in, and enforce earliest availability again at confirmation.
- `backend/src/routes/property.routes.js`: public visibility now also requires an active, nondeleted owner account, matching booking/chat eligibility.
- `src/rentals/Bookings.tsx`: expose confirmed-booking cancellation through the existing confirmation UI.
- `src/services/bookings.ts`: repair a stale query-string import that prevented TypeScript validation.
- `backend/tests/availability.test.js`: add supported-year and confirmed-cancellation/released-availability assertions.

Existing verified integration components: `src/properties/BookingForm.tsx`, `AvailabilityCalendar.tsx`, `PropertyDetails.tsx`, `PropertyCard.tsx`, `src/services/rentals.ts`, `backend/src/services/availability.service.js`.

## Endpoint map

| UI | Endpoints |
| --- | --- |
| Browse and details | `GET /api/properties`, `GET /api/properties/:id` |
| Details and modal calendars | `GET /api/properties/:id/availability?months=N&from=YYYY-MM-DD` |
| Booking review and submission | `GET /api/bookings/quote`, `POST /api/bookings` |
| Bookings and owner decisions | `GET /api/bookings`, `PATCH /api/bookings/:id/decision`, `PATCH /api/bookings/:id/cancel` |
| Favorites | `GET /api/favorites`, `PUT /api/favorites/:id`, `DELETE /api/favorites/:id` |
| Owner management | `GET /api/owner/properties`, `PATCH /api/owner/properties/:id` |
| Owner chat | `POST /api/conversations`, `GET /api/conversations`, `GET/POST /api/conversations/:id/messages` |

The public availability response contains dates only, earliest/next move-in, occupancy flag, duration, and date convention; it exposes no renter identity or booking ID.

## Database audit and ambiguous listings

`BOOKING_DATABASE_AUDIT.json` records all 36 listing IDs and owners. No missing/invalid owner relationships, exact duplicate title/location groups, changed-owner conversations, or conflicting approved/confirmed booking pairs were found.

Four stock photographs are reused among many distinct demo IDs and all eight owners. For example, IDs 26 and 56 both have Gulshan apartment titles (Demo 01 and Demo 31), but owners 94/Rezaul Chowdhury and 100/Anisul Haque. IDs 27 and 57 similarly have Banani flat titles with owners 95 and 101. This establishes separate database listings, not a single ID with different owners. Whether any represent the same physical dwelling cannot be determined from stock photos, neighborhood, or demo titles. The complete photo-to-ID groups are in the audit JSON. No address/parcel evidence justifies merging or reassigning them.

## Verification and limitations

- TypeScript and production build pass.
- All 29 tests for currently mounted APIs pass, including date/month-end/leap-year arithmetic, current occupancy with future availability, one/multiple month pricing, full/partial overlaps, adjacency, status handling, duplicate requests, stale availability, competing approvals, competing confirmation attempts, confirmed cancellation, earliest availability, two-owner isolation, favorites, messaging privacy, and profile/session restoration. Test fixtures are cleaned up.
- Twelve browser checks are recorded in `BOOKING_BROWSER_VERIFICATION.json`; screenshots are `booking-calendar-mobile.png`, `booking-review-mobile.png`, and `booking-calendar-reservations.png`. Public details, search, favorites, bookings, correct owner chat, conversation refresh, future month navigation, 390px layout, availability failure/retry, and monthly review pass with no JavaScript page errors. A temporary database fixture verified loading state, confirmed occupied dates with accessible disabled labels, and the next free proposed period; it was removed afterward. Remote stock photos were unavailable to the browser runner and displayed the existing honest image fallback.
- The complete default test command remains **29 passed / 15 failed**. Failures are in `rentals.test.js` and `workspace.test.js`, which expect unmounted legacy routes or old response contracts (including owner-create, account, sessions, payments, and admin settings). The full output is retained in `BOOKING_FULL_TEST_OUTPUT.txt`. These unrelated route regressions were not silently presented as passing or removed from the suite.
- Physical duplicate identity cannot be established with the schema's current location/photo data. Historical private conversations were verified through isolated test fixtures because none currently have changed owners in the seeded database.
- The local database and API were stopped at the start of verification; they and Vite were started. API database health is checked separately from booking validation.
