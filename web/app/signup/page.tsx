"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [role, setRole] = React.useState<'admin' | 'hr' | 'employee'>('employee');
  const [employeeId, setEmployeeId] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, employeeId: employeeId || null }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b?.error || 'Signup failed');
      }
      alert('Signup successful, please log in');
      router.push('/login');
    } catch (e: any) {
      alert(e?.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6">
      <div className="mx-auto w-full max-w-sm rounded border p-6">
        <h1 className="mb-4 text-xl font-semibold">Sign up</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="w-full rounded border px-3 py-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="w-full rounded border px-3 py-2" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <select className="w-full rounded border px-3 py-2" value={role} onChange={e => setRole(e.target.value as any)}>
            <option value="employee">Employee</option>
            <option value="hr">HR</option>
            <option value="admin">Admin</option>
          </select>
          <input className="w-full rounded border px-3 py-2" placeholder="Employee ID (optional for Employee role)" value={employeeId} onChange={e => setEmployeeId(e.target.value)} />
          <button disabled={loading} className="w-full rounded bg-blue-600 px-3 py-2 text-white">{loading ? 'Signing up…' : 'Sign up'}</button>
        </form>
      </div>
    </main>
  );
}


