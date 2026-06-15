import type { Session, StockCatalogEntry } from './types';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export async function login(email: string): Promise<Session> {
  const res = await fetch(`${API_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Login failed');
  return data as Session;
}

export async function fetchCatalog(): Promise<StockCatalogEntry[]> {
  const res = await fetch(`${API_URL}/api/stocks`);
  if (!res.ok) throw new Error('Failed to load stock catalogue');
  return res.json();
}
