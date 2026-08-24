# Phase 8 — System Test, UAT, and Staging Runbook

This document turns the Phase 8 blueprint requirements into a repeatable test record. It does not replace real User Acceptance Testing: the product owner/instructor must complete and sign the acceptance record after testing the deployed staging system.

## 1. Scope and evidence

Run the automated local verification from the repository root:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Verify-Project.ps1
```

For a clean computer or CI-equivalent dependency check:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Verify-Project.ps1 -InstallDependencies
```

The standard verification covers Laravel formatting/tests, scheduler registration, Admin web type-check/production build, and mobile TypeScript checking. `-IncludeMobileBundle` also exports the Android JavaScript bundle. Native Android compilation remains a physical Android Studio validation because it uses the local SDK/NDK.

Record the command output, Git commit, tester, date, device/browser, and result with the UAT record below.

For local or staging UAT data only, seed the small repeat-safe demonstration catalog:

```powershell
php artisan db:seed --class=DemoCatalogSeeder
```

It adds 20 catalog titles and two available copies per title without creating demo user credentials. It is intentionally excluded from the default database seeder and must never be run in production.

## 2. Staging smoke test

Before UAT, deploy a non-production environment using non-sensitive test accounts and a separate staging database. Confirm:

1. `GET /api/v1/health` returns HTTP `200` over HTTPS.
2. An Admin can sign in to the web app and load Dashboard, Books, Requests, Loans, Reports, and Notifications.
3. A Library Member can sign in, browse/search the catalog, open a book, and view My Library.
4. API CORS permits only the deployed Admin web origin; browser/network responses do not expose framework stack traces or secrets.
5. The queue worker and `php artisan schedule:work` (or the platform scheduler) are running. `php artisan schedule:list` lists `library:sync-loans` hourly.
6. A test request can be created, approved with a selected copy and due date, and returned. Confirm the test copy becomes available again.
7. Reports export CSV using the selected date range, and notification/read state works for the signed-in account only.

Do not use a real member record, a production database, or a real public API key during staging tests.

## 3. Backup and restore rehearsal

An authorized database operator performs this rehearsal only on staging or a disposable test database.

1. Record the database name, backup timestamp, operator, storage location, checksum, and the number of tables/rows expected.
2. Create a database backup using the hosting provider’s approved tool or MySQL dump utility. Store it outside the web root with restricted access.
3. Restore it to a new, disposable database name; never overwrite the active staging or production database during a rehearsal.
4. Point an isolated Laravel `.env` at the restored database, run read-only smoke checks, and confirm books, copies, requests, loans, notifications, and audit logs have expected counts.
5. Confirm cover-file storage is included in the backup/recovery procedure or is restored from its configured object-storage version/backup.
6. Record recovery time, issues, and owner. Destroy only the disposable restored database after the reviewer accepts the result.

## 4. UAT acceptance record

Use a new row for each test. A failed test must include a defect link, severity, and retest result before sign-off.

| ID | Scenario | Expected result | Tester / environment | Pass / fail | Notes or defect |
|---|---|---|---|---|---|
| UAT-01 | Member registration and login | Registration creates only a `user` account; the member can log in and log out. |  |  |  |
| UAT-02 | Admin login and RBAC | Admin reaches the web dashboard; a member receives `403` from Admin API routes and cannot enter Admin screens. |  |  |  |
| UAT-03 | Catalog | Search, category filter, pagination, details, and displayed availability are accurate. |  |  |  |
| UAT-04 | Member request | Member submits one request for an available title; duplicate pending request is rejected safely. |  |  |  |
| UAT-05 | Admin approval | Admin selects an available physical copy and due date; one loan is created and the copy becomes borrowed. |  |  |  |
| UAT-06 | Rejection/cancellation | Member can cancel only a pending request; Admin rejection includes a visible reason/notification. |  |  |  |
| UAT-07 | Return and history | Admin return updates the loan, copy status, audit record, notification, and Member history exactly once. |  |  |  |
| UAT-08 | Due reminders | Use a staging test loan near/past due date, run `library:sync-loans` twice, and confirm no duplicate notification is created. |  |  |  |
| UAT-09 | Accounts and recovery | Profile name update is limited to allowed fields; password change/reset revokes existing tokens; inactive account access stops. |  |  |  |
| UAT-10 | Reports and privacy | Report date filter/CSV export work for an Admin only; cells beginning with `=`, `+`, `-`, or `@` are exported as text. |  |  |  |
| UAT-11 | Android member app | On a real Android device, member login, catalog, request, My Library, notifications, and profile work against staging. |  |  |  |
| UAT-12 | Accessibility/responsiveness | Admin web keyboard navigation, dialogs, labels, focus, contrast, and mobile-width layout are usable. |  |  |  |

## 5. Sign-off

| Role | Name | Date | Signature/approval reference |
|---|---|---|---|
| Product owner / instructor |  |  |  |
| Librarian / Admin representative |  |  |  |
| Technical tester |  |  |  |

Phase 8 is complete only when critical/high defects are closed, the staging rehearsal passes, and the appropriate reviewer signs this record.

## 6. Current automated evidence

On 2026-08-22, `Verify-Project.ps1 -IncludeMobileBundle` passed Laravel formatting, 45 Laravel tests (273 assertions), scheduler registration, the Admin web type-check/production build, mobile type-check, and Android JavaScript bundle export.

The Admin web build reports one non-blocking Vite size warning: the main JavaScript asset is about 780 KB before compression (about 220 KB gzip). Measure its real staging load time during UAT and add route/component code-splitting before release if it causes a material user delay.
