import { useEffect, useState } from 'react';

import { fetchCatalog } from '../api';
import { useLiveStocks } from '../useLiveStocks';
import type { Session, StockCatalogEntry } from '../types';
import { AddStock } from './AddStock';
import { StockCard } from './StockCard';

const STATUS_LABEL = {
  connecting: { text: 'Connecting…', color: '#f5a623' },
  connected: { text: 'Live', color: '#16c784' },
  disconnected: { text: 'Disconnected', color: '#ea3943' },
} as const;

export function Dashboard({ session, onLogout }: { session: Session; onLogout: () => void }) {
  const [catalog, setCatalog] = useState<StockCatalogEntry[]>([]);
  const { status, subscriptions, watchlist, subscribe, unsubscribe } = useLiveStocks(session.token);

  useEffect(() => {
    fetchCatalog().then(setCatalog).catch(() => setCatalog([]));
  }, []);

  const nameOf = (ticker: string) => catalog.find((c) => c.ticker === ticker)?.name ?? '';
  const badge = STATUS_LABEL[status];

  return (
    <div className="mx-auto max-w-5xl px-5 py-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📈</span>
          <div>
            <h1 className="text-xl font-bold leading-none">Tickr</h1>
            <span className="text-xs text-muted">{session.email}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2 text-xs font-medium" style={{ color: badge.color }}>
            <span className="relative flex h-2 w-2">
              {status === 'connected' && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" style={{ backgroundColor: badge.color }} />
              )}
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: badge.color }} />
            </span>
            {badge.text}
          </span>
          <button onClick={onLogout} className="rounded-lg border border-edge px-3 py-1.5 text-xs text-muted transition hover:text-slate-100">
            Sign out
          </button>
        </div>
      </header>

      <div className="mt-6">
        <AddStock catalog={catalog} subscribed={subscriptions} onSubscribe={subscribe} />
      </div>

      <section className="mt-6">
        <h2 className="mb-3 text-sm font-semibold text-muted">
          Your watchlist {subscriptions.length > 0 && `· ${subscriptions.length}`}
        </h2>
        {watchlist.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-edge p-12 text-center text-sm text-muted">
            No subscriptions yet. Add a ticker above to start streaming live prices.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {watchlist.map((w) => (
              <StockCard
                key={w.ticker}
                ticker={w.ticker}
                name={nameOf(w.ticker)}
                tick={w.tick}
                history={w.history}
                onRemove={unsubscribe}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
