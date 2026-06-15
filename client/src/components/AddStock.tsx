import { useState } from 'react';

import type { StockCatalogEntry } from '../types';

interface Props {
  catalog: StockCatalogEntry[];
  subscribed: string[];
  onSubscribe: (ticker: string) => Promise<{ ok: boolean; error?: string }>;
}

/** Ticker entry box + one-click chips for the supported catalogue. */
export function AddStock({ catalog, subscribed, onSubscribe }: Props) {
  const [value, setValue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function add(ticker: string) {
    const t = ticker.trim().toUpperCase();
    if (!t) return;
    setBusy(true);
    setError(null);
    const res = await onSubscribe(t);
    setBusy(false);
    if (res.ok) setValue('');
    else setError(res.error ?? 'Could not subscribe');
  }

  return (
    <div className="rounded-2xl border border-edge bg-panel p-5">
      <h2 className="text-sm font-semibold text-muted">Subscribe to a stock</h2>
      <form
        className="mt-3 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void add(value);
        }}
      >
        <input
          value={value}
          onChange={(e) => setValue(e.target.value.toUpperCase())}
          placeholder="Ticker e.g. GOOG"
          className="w-40 rounded-lg border border-edge bg-panel-2 px-3 py-2 font-mono text-sm outline-none focus:border-up"
        />
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-up px-4 py-2 text-sm font-semibold text-bg transition hover:brightness-110 disabled:opacity-50"
        >
          Add
        </button>
      </form>
      {error && <p className="mt-2 text-xs text-down">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2">
        {catalog.map((s) => {
          const active = subscribed.includes(s.ticker);
          return (
            <button
              key={s.ticker}
              disabled={active}
              onClick={() => void add(s.ticker)}
              title={s.name}
              className={`rounded-full border px-3 py-1 font-mono text-xs transition ${
                active
                  ? 'cursor-default border-edge bg-panel-2 text-muted'
                  : 'border-edge text-slate-100 hover:border-up hover:text-up'
              }`}
            >
              {s.ticker}
              {active && ' ✓'}
            </button>
          );
        })}
      </div>
    </div>
  );
}
