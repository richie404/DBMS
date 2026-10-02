# RentNest development demo database

From the repository root (or from `backend`):

```sh
npm run seed
npm run seed:verify
```

On Windows PowerShell with restricted script execution, use `npm.cmd` instead of `npm`.
The scripts load `backend/.env`. Configure NODE_ENV=development (or test) and the existing local MySQL connection. Apply pending migrations with `npm --prefix backend run migrate` before seeding. Seeding never runs migrations or changes their history.

## Demo accounts

| Role | Email | Password |
| --- | --- | --- |
| Renter | renter1@rentnest.test | 12345678 |
| Renter | renter2@rentnest.test | 12345678 |
| Owner | owner1@rentnest.test | 12345678 |
| Owner | owner2@rentnest.test | 12345678 |
| Admin | admin1@rentnest.test | 12345678 |
| Admin | admin2@rentnest.test | 12345678 |

All 25 accounts use the same demo password. Usernames are `demo_renter1` through `demo_renter15`, `demo_owner1` through `demo_owner8`, and `demo_admin1`/`demo_admin2`. Accounts are active. The schema has no email-verification flag. Passwords are stored using `src/utils/password.js`, the exact Argon2id utility used by registration/login; no plaintext passwords are stored in the database.

## Safety and repeatability

This is an additive local development tool. Production NODE_ENV, remote database hosts, and production-named databases are rejected before connecting. Do not point development configuration at a production database forwarded onto localhost.

The seeder uses a MySQL advisory lock and one transaction, retains foreign key checks, and rolls back on any error. Stable demo identities and row lookup keys prevent duplicate records on repeat runs. Existing settings, amenity names, and existing data are preserved. A conflicting demo account, inactive account, changed role, or changed password causes refusal rather than overwriting it. Demo records edited or deleted through the UI may no longer reproduce the original fixture; there is deliberately no reset command or destructive behavior.

Images use HTTPS Unsplash demo URLs with 2–4 images per property. Loading images requires internet access; the seeder downloads nothing. Property dates are relative to the database date on first insertion. Booking totals use the application's 30-day rental-month prorating rule plus deposit; accepted bookings do not overlap. Fictional completed payment charges are attached only to confirmed bookings. No payment service is invoked.

## Verified results

The seed was run twice with identical fixture counts. Real HTTP login, authenticated `/api/auth/me`, and CSRF-protected logout passed for renter1, owner1, and admin1. The production guard refused seeding. All 30 existing backend tests passed. `SEED_VERIFICATION.json` records live totals, role/status counts, consistency checks, foreign key checks, and login results; run `seed:verify` to refresh it after changes.

| Table | Rows |
| --- | ---: |
| users | 25 (15 renters, 8 owners, 2 admins) |
| properties | 36 |
| property_images | 108 |
| amenities | 12 |
| property_amenities | 144 |
| favorites | 56 |
| bookings | 45 (9 each: pending, approved, confirmed, rejected, cancelled) |
| booking_events | 90 |
| conversations | 18 |
| messages | 72 |
| notifications | 153 |
| payments | 9 |
| activity_logs | 81 |
| platform_settings | 1 |
| user_preferences | 25 |

All requested feature tables contain demo records. Password-reset tokens are intentionally not seeded because they are security credentials created by real reset requests. Sessions are created by real logins, not fixtures; verification sessions are revoked by logout. Booking status `completed` and notification category `payment` do not exist in this schema, so payment notices use the supported `booking` category.

Properties include 29 approved (26 available), 4 pending, 2 rejected, and 1 draft. Favorites vary from zero to eight per renter. Message histories and notifications include both read and unread records.

## Frontend integration limitation

The database-backed property, favorites, booking, renter dashboard, and owner listing/request flows can consume this data. Existing messaging, notifications, and several admin panels still use frontend demo state rather than database endpoints. Seeding their tables does not connect those screens to MySQL. Wiring those APIs is separate application work; this seeder does not change frontend behavior.
