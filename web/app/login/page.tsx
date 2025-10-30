"use client";
import React from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        throw new Error(b?.error || 'Login failed');
      }
      const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
      const next = params.get('next') || '/employees';
      // Force full reload so header refetches me immediately
      window.location.replace(next);
    } catch (e: any) {
      alert(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="p-6">
      <div className="mx-auto w-full max-w-sm rounded border p-6">
        <h1 className="mb-4 text-xl font-semibold">Sign in</h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className="w-full rounded border px-3 py-2" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
          <input className="w-full rounded border px-3 py-2" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          <button disabled={loading} className="w-full rounded bg-blue-600 px-3 py-2 text-white">{loading ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </div>
    </main>
  );
}


