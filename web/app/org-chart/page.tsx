import { Employee } from '@/types/employee';
import OrgChartClient from './OrgChartClient';
import { prisma } from '@/lib/prisma';

async function getEmployees() {
  const rows = await prisma.employee.findMany();
  const emps: Employee[] = rows.map((e) => ({
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


