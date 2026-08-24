# Staging Prerequisites Before Phase 9

Phase 9 cannot begin until the following Phase 8 activities are complete. These steps use a separate staging environment; they must not reuse the local XAMPP database or production credentials.

## 1. Prepare configuration without committing secrets

1. Copy `backend/.env.staging.example` to the staging server as `backend/.env` and replace every placeholder with a staging-only value from the deployment secret store.
2. Generate a new application key on that server with `php artisan key:generate`.
3. Copy `frontend/.env.staging.example` to the Admin web build environment as `.env.production` (or the host’s equivalent) and set the actual HTTPS API URL.
4. Copy `mobile/.env.staging.example` to the short-path mobile build copy as `.env` before generating the staging APK. The URL is public build configuration, but it must be HTTPS and must not contain a token or password.
5. Set `APP_DEBUG=false`, `APP_ENV=staging`, restrictive `CORS_ALLOWED_ORIGINS`, and a daily/warning-or-higher log configuration. Never copy a local `.env` to staging.

## 2. Deploy the staging services

Use a staging host/domain chosen by the project owner. The API host must provide PHP 8.2+, MySQL/MariaDB, HTTPS, persistent storage, and a process manager or scheduler. Before testing, confirm:

- `php artisan migrate --force` completed against the staging database only.
- `php artisan storage:link` was run if the chosen storage disk needs it.
- The queue worker is running when `QUEUE_CONNECTION=database`.
- `php artisan schedule:work` is active for the rehearsal, or the host triggers `php artisan schedule:run` every minute.
- The backend health URL, Admin web URL, and mobile API URL use the same staging API origin.

## 3. Create a backup before UAT

From a Windows machine with MySQL client tools, run a non-destructive backup of the *staging* database. The script prompts for the password and never stores it:

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Backup-MySqlDatabase.ps1 `
  -Database library_management_staging `
  -OutputDirectory 'C:\Users\jttra\LibraryManagementBackups' `
  -Host 'your-staging-db-host' `
  -Username 'your-staging-db-user'
```

Record the generated file path and SHA-256 output. Restore only to a newly created disposable database, then complete the backup/restore section in [PHASE_8_UAT_AND_STAGING.md](PHASE_8_UAT_AND_STAGING.md). Do not overwrite the active database during the rehearsal.

## 4. Physical Android validation

1. In the original repository, synchronize the short build copy with `mobile/scripts/Sync-AndroidBuildCopy.ps1 -PrepareAndroid`.
2. In the short copy, replace `mobile/.env` with the staging mobile values.
3. Open the short-copy `mobile/android` folder in Android Studio, build/install the debug or signed staging build, and test with a device on a network that can reach the staging HTTPS API.
4. Complete UAT-11 in the [Phase 8 runbook](PHASE_8_UAT_AND_STAGING.md).

## 5. Required human approvals

Complete every UAT row, resolve critical/high findings, and obtain the three sign-offs in the runbook. The project owner must then provide the intended Phase 9 deployment target, domain/API URL, and authorized deployment access. Do not proceed to production based on a local pass alone.
