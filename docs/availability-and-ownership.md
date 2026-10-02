# RentNest dates, reservations and ownership audit

Audit date: 2026-10-02. Read-only inspection of rentnest_import; no existing records were merged, reassigned or removed.

## Rules

- Store and exchange dates as YYYY-MM-DD. Move-in is inclusive; checkout is exclusive. No timezone conversion of DATE values.
- Add whole months from the original move-in anniversary, clamping to the final day of the target month. January 31 + 1 month can check out February 28/29; + 2 months checks out March 31.
- Approved and confirmed, undeleted bookings reserve [start, checkout). Pending requests have no temporary hold; rejected, cancelled, expired and deleted bookings do not reserve dates.
- is_available is an explicit listing withdrawal flag. Current occupancy does not alter it. available_from is the earliest allowed move-in date.
- Rent is monthly rent multiplied by duration; the deposit is separate. Supported duration is 1-120 whole months.

## Root causes

- Independent end-date input allowed non-anniversary choices; October 10 to November 30 is not a valid whole-month interval.
- DATE columns serialized through mysql2 JavaScript Date objects shifted dates by the connection timezone. SQL DATE_FORMAT now returns date-only strings.
- Legacy landing/details and owner/admin management screens used demo arrays and hardcoded names instead of property IDs and database owners.
- Approval started a MySQL consistent-read snapshot before waiting for the property lock. A nonlocking overlap read could miss a concurrently approved reservation; overlap checks now use current locking reads.
- Duplicate prevention previously rejected every additional request for the same property, even for a different future period. It now rejects the same renter/property/period.

## Ownership and duplicate evidence

Current listing owner always comes from properties.owner_id -> users.id. Conversation membership remains immutable when ownership changes; a new conversation is created for the current owner.

Missing owner relationships: 0. Conversation owner/current listing-owner mismatches: 0. No exact duplicate active titles were found.

Similar base titles can be seed/demo variants. Similar titles or stock images cannot establish a shared physical property; this schema lacks a unique physical-address identifier. The following groups need manual review, not automatic merging:

| Base title | Property IDs and owners | Location/type/size evidence |
|---|---|---|
| Gulshan apartment | 26: Rezaul Chowdhury (user 94); 56: Anisul Haque (user 100) | 26: Gulshan, Dhaka, apartment, 400.00 sqft; 56: Gulshan, Dhaka, apartment, 925.00 sqft |
| Banani flat | 27: Shamima Begum (user 95); 57: Salma Rahman (user 101) | 27: Banani, Dhaka, flat, 575.00 sqft; 57: Banani, Dhaka, flat, 1100.00 sqft |
| Dhanmondi studio | 28: Kamal Uddin (user 96); 58: Rezaul Chowdhury (user 94) | 28: Dhanmondi, Dhaka, studio, 750.00 sqft; 58: Dhanmondi, Dhaka, studio, 1275.00 sqft |
| Uttara room | 29: Nadia Karim (user 97); 59: Shamima Begum (user 95) | 29: Uttara, Dhaka, room, 925.00 sqft; 59: Uttara, Dhaka, room, 1450.00 sqft |
| Bashundhara office | 30: Masud Rana (user 98); 60: Kamal Uddin (user 96) | 30: Bashundhara, Dhaka, office, 1100.00 sqft; 60: Bashundhara, Dhaka, office, 1625.00 sqft |
| Mirpur parking | 31: Fahmida Akter (user 99); 61: Nadia Karim (user 97) | 31: Mirpur, Dhaka, parking, 150.00 sqft; 61: Mirpur, Dhaka, parking, 150.00 sqft |

Repeated primary stock photos:

- https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?auto=format&fit=crop&w=1000&q=80 - property IDs 29,33,37,41,45,49,53,57,61.
- https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1000&q=80 - property IDs 28,32,36,40,44,48,52,56,60.
- https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80 - property IDs 26,30,34,38,42,46,50,54,58.
- https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1000&q=80 - property IDs 27,31,35,39,43,47,51,55,59.

No ownership changes are inferred from these similarities. Existing bookings and private messages remain intact.

## Implementation files

- Shared date arithmetic: `shared/rental-dates.js`, `shared/rental-dates.d.ts`.
- Backend reservation/price rules: `backend/src/services/availability.service.js`, `backend/src/services/rental.service.js`.
- Database-backed availability, owners, bookings and management: `backend/src/routes/property.routes.js`, `backend/src/routes/rental.routes.js`, `backend/src/routes/owner-properties.routes.js`, `backend/src/app.js`.
- Availability and booking UI: `src/properties/AvailabilityCalendar.tsx`, `src/properties/availability.css`, `src/properties/BookingForm.tsx`, `src/properties/PropertyDetails.tsx`.
- Consistent real listing owners: `src/properties/ListingCollection.tsx`, `src/properties/PropertyCard.tsx`, `src/properties/FavoritesContext.tsx`, `src/services/properties.ts`.
- Existing flows and navigation: `src/App.tsx`, `src/lib/api.ts`, `src/services/rentals.ts`, `src/rentals/Bookings.tsx`, `src/rentals/Messages.tsx`, `src/rentals/useWorkspaceNavigation.ts`.
- Regression coverage: `backend/tests/availability.test.js`.

## Verification

- All 29 backend tests pass, including database-backed two-owner/two-renter checks, entire-period overlaps, containing/partial/adjacent periods, pending versus reserved statuses, cancellation, duplicate requests, concurrent approvals and confirmations, earliest availability, and changed availability after quotation.
- Ownership tests cover discovery, details, favorites, bookings and owner management; editing another owner's property and submitting owner_id are rejected. A test-only ownership change creates a separate current-owner conversation without exposing previous private messages.
- TypeScript checking and the production build pass. Vite reports existing configuration warnings about __dirname and JSON import attributes; neither prevents the build.
- Browser checks use temporary real database records: occupied property remains browsable, a future two-month request reaches only its correct owner, and approval updates next availability to January 2, 2027.
- Browser leap-year review: January 31, 2028 + 1 month checks out February 29; + 2 months checks out March 31. Quotes show 12,000/24,000 BDT rent and a separate 5,000 BDT deposit.
- A reservation inserted after review causes a 409 with the conflicting February 15-March 15 interval, clears the stale quote, and refreshes calendar availability and next move-in.
- Calendar loading, failure and Retry recovery were checked in the browser. Desktop and 390px mobile calendars/forms were inspected; no horizontal overflow occurred.
- Browser navigation verifies direct property links, favorites, booking-to-property navigation, correct names for two different owners, and repeated chat actions reusing the same property-specific conversation. Guest login returns to the selected property and requires explicit booking confirmation.
- Temporary test users, properties and related records are removed after verification. Existing property ownership, bookings and private messages are preserved.

Unresolved: whether the similar seed listings represent the same physical premises requires reliable address/unit evidence or owner confirmation. No automated ownership correction or merge is justified by the stored information.
