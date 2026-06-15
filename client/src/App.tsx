import { useEffect, useState } from 'react';

import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import type { Session } from './types';

const STORAGE_KEY = 'tickr.session';

export default function App() {
  const [session, setSession] = useState<Session | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  });

  useEffect(() => {
    if (session) localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    else localStorage.removeItem(STORAGE_KEY);
  }, [session]);

  if (!session) return <Login onLogin={setSession} />;
  return <Dashboard session={session} onLogout={() => setSession(null)} />;
}
