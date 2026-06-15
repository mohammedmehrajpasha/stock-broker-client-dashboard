import type { StockMeta } from './types.js';

/**
 * The five instruments this broker supports. Seed prices are realistic
 * starting points; the price engine performs a random walk from here.
 *
 * Add a row to support more tickers — the rest of the system is generic.
 */
export const SUPPORTED_STOCKS: (StockMeta & { seed: number })[] = [
  { ticker: 'GOOG', name: 'Alphabet Inc.', seed: 178.32 },
  { ticker: 'TSLA', name: 'Tesla, Inc.', seed: 251.44 },
  { ticker: 'AMZN', name: 'Amazon.com, Inc.', seed: 213.18 },
  { ticker: 'META', name: 'Meta Platforms, Inc.', seed: 597.02 },
  { ticker: 'NVDA', name: 'NVIDIA Corporation', seed: 138.76 },
];

export const SUPPORTED_TICKERS = new Set(SUPPORTED_STOCKS.map((s) => s.ticker));

export function isSupported(ticker: string): boolean {
  return SUPPORTED_TICKERS.has(ticker.toUpperCase());
}
