## Lightweight HRIS (web)

A lightweight HRIS built with Next.js (App Router) and Prisma/Postgres.

### Implemented features
- Employee Directory (`/employees`): list with client-side search/filter and CSV export.
- API: DB-backed CRUD for employees.
  - `GET /api/employees` → list employees
  - `POST /api/employees` → create employee
  - `GET /api/employees/[id]` → get one
  - `PUT /api/employees/[id]` → update
  - `DELETE /api/employees/[id]` → delete
- Org Chart stub (`/org-chart`): page scaffold for future visualization.

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
