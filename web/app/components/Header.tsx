"use client";
import React from 'react';

type Me = { id: string; role: 'admin'|'hr'|'employee'; employeeId?: string|null; email?: string|null; name?: string|null } | null;

export default function Header({ initialUser }: { initialUser?: Me }) {
  const [me, setMe] = React.useState<any>(initialUser ?? null);
  React.useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(r => r.json())
      .then(b => setMe(b?.user ?? null))
      .catch(() => setMe(null));
  }, []);
  return (
    <div className="flex items-center justify-between border-b px-4 py-2 text-sm">
      <div className="flex items-center gap-3">
        <a href="/" className="font-semibold">HRIS</a>
        <a href="/employees" className="hover:underline">Employees</a>
        <a href="/org-chart" className="hover:underline">Org Chart</a>
        {(me && (me.role === 'admin' || me.role === 'hr')) && (
          <a href="/change-log" className="hover:underline">Change Log</a>
        )}
      </div>
      <AuthStatus />
    </div>
  );
}

function AuthStatus() {
  const [me, setMe] = React.useState<any>(null);
  React.useEffect(() => {
    fetch('/api/auth/me', { cache: 'no-store' })
      .then(r => r.json())
      .then(b => setMe(b?.user ?? null))
      .catch(() => setMe(null));
  }, []);
  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    location.href = '/login';
  }
  if (!me) {
    return (
      <div className="flex items-center gap-3">
        <a className="hover:underline" href="/login">Log in</a>
        <a className="hover:underline" href="/signup">Sign up</a>
      </div>
    );
  }
  const display = me?.email || '';
  return (
    <div className="flex items-center gap-3">
      <span className="text-gray-700">{display}</span>
      <button onClick={logout} className="rounded border px-2 py-1">Log out</button>
    </div>
  );
}


