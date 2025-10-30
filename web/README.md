# Next.js App (web)

A Next.js 16 (App Router) application providing an HRIS: Employee Directory with search/filter, bulk CSV/Excel import, CSV/Excel/PDF export, Org Chart, Change Log, and RBAC.

## Quick Start

```bash
cd web
npm install

# Create web/.env with:
# DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public
# AUTH_SECRET=a-strong-random-secret

npm run prisma:generate
npm run prisma:migrate -- --name init
npm run db:seed   # optional
npm run dev       # http://localhost:3000
```

Env vars used by this app:
- `DATABASE_URL` — Postgres connection string for Prisma
- `AUTH_SECRET` — HMAC secret used to sign the session cookie

## Scripts

| Script | What it does |
|---|---|
| `dev` | Start Next.js dev server |
| `build` | Production build |
| `start` | Start production server |
| `lint` | Run ESLint |
| `prisma:generate` | Generate Prisma Client |
| `prisma:migrate` | `prisma migrate dev` (create/apply migration) |
| `prisma:deploy` | `prisma migrate deploy` (apply in prod) |
| `db:seed` | Run `scripts/seed.js` |

Defined in `web/package.json`.

## Routes

### UI Pages
- `/` — Home
- `/employees` — Employee Directory (search/filter/sort; add/edit/delete; import/export)
- `/org-chart` — Org chart (manager → reports)
- `/change-log` — Change log (Admin/HR only)
- `/login`, `/signup` — Auth

### API Routes
- Auth
  - `GET /api/auth/me` — Current user (id, role, employeeId, email, name)
  - `POST /api/auth/login` — Login (sets HTTP-only session cookie)
  - `POST /api/auth/logout` — Logout (clears cookie)
  - `POST /api/auth/signup` — Create user
- Employees
  - `GET /api/employees` — List employees
  - `POST /api/employees` — Create employee (Admin/HR). Also creates a `User` account for the employee (role `employee`, initial password = email, hashed).
  - `GET /api/employees/[id]` — Read one
  - `PUT /api/employees/[id]` — Update (Admin/HR) or Employee can edit only direct reports; cycle prevention on manager chain
  - `DELETE /api/employees/[id]` — Delete (Admin/HR)
  - `POST /api/employees/import` — Bulk import CSV/XLSX (Admin/HR). Validates; per-row errors; auto-creates login accounts.
  - `GET /api/employees/export?format=xlsx|pdf[&ids=...]` — Export (Admin/HR). `ids` narrows to filtered set.

See `app/api/**/route.ts` for implementations.

## Features

- Employees table:
  - Search, filters (Title, Department, Manager, Hire Date popover, Status), sorting
  - Inline Edit/Delete; modal forms for Create/Edit; delete confirm
- Bulk import CSV/Excel (`/api/employees/import`):
  - Required columns: `name,title,department,contact_email,hire_date,salary,status`
  - Optional: `manager_id,contact_phone`
  - Errors reported per row; successful inserts create `User` accounts (initial password = email, hashed)
- Export CSV/Excel/PDF:
  - CSV built client-side (from current filtered/sorted view)
  - Excel via `xlsx` and PDF via `pdf-lib` on the server (`/api/employees/export`)
  - PDF columns: Name, Title, Department, Manager, Status; truncation + pagination
- Org chart:
  - Forest from `managerId` links; expand/collapse; details (email, hire date, status)
- Change log:
  - Create/Update/Delete write to `ChangeLog` with before/after snapshots

## RBAC usage in the UI
- Admin/HR: See Add/Import/Export on `/employees`, Export on `/org-chart`, and the Change Log link.
- Employee/Viewer: Read-only in general; Employees can edit only their direct reports (button gated in UI).
- The API also enforces all rules; UI gating is for UX.

## Prisma Integration
- Prisma client: `lib/prisma.ts`
- Schema: `prisma/schema.prisma`; migrations in `prisma/migrations/**`
- Server pages (e.g., `/employees`, `/org-chart`) read employees via Prisma and map to UI types.
- CRUD/Import/Export implemented in `app/api/employees/**`.

Run Prisma Studio for debugging:
```bash
cd web
npx prisma studio
```

## Dev Notes
- Sessions are HMAC-signed cookies (`lib/auth.ts`) — no external JWT dependency.
- Global auth enforcement: `middleware.ts` redirects to `/login` unless authenticated (auth routes and static excluded).
- Server pages use Prisma directly (avoids cookie-forwarding issues in server `fetch`).

## Troubleshooting
- “next: not found”: ensure Node >= 20.9 and run `npm install` in `web/`.
- Prisma P10xx errors: check `web/.env` → `DATABASE_URL`, then `npm run prisma:generate` and `npm run prisma:migrate -- --name <name>`.
- Quick DB reset: use Prisma Studio to delete rows or write a tiny reset script; re-seed via `npm run db:seed`.
