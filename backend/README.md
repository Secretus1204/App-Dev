# Library Management System API

Laravel 12 REST API for the Library Management System. The API is versioned under `/api/v1` and follows the project module path:

```text
Route → Form Request → Controller → Service → Repository → Model → API Resource
```

## Local requirements

- PHP 8.2 or newer
- Composer
- MySQL/MariaDB on `127.0.0.1:3306`
- The database named `library_management`

XAMPP Apache and `htdocs` are not required. Start only XAMPP MySQL and run Laravel's development server.

## Setup

```powershell
Copy-Item .env.example .env
composer install
php artisan key:generate
php artisan migrate --seed
php artisan serve
```

The API is then available at `http://127.0.0.1:8000/api/v1`.

## First Admin

Set these private values in `.env` before seeding:

```env
LIBRARY_FIRST_ADMIN_NAME="Library Administrator"
LIBRARY_FIRST_ADMIN_EMAIL=admin@example.com
LIBRARY_FIRST_ADMIN_PASSWORD=replace-this-temporary-password
```

`FirstAdminSeeder` hashes the password, creates the Admin idempotently, activates the account, and sets `must_change_password=true`. Existing Admin passwords are not reset when the seeder is run again.

Run the seed independently with:

```powershell
php artisan db:seed --class=FirstAdminSeeder
```

## Implemented API modules

| Method | Endpoint | Access |
|---|---|---|
| `GET` | `/api/v1/health` | Public |
| `POST` | `/api/v1/auth/register` | Public User registration |
| `POST` | `/api/v1/auth/login` | Public |
| `GET` | `/api/v1/auth/me` | Authenticated active account |
| `PUT` | `/api/v1/auth/password` | Authenticated active account |
| `POST` | `/api/v1/auth/logout` | Authenticated active account |
| `GET` | `/api/v1/admin/health` | Active Admin only |
| `GET` | `/api/v1/categories` | Active Admin/User |
| `POST` | `/api/v1/categories` | Admin |
| `PATCH` | `/api/v1/categories/{category}` | Admin |
| `PATCH` | `/api/v1/categories/{category}/archive` | Admin |
| `GET` | `/api/v1/books` | Active Admin/User |
| `GET` | `/api/v1/books/{book}` | Active Admin/User |
| `POST` | `/api/v1/books` | Admin |
| `PUT/PATCH` | `/api/v1/books/{book}` | Admin |
| `PATCH` | `/api/v1/books/{book}/archive` | Admin |
| `POST` | `/api/v1/books/{book}/cover` | Admin |
| `GET/POST` | `/api/v1/books/{book}/copies` | Admin |
| `PATCH` | `/api/v1/book-copies/{copy}` | Admin |
| `PATCH` | `/api/v1/book-copies/{copy}/archive` | Admin |
| `GET/POST` | `/api/v1/admin/users` | Admin |
| `GET/PATCH` | `/api/v1/admin/users/{user}` | Admin |
| `PATCH` | `/api/v1/admin/users/{user}/status` | Admin; cannot target own account |
| `GET/POST` | `/api/v1/borrow-requests` | Active User; own requests only |
| `GET` | `/api/v1/borrow-requests/{request}` | Owning User |
| `PATCH` | `/api/v1/borrow-requests/{request}/cancel` | Owning User; pending only |
| `GET` | `/api/v1/admin/borrow-requests` | Admin |
| `GET` | `/api/v1/admin/borrow-requests/{request}` | Admin |
| `PATCH` | `/api/v1/admin/borrow-requests/{request}/approve` | Admin; pending and available only |
| `PATCH` | `/api/v1/admin/borrow-requests/{request}/reject` | Admin; rejection reason required |
| `GET` | `/api/v1/loans` | Active User; own loan history only |
| `GET` | `/api/v1/admin/loans` | Admin; filter all loans |
| `POST` | `/api/v1/admin/loans/{loan}/return` | Admin; atomic return |
| `GET` | `/api/v1/notifications` | Authenticated owner |
| `POST` | `/api/v1/notifications/{notification}/read` | Authenticated owner |
| `POST` | `/api/v1/notifications/read-all` | Authenticated owner |
| `GET` | `/api/v1/admin/dashboard` | Admin |
| `GET` | `/api/v1/admin/reports/borrowings` | Admin |
| `GET` | `/api/v1/admin/reports/borrowings/export` | Admin; CSV |

Protected requests use a Sanctum bearer token:

```http
Authorization: Bearer YOUR_TOKEN
Accept: application/json
```

The live API contract is in `../docs/api/openapi.yaml`.

## Validation

```powershell
php artisan test
vendor\bin\pint --test
php artisan route:list --path=api/v1
php artisan migrate:status
```

Tests use an isolated in-memory SQLite database and do not change the local MySQL development data.

## Current milestone

Original blueprint Phase 4 and its Phase 5 Admin web consumers are implemented for local/development acceptance. Borrow approval locks and assigns a physical copy, creates one loan, updates inventory, and notifies the Member atomically. Returns, damaged-copy handling, due-soon/overdue synchronization, dashboards, reports, CSV export, and owner-scoped notifications are also live.

Run `php artisan library:sync-loans` manually when needed. In long-running environments, `php artisan schedule:work` executes the configured hourly overdue synchronization. See [`../LIBRARY_MANAGEMENT_SYSTEM_BLUEPRINT.md`](../LIBRARY_MANAGEMENT_SYSTEM_BLUEPRINT.md).
