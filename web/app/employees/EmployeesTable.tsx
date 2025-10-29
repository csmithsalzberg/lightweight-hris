"use client";
import React from 'react';
import { Employee } from '@/types/employee';
import EmployeeForm, { EmployeeFormValues } from './EmployeeForm';

type Props = {
  employees: Employee[];
};

export default function EmployeesTable({ employees }: Props) {
  const [query, setQuery] = React.useState("");
  const [items, setItems] = React.useState<Employee[]>(employees);
  const [showForm, setShowForm] = React.useState<null | { mode: 'create' } | { mode: 'edit', employee: Employee }>(null);
  const [department, setDepartment] = React.useState<string>("");
  const [title, setTitle] = React.useState<string>("");
  const [status, setStatus] = React.useState<string>("");
  const [startDate, setStartDate] = React.useState<string>("");
  const [endDate, setEndDate] = React.useState<string>("");
  const [sortKey, setSortKey] = React.useState<keyof Employee | 'hire_date'>('name');
  const [sortDir, setSortDir] = React.useState<'asc' | 'desc'>('asc');

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const source = items;
    let out = source.filter((e) =>
      [e.name, e.title, e.department, e.contact_email, e.status]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
    if (department) out = out.filter((e) => e.department === department);
    if (title) out = out.filter((e) => e.title === title);
    if (status) out = out.filter((e) => e.status === status);
    if (startDate) out = out.filter((e) => e.hire_date >= startDate);
    if (endDate) out = out.filter((e) => e.hire_date <= endDate);
    return out;
  }, [items, query, department, title, status, startDate, endDate]);

  const sorted = React.useMemo(() => {
    const arr = [...filtered];
    arr.sort((a, b) => {
      let av: any = (a as any)[sortKey];
      let bv: any = (b as any)[sortKey];
      if (sortKey === 'hire_date') {
        av = a.hire_date;
        bv = b.hire_date;
      }
      if (av == null && bv == null) return 0;
      if (av == null) return sortDir === 'asc' ? -1 : 1;
      if (bv == null) return sortDir === 'asc' ? 1 : -1;
      if (typeof av === 'string' && typeof bv === 'string') {
        const cmp = av.localeCompare(bv);
        return sortDir === 'asc' ? cmp : -cmp;
      }
      const cmp = av < bv ? -1 : av > bv ? 1 : 0;
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return arr;
  }, [filtered, sortKey, sortDir]);

  function downloadCsv() {
    const headers = [
      'id','name','title','department','manager_id','contact_email','contact_phone','hire_date','salary','status',
    ];
    const rows = sorted.map((e) => [
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

  async function handleCreate(vals: EmployeeFormValues) {
    const created = await apiCreate(vals);
    const mapped: Employee = {
      id: created.id,
      name: created.name,
      title: created.title,
      department: created.department,
      manager_id: created.managerId ?? null,
      contact_email: created.contactEmail,
      contact_phone: created.contactPhone ?? undefined,
      hire_date: typeof created.hireDate === 'string' ? created.hireDate.slice(0, 10) : created.hireDate,
      salary: created.salary,
      status: created.status,
    };
    setItems((prev) => [mapped, ...prev]);
    setShowForm(null);
  }

  async function handleUpdate(vals: EmployeeFormValues) {
    const updated = await apiUpdate(vals);
    const mapped: Employee = {
      id: updated.id,
      name: updated.name,
      title: updated.title,
      department: updated.department,
      manager_id: updated.managerId ?? null,
      contact_email: updated.contactEmail,
      contact_phone: updated.contactPhone ?? undefined,
      hire_date: typeof updated.hireDate === 'string' ? updated.hireDate.slice(0, 10) : updated.hireDate,
      salary: updated.salary,
      status: updated.status,
    };
    setItems((prev) => prev.map((e) => (e.id === mapped.id ? mapped : e)));
    setShowForm(null);
  }

  async function handleDelete(emp: Employee) {
    if (!confirm(`Delete ${emp.name}?`)) return;
    try {
      await apiDelete(emp.id);
      setItems((prev) => prev.filter((e) => e.id !== emp.id));
    } catch (err: any) {
      alert(err?.message || 'Delete failed');
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3 pb-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search employees..."
          className="w-full max-w-sm rounded border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={() => setShowForm({ mode: 'create' })}
          className="rounded bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-700"
        >
          Add Employee
        </button>
        <button
          onClick={downloadCsv}
          className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Export CSV
        </button>
      </div>

      {/* sorting is controlled by clicking column headers */}

      <div className="overflow-x-auto rounded border border-gray-200">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-800">
            <tr>
              <th className="p-3 font-medium">
                <button
                  className="flex items-center gap-1 hover:underline"
                  onClick={() => {
                    setSortKey('name' as any);
                    setSortDir((d) => (sortKey === 'name' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'));
                  }}
                >
                  Name {sortKey === 'name' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </button>
              </th>
              <th className="p-3 font-medium">
                <button
                  className="flex items-center gap-1 hover:underline"
                  onClick={() => {
                    setSortKey('title' as any);
                    setSortDir((d) => (sortKey === 'title' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'));
                  }}
                >
                  Title {sortKey === 'title' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </button>
              </th>
              <th className="p-3 font-medium">
                <button
                  className="flex items-center gap-1 hover:underline"
                  onClick={() => {
                    setSortKey('department' as any);
                    setSortDir((d) => (sortKey === 'department' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'));
                  }}
                >
                  Department {sortKey === 'department' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </button>
              </th>
              <th className="p-3 font-medium">Manager</th>
              <th className="p-3 font-medium">
                <button
                  className="flex items-center gap-1 hover:underline"
                  onClick={() => {
                    setSortKey('hire_date' as any);
                    setSortDir((d) => (sortKey === 'hire_date' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'));
                  }}
                >
                  Hire Date {sortKey === 'hire_date' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </button>
              </th>
              <th className="p-3 font-medium">
                <button
                  className="flex items-center gap-1 hover:underline"
                  onClick={() => {
                    setSortKey('status' as any);
                    setSortDir((d) => (sortKey === 'status' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'));
                  }}
                >
                  Status {sortKey === 'status' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </button>
              </th>
              <th className="p-3 font-medium">
                <button
                  className="flex items-center gap-1 hover:underline"
                  onClick={() => {
                    setSortKey('contact_email' as any);
                    setSortDir((d) => (sortKey === 'contact_email' ? (d === 'asc' ? 'desc' : 'asc') : 'asc'));
                  }}
                >
                  Email {sortKey === 'contact_email' ? (sortDir === 'asc' ? '▲' : '▼') : ''}
                </button>
              </th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
            <tr className="align-top text-xs">
              <th className="p-2"></th>
              <th className="p-2">
                <select
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1"
                >
                  <option value="">All</option>
                  {[...new Set(items.map((e) => e.title))].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </th>
              <th className="p-2">
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1"
                >
                  <option value="">All</option>
                  {[...new Set(items.map((e) => e.department))].map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </th>
              <th className="p-2"></th>
              <th className="p-2">
                <div className="flex items-center gap-2">
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-1/2 rounded border border-gray-300 px-2 py-1" />
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-1/2 rounded border border-gray-300 px-2 py-1" />
                </div>
              </th>
              <th className="p-2">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded border border-gray-300 px-2 py-1"
                >
                  <option value="">All</option>
                  <option value="active">active</option>
                  <option value="leave">leave</option>
                  <option value="terminated">terminated</option>
                </select>
              </th>
              <th className="p-2"></th>
              <th className="p-2"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((emp) => {
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
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        className="rounded border px-2 py-1 text-xs"
                        onClick={() => setShowForm({ mode: 'edit', employee: emp })}
                      >
                        Edit
                      </button>
                      <button
                        className="rounded border border-red-300 bg-red-50 px-2 py-1 text-xs text-red-700"
                        onClick={() => handleDelete(emp)}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td className="p-4 text-gray-600" colSpan={8}>No results</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">
              {showForm.mode === 'create' ? 'Add Employee' : 'Edit Employee'}
            </h2>
            <EmployeeForm
              initialValues={
                showForm.mode === 'edit'
                  ? {
                      id: showForm.employee.id,
                      name: showForm.employee.name,
                      title: showForm.employee.title,
                      department: showForm.employee.department,
                      managerId: showForm.employee.manager_id,
                      contactEmail: showForm.employee.contact_email,
                      contactPhone: showForm.employee.contact_phone ?? null,
                      hireDate: showForm.employee.hire_date,
                      salary: showForm.employee.salary,
                      status: showForm.employee.status,
                    }
                  : undefined
              }
              onCancel={() => setShowForm(null)}
              onSubmit={(vals) => (showForm.mode === 'create' ? handleCreate(vals) : handleUpdate(vals))}
            />
          </div>
        </div>
      )}
    </div>
  );
}

async function apiCreate(values: EmployeeFormValues) {
  const res = await fetch('/api/employees', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: values.name,
      title: values.title,
      department: values.department,
      managerId: values.managerId ?? null,
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone ?? null,
      hireDate: values.hireDate,
      salary: values.salary,
      status: values.status,
    }),
  });
  if (!res.ok) {
    let msg = 'Failed to create';
    try {
      const body = await res.json();
      if (body?.code === 'P2002') msg = 'Email already exists';
      else if (body?.error) msg = body.error;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

async function apiUpdate(values: EmployeeFormValues) {
  if (!values.id) throw new Error('Missing id');
  const res = await fetch(`/api/employees/${values.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: values.name,
      title: values.title,
      department: values.department,
      managerId: values.managerId ?? null,
      contactEmail: values.contactEmail,
      contactPhone: values.contactPhone ?? null,
      hireDate: values.hireDate,
      salary: values.salary,
      status: values.status,
    }),
  });
  if (!res.ok) {
    let msg = 'Failed to update';
    try {
      const body = await res.json();
      if (body?.code === 'P2002') msg = 'Email already exists';
      else if (body?.error) msg = body.error;
    } catch {}
    throw new Error(msg);
  }
  return res.json();
}

async function apiDelete(id: string) {
  const res = await fetch(`/api/employees/${id}`, { method: 'DELETE' });
  if (!res.ok) {
    let msg = 'Failed to delete';
    try {
      const body = await res.json();
      if (body?.error) msg = body.error;
      if (body?.code) msg += ` (code: ${body.code})`;
    } catch {}
    throw new Error(msg);
  }
}



