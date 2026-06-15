import http from 'node:http';
import cors from 'cors';
import express from 'express';
import { Server } from 'socket.io';

import { isValidEmail, issueToken, verifyToken } from './auth.js';
import { PriceEngine } from './priceEngine.js';
import { SUPPORTED_STOCKS, isSupported } from './stocks.js';
import {
  addSubscription,
  getSubscriptions,
  removeSubscription,
} from './subscriptionStore.js';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  SocketAuthData,
} from './types.js';

const PORT = Number(process.env.PORT ?? 4000);
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

/* ------------------------------- REST API ------------------------------- */

app.get('/api/health', (_req, res) => res.json({ ok: true }));

/** Email-only login. Returns a JWT used to authenticate the socket. */
app.post('/api/login', (req, res) => {
  const { email } = req.body ?? {};
  if (!isValidEmail(email)) {
    return res.status(400).json({ error: 'A valid email is required.' });
  }
  const normalized = email.trim().toLowerCase();
  return res.json({ email: normalized, token: issueToken(normalized) });
});

/** Catalogue of supported instruments + their current price. */
app.get('/api/stocks', (_req, res) => {
  res.json(
    SUPPORTED_STOCKS.map(({ ticker, name }) => ({
      ticker,
      name,
      tick: engine.snapshot(ticker),
    })),
  );
});

/* ------------------------------- Realtime ------------------------------- */

const engine = new PriceEngine();
engine.start(1000);

const server = http.createServer(app);
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketAuthData
>(server, { cors: { origin: CLIENT_ORIGIN } });

// Authenticate every socket from the JWT supplied in the handshake.
io.use((socket, next) => {
  const auth = verifyToken(socket.handshake.auth?.token as string | undefined);
  if (!auth) return next(new Error('unauthorized'));
  socket.data.email = auth.email;
  next();
});

io.on('connection', (socket) => {
  const { email } = socket.data;

  // Restore this user's watchlist: join a room per subscribed ticker and
  // push an immediate snapshot so cards paint without waiting for a tick.
  const existing = getSubscriptions(email);
  for (const ticker of existing) {
    socket.join(roomFor(ticker));
    const tick = engine.snapshot(ticker);
    if (tick) socket.emit('price', tick);
  }
  socket.emit('subscriptions', existing);

  socket.on('subscribe', (raw, ack) => {
    const ticker = String(raw ?? '').trim().toUpperCase();
    if (!isSupported(ticker)) {
      return ack({ ok: false, error: `'${ticker}' is not a supported ticker.` });
    }
    addSubscription(email, ticker);
    socket.join(roomFor(ticker));
    const tick = engine.snapshot(ticker);
    if (!tick) return ack({ ok: false, error: 'Price unavailable.' });
    ack({ ok: true, snapshot: { ticker, tick, history: engine.history(ticker) } });
  });

  socket.on('unsubscribe', (raw, ack) => {
    const ticker = String(raw ?? '').trim().toUpperCase();
    removeSubscription(email, ticker);
    socket.leave(roomFor(ticker));
    ack({ ok: true });
  });
});

// Fan each price tick out to ONLY the sockets subscribed to that ticker.
// This is the multi-user core: two users watching different stocks receive
// disjoint update streams over their own connections, fully asynchronously.
engine.on('tick', (tick) => {
  io.to(roomFor(tick.ticker)).emit('price', tick);
});

function roomFor(ticker: string): string {
  return `ticker:${ticker}`;
}

server.listen(PORT, () => {
  console.log(`📈 Stock dashboard API + WebSocket listening on :${PORT}`);
  console.log(`   Allowing client origin: ${CLIENT_ORIGIN}`);
});
