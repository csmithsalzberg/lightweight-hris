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
      <div className={`rounded border bg-white px-4 py-2 shadow-sm ${showDetails ? 'min-w-[320px]' : 'min-w-[200px]'}`}>
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-semibold text-gray-900">{emp.name}</div>
            <div className="text-xs text-gray-600">{emp.title}</div>
            <div className="mt-1 text-[10px] text-gray-500">{emp.department}</div>
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              className="rounded border px-1 text-xs text-gray-700 hover:bg-gray-50"
              onClick={() => setShowDetails((v) => !v)}
              aria-label="Toggle details"
              title="Toggle details"
            >
              {showDetails ? '▾' : '▸'}
            </button>
            {kids.length > 0 && (
              <button
                type="button"
                className="rounded border px-1 text-xs text-gray-700 hover:bg-gray-50"
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
          <div className="absolute left-1/2 top-[-16px] h-4 w-px -translate-x-1/2 bg-gray-300" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gray-300" />
          <div className="flex gap-6 pt-2">
            {kids.map((k) => (
              <div key={k.id} className="flex flex-col items-center">
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

export default function OrgChartClient({ employees }: Props) {
  const { roots, children } = React.useMemo(() => buildForest(employees), [employees]);
  return (
    <div className="min-w-max">
      <div className="flex items-start gap-10">
        {roots.map((r) => (
          <Node key={r.id} emp={r} childrenMap={children} />
        ))}
      </div>
    </div>
  );
}


