'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';

export default function ResetPasswordClient() {
  const [token, setToken] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [state, setState] = useState<'ready' | 'busy' | 'success' | 'error'>('ready');

  useEffect(() => {
    const params = new URLSearchParams(window.location.hash.slice(1));
    setToken(params.get('token') ?? '');
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!token || password !== confirm) {
      setState('error');
      return;
    }
    setState('busy');
    const response = await fetch('/api/auth/recovery/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword: password }),
    });
    setToken('');
    setState(response.ok ? 'success' : 'error');
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-5 py-12">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">Choose a new password</h1>
        {state === 'success' ? (
          <p className="mt-5 text-sm text-emerald-800" role="status">Password changed. All previous sessions were signed out.</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-800">
              New password
              <input type="password" autoComplete="new-password" required minLength={8} maxLength={128}
                value={password} onChange={(event) => setPassword(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <label className="block text-sm font-medium text-slate-800">
              Confirm new password
              <input type="password" autoComplete="new-password" required minLength={8} maxLength={128}
                value={confirm} onChange={(event) => setConfirm(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            {state === 'error' && <p className="text-sm text-red-700" role="alert">The link is invalid or expired, or the passwords do not meet the requirements.</p>}
            <button disabled={state === 'busy'} className="w-full rounded-lg bg-slate-950 px-4 py-2 text-white disabled:opacity-60">
              {state === 'busy' ? 'Updating…' : 'Update password'}
            </button>
          </form>
        )}
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-blue-700">Back to login</Link>
      </section>
    </main>
  );
}
