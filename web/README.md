## Lightweight HRIS (web)

A lightweight HRIS built with Next.js (App Router) and Prisma/Postgres.

### Implemented features
- Employee Directory (`/employees`): list with client-side search/filter and export/import.
  - Filters: query, Title, Department, Manager, Hire Date range, Status.
  - Export: CSV, Excel (.xlsx), PDF (server-generated).
  - Import: CSV/XLSX upload to bulk-create employees; reports per-row errors.
- API: DB-backed CRUD for employees and utilities.
  - `GET /api/employees` → list employees
  - `POST /api/employees` → create employee
  - `GET /api/employees/[id]` → get one
  - `PUT /api/employees/[id]` → update
  - `DELETE /api/employees/[id]` → delete
  - `POST /api/employees/import` → CSV/XLSX bulk import (validates, returns summary)
  - `GET /api/employees/export?format=xlsx|pdf` → server-side exports
- Org Chart (`/org-chart`): expandable/collapsible nodes with per-employee details.
  - Excludes employees with status `terminated`.
  - Toggle to expand/collapse a manager's reports; toggle to show/hide details (email, hire date, status).
- Change Log (`/change-log`): simple ordered list of recent changes.
  - Logs create/update/delete with before/after snapshots and actor when available.

#### Managing employees in the UI
- Add: Click "Add Employee" on `/employees`, fill the form, Save.
- Edit: Click "Edit" on a row, update fields, Save.
- Delete: Click "Delete" on a row and confirm.

### Quick start

1) Install deps
```
npm install
```

2) Configure database (Neon/Postgres) in `web/.env`:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"
```

3) Generate Prisma client and run migrations
```
npm run prisma:generate
npm run prisma:migrate -- --name init
```

4) Seed sample data
```
npm run db:seed
```

5) Run the app
```
npm run dev
```

Open `/employees` and `/api/employees` to verify data.

---

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Database (Prisma + Postgres)

1. Create a Postgres database (e.g., Neon). Copy its connection string.
2. Create a `.env` file in `web/` with:

```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"
```

3. Generate Prisma client and run migrations:

```
npm run prisma:generate
npm run prisma:migrate -- --name init
```

4. Start the app and hit `/api/employees` to verify DB connectivity.

### Seed sample data

After migrations, you can populate sample employees:

```
npm run db:seed
```

Then open `/api/employees` or the Employees page to see data.

## Exports & Imports

- Exports
  - CSV generated on the client.
  - XLSX and PDF generated server-side: `/api/employees/export?format=xlsx|pdf`.
  - Dependencies: `xlsx`, `pdf-lib`.
- Imports
  - Upload CSV/XLSX via the Import button on `/employees`.
  - Required headers: `name,title,department,contact_email,hire_date,salary,status`.
  - Optional: `manager_id,contact_phone`.
  - Server returns `{ inserted, failed, total, errors[] }` and the UI shows a summary with the first few error details.

## Audit logging (ChangeLog)

- Create/Update/Delete operations write to `ChangeLog` with `before`/`after` payloads.
- ChangeLog is decoupled from `Employee` via FK removal; run a migration after schema updates:
```
npx prisma migrate dev -n decouple-changelog
```
- View logs at `/change-log`.

## Timezones & dates

- The API stores `hireDate` as a `DateTime`. Passing a bare `YYYY-MM-DD` string through `new Date(...)` is treated as UTC and can shift by local timezone. Import uses the provided date string and the server stores it directly; display is rendered as `YYYY-MM-DD` in the UI.
