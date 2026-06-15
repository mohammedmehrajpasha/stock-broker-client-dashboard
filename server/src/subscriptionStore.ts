/**
 * In-memory per-user subscription store, keyed by email. Survives socket
 * reconnects (so a refresh restores the user's watchlist) for the lifetime
 * of the server process. Swap this module for Redis/Postgres to persist
 * across restarts — the interface is all the rest of the app depends on.
 */
const byEmail = new Map<string, Set<string>>();

export function getSubscriptions(email: string): string[] {
  return [...(byEmail.get(email) ?? [])];
}

export function addSubscription(email: string, ticker: string): void {
  const set = byEmail.get(email) ?? new Set<string>();
  set.add(ticker);
  byEmail.set(email, set);
}

export function removeSubscription(email: string, ticker: string): void {
  byEmail.get(email)?.delete(ticker);
}
