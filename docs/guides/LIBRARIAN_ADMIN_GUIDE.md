# Librarian / Admin Guide

## Daily startup

1. Start MySQL and the Laravel API. For production, confirm the managed API runtime, queue worker, and scheduler are healthy.
2. Sign in through the Admin web application using an approved Admin account. Do not share accounts or passwords.
3. Check Dashboard for pending requests, overdue loans, and notifications.

## Manage the catalog

1. Create/maintain categories, then add book metadata.
2. Add a physical copy for every library item that can be borrowed; each copy needs its own accession number/barcode.
3. Archive rather than delete historical records. Do not mark a borrowed copy as available manually.

## Approve a request and issue a loan

1. Open **Borrow Requests** and select a pending request.
2. Confirm the member and book, select an available physical copy, and set a due date.
3. Approve once. The system marks that copy borrowed, creates a loan, records an audit event, and notifies the member.
4. If a request cannot be supplied, reject it with a clear reason instead of leaving it pending indefinitely.

## Return a book

1. Open the current loan and confirm the returned physical copy.
2. Record the return condition and relevant notes.
3. Submit once. A good-condition copy becomes available; a damaged copy remains unavailable until managed appropriately.

## Accounts, reports, and reminders

- Public registration is for Members only. The first Admin is seeded securely; an existing Admin may create an additional Admin when authorized.
- Deactivating a Member ends their access. Do not deactivate the final active Admin.
- Use Reports with a date range, then export CSV only for authorized library operations. Open exported CSV files carefully; the system escapes formula-like values.
- The scheduled `library:sync-loans` command marks overdue loans and sends reminders. It is repeat-safe; investigate logs/notifications if it does not run.

## Staging and production safety

Use the [Phase 8 UAT and staging runbook](../release/PHASE_8_UAT_AND_STAGING.md) before releases. Never run demo seeders or use demonstration credentials in production.
