import { useEffect, useRef, useState } from 'react';

import type { PriceTick } from '../types';
import { Sparkline } from './Sparkline';

const UP = '#16c784';
const DOWN = '#ea3943';

interface Props {
  ticker: string;
  name: string;
  tick?: PriceTick;
  history: number[];
  onRemove: (ticker: string) => void;
}

const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function StockCard({ ticker, name, tick, history, onRemove }: Props) {
  // Briefly flash the card green/red whenever the price moves.
  const [flash, setFlash] = useState<'up' | 'down' | null>(null);
  const lastPrice = useRef<number | undefined>(tick?.price);

  useEffect(() => {
    if (tick && lastPrice.current !== undefined && tick.price !== lastPrice.current) {
      setFlash(tick.price > lastPrice.current ? 'up' : 'down');
      const id = setTimeout(() => setFlash(null), 600);
      lastPrice.current = tick.price;
      return () => clearTimeout(id);
    }
    lastPrice.current = tick?.price;
  }, [tick]);

  const positive = (tick?.change ?? 0) >= 0;
  const accent = positive ? UP : DOWN;
  const flashClass = flash === 'up' ? 'animate-flashUp' : flash === 'down' ? 'animate-flashDown' : '';

  return (
    <div className={`group relative rounded-2xl border border-edge bg-panel p-5 shadow-lg transition ${flashClass}`}>
      <button
        onClick={() => onRemove(ticker)}
        aria-label={`Unsubscribe from ${ticker}`}
        className="absolute right-4 top-4 text-muted opacity-0 transition hover:text-down group-hover:opacity-100"
      >
        ✕
      </button>

      <div className="flex items-baseline gap-2">
        <span className="font-mono text-lg font-bold tracking-wide">{ticker}</span>
        <span className="truncate text-xs text-muted">{name}</span>
      </div>

      {tick ? (
        <>
          <div className="mt-3 flex items-end justify-between">
            <div className="font-mono text-3xl font-semibold tabular-nums">${fmt(tick.price)}</div>
            <div className="text-right font-mono text-sm font-medium" style={{ color: accent }}>
              <div>
                {positive ? '▲' : '▼'} {fmt(Math.abs(tick.change))}
              </div>
              <div>
                {positive ? '+' : '−'}
                {fmt(Math.abs(tick.changePct))}%
              </div>
            </div>
          </div>
          <div className="mt-3">
            <Sparkline data={history} color={accent} />
          </div>
          <div className="mt-2 text-[11px] text-muted">
            since open · updated {new Date(tick.ts).toLocaleTimeString()}
          </div>
        </>
      ) : (
        <div className="mt-6 h-[120px] animate-pulse rounded-lg bg-panel-2" />
      )}
    </div>
  );
}
