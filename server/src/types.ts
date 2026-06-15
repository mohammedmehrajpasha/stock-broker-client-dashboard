/** Shared domain & wire types for the real-time stock dashboard. */

/** Static description of a tradable instrument the broker supports. */
export interface StockMeta {
  ticker: string;
  name: string;
}

/** A single price update for one ticker, pushed to subscribed clients. */
export interface PriceTick {
  ticker: string;
  /** Current price, rounded to 2dp. */
  price: number;
  /** Absolute change since the session's opening price. */
  change: number;
  /** Percentage change since the session's opening price. */
  changePct: number;
  /** Movement relative to the previous tick — drives the UI flash colour. */
  direction: 'up' | 'down' | 'flat';
  /** Epoch millis when the tick was generated. */
  ts: number;
}

/** Sent to a client when it (re)subscribes, so the card paints instantly. */
export interface SubscriptionSnapshot {
  ticker: string;
  tick: PriceTick;
  /** Recent price points for the sparkline (oldest → newest). */
  history: number[];
}

/** Data we attach to each authenticated socket. */
export interface SocketAuthData {
  email: string;
}

/* ---- Socket.IO event contracts (typed both ends) ---- */

export interface ServerToClientEvents {
  price: (tick: PriceTick) => void;
  subscriptions: (tickers: string[]) => void;
}

export interface ClientToServerEvents {
  subscribe: (
    ticker: string,
    ack: (res: { ok: true; snapshot: SubscriptionSnapshot } | { ok: false; error: string }) => void,
  ) => void;
  unsubscribe: (ticker: string, ack: (res: { ok: boolean }) => void) => void;
}
