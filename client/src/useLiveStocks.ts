import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';

import { API_URL } from './api';
import type { PriceTick, SubscriptionSnapshot } from './types';

const HISTORY_LENGTH = 60;
type Status = 'connecting' | 'connected' | 'disconnected';

interface SubscribeResult {
  ok: boolean;
  error?: string;
}

/**
 * Owns the authenticated Socket.IO connection and all live price state for
 * the logged-in user: which tickers they're subscribed to, the latest tick
 * per ticker, a rolling price history (for sparklines), and link status.
 *
 * The socket auto-reconnects; on reconnect the server replays the user's
 * subscriptions, so the dashboard is self-healing across network blips.
 */
export function useLiveStocks(token: string) {
  const socketRef = useRef<Socket | null>(null);
  const [status, setStatus] = useState<Status>('connecting');
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [prices, setPrices] = useState<Record<string, PriceTick>>({});
  const [history, setHistory] = useState<Record<string, number[]>>({});

  useEffect(() => {
    const socket: Socket = io(API_URL, {
      auth: { token },
      transports: ['websocket'],
    });
    socketRef.current = socket;

    socket.on('connect', () => setStatus('connected'));
    socket.io.on('reconnect_attempt', () => setStatus('connecting'));
    socket.on('disconnect', () => setStatus('disconnected'));

    socket.on('subscriptions', (tickers: string[]) => setSubscriptions(tickers));

    socket.on('price', (tick: PriceTick) => {
      setPrices((p) => ({ ...p, [tick.ticker]: tick }));
      setHistory((h) => {
        const next = [...(h[tick.ticker] ?? []), tick.price];
        if (next.length > HISTORY_LENGTH) next.shift();
        return { ...h, [tick.ticker]: next };
      });
    });

    return () => {
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token]);

  const subscribe = useCallback((ticker: string): Promise<SubscribeResult> => {
    const socket = socketRef.current;
    if (!socket) return Promise.resolve({ ok: false, error: 'Not connected' });
    return new Promise((resolve) => {
      socket.emit(
        'subscribe',
        ticker,
        (res: { ok: true; snapshot: SubscriptionSnapshot } | { ok: false; error: string }) => {
          if (res.ok) {
            const { snapshot } = res;
            setSubscriptions((s) => (s.includes(snapshot.ticker) ? s : [...s, snapshot.ticker]));
            setPrices((p) => ({ ...p, [snapshot.ticker]: snapshot.tick }));
            setHistory((h) => ({ ...h, [snapshot.ticker]: snapshot.history }));
            resolve({ ok: true });
          } else {
            resolve({ ok: false, error: res.error });
          }
        },
      );
    });
  }, []);

  const unsubscribe = useCallback((ticker: string) => {
    const socket = socketRef.current;
    if (!socket) return;
    socket.emit('unsubscribe', ticker, () => {});
    setSubscriptions((s) => s.filter((t) => t !== ticker));
  }, []);

  const watchlist = useMemo(
    () => subscriptions.map((t) => ({ ticker: t, tick: prices[t], history: history[t] ?? [] })),
    [subscriptions, prices, history],
  );

  return { status, subscriptions, watchlist, subscribe, unsubscribe };
}
