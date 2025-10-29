"use client";
import React from 'react';

export type EmployeeFormValues = {
  id?: string;
  name: string;
  title: string;
  department: string;
  managerId?: string | null;
  contactEmail: string;
  contactPhone?: string | null;
  hireDate: string; // YYYY-MM-DD
  salary: number;
  status: 'active' | 'leave' | 'terminated';
};

type Props = {
  initialValues?: Partial<EmployeeFormValues>;
  onCancel: () => void;
  onSubmit: (values: EmployeeFormValues) => Promise<void> | void;
};

export default function EmployeeForm({ initialValues, onCancel, onSubmit }: Props) {
  const [values, setValues] = React.useState<EmployeeFormValues>({
    name: initialValues?.name ?? '',
    title: initialValues?.title ?? '',
    department: initialValues?.department ?? '',
    managerId: initialValues?.managerId ?? null,
    contactEmail: initialValues?.contactEmail ?? '',
    contactPhone: initialValues?.contactPhone ?? '',
    hireDate: initialValues?.hireDate ?? new Date().toISOString().slice(0, 10),
    salary: initialValues?.salary ?? 0,
    status: (initialValues?.status as EmployeeFormValues['status']) ?? 'active',
    id: initialValues?.id,
  });
  const [submitting, setSubmitting] = React.useState(false);
  const [managers, setManagers] = React.useState<Array<{ id: string; name: string; email: string; managerId: string | null }>>([]);
  const selfId = initialValues?.id;
  const [invalidManagerIds, setInvalidManagerIds] = React.useState<Set<string>>(new Set());
  const [error, setError] = React.useState<string>("");

  React.useEffect(() => {
    let isMounted = true;
    fetch('/api/employees')
      .then((r) => r.json())
      .then((data) => {
        if (!isMounted) return;
        const list = (data.employees ?? [])
          .map((e: any) => ({ id: e.id as string, name: e.name as string, email: e.contactEmail as string, managerId: e.managerId ?? null }))
          .filter((e: any) => e && e.id && e.name);
        setManagers(list);

        // Build descendants of self to prevent cycles.
        if (selfId) {
          const children = new Map<string, string[]>();
          for (const m of list) {
            if (m.managerId) {
              const arr = children.get(m.managerId) ?? [];
              arr.push(m.id);
              children.set(m.managerId, arr);
            }
          }
          const blocked = new Set<string>();
          const stack = [selfId];
          while (stack.length) {
            const cur = stack.pop()!;
            const kids = children.get(cur) ?? [];
            for (const k of kids) {
              if (!blocked.has(k)) {
                blocked.add(k);
                stack.push(k);
              }
            }
          }
          setInvalidManagerIds(blocked);
        } else {
          setInvalidManagerIds(new Set());
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, []);

  function update<K extends keyof EmployeeFormValues>(key: K, val: EmployeeFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await onSubmit({ ...values, salary: Number(values.salary) });
    } catch (err: any) {
      setError(err?.message || 'Save failed');
      return;
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-700">Name</span>
          <input className="rounded border px-3 py-2" value={values.name} onChange={(e) => update('name', e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-700">Title</span>
          <input className="rounded border px-3 py-2" value={values.title} onChange={(e) => update('title', e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-700">Department</span>
          <input className="rounded border px-3 py-2" value={values.department} onChange={(e) => update('department', e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-700">Manager (optional)</span>
          <select
            className="rounded border px-3 py-2"
            value={values.managerId ?? ''}
            onChange={(e) => update('managerId', e.target.value ? e.target.value : null)}
          >
            <option value="">— None —</option>
            {managers
              .filter((m) => m.id !== selfId)
              .map((m) => (
                <option key={m.id} value={m.id} disabled={invalidManagerIds.has(m.id)}>
                  {m.email}{invalidManagerIds.has(m.id) ? ' (circular)' : ''}
                </option>
              ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-700">Email</span>
          <input type="email" className="rounded border px-3 py-2" value={values.contactEmail} onChange={(e) => update('contactEmail', e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-700">Phone (optional)</span>
          <input className="rounded border px-3 py-2" value={values.contactPhone ?? ''} onChange={(e) => update('contactPhone', e.target.value || null)} />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-700">Hire Date</span>
          <input type="date" className="rounded border px-3 py-2" value={values.hireDate} onChange={(e) => update('hireDate', e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-700">Salary</span>
          <input type="number" className="rounded border px-3 py-2" value={values.salary} onChange={(e) => update('salary', Number(e.target.value))} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="text-gray-700">Status</span>
          <select className="rounded border px-3 py-2" value={values.status} onChange={(e) => update('status', e.target.value as EmployeeFormValues['status'])}>
            <option value="active">active</option>
            <option value="leave">leave</option>
            <option value="terminated">terminated</option>
          </select>
        </label>
      </div>
      <div className="flex justify-end gap-2 pt-2">
        {error && (
          <div className="mr-auto rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}
        <button type="button" onClick={onCancel} className="rounded border px-3 py-2 text-sm">Cancel</button>
        <button type="submit" disabled={submitting} className="rounded bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700">
          {submitting ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
}


