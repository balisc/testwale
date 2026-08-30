'use client';

import { FormEvent, useState } from 'react';
import Link from 'next/link';

export default function ForgotPasswordClient() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await fetch('/api/auth/recovery/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } finally {
      // Intentionally identical for existing, unknown, and Google-only emails.
      setSent(true);
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-md items-center px-5 py-12">
      <section className="w-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">Reset your password</h1>
        <p className="mt-2 text-sm text-slate-600">
          Enter your email. If password recovery is available for that account, we will send a reset link.
        </p>
        {sent ? (
          <p className="mt-6 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-900" role="status">
            If that account can be recovered, a message is on its way.
          </p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block text-sm font-medium text-slate-800">
              Email
              <input
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <button disabled={busy} className="w-full rounded-lg bg-slate-950 px-4 py-2 text-white disabled:opacity-60">
              {busy ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
        <Link href="/login" className="mt-6 inline-block text-sm font-semibold text-blue-700">Back to login</Link>
      </section>
    </main>
  );
}
