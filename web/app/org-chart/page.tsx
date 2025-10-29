import { Employee } from '@/types/employee';

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
  return emps;
}

function buildForest(employees: Employee[]) {
  const byId = new Map<string, Employee>();
  employees.forEach((e) => byId.set(e.id, e));
  const children = new Map<string, Employee[]>();
  employees.forEach((e) => {
    if (!e.manager_id) return;
    const arr = children.get(e.manager_id) ?? [];
    arr.push(e);
    children.set(e.manager_id, arr);
  });
  const roots = employees.filter((e) => !e.manager_id || !byId.has(e.manager_id));
  return { roots, children } as const;
}

function Node({ emp, childrenMap }: { emp: Employee; childrenMap: Map<string, Employee[]> }) {
  const kids = childrenMap.get(emp.id) ?? [];
  return (
    <div className="flex flex-col items-center">
      <div className="rounded border bg-white px-4 py-2 shadow-sm">
        <div className="text-sm font-semibold text-gray-900">{emp.name}</div>
        <div className="text-xs text-gray-600">{emp.title}</div>
        <div className="mt-1 text-[10px] text-gray-500">{emp.department}</div>
      </div>
      {kids.length > 0 && (
        <div className="relative mt-4 flex">
          {/* vertical connector */}
          <div className="absolute left-1/2 top-[-16px] h-4 w-px -translate-x-1/2 bg-gray-300" />
          {/* horizontal rail */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gray-300" />
          <div className="flex gap-6 pt-2">
            {kids.map((k) => (
              <div key={k.id} className="flex flex-col items-center">
                {/* vertical drop from rail to child */}
                <div className="h-4 w-px bg-gray-300" />
                <Node emp={k} childrenMap={childrenMap} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default async function OrgChartPage() {
  const employees = await getEmployees();
  const { roots, children } = buildForest(employees);
  return (
    <main className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-semibold">Organizational Chart</h1>
        <p className="text-sm text-gray-600">Auto-generated from reporting relationships.</p>
      </header>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          <div className="flex items-start gap-10">
            {roots.map((r) => (
              <Node key={r.id} emp={r} childrenMap={children} />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}


