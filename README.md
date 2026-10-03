# RentNest

RentNest is a rental property application with renter, owner, and administrator accounts. It uses React 19, Vite 8, and Tailwind CSS 4 for the frontend, Express for the backend, and MySQL/MariaDB for storage.

## Requirements

- Node.js 22.12 or newer with npm (the project toolchain uses Node 22).
- XAMPP with MySQL/MariaDB and phpMyAdmin.
- A terminal such as Windows PowerShell.

XAMPP supplies the database and phpMyAdmin. The frontend and backend run through Node.js; you do not need to move this project into `htdocs`.

## 1. Install dependencies

Open PowerShell in the project root:

```powershell
cd F:\DBMS\DBMS-Shafi
npm.cmd install
npm.cmd --prefix backend install
```

Replace the path if you saved the project elsewhere. These instructions use `npm.cmd` to avoid PowerShell script execution-policy errors. On other shells, use `npm`.

## 2. Import the database into XAMPP

1. Open the XAMPP Control Panel and start **MySQL** and **Apache**.
2. Visit `http://localhost/phpmyadmin`.
3. Select **Import** and choose [backend/database/rentnest_mysql.sql](backend/database/rentnest_mysql.sql).
4. Click **Go** and wait for the import to finish.

The file creates and selects `rentnest_import`. It contains 17 application tables, the `schema_migrations` tracking table, all 18 migrations, default amenities, and the initial platform settings.

Import this file once for a fresh installation. It does not delete existing tables and is not a repeatable upgrade script. If the database already contains these tables, do not import it again; use the migration command below for pending schema updates.

The SQL file does not include users or sample properties. Step 4 adds optional demo data.

## 3. Configure environment files

From the project root, create the files only if they do not already exist:

```powershell
if (!(Test-Path .env)) { Copy-Item .env.example .env }
if (!(Test-Path backend/.env)) { Copy-Item backend/.env.example backend/.env }
```

Set the root `.env` to:

```dotenv
VITE_API_BASE_URL=http://localhost:5000/api
```

Set `backend/.env` to match your local database:

```dotenv
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:8443
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=rentnest_import
SESSION_DURATION_HOURS=24
SESSION_COOKIE_NAME=rentnest_session
PASSWORD_RESET_TOKEN_TTL_MINUTES=60
CSRF_SECRET=replace-with-your-generated-secret
```

An empty `DB_PASSWORD` is suitable only if your local XAMPP root account has no password. Otherwise, enter its actual password. Change `DB_PORT` if your database uses another port.

Generate a secret with this command, then copy its output into `CSRF_SECRET`:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

The backend requires a secret of at least 32 characters. Keep credentials in `backend/.env`; frontend `VITE_` variables are exposed to the browser.

Use `localhost` consistently for the frontend and API URLs. `FRONTEND_URL` must exactly match the browser's frontend origin, including the port and without a trailing slash. Restart the relevant server after changing its environment file.

## 4. Add demo data (optional)

### Option A: paste or import SQL in XAMPP

For the fresh database created by `rentnest_mysql.sql`, use [backend/database/rentnest_sample_data.sql](backend/database/rentnest_sample_data.sql):

1. Open `http://localhost/phpmyadmin` and select **rentnest_import**.
2. Select **SQL**, paste the entire sample-data file, and click **Go**. Alternatively, select **Import** and upload the file.
3. Refresh the application at `http://localhost:8443` and sign in with an account below.

Import this sample file **once**, before creating your own accounts or records. It uses fixed record IDs and expects the original amenities from the schema import. If you already have application data or have run the seeder, use Option B instead of pasting this file. Do not run both options for the same fresh setup.

The sample SQL includes:

| Data | Records |
| --- | ---: |
| Accounts / user preferences | 25 / 25 |
| Properties / property images | 36 / 108 |
| Property amenity links / favorites | 144 / 56 |
| Bookings / booking status events | 45 / 90 |
| Conversations / messages | 18 / 72 |
| Notifications | 153 |
| Fictional payment records | 9 |
| Activity logs | 81 |

The 12 amenities and platform settings are already included in `rentnest_mysql.sql`. Login sessions and password-reset tokens are created by actual login and recovery actions, so they are not prefilled. Sample dates are fixed at file generation; the command-line seeder calculates dates when records are first created. No actual payments are processed.

### Option B: add demo data from the terminal

After importing the database and configuring `backend/.env`, run from the project root:

```powershell
npm.cmd run seed
npm.cmd run seed:verify
```

The seeder adds sample accounts, properties, bookings, messages, and other demonstration records. It requires a local database and `NODE_ENV=development` or `test`. Existing records are preserved; conflicting or modified demo accounts can cause seeding to stop.

| Role | Email | Password |
| --- | --- | --- |
| Renter | renter1@rentnest.test | 12345678 |
| Owner | owner1@rentnest.test | 12345678 |
| Admin | admin1@rentnest.test | 12345678 |

These accounts exist after importing the sample SQL **or** running the seeder. All 25 demo accounts use password **`12345678`**, stored as Argon2id hashes:

| Role | Available emails | Usernames |
| --- | --- | --- |
| Renter (15 accounts) | `renter1@rentnest.test` through `renter15@rentnest.test` | `demo_renter1` through `demo_renter15` |
| Owner (8 accounts) | `owner1@rentnest.test` through `owner8@rentnest.test` | `demo_owner1` through `demo_owner8` |
| Admin (2 accounts) | `admin1@rentnest.test`, `admin2@rentnest.test` | `demo_admin1`, `demo_admin2` |

Use the email and password on the login page. Demo passwords are for local development. See [the demo data guide](backend/database/DEMO_ACCOUNTS.md) for additional details. Demo property images require an internet connection.

`seed:verify` checks database consistency and demo logins, then updates `backend/database/SEED_VERIFICATION.json`. It starts its own temporary API server, so the normal backend does not need to be running for this command.

## 5. Start the application

Keep XAMPP's MySQL service running. Open two terminals in the project root.

**Terminal 1: backend**

```powershell
npm.cmd run dev:api
```

Expected startup messages include `Database connection: OK` and `RentNest API running on http://localhost:5000`.

**Terminal 2: frontend**

```powershell
npm.cmd run dev
```

Open **http://localhost:8443**. The configured default is HTTP on port 8443. If a Figma Make preview server is already running, use that preview instead of starting a second frontend server.

| Service | Default address |
| --- | --- |
| Frontend | http://localhost:8443 |
| Backend API | http://localhost:5000/api |
| API health | http://localhost:5000/api/health |
| Database health (development only) | http://localhost:5000/api/health/database |
| phpMyAdmin | http://localhost/phpmyadmin |
| Database connection | 127.0.0.1:3306 / rentnest_import |

Press `Ctrl+C` in each terminal to stop its server. On later runs, start MySQL and the two application servers; dependency installation, database import, and seeding are not daily startup steps. Apache is needed for phpMyAdmin, while the application connects directly to MySQL.

## Maintenance, tests, and builds

Run these commands from the project root:

| Command | Purpose |
| --- | --- |
| `npm.cmd --prefix backend run migrate` | Apply pending database migrations |
| `npm.cmd --prefix backend test` | Run backend tests against the configured database |
| `npm.cmd run build` | Build the frontend into `dist/` |
| `npm.cmd run preview` | Preview the built frontend, default port 8443 |
| `npm.cmd --prefix backend start` | Run the backend without automatic reload |

The SQL import already records migrations 001 through 018, so the migration command should report no pending migrations immediately after import. Future migrations can be applied with that command.

Backend tests use a database and create test records. Use a separate local test database, initialized with the same schema, when testing. Point `backend/.env` at that database for the test run and restore your development configuration afterward.

Run `build` before `preview`, and stop the development frontend first if it occupies port 8443. The frontend build does not bundle or start the backend or database.

## Project structure

```text
DBMS-Shafi/
|-- README.md                     Setup and project guide
|-- package.json                  Frontend dependencies and root commands
|-- .env.example                  Frontend environment template
|-- .mise.toml                    Node and pnpm toolchain versions
|-- index.html                    Frontend HTML shell
|-- vite.config.ts                Vite plugins, alias, and server ports
|-- tsconfig.json                 TypeScript configuration
|-- .figma/make/                  Figma Make configuration and preview support
|-- src/
|   |-- main.tsx                  React entrypoint
|   |-- App.tsx                   Main application and screens
|   |-- index.css                 Global styling and Tailwind entrypoint
|   |-- auth/                     Authentication context and navigation
|   |-- components/               Shared UI components
|   |-- config/                   Frontend API configuration
|   |-- hooks/                    Shared React hooks
|   |-- lib/                      HTTP/API utilities
|   |-- properties/               Discovery, details, favorites, availability
|   |-- rentals/                  Booking, messaging, and dashboard UI
|   |-- services/                 Frontend calls to backend endpoints
|   `-- types/                    TypeScript data types
|-- shared/                       Rental date helpers shared by both layers
|-- backend/
|   |-- package.json              Backend dependencies and commands
|   |-- .env.example              Backend environment template
|   |-- RENTAL_API.md             Rental API documentation
|   |-- database/
|   |   |-- rentnest_mysql.sql    Standalone initial database import
|   |   |-- rentnest_sample_data.sql Sample records and demo login accounts
|   |   |-- migrations/           Ordered schema changes (001 through 018)
|   |   |-- migrate.js            Migration runner and history tracking
|   |   |-- seed.js               Local demo data creation
|   |   |-- verify-seed.js        Demo data and login verification
|   |   |-- DEMO_ACCOUNTS.md      Demo account reference
|   |   `-- SEED_VERIFICATION.json Generated verification report
|   |-- src/
|   |   |-- server.js             Database check and API server startup
|   |   |-- app.js                Express configuration and route mounting
|   |   |-- config/               Environment, database pool, session settings
|   |   |-- routes/               HTTP endpoint definitions
|   |   |-- controllers/          Request handlers
|   |   |-- services/             Business rules and workflows
|   |   |-- models/               Database query helpers
|   |   |-- middleware/           Authentication, role checks, CSRF, errors
|   |   |-- validators/           Input validation
|   |   `-- utils/                Password, token, and error utilities
|   `-- tests/                    Backend automated tests
`-- docs/                         Additional feature documentation
```

The browser sends requests through `src/services/` and `src/lib/api.ts` to the Express API. Backend routes use business logic and database queries to read and write MySQL. Database credentials stay on the backend.

## Database structure

| Tables | Purpose |
| --- | --- |
| `users`, `user_preferences` | Accounts, roles, and notification preferences |
| `sessions`, `password_reset_tokens` | Login sessions and password recovery |
| `properties`, `property_images` | Listings, ownership, moderation, and photos |
| `amenities`, `property_amenities` | Amenity catalog and listing associations |
| `favorites` | Saved properties for users |
| `bookings`, `booking_events` | Rental requests and their status history |
| `conversations`, `messages` | Property conversations and messages |
| `notifications` | User notifications |
| `payments` | Payment, payout, and refund records |
| `activity_logs` | Application activity history |
| `platform_settings` | Platform-wide configuration |
| `schema_migrations` | Applied migration filenames |

Foreign keys connect listings to owners, bookings to renters and properties, and messages to conversations. The schema uses InnoDB and `utf8mb4_unicode_ci`.

## Troubleshooting

| Problem | What to check |
| --- | --- |
| Database connection fails | Start XAMPP MySQL; verify database name, host, port, username, and password in `backend/.env`. |
| MySQL cannot start in XAMPP | Check the XAMPP log for a port conflict with another database service; use the intended service's port in `DB_PORT`. |
| Import reports that tables already exist | The initial schema is already present or an import was partial. Inspect it before retrying; use migrations for an existing installation. |
| `CSRF_SECRET` configuration error | Generate and set a secret of at least 32 characters in `backend/.env`. |
| Frontend reports missing API URL | Create the root `.env`, set `VITE_API_BASE_URL`, and restart Vite. |
| Login fails or browser reports CORS errors | Confirm API availability and that `FRONTEND_URL` matches the exact frontend origin. Use `localhost` consistently. |
| Demo login is rejected | Run the seeder and use an account listed above. SQL import alone creates no accounts. |
| Port 8443 or 5000 is occupied | Reuse an existing project server or select a free port. Update the matching environment URLs and restart servers. |
| Frontend port differs from this guide | `vite.config.ts` reads the terminal's `PORT` environment variable; otherwise it defaults to 8443. |
| Build fails on an older Node version | Check `node --version` and use Node 22.12 or newer. |

For additional details, see [rental API documentation](backend/RENTAL_API.md) and [availability and ownership rules](docs/availability-and-ownership.md).
