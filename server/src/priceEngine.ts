import { EventEmitter } from 'node:events';
import { SUPPORTED_STOCKS } from './stocks.js';
import type { PriceTick } from './types.js';

interface PriceState {
  price: number;
  open: number; // session opening price — basis for day change
  prev: number; // previous tick — basis for flash direction
  history: number[];
}

const HISTORY_LENGTH = 60; // ~1 minute of 1s ticks, enough for a sparkline

/**
 * Single source of truth for prices. One engine instance ticks every stock
 * once per second via a bounded random walk, and emits a `tick` event per
 * stock. Because there is exactly one engine, every connected user sees a
 * consistent price for the same ticker — the gateway only fans ticks out to
 * the users who subscribed (see index.ts rooms).
 */
export class PriceEngine extends EventEmitter {
  private readonly state = new Map<string, PriceState>();
  private timer?: NodeJS.Timeout;

  /** Per-tick volatility (fraction of price). 0.004 ⇒ up to ±0.4% / second. */
  private readonly volatility = 0.004;

  constructor() {
    super();
    for (const s of SUPPORTED_STOCKS) {
      this.state.set(s.ticker, {
        price: s.seed,
        open: s.seed,
        prev: s.seed,
        history: [s.seed],
      });
    }
  }

  start(intervalMs = 1000): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.tickAll(), intervalMs);
    // Don't keep the process alive solely for the ticker during shutdown.
    this.timer.unref?.();
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = undefined;
  }

  /** Latest tick for a ticker, or null if unknown. */
  snapshot(ticker: string): PriceTick | null {
    const s = this.state.get(ticker);
    return s ? this.buildTick(ticker, s) : null;
  }

  history(ticker: string): number[] {
    return this.state.get(ticker)?.history.slice() ?? [];
  }

  private tickAll(): void {
    for (const [ticker, s] of this.state) {
      const shock = (Math.random() - 0.5) * 2 * this.volatility;
      const next = Math.max(0.01, s.price * (1 + shock));
      s.prev = s.price;
      s.price = Math.round(next * 100) / 100;
      s.history.push(s.price);
      if (s.history.length > HISTORY_LENGTH) s.history.shift();
      this.emit('tick', this.buildTick(ticker, s));
    }
  }

  private buildTick(ticker: string, s: PriceState): PriceTick {
    const change = Math.round((s.price - s.open) * 100) / 100;
    const changePct = Math.round((change / s.open) * 10000) / 100;
    const direction = s.price > s.prev ? 'up' : s.price < s.prev ? 'down' : 'flat';
    return { ticker, price: s.price, change, changePct, direction, ts: Date.now() };
  }
}
