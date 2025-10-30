import { Employee } from '@/types/employee';
import OrgChartClient from './OrgChartClient';

async function getEmployees() {
  const res = await fetch('http://localhost:3000/api/employees', { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch employees');
  const data = await res.json();
  const emps: Employee[] = (data.employees ?? []).map((e: any) => ({
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
  const active = emps.filter((e) => e.status !== 'terminated');
  return active;
}

export default async function OrgChartPage() {
  const employees = await getEmployees();
  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Organizational Chart</h1>
        <p className="text-sm text-gray-600">Auto-generated from reporting relationships.</p>
      </header>

      <div className="overflow-x-auto">
        <OrgChartClient employees={employees} />
      </div>
    </main>
  );
}


