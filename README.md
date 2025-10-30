# Lightweight HRIS

Goals:
- Employee directory
- Org chart
- Editing & audit trail

## Project structure

- `web/`: Next.js app (App Router) with Prisma/Postgres backend.
  - Employees directory with filters, export (CSV/XLSX/PDF), and bulk import (CSV/XLSX).
  - Org chart with expand/collapse and details; excludes terminated employees.
  - Change log page listing recent create/update/delete entries.

## Getting started (dev)

1. cd into `web/` and install deps:
```
cd web
npm install
```
2. Configure Postgres in `web/.env`:
```
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"
```
3. Generate client and run migrations:
```
npm run prisma:generate
npm run prisma:migrate -- --name init
```
4. Seed sample data (optional):
```
npm run db:seed
```
5. Start the app:
```
npm run dev
```

Open `http://localhost:3000/employees`.

## Notable endpoints

- `GET /api/employees` — list employees
- `POST /api/employees` — create employee
- `GET /api/employees/[id]` — fetch employee
- `PUT /api/employees/[id]` — update employee
- `DELETE /api/employees/[id]` — delete employee
- `POST /api/employees/import` — bulk import CSV/XLSX
- `GET /api/employees/export?format=xlsx|pdf` — server-side exports

## Change log (auditing)

- All create/update/delete operations write to `ChangeLog` with before/after.
- ChangeLog is not FK-linked to Employee so logs persist after deletes — run migration after schema updates if needed:
```
npx prisma migrate dev -n decouple-changelog
```

## Date handling

- `hireDate` is stored as `DateTime`. Be aware that `new Date('YYYY-MM-DD')` is treated as UTC in JS and may appear shifted by local timezone on display. The UI renders dates as `YYYY-MM-DD` strings.
