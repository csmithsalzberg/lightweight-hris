import React from 'react';
import { Employee } from '@/types/employee';
import EmployeesTable from './EmployeesTable';
import { prisma } from '@/lib/prisma';

// Server Component: read directly from DB to avoid cookie forwarding issues
async function getEmployees() {
  const rows = await prisma.employee.findMany();
  const mapped: Employee[] = rows.map((e) => ({
    id: e.id,
    name: e.name,
    title: e.title,
    department: e.department,
    manager_id: e.managerId ?? null,
    contact_email: e.contactEmail,
    contact_phone: e.contactPhone ?? undefined,
    hire_date: e.hireDate.toISOString().slice(0, 10),
    salary: e.salary,
    status: e.status as any,
  }));
  return mapped;
}

export default async function EmployeesPage() {
  const employees = await getEmployees();

  return (
    <main className="p-6 space-y-4">
      <header className="flex items-center justify-between border-b pb-3">
        <h1 className="text-3xl font-semibold tracking-tight">Employee Directory</h1>
      </header>
      <EmployeesTable employees={employees} />
    </main>
  );
}
