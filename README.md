# EWRAP — UNICROSS Calabar

EWRAP is a server-rendered E-Waste Recycling Awareness Platform built with Node.js, Express, EJS, Bootstrap, and MySQL. It supports public education and center discovery, registered-user reporting and recycling history, and administrator content and report management.

## Run with Docker

1. Copy `.env.example` to `.env` and replace `SESSION_SECRET` with a unique random value.
2. Run `docker compose up --build` from the project directory.
3. Open [http://localhost:3000](http://localhost:3000).

MySQL loads `sql/schema.sql`, `sql/seed.sql`, and `sql/create-app-user.sql` when the database volume is first created. The Compose database has no DB password by request and binds its host port to `127.0.0.1` only (3309 by default), so local Node.js commands can connect without exposing MySQL to the network. The app container uses a dedicated account limited to the EWRAP database. Use this setup for local development only. Uploaded report images are held in a separate volume outside `public/`, with access controlled by the app. Set `SESSION_SECURE=1` when serving over HTTPS.

If you ran an earlier EWRAP Compose version with a persistent `db_data` volume, the database retains its old account configuration and does not rerun initialization scripts. Back up anything you need, then reset that local volume with `docker compose down -v` before starting this passwordless setup.

For local development, install Node.js 20.11 or newer and copy `.env.example` to `.env`. Start the Compose database with `docker compose up -d db`; `npm run dev` detects it, connects through the loopback-only database port, and serves the development app on port 3101. Without Compose, install MySQL, create an `ewrap` database and a passwordless `ewrap_app` account, set `DB_HOST=127.0.0.1` and `DB_PORT` to that MySQL port, then run `npm install` and `npm run dev`. Run `npm run seed` to seed the running Compose database when Compose is active, or the configured local database otherwise. It safely skips when the demo administrator already exists. `npm run db:seed` connects directly to the configured local database; `npm run db:setup` creates the schema and seeds a new database. `npm start` starts the production server. `npm run check` checks app and database health after startup.

## Environment settings

`DB_HOST`, `DB_PORT`, `DB_NAME`, and `DB_USER` configure MySQL. No database password variable is used. `SESSION_SECRET`, `SESSION_SECURE`, and `SESSION_MAX_AGE_HOURS` configure Express sessions. `UPLOADS_DIR` and `MAX_PHOTO_UPLOAD_MB` configure private report photos. `APP_TIMEZONE` defaults to `Africa/Lagos`.

## Seeded accounts

All seeded demo users, across Administrator, RegisteredUser, and PublicUser roles, use password **`password123`**. This shared password is for local testing only.

| Role | Email |
| --- | --- |
| Administrator | `admin@ewrap.local` |
| Registered user | `ada@ewrap.local` |
| Registered user | `james@ewrap.local` |
| Public user | `visitor@ewrap.local` |

Public registration always creates a `RegisteredUser`. An existing administrator can provision additional administrators from the dashboard. To generate a bcrypt hash for direct provisioning, run `node scripts/hash-password.js "your-long-password"`.

## Features

- Public Awareness and Policy libraries, plus a searchable Calabar center directory and Leaflet/OpenStreetMap map with optional nearest-center highlighting.
- Registered user accounts, campus reports with optional private photos, personal report and recycling history, editing/deletion of owned records, and optional 1–5 ratings and feedback.
- Administrator report review, center and article CRUD, administrator account provisioning, and live report and participation analytics.
- Public `/api/centers` and administrator-only `/api/analytics` JSON endpoints.
- Bootstrap 5 via CDN with custom, flat EWRAP styles and `ewrap-` design tokens. The optional UI CLI setup was not used; the app has no frontend build step.

## Design provenance

The uploaded source material ends at Section 3.7 and supplies no database design, ERD, field-level schema, or pseudocode. The schema and workflows in this project are designed from scratch to implement the objectives and modules in Sections 1.3, 2.1.1, and 2.2. Section 3.5.1 describes commuter and terminal transactions for a transport company; because that conflicts with the e-waste platform, it was treated as a copy-paste artifact and disregarded.

The Calabar collection-center names and coordinates in the seed file are illustrative. Confirm exact locations, contact details, opening hours, and certification status with operators before relying on the listings.
