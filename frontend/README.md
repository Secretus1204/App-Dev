# Library Management System — Web Admin

React 19, TypeScript, Vite, Tailwind CSS, React Router, and TanStack Query implementation of the Library Management System admin panel.

## Implemented scope

- Real Laravel Sanctum login and logout
- Admin-only protected routes and session restoration
- Forced replacement of the seeded temporary Admin password
- Catalog search, category/availability filters, sorting, and pagination
- Category create, edit, archive, and restore
- Book create, edit, cover upload, archive, and restore
- Physical copy listing, create, edit, archive, and restore
- Account search/filter/details, member approval, status management, and secure Member/Admin creation
- Live Pending and Approved Borrow Request queues with details, approval, rejection, and pagination
- Atomic copy assignment and loan creation during approval
- Live current, overdue, returned, and all-transaction circulation screens
- Atomic return recording with good/damaged inventory outcomes
- Live dashboard aggregates, operational charts, and recent activity
- Live borrowing reports with date filters and CSV export
- Live notification center and header unread state
- Shared typed API client with validation and authentication error handling

## Local setup

Create the local configuration if needed:

```powershell
Copy-Item .env.example .env
```

Install and run with npm. Use `npm.cmd` in PowerShell if the Windows script execution policy blocks `npm.ps1`:

```powershell
npm.cmd install
npm.cmd run dev
```

The web app opens at `http://localhost:5173`. Laravel must also be running at `http://127.0.0.1:8000`.

```env
VITE_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

## Architecture

```text
Page / component
  → TanStack Query hook
    → domain service
      → shared authenticated API client
        → Laravel /api/v1
```

```text
src/
├── api/          # Shared client and bearer-token storage
├── components/   # Reusable UI, auth, and navigation components
├── contexts/     # Authentication lifecycle
├── guards/       # Admin route protection
├── hooks/        # Server-state queries and mutations
├── layouts/      # Admin shell and route map
├── pages/        # Route-level admin and authentication screens
├── services/     # Auth, catalog, accounts, circulation, notification, and report APIs
└── types/        # API envelope and domain contracts
```

## Validation

```powershell
npm.cmd run typecheck
npm.cmd run build
```

The production build currently reports a non-blocking large-chunk warning because the prototype screens and Recharts ship in the main bundle. Route-level code splitting is scheduled as a later optimization.
