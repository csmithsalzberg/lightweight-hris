import React from 'react';
import { Employee } from '@/types/employee';
import EmployeesTable from './EmployeesTable';

// Server Component fetch
async function getEmployees() {
  const res = await fetch('http://localhost:3000/api/employees', {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch employees');
  }

  const data = await res.json();
  // Map API camelCase (DB) -> front-end Employee type
  const mapped: Employee[] = (data.employees ?? []).map((e: any) => ({
    id: e.id,
    name: e.name,
    title: e.title,
    department: e.department,
    manager_id: e.managerId ?? null,
    contact_email: e.contactEmail,
    contact_phone: e.contactPhone ?? undefined,
    hire_date: typeof e.hireDate === 'string' ? e.hireDate.slice(0, 10) : e.hireDate,
    salary: e.salary,
    status: e.status,
  }));
  return mapped;
}

export default async function EmployeesPage() {
  const employees = await getEmployees();

  return (
    <main className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Employee Directory</h1>
        <p className="text-sm text-gray-600">Search, filter, and export employees.</p>
      </header>
      <EmployeesTable employees={employees} />
    </main>
  );
}
