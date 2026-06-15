import { useState } from 'react';

import { login } from '../api';
import type { Session } from '../types';

export function Login({ onLogin }: { onLogin: (s: Session) => void }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onLogin(await login(email));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-2xl border border-edge bg-panel p-8 shadow-2xl">
        <div className="mb-1 text-3xl">📈</div>
        <h1 className="text-2xl font-bold">Tickr</h1>
        <p className="mt-1 text-sm text-muted">Sign in with your email to open your live broker dashboard.</p>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-lg border border-edge bg-panel-2 px-3 py-2.5 text-sm outline-none focus:border-up"
          />
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-lg bg-up px-4 py-2.5 text-sm font-semibold text-bg transition hover:brightness-110 disabled:opacity-50"
          >
            {busy ? 'Signing in…' : 'Continue'}
          </button>
        </form>
        {error && <p className="mt-3 text-sm text-down">{error}</p>}

        <p className="mt-6 text-center text-xs text-muted">
          No password needed. Open a second browser/incognito window with a different
          email to see two dashboards update independently.
        </p>
      </div>
    </div>
  );
}
