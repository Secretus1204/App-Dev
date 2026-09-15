# Library Management System

A Library Management System built around a versioned REST API. Laravel 12 and MySQL provide the backend, React powers the Admin web application, and React Native/Expo powers the Library Member Android app.

The comprehensive implementation guide and single source of truth is in [LIBRARY_MANAGEMENT_SYSTEM_BLUEPRINT.md](LIBRARY_MANAGEMENT_SYSTEM_BLUEPRINT.md).

## Repository packages

- `backend/` — Laravel REST API, MySQL schema, Sanctum authentication, RBAC, and automated tests
- `frontend/` — React/TypeScript Admin web application
- `mobile/` — React Native Android Library Member application; see its README for Android Studio/device setup
- `docs/` — OpenAPI contract and database ERD

## Current status

- Complete in this milestone: original blueprint Phase 4 circulation API, Phase 5 Admin web MVP, and the Phase 6 Android source implementation
- Included: copy allocation, loans, returns, overdue synchronization, notifications, dashboards, reports, and CSV export
- The Phase 6 TypeScript build and 45 Laravel feature tests pass. Physical-device acceptance and the signed staging APK are performed through Android Studio because its native compiler runs under the Windows user account.
- Phase 7 hardening adds repeat-safe scheduling, protected CSV export, request-context audit records, API security headers, rate limiting, and automated GitHub quality checks
- Remaining blueprint work includes physical Android-device acceptance, staging UAT, production deployment, and handoff

## Quick start

Start XAMPP MySQL only. Apache and `htdocs` are not required.

```powershell
cd backend
composer install
php artisan migrate --seed
php artisan serve
```

In another terminal:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open `http://localhost:5173`.

## Phase 8 verification and UAT

Run all repeatable checks from the project root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Verify-Project.ps1
```

See [docs/release/PHASE_8_UAT_AND_STAGING.md](docs/release/PHASE_8_UAT_AND_STAGING.md) for staging smoke tests, backup/restore rehearsal rules, and the acceptance-signoff record. Native Android validation uses the short-path Android build copy described in `mobile/README.md`.

For a Railway-hosted staging deployment of this monorepo, follow [docs/release/RAILWAY_STAGING_DEPLOYMENT.md](docs/release/RAILWAY_STAGING_DEPLOYMENT.md).

Before Phase 9, follow [docs/release/STAGING_PREREQUISITES.md](docs/release/STAGING_PREREQUISITES.md) to create an isolated staging environment, protect its configuration, rehearse the backup/restore path, and validate the physical Android build.

Member and Librarian guides are in `docs/guides/`. For local/staging demonstration data only, run `php artisan db:seed --class=DemoCatalogSeeder` from `backend/`.

## Group members

1. Clark Villanueva
2. Jomarie Travilla
3. Kent Serencio
4. Ryle Jade Tabay

Course: CCE 106L — Applications Development and Emerging Technologies
