# Player Recommender

A work-in-progress NBA app for searching players and browsing player and team statistics.

## Architecture

- `Frontend/`: React, TypeScript, Vite, and Tailwind CSS.
- `api/`: Node.js 22+ and Express API; connects to Azure SQL Database.
- `Backend/data/`: source CSV files used by the one-time database import.

The frontend API contract remains under `/api/v1/`:

- `GET /players/?search=&page=`
- `GET /players/:playerId/`
- `GET /players/:playerId/stats/?type=per_game|shooting|totals&season=`
- `GET /teams/?search=`
- `GET /teams/:abbreviation/?season=&stats=per_game|summary|per_100`

The Express API creates and reads the SQL schema in `api/sql/schema.sql`. It does not read CSV files at request time.

## Start locally

Prerequisites: Node.js 22+, npm, and an Azure SQL database that is empty and reachable from your machine.

1. Install the API dependencies and create a local environment file:

   ```powershell
   cd api
   npm install
   Copy-Item .env.example .env
   ```

2. Set `AZURE_SQL_SERVER`, `AZURE_SQL_DATABASE`, `AZURE_SQL_USER`, and `AZURE_SQL_PASSWORD` in `api/.env`. Keep this file private and never commit credentials.

3. From `api/`, create the tables and import the CSV datasets:

   ```powershell
   npm run validate-data
   npm run import-data
   ```

   `npm run validate-data` checks the required CSVs in `Backend/data/` without connecting to or changing a database. `npm run import-data` creates the schema if it is missing and imports into an empty database in a transaction. It refuses to import when any target table already contains rows; it does not truncate or overwrite existing data.

4. Start the API from `api/`:

   ```powershell
   npm run dev
   ```

5. In another terminal, install and start the frontend:

   ```powershell
   cd Frontend
   npm install
   npm run dev
   ```

Vite proxies `/api` requests to `http://127.0.0.1:3000`. The API health check is `http://127.0.0.1:3000/health`.

## Configuration

`api/.env.example` lists the API settings. Azure SQL connections use encryption by default and do not trust unverified server certificates. `FRONTEND_ORIGINS` is a comma-separated CORS allowlist; the local Vite origin is allowed by default. In production, set it to the exact HTTPS frontend origin. Database credentials must stay on the API server and must never be exposed as `VITE_` frontend variables.

Do not create paid Azure resources, change subscription billing, upload data, or deploy until you have reviewed the Azure pricing estimate and explicitly approved those steps. Azure Free Offer availability and limits can vary by subscription and region; do not assume a $0 spending cap.

## Checks

From `api/`:

```powershell
npm test
```

From `Frontend/`:

```powershell
npm run lint
npm run build
```

No Azure resources are created and no CSV data is uploaded automatically. Run `npm run import-data` only after verifying the configured database is the intended empty target.
