"use client";
import React from 'react';
import { Employee } from '@/types/employee';

type Props = {
  employees: Employee[];
};

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
  const [showChildren, setShowChildren] = React.useState(true);
  const [showDetails, setShowDetails] = React.useState(false);

  return (
    <div className="flex flex-col items-center">
      <div className={`rounded border bg-white px-5 py-3 shadow-sm ${showDetails ? 'min-w-[340px]' : 'min-w-[220px]'}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-base font-semibold text-gray-900">{emp.name}</div>
            <div className="text-sm text-gray-700">{emp.title}</div>
            <div className="mt-1 text-xs text-gray-500">{emp.department}</div>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              className="rounded border px-1.5 text-xs text-gray-700 hover:bg-gray-50"
              onClick={() => setShowDetails((v) => !v)}
              aria-label="Toggle details"
              title="Toggle details"
            >
              {showDetails ? '▾' : '▸'}
            </button>
            {kids.length > 0 && (
              <button
                type="button"
                className="rounded border px-1.5 text-xs text-gray-700 hover:bg-gray-50"
                onClick={() => setShowChildren((v) => !v)}
                aria-label="Toggle reports"
                title="Toggle reports"
              >
                {showChildren ? '−' : '+'}
              </button>
            )}
          </div>
        </div>

        {showDetails && (
          <div className="mt-2 border-t pt-2 text-[11px] text-gray-700">
            <div className="grid grid-cols-[auto,1fr] gap-x-2 gap-y-1 items-start">
              <span className="text-gray-500">Email</span>
              <span className="break-all">{emp.contact_email}</span>
              <span className="text-gray-500">Hire Date</span>
              <span>{emp.hire_date}</span>
              <span className="text-gray-500">Status</span>
              <span className="capitalize">{emp.status}</span>
            </div>
          </div>
        )}
      </div>

      {kids.length > 0 && showChildren && (
        <div className="relative mt-4 flex">
          <div className="absolute left-1/2 top-[-18px] h-5 w-0.5 -translate-x-1/2 bg-gray-400" />
          <div className="absolute top-[-2px] left-0 right-0 h-0.5 bg-gray-400" />
          <div className="flex gap-8 pt-3">
            {kids.map((k) => (
              <div key={k.id} className="flex flex-col items-center">
                <div className="h-5 w-0.5 bg-gray-400" />
                <Node emp={k} childrenMap={childrenMap} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrgChartClient({ employees }: Props) {
  const { roots, children } = React.useMemo(() => buildForest(employees), [employees]);
  const [exportOpen, setExportOpen] = React.useState(false);
  const [me, setMe] = React.useState<{ role: 'admin'|'hr'|'employee' } | null>(null);
  React.useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(b => setMe(b?.user ?? null)).catch(() => setMe(null));
  }, []);

  function getExportData() {
    const headers = [
      'id','name','title','department','manager_id','manager','contact_email','contact_phone','hire_date','salary','status',
    ];
    const idToName = new Map(employees.map((e) => [e.id, e.name] as const));
    const rows = employees.map((e) => [
      e.id,
      e.name,
      e.title,
      e.department,
      e.manager_id ?? '',
      e.manager_id ? (idToName.get(e.manager_id) ?? '') : '',
      e.contact_email,
      e.contact_phone ?? '',
      e.hire_date,
      String(e.salary),
      e.status,
    ]);
    return { headers, rows } as const;
  }

  function downloadCsv() {
    const { headers, rows } = getExportData();
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

  async function downloadExcel() {
    const res = await fetch('/api/employees/export?format=xlsx');
    if (!res.ok) return alert('Failed to export Excel');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function downloadPdf() {
    const res = await fetch('/api/employees/export?format=pdf');
    if (!res.ok) return alert('Failed to export PDF');
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees.pdf';
    a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="min-w-max">
      <div className="mb-4 flex items-center justify-end">
        {(me && (me.role === 'admin' || me.role === 'hr')) && (
          <div className="relative">
            <button
              onClick={() => setExportOpen((v) => !v)}
              className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
              aria-haspopup="menu"
              aria-expanded={exportOpen}
            >
              Export ▾
            </button>
            {exportOpen && (
              <div className="absolute right-0 mt-2 w-40 rounded border border-gray-200 bg-white py-1 shadow-lg z-10" role="menu">
                <button className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={() => { setExportOpen(false); downloadCsv(); }}>CSV</button>
                <button className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={() => { setExportOpen(false); downloadExcel(); }}>Excel</button>
                <button className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50" onClick={() => { setExportOpen(false); downloadPdf(); }}>PDF</button>
              </div>
            )}
          </div>
        )}
      </div>
      <div className="flex items-start gap-10">
        {roots.map((r) => (
          <Node key={r.id} emp={r} childrenMap={children} />
        ))}
      </div>
    </div>
  );
}


