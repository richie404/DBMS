# Public navigation and availability cleanup

## Changes
- `src/App.tsx`: removed public About component, desktop/mobile navigation entry and footer entry, including story, mission, team profiles and their exclusive remote image references. How It Works remains.
- `src/index.css`: removed exclusive About, story, mission and team styles.
- `src/auth/navigation.ts`: removed About from supported return destinations.
- `src/rentals/useWorkspaceNavigation.ts`: redirects old About query, pathname and hash destinations to public Home, including when a pending property return exists; malformed hashes remain safe.
- `src/properties/PropertyDetails.tsx`: replaced full details calendar with compact availability summary; both Check availability and Request Booking open the same existing modal. Real description, owner card, favorites and message actions remain.
- `src/properties/AvailabilitySummary.tsx`: added API-backed compact summary with loading, error/retry and refresh behavior, occupied-today and future availability information.
- `src/properties/BookingForm.tsx`: guests inspect the existing calendar and estimated rent/deposit summary; login is required to proceed. Authenticated requests continue through backend quote and confirmed submission. Non-renter accounts can inspect but cannot submit.
- `src/properties/availability.css`: compact summary styles using existing design tokens.

## Availability contract preserved
Both summary and modal use the public GET /api/properties/:id/availability endpoint for the actual property. Authenticated review uses POST /api/bookings/quote and submission uses POST /api/bookings. Existing backend approval/confirmation validation remains intact. No availability API, migration or booking validation was removed.

Approved and confirmed reservations block overlapping periods; pending requests do not reserve dates. Start date is inclusive, checkout is exclusive; adjacent rentals are allowed. Whole-month durations use the original move-in anniversary with month-end clamping. Calendar retains reserved/selectable/proposed distinctions, future navigation, duration selection, calculated checkout, rent and separate deposit. Current occupancy does not prohibit a future free period. Backend checks the whole interval again when quoting, submitting and approving/confirming.

## Verification
- TypeScript no-emit check: passed.
- Production build: passed; existing Vite native-config compatibility warnings remain.
- 30 active backend API tests: passed, see PUBLIC_CLEANUP_TEST_OUTPUT.txt.
- 12 real-browser checks: passed, zero page errors, see PUBLIC_CLEANUP_BROWSER_VERIFICATION.json. Includes desktop/mobile navigation, four About URL forms, real owner and description, absence of details calendar, one shared guest modal, reserved overlap, future navigation, month-end checkout, login return, backend overlap rejection, real future booking with separate deposit, refresh persistence and logout.
- Mobile tested at 390px and desktop at 1440px. No horizontal overflow. Screenshots: public-cleanup-modal-mobile.png and public-cleanup-home-mobile.png.
- Git whitespace check: passed.
- Temporary browser-test property, bookings, events and notifications were cleaned up; existing demo data was retained.

## Limits
The two existing legacy suites rentals.test.js and workspace.test.js were excluded from the active API run because they target older unmounted routes/contracts and have 15 previously identified failures. This report does not claim the complete default legacy suite passes. No manual testing on physical mobile devices was performed. Remote property images depend on the external host; existing image fallback remains.
