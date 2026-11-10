# Player Recommender

A work-in-progress NBA app for searching players and browsing player and team statistics. Django provides the JSON API, while a React frontend displays the data. Future plans include player recommendations for team needs and player archetypes.

## Architecture

- `Frontend/`: React, TypeScript, Vite, and Tailwind CSS.
- `Backend/`: Django application, API views, models, and migrations.
- `db.sqlite3`: local development database. Local mode remains SQLite.
- `requirements.txt`: shared runtime and Azure deployment dependencies.

The API is currently implemented with Django JSON views. Its existing routes remain under `/api/v1/`; deployment configuration does not replace them or convert them to a different API implementation.

## Local setup

Prerequisites: Python 3.12, Node.js, and npm.

From the repository root:

```powershell
python -m pip install -r requirements.txt
python manage.py migrate
python import_players.py
```

Install frontend packages from `Frontend/`:

```powershell
cd Frontend
npm install
```

Run Django from the repository root:

```powershell
python manage.py runserver
```

Run Vite in another terminal from `Frontend/`:

```powershell
npm run dev
```

Open the URL printed by Vite, usually `http://localhost:5173`. Use **HTTP**, not HTTPS, for both local servers: `http://127.0.0.1:8000` for Django and `http://localhost:5173` for Vite. The Vite `/api` proxy still targets Django at `http://127.0.0.1:8000`. Locally, `DJANGO_DEBUG` defaults to true and HTTPS redirects are disabled; on Azure App Service, production security defaults apply and `DJANGO_DEBUG` must remain false.

## Checks

From the repository root:

```powershell
python manage.py test Trialapp
```

From `Frontend/`:

```powershell
npm run lint
npm run build
```

## Azure deployment preparation

This repository contains configuration for the intended Azure services, but this preparation does not create resources, connect a GitHub deployment, upload data, or deploy the app.

### Frontend: Azure Static Web Apps Free

- App location: `Frontend`
- API location: leave empty
- Output location: `dist`
- The generated `Frontend/public/staticwebapp.config.json` configures SPA navigation fallback and basic response headers. Azure Static Web Apps provides HTTPS for its managed hostname.
- The frontend reads `VITE_API_BASE_URL` at build time. Leave it empty for local Vite proxy use; in the Static Web Apps build configuration set it to the backend origin, for example `https://<app-name>.azurewebsites.net` (no trailing slash). It is a public URL, not a secret.
- Set the value only after the backend hostname is known. The frontend calls the existing `/api/v1/...` endpoints at that origin.

### Backend: Azure App Service F1

Use the Linux Python runtime supported by the selected App Service region and plan, and install dependencies from the repository-root `requirements.txt`. The root `Procfile` starts Gunicorn with one worker and four threads to limit memory use. Configure the following App Service environment variables; never commit their values:

| Setting | Value |
| --- | --- |
| `DJANGO_SECRET_KEY` | A newly generated, private production key; do not reuse the former checked-in development key |
| `DJANGO_DEBUG` | `false` |
| `DJANGO_ALLOWED_HOSTS` | The exact App Service hostname, such as `<app-name>.azurewebsites.net` |
| `DATABASE_ENGINE` | `mssql` |
| `AZURE_SQL_DATABASE` | Azure SQL database name |
| `AZURE_SQL_SERVER` | Azure SQL server FQDN, such as `<server>.database.windows.net` |
| `AZURE_SQL_USER` | SQL login name |
| `AZURE_SQL_PASSWORD` | SQL login password |
| `AZURE_SQL_PORT` | `1433` |
| `AZURE_SQL_ODBC_DRIVER` | `ODBC Driver 18 for SQL Server` |
| `FRONTEND_ORIGIN` | Exact HTTPS Static Web Apps origin, with no path or trailing slash |

App Service supplies `WEBSITE_SITE_NAME` and `WEBSITE_HOSTNAME`; settings select SQL Server in App Service by default and fail at startup if required production credentials or the frontend origin are missing. Local runs continue to select SQLite unless `DATABASE_ENGINE` is explicitly changed. SQL connections use encryption and certificate validation, and connection pooling is disabled so idle connections do not unnecessarily inhibit serverless database auto-pause.

The `requirements.txt` targets Django 5.2 LTS with Microsoft's `mssql-django` backend. The existing migrations use standard Django fields including `JSONField`; do not change models just for the database switch. Backend-version support and Azure's installed ODBC Driver 18 must be verified against the actual App Service runtime before deployment. `JSONField` is used as stored team-stat data rather than in database-side JSON queries. SQL Server collation may change case sensitivity for the current `icontains` and `iexact` lookups; verify search behavior against the target database. API unit tests on SQLite are not a substitute for testing Django migrations and queries on Azure SQL.

The API uses a small amount of query-scoped data and does not load the CSV dataset into application memory at startup. The single Gunicorn worker configuration is conservative for F1, but actual memory/CPU fit and concurrent-user capacity cannot be confirmed without an approved deployment and load test. Free plans have resource, availability, and scaling limits; confirm their current regional details before selecting the plan.

### Production database: Azure SQL Database Free Offer

Before creating any resource, confirm that the Azure SQL Database Free Offer is currently available to this subscription and region and that the portal explicitly shows the requested allowance: **100,000 vCore-seconds/month, 32 GB database storage, and 32 GB backup storage**. Select the **General Purpose serverless Azure SQL Database Free Offer**. Select **“Auto-pause database until next month when the free limit is reached”** and never select **“Continue using database for additional charges.”** Do not substitute SQL Managed Instance or another paid SQL Database tier.

These settings do not guarantee a $0 Azure bill. The offer and service limits can depend on subscription, region, and current Microsoft terms; usage outside the free offer and related billable services may still incur charges. Pay-As-You-Go does not provide a hard $0 spending cap. Do not upgrade the expired trial, add paid integrations, or provision resources until you have reviewed the portal's pricing and billing estimate and approved the action.

## Safe SQLite-to-Azure SQL data migration

No export or upload is performed automatically. `cloud_data` exports only the `Trialapp` app's basketball data, so Django authentication users, passwords, sessions, and other apps are excluded. It preserves primary keys and foreign-key values in a Django fixture, writes a separate SQLite backup, and records per-model counts. It refuses to overwrite an existing export.

1. Keep the original `db.sqlite3` unchanged. With local SQLite selected, run from the repository root:

   ```powershell
   python manage.py cloud_data export --output-dir cloud-migration
   ```

   The command creates `cloud-migration/sqlite-backup.sqlite3`, `basketball-data.json`, and `manifest.json`. Do not upload these files to a public location.

2. After you approve Azure database creation and set the App Service settings, run the schema migrations against the target database:

   ```powershell
   python manage.py migrate --database default
   ```

3. Only after separately approving the data transfer, load the fixture and validate every model's row count and foreign-key references:

   ```powershell
   python manage.py loaddata cloud-migration/basketball-data.json --database default
   python manage.py cloud_data verify --manifest cloud-migration/manifest.json --database default
   ```

`loaddata` is not a merge operation; load into an empty, migrated target database. If validation reports a mismatch, stop and investigate rather than rerunning the import. The local database and backup remain untouched.

## Git and deployment sequence

Use `main` for stable production, `develop` for integration/testing, and `feature/*` for new development. This deployment preparation is on the existing local `work` branch. Before any production release, review the changes, run the checks above, confirm Azure pricing/eligibility and the database stop-at-limit setting, and approve each resource creation, data transfer, push/merge, and deployment separately. No automatic deployment workflow is included.
