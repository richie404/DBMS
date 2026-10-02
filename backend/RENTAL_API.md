# RentNest rental data API

All routes below use the existing `/api` prefix, JSON response envelopes, session cookies, and CSRF tokens for authenticated mutations. Migrations 005–016 are unchanged. Public property owner information excludes email and phone numbers.

| Access | Routes |
| --- | --- |
| Public | `GET /properties`, `GET /properties/:id`, `GET /amenities` |
| Renter favorites | `GET /favorites`, `POST /favorites/:propertyId`, `DELETE /favorites/:propertyId` |
| Renter bookings | `GET /bookings`, `GET /bookings/:id`, `POST /bookings`, `POST /bookings/:id/cancel` |
| Owner properties | `GET /owner/properties`, `GET /owner/properties/:id`, `POST /owner/properties`, `PATCH /owner/properties/:id`, `DELETE /owner/properties/:id` |
| Owner bookings | `GET /owner/bookings`, `GET /owner/bookings/:id`, `POST /owner/bookings/:id/approve`, `POST /owner/bookings/:id/reject`, `POST /owner/bookings/:id/cancel` |
| Admin properties | `GET /admin/properties`, `GET /admin/properties/:id`, `PATCH /admin/properties/:id/moderation` |
| Admin bookings | `GET /admin/bookings`, `GET /admin/bookings/:id` |

Property list filters: `search`, `location`, `type`, `minPrice`, `maxPrice`, `bedrooms` (minimum), `availability` (`available`, `unavailable`, `now`, `future`), `status`, `createdAfter`, `sort` (`latest`, `price_asc`, `price_desc`), `page`, `limit` (1–100). Public routes always restrict results to approved, available, non-archived properties belonging to active owners. Filters cannot override those restrictions.

Booking list filters: `search`, `status`, `propertyId`, `from`, `to`, `page`, `limit`. Date filters constrain the start date. Lists include pagination and a status summary for the authenticated scope. Booking details include event history.

Owners can create drafts or submit pending listings. Significant edits to approved listings require moderation again. Admin moderation accepts `{ "status": "approved" }` or `{ "status": "rejected", "reason": "..." }` for pending listings. DELETE archives via `deleted_at`; active future booking requests must be resolved first.

Create a booking with `{ "propertyId": 123, "startDate": "2027-02-01", "endDate": "2027-03-03" }`. Rent and deposit snapshots come from MySQL. The end date is exclusive; total equals monthly rent prorated by rental days using a 30-day month, plus the deposit. Clients cannot supply prices or statuses.

Pending bookings can be approved or rejected only by their property's owner. Renter and owner participants can cancel pending, approved, or confirmed bookings before their rental starts. Admin booking access is read-only. Each creation or status transition records a booking event in the same transaction. Property locks serialize decisions and prevent concurrent overlapping approvals.

Frontend services: `src/services/properties.ts`, `bookings.ts`, `favorites.ts`; shared types are in `src/types/rentals.ts`. Functional rental pages use real data, loading skeletons, error states, and empty states. Design System fixtures remain. Existing messaging, payment/earnings, notifications, user administration, analytics, activity logs, and settings demonstrations are outside this integration and retain their previous mock content.

Verification: run `npm test` in `backend`, and `npx tsc --noEmit` plus `npm run build` at the repository root. Rental integration tests create unique temporary accounts and records and clean them up; an existing migrated MySQL database is required.
