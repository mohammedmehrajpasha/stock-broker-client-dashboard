/** Client-side mirror of the server wire types. */

export interface PriceTick {
  ticker: string;
  price: number;
  change: number;
  changePct: number;
  direction: 'up' | 'down' | 'flat';
  ts: number;
}

export interface SubscriptionSnapshot {
  ticker: string;
  tick: PriceTick;
  history: number[];
}

export interface StockCatalogEntry {
  ticker: string;
  name: string;
  tick: PriceTick | null;
}

export interface Session {
  email: string;
  token: string;
}
