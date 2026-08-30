'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';

export default function VerifyEmailClient() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState<'idle' | 'working' | 'sent' | 'verified' | 'error'>('idle');

  useEffect(() => {
    const token = new URLSearchParams(window.location.hash.slice(1)).get('token') ?? '';
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
    if (!token) return;
    setState('working');
    void fetch('/api/auth/email-verification/confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    }).then((response) => setState(response.ok ? 'verified' : 'error'))
      .catch(() => setState('error'));
  }, []);

  async function requestVerification(event: FormEvent) {
    event.preventDefault();
    setState('working');
    try {
      await fetch('/api/auth/email-verification/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } finally {
      setState('sent');
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-5 py-12">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">Verify your email</h1>
        {state === 'verified' && <p className="mt-5 text-sm text-emerald-800" role="status">Email verified. You can now log in.</p>}
        {state === 'error' && <p className="mt-5 text-sm text-red-700" role="alert">This verification link is invalid or expired.</p>}
        {state === 'sent' && <p className="mt-5 text-sm text-slate-700" role="status">If verification is available for that account, a message is on its way.</p>}
        {(state === 'idle' || state === 'error') && (
          <form onSubmit={requestVerification} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-800">
              Email
              <input type="email" autoComplete="email" required maxLength={254} value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2" />
            </label>
            <button className="w-full rounded-lg bg-slate-950 px-4 py-2 text-white">Send verification link</button>
          </form>
        )}
        {state === 'working' && <p className="mt-5 text-sm text-slate-600" role="status">Verifying…</p>}
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-blue-700">Back to login</Link>
      </section>
    </main>
  );
}
