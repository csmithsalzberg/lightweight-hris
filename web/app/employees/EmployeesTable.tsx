"use client";
import React from 'react';
import { Employee } from '@/types/employee';

type Props = {
  employees: Employee[];
};

export default function EmployeesTable({ employees }: Props) {
  const [query, setQuery] = React.useState("");

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      [
        e.name,
        e.title,
        e.department,
        e.contact_email,
        e.status,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [employees, query]);

  function downloadCsv() {
    const headers = [
      'id','name','title','department','manager_id','contact_email','contact_phone','hire_date','salary','status',
    ];
    const rows = filtered.map((e) => [
      e.id,
      e.name,
      e.title,
      e.department,
      e.manager_id ?? '',
      e.contact_email,
      e.contact_phone ?? '',
      e.hire_date,
      String(e.salary),
      e.status,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search employees..."
          className="w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={downloadCsv}
          className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Export CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-800">
            <tr>
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Title</th>
              <th className="p-3 font-medium">Department</th>
              <th className="p-3 font-medium">Manager</th>
              <th className="p-3 font-medium">Hire Date</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Email</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((emp) => {
              const manager = employees.find((e) => e.id === emp.manager_id);
              return (
                <tr key={emp.id} className="odd:bg-white even:bg-gray-50 border-b border-gray-100">
                  <td className="p-3 font-medium text-gray-900">{emp.name}</td>
                  <td className="p-3 text-gray-700">{emp.title}</td>
                  <td className="p-3 text-gray-700">{emp.department}</td>
                  <td className="p-3 text-gray-700">{manager ? manager.name : '—'}</td>
                  <td className="p-3 text-gray-700">{emp.hire_date}</td>
                  <td className="p-3">
                    <span
                      className={
                        'inline-block rounded-full px-2 py-1 text-xs font-semibold ' +
                        (emp.status === 'active'
                          ? 'bg-green-100 text-green-700'
                          : emp.status === 'leave'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-200 text-gray-700')
                      }
                    >
                      {emp.status}
                    </span>
                  </td>
                  <td className="p-3 text-blue-600 underline">{emp.contact_email}</td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td className="p-4 text-gray-600" colSpan={7}>No results</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}


