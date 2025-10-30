# Lightweight HRIS

A lightweight HR platform with employee directory, org chart, imports/exports, and role-based access control. Built with Next.js (App Router) and Prisma (Postgres).

## Screenshots / GIFs
# Screenshots for HR/Admin Users
Notice the edit/delete buttons, and options to add, import, and export employee information here:
<img width="1908" height="780" alt="image" src="https://github.com/user-attachments/assets/d1c3f81c-1787-4ba6-a7fb-e21dc72ea02b" />

Notice the export button as an option in the org-chart here:
<img width="1908" height="794" alt="image" src="https://github.com/user-attachments/assets/90ab85c2-996a-462c-afe8-60bd9d62747e" />

The change log is only an option to view for HR/Admin users:
<img width="1892" height="832" alt="image" src="https://github.com/user-attachments/assets/14165858-41e3-4e32-805f-d7ad67dace64" />

Notice a regular employee can only edit their direct reports' information (Joe Johnson here), and don't have options to add/import/export employees:
<img width="1904" height="786" alt="image" src="https://github.com/user-attachments/assets/6e722799-0bf7-4e3e-8f7a-a6eb4a5e3957" />

Notice there is no export option in the org-chart:
<img width="1905" height="720" alt="image" src="https://github.com/user-attachments/assets/e6faa6f8-bf82-43b9-8a5a-c50e998672e2" />

There is no option to view the change log for a regular employee

## Tech Stack
- Node: Requires >= 20.9.x for Next 16 (use nvm to install Node 20+)
- Framework: Next.js 16 (App Router) — `web/package.json`
- UI: React 19
- DB: Postgres (Neon recommended), Prisma 5
- Data export: `xlsx` for Excel, native CSV generation, `pdf-lib` for PDFs
- Styling: Tailwind CSS 4 (via `@tailwindcss/postcss`)

## Architecture Overview
- `web/` — Next.js app (frontend + API routes)
  - `web/app` — App Router pages, components, and API route handlers
    - `web/app/api/**` — server route handlers (employees CRUD, import/export, auth)
  - `web/prisma/` — Prisma schema and migrations
  - `web/scripts/seed.js` — database seeding script
- Root — project workspace (monorepo-ready). The active app is under `web/`.

## Features
- Employee Directory
  - Search/filter/sort (Title, Department, Manager, Hire Date range, Status)
  - Single add/edit/delete
  - Bulk import CSV/Excel with validation and error reporting
- Exports
  - CSV (client-side)
  - Excel (.xlsx) via `GET /api/employees/export?format=xlsx` (server-side `xlsx`)
  - PDF via `GET /api/employees/export?format=pdf` (server-side `pdf-lib`)
    - Compact column set optimized to fit a page; multi-page handling
- Org Chart
  - Manager → reports visualization with expand/collapse and details
  - Export controls gated by role
- RBAC
  - Admin: Full access, manage users/data/settings
  - HR: Full employee data operations; import/export
  - Employee/Viewer: Read-only; Employees can edit their direct reports
  - (Implicit Manager via the “Employee with direct reports” rule)
- Auth
  - Email/password with HTTP-only cookie session
  - New Employees automatically get accounts (password initially set to their email, securely hashed)

## Prerequisites
- Node >= 20.9.x (Next 16 requires modern Node)
- npm (or pnpm/yarn if you prefer; npm is used here)
- Postgres database (Neon recommended)

## Environment Variables
Create `web/.env` with at least:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | Postgres connection string used by Prisma | `postgresql://USER:PASSWORD@HOST:PORT/DB?schema=public` |
| `AUTH_SECRET` | HMAC secret used to sign session cookies | `a-strong-random-secret` |

Notes:
- Prisma reads `DATABASE_URL` from `web/.env` (`web/prisma/schema.prisma`).
- Auth uses `AUTH_SECRET` in `web/lib/auth.ts`.

## Setup & Local Development
```bash
# 1) Install dependencies
cd web
npm install

# 2) Configure database in web/.env
# DATABASE_URL=...
# AUTH_SECRET=...

# 3) Generate Prisma client and run migrations
echo "// ensure Node >= 20" 
npm run prisma:generate
npm run prisma:migrate -- --name init

# 4) Seed sample data (optional)
npm run db:seed

# 5) Start the dev server
npm run dev
# open http://localhost:3000
```

## Common NPM Scripts (web/package.json)
- `npm run dev` — Start Next.js dev server
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run lint` — Run ESLint
- `npm run prisma:generate` — Generate Prisma Client
- `npm run prisma:migrate` — Run `prisma migrate dev`
- `npm run prisma:deploy` — Run `prisma migrate deploy` (use in prod)
- `npm run db:seed` — Seed database (`web/scripts/seed.js`)

## Database
- Schema: `web/prisma/schema.prisma`
  - Models: `Employee`, `ChangeLog`, `User`, `Role` (enum: `admin`, `hr`, `employee`)
  - Relationships: `Employee.user` (optional 1:1), `Employee.manager`/`reports` self-relation
- Migrations: `web/prisma/migrations/**`
- Prisma Commands:
  - Generate: `npm run prisma:generate`
  - Dev migrate: `npm run prisma:migrate -- --name <name>`
  - Deploy migrate (prod): `npm run prisma:deploy`
  - Prisma Studio: `npx prisma studio` (from `web/`)
- Neon: use its connection string as `DATABASE_URL`.

## Import / Export
- Import (`POST /api/employees/import`) — `web/app/api/employees/import/route.ts`
  - Accepts CSV/XLSX upload (first sheet)
  - Required headers (case-insensitive): `name`, `title`, `department`, `contact_email`, `hire_date`, `salary`, `status`
  - Optional headers: `manager_id`, `contact_phone`
  - Validates manager foreign keys and basic data types
  - Creates `Employee` rows; logs change; auto-creates `User` login (role `employee`, password initially `contact_email`, hashed)
  - Returns summary with per-row errors (truncated list)
- Export (`GET /api/employees/export`)
  - Query: `?format=xlsx|pdf` (default xlsx); optional `ids` (comma-separated) to export only filtered rows
  - Excel: server-side `xlsx` workbook, `Employees` sheet
  - PDF: server-side `pdf-lib` with compact columns [Name, Title, Department, Manager, Status]; pagination and truncation logic
  - CSV is built client-side for the Employee Directory with the same columns as Excel

## API Endpoints
All endpoints live under `web/app/api/**` and require authentication unless noted. RBAC is enforced per-route.

- Auth
  - `POST /api/auth/signup` — Create user (Admin/HR can also create), stores `User` with role. Uses scrypt-based hashing. Public (but typically used by admins).
  - `POST /api/auth/login` — Log in by email/password, sets session cookie
  - `POST /api/auth/logout` — Clear session cookie
  - `GET /api/auth/me` — Returns current user (id, role, employeeId, email, name)

- Employees
  - `GET /api/employees` — List employees; returns DB model (camelCase fields). Auth required.
  - `POST /api/employees` — Create employee (Admin/HR). Also creates a `User` account for the employee (role `employee`, password = email, hashed). Writes to `ChangeLog`.
  - `GET /api/employees/[id]` — Get one by id. Auth required.
  - `PUT /api/employees/[id]` — Update (Admin/HR), or Employee can edit only their direct reports. Includes cycle prevention and validation. Writes to `ChangeLog`.
  - `DELETE /api/employees/[id]` — Delete (Admin/HR). Writes to `ChangeLog`.
  - `POST /api/employees/import` — Bulk import CSV/XLSX (Admin/HR). Per-row validation; auto-account creation for employees; change logging.
  - `GET /api/employees/export?format=xlsx|pdf[&ids=...]` — Export filtered/all employees (Admin/HR). Server-side XLSX/PDF; client CSV in UI.

## RBAC & Security
- Roles
  - Admin: Full access, manage users/data/settings; can import/export; view Change Log
  - HR: Full employee data operations; can import/export; view Change Log
  - Employee/Viewer: Read-only; Employees can edit only their direct reports
- Enforcement
  - Middleware (`web/middleware.ts`) requires login for all pages and APIs except `/login`, `/signup`, `/api/auth/*`, and static assets
  - Route handlers check `getSession()` (from `web/lib/auth.ts`) and role-specific rules
  - UI gating: Add/Import/Export buttons shown only to Admin/HR; Change Log link hidden unless Admin/HR
- Sessions
  - Signed (HMAC) cookie with 7-day expiration (`web/lib/auth.ts`), no JWT dependency

## Testing & Linting
- Lint: `npm run lint` (ESLint 9, Next config)
- Tests: TODO (no test suite currently present)

## Deployment
- Build: `npm run build`
- Start: `npm run start`
- Environment
  - Ensure `DATABASE_URL` and `AUTH_SECRET` are set in the runtime environment
  - Run `npm run prisma:deploy` on first boot to apply migrations
- Platform: Node runtime (ensure Node >= 20.9.x)

## Troubleshooting
- “next: not found” — Install deps and ensure Node >= 20 (in WSL use nvm); run `npm install` in `web/`
- Prisma errors (P1012, relation issues) — Ensure schema and migrations applied (`npm run prisma:migrate`), then `npm run prisma:generate`
- Auth header flicker — Addressed by server-hydrated header (`HeaderServer`) and client refresh on login
- PDF truncation/overlap — PDF uses fixed column widths and ellipsis truncation; wide fields are shortened automatically
- Import errors — Endpoint responds with per-row errors; verify required headers and data types

## License
- TODO: Add license if applicable

## Key File Links
- Employees API: `web/app/api/employees/route.ts`
- Import API: `web/app/api/employees/import/route.ts`
- Export API: `web/app/api/employees/export/route.ts`
- Auth APIs: `web/app/api/auth/*/route.ts`
- Prisma schema: `web/prisma/schema.prisma`
- Seed script: `web/scripts/seed.js`
