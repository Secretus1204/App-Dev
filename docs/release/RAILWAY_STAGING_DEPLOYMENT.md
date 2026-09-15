# Railway staging deployment

This guide deploys a non-production RCJK Library environment from the `staging` branch. It uses Railway URLs with HTTPS, so purchasing a custom domain is **not** required for testing.

Do not use local XAMPP data, local `.env` files, production user data, or the temporary local Admin password in this environment.

## 1. Publish the current source branch

Run these commands from the repository root. Railway can only deploy commits that are already on GitHub.

```powershell
git push origin main
git push -u origin staging
```

In GitHub, confirm that the `staging` branch contains the intended commit before continuing.

## 2. Create the Railway project and database

1. Sign in at [Railway](https://railway.app/) and link the GitHub account that owns `Secretus1204/App-Dev`.
2. Select **New Project** > **Empty Project** and name it `rcjk-library-staging`.
3. Select **+ New** > **Database** > **MySQL**. Keep it private; the API service will use Railway's internal network to reach it.
4. Rename the database service to `MySQL`. The variable references below assume that service name.

## 3. Deploy the Laravel API

1. Select **+ New** > **Empty Service** and name it `api`.
2. In its **Settings**, connect `Secretus1204/App-Dev`, choose the `staging` branch, and set **Root Directory** to `/backend`.
3. Set the watch path to `/backend/**` so frontend-only commits do not redeploy the API.
4. Set the **Pre-Deploy Command** below. It is safe only for this fresh staging environment: it runs migrations, creates the controlled first Admin, and adds the repeat-safe 20-book demonstration catalog.

```sh
php artisan migrate --force && php artisan db:seed --force && php artisan db:seed --class=DemoCatalogSeeder --force
```

5. In **Variables** > **Raw Editor**, add these values. Generate `APP_KEY` locally with `php artisan key:generate --show` from `backend/`, then paste the output into Railway only. Use a new strong staging password for the first Admin; never commit it.

```dotenv
APP_NAME="RCJK Library"
APP_ENV=staging
APP_KEY=replace-with-a-new-generated-key
APP_DEBUG=false
APP_URL=https://temporary.invalid

LOG_CHANNEL=stderr
LOG_LEVEL=warning

DB_CONNECTION=mysql
DB_HOST=${{MySQL.MYSQLHOST}}
DB_PORT=${{MySQL.MYSQLPORT}}
DB_DATABASE=${{MySQL.MYSQLDATABASE}}
DB_USERNAME=${{MySQL.MYSQLUSER}}
DB_PASSWORD=${{MySQL.MYSQLPASSWORD}}

SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=sync
FILESYSTEM_DISK=local
MAIL_MAILER=log

CORS_ALLOWED_ORIGINS=https://temporary.invalid

LIBRARY_DEFAULT_LOAN_DAYS=14
LIBRARY_MAX_ACTIVE_LOANS=3
LIBRARY_DUE_SOON_DAYS=2
LIBRARY_REQUIRE_EMAIL_VERIFICATION=false
LIBRARY_REQUIRE_MEMBER_APPROVAL=false
LIBRARY_FIRST_ADMIN_NAME=RCJK Library Administrator
LIBRARY_FIRST_ADMIN_EMAIL=replace-with-a-staging-only-admin-email
LIBRARY_FIRST_ADMIN_PASSWORD=replace-with-a-strong-staging-password
```

6. Deploy the service. When it succeeds, open **Settings** > **Networking** > **Generate Domain**. Copy the generated URL, for example `https://api-xxxx.up.railway.app`.
7. Replace `APP_URL` with that API URL and redeploy. Confirm this URL returns HTTP 200:

```text
https://your-api-domain.up.railway.app/api/v1/health
```

## 4. Deploy the React Admin web application

The `frontend` project has a production `npm run start` command that serves the Vite build with an SPA fallback. This is needed because the Admin application uses browser routes such as `/books` and `/reports`.

1. Select **+ New** > **Empty Service** and name it `web`.
2. Connect the same repository and `staging` branch.
3. Set **Root Directory** to `/frontend` and its watch path to `/frontend/**`.
4. Set the build command to `npm ci && npm run build` and the start command to `npm run start`.
5. Add this variable, using the actual API domain from step 3:

```dotenv
VITE_API_BASE_URL=https://your-api-domain.up.railway.app/api/v1
```

6. Deploy, then generate a Railway domain for this service, for example `https://web-xxxx.up.railway.app`.
7. Return to the `api` service, set `CORS_ALLOWED_ORIGINS` to the exact web URL, and redeploy the API.

The browser app sends bearer tokens rather than cookies, so no `SANCTUM_STATEFUL_DOMAINS` or shared session-cookie domain is required.

## 5. Run the hourly loan scheduler

The scheduled due-soon/overdue process still needs a long-running service.

1. Create another service named `scheduler` from the same repository and `staging` branch.
2. Set **Root Directory** to `/backend`.
3. Set **Custom Start Command** to:

```sh
php artisan schedule:work
```

4. Copy the same non-public Laravel and database variables from the `api` service. It needs the same `APP_KEY` and MySQL references, but it does not need a generated public domain.

`QUEUE_CONNECTION=sync` is intentional for the current small deployment; no queue worker is needed while the app has no queued jobs. If queued jobs are introduced later, create a separate worker service using `php artisan queue:work` and switch the queue connection back to `database`.

## 6. Verify staging before changing the mobile application

1. Open the web Railway URL and sign in with the staging Admin account.
2. Test catalog, borrowing, return, reports/CSV, notifications, and responsive layout.
3. Create a staging member account and test the member flow.
4. Confirm the API health endpoint and web browser requests use HTTPS with no CORS errors.
5. Do not upload important cover files in this staging setup: `FILESYSTEM_DISK=local` is ephemeral on Railway. Use object storage before production.
6. Password-reset emails are not delivered while `MAIL_MAILER=log`; configure a real staging mail provider before accepting password-recovery testing.

## 7. Produce a mobile build that works without Wi-Fi development tools

The current `app-debug.apk` requires Metro, even if the API is deployed. After the web/API staging smoke test passes:

1. In the original repository, update `mobile/.env` with the public API URL:

```dotenv
EXPO_PUBLIC_API_URL=https://your-api-domain.up.railway.app/api/v1
```

2. Synchronize the short Android build copy:

```powershell
cd "C:\Users\jttra\Documents\Codex\2026-08-21\referenced-chatgpt-conversation-this-is-an\App-Dev\mobile"
powershell.exe -NoProfile -ExecutionPolicy Bypass -File .\scripts\Sync-AndroidBuildCopy.ps1 -PrepareAndroid
```

3. Open `C:\Users\jttra\LibraryApp\App-Dev\mobile\android` in Android Studio.
4. Select **Build** > **Generate Signed Bundle / APK** > **APK**. Create and store the signing keystore safely, outside Git.
5. Install the signed release APK and test it using mobile data or any Wi-Fi network. Metro is not required for this release build.

A release APK normally cannot replace a debug APK because they use different signing keys. Uninstall the debug build first if Android asks for a signature conflict.

## 8. Deploy changes after a fix

For backend or web changes:

```powershell
git add .
git commit -m "fix(scope): describe the correction"
git push origin staging
```

Railway automatically rebuilds the affected service from `staging`. A change to `VITE_API_BASE_URL` requires a web rebuild. A change to the mobile API URL or mobile code requires a new signed APK; installed APKs do not update themselves.

## 9. Later production deployment

Create a separate Railway production environment and a separate MySQL database. Deploy from `main`, use production-only secrets, do not run `DemoCatalogSeeder`, configure object storage/mail/backups, and repeat the smoke tests. A custom domain is optional: Railway's generated HTTPS domain works for a small demonstration, while a custom domain is useful only when the school wants a branded public address.
