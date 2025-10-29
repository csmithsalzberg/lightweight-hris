import React from 'react';
import { Employee } from '@/types/employee';

// Server Component fetch
async function getEmployees() {
  const res = await fetch('http://localhost:3000/api/employees', {
    cache: 'no-store',
  });

  if (!res.ok) {
    throw new Error('Failed to fetch employees');
  }

  const data = await res.json();
  return data.employees as Employee[];
}

export default async function EmployeesPage() {
  const employees = await getEmployees();

  return (
    <main className="p-6 space-y-4">
      <header>
        <h1 className="text-2xl font-semibold">Employee Directory</h1>
        <p className="text-sm text-gray-600">
          Basic listing. Future: search, filter, edit, export.
        </p>
      </header>

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
            {employees.map((emp) => {
              const manager = employees.find((e) => e.id === emp.manager_id);

              return (
                <tr
                  key={emp.id}
                  className="odd:bg-white even:bg-gray-50 border-b border-gray-100"
                >
                  <td className="p-3 font-medium text-gray-900">{emp.name}</td>
                  <td className="p-3 text-gray-700">{emp.title}</td>
                  <td className="p-3 text-gray-700">{emp.department}</td>
                  <td className="p-3 text-gray-700">
                    {manager ? manager.name : '—'}
                  </td>
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
                  <td className="p-3 text-blue-600 underline">
                    {emp.contact_email}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Future enhancements:
          - search box that filters employees client-side
          - click row to view/edit details
          - export CSV button
      */}
    </main>
  );
}
