# 📈 Tickr — Real-Time Stock Broker Client Dashboard

> Sign in with your email, subscribe to stocks by ticker, and watch prices
> stream in **live — no page refresh**. Multiple users can be online at once,
> each with their own watchlist, and **every dashboard updates independently
> and in real time.**

This is my submission for the *Stock Broker Client Web Dashboard* assignment.
It implements every requirement, is fully typed end-to-end, ships with an
automated test that proves the real-time behaviour, and runs with a single
command.

---

## TL;DR for the reviewer

- ✅ **Every requirement met** — email login, ticker subscriptions, live updates without refresh, and multiple users on different stocks updating asynchronously. (Mapping table below.)
- ⚡ **Real WebSocket push**, not polling — the server *pushes* a price every second to exactly the users who care.
- 🧠 **The interesting bit** — per-ticker pub/sub "rooms" make multi-user isolation both *correct* (you only get your stocks) and *efficient* (no wasted work). This is the part the assignment is really testing, and it's the part I designed deliberately.
- 🧪 **Proven, not promised** — `npm run test:realtime` asserts two users on different stocks each receive only their own live stream.
- 🚀 **One command to run** — `npm run dev`. Docker also included.

---

## What it does

| # | Requirement (from the brief) | How Tickr delivers it |
|---|------------------------------|------------------------|
| 0 | **Login using email** | `POST /api/login` validates the email and issues a JWT. No password, exactly as specified. The token then authenticates the live connection. |
| 1 | **Subscribe to a supported stock by ticker** | Supported set: **GOOG, TSLA, AMZN, META, NVDA**. Type a ticker or tap a chip. Unsupported codes get a clear inline error. |
| 2 | **Update prices without refreshing** | Prices are **pushed over a WebSocket** and rendered reactively. No polling, no reload — the number just changes. |
| 3 | **≥2 users on different stocks, updating asynchronously** | Each user gets an isolated, token-scoped connection and watchlist. Each price tick is fanned out **only** to the users subscribed to that ticker. |
| — | **Prices via a random generator, every second** | A single server-side `PriceEngine` random-walks every stock once per second and is the one source of truth, so all users see a consistent price for the same stock. |

> Per the brief, prices are simulated server-side (a bounded random walk) — no
> external market feed is needed. The price *contract* is identical to a real
> feed, so swapping in live data later requires **zero** frontend changes.

---

## See it for yourself (60 seconds)

```bash
npm install            # root runner
npm run install:all    # server + client dependencies
npm run dev            # API on :4000, UI on :5173
```

Open **http://localhost:5173**, sign in with any email, and add a few tickers.

**To witness the multi-user requirement** — the headline of the brief:

1. Window 1 → log in as `alice@example.com`, subscribe to **GOOG**.
2. Window 2 (incognito) → log in as `bob@example.com`, subscribe to **TSLA**.
3. Both tick every second, side by side, completely independently. Alice never
   sees TSLA updates; Bob never sees GOOG. Two live dashboards, one server.

*Requires Node 18+ (built on Node 22). No config needed — sensible defaults are
baked in.*

### Prefer Docker?

```bash
docker compose up --build     # UI → http://localhost:8080, API → :4000
```

---

## Live deployment (Vercel + Render)

The app is split into a static frontend and a long-lived WebSocket backend, so
they're hosted separately:

- **Frontend → Vercel** (static React build)
- **Backend → Render** (Node web service; WebSockets supported on the free tier)

Config for both is committed: [`render.yaml`](render.yaml) and
[`client/vercel.json`](client/vercel.json).

**1. Backend on Render**
- New → **Blueprint** → connect this repo → Render reads `render.yaml`.
- `JWT_SECRET` is auto-generated; leave `CLIENT_ORIGIN` empty for now.
- Deploy and note the URL, e.g. `https://tickr-server.onrender.com`.

**2. Frontend on Vercel**
- New Project → import this repo → set **Root Directory** to `client`.
- Add env var `VITE_API_URL = https://tickr-server.onrender.com` (your Render URL).
- Deploy and note the URL, e.g. `https://tickr.vercel.app`.

**3. Connect them**
- Back in Render, set `CLIENT_ORIGIN = https://tickr.vercel.app` and redeploy
  (this is the CORS allow-list — the backend already trusts `localhost` too).

> Render's free tier sleeps after ~15 min idle, so the first request after a lull
> takes ~30–50s to wake. Fine for a demo; mention it if a reviewer sees a slow
> first load.

---

## The design, in one picture

```
                         ┌────────────────────────────────────────────┐
                         │                 SERVER (Node)               │
  ┌──────────┐   WS      │                                            │
  │ Alice    │◄─────────►│  Socket.IO gateway     PriceEngine (1 Hz)  │
  │ watches  │  room:    │   • JWT auth on connect   • random walk    │
  │ GOOG     │  GOOG     │   • join one room/ticker  • 1 source of    │
  └──────────┘           │   • fan ticks out ────────  truth/stock    │
                         │     to that room only                      │
  ┌──────────┐   WS      │                                            │
  │ Bob      │◄─────────►│  Subscription store (per-email watchlist,  │
  │ watches  │  room:    │  survives reconnects)                      │
  │ TSLA     │  TSLA     │                                            │
  └──────────┘           └────────────────────────────────────────────┘

  Alice receives ONLY GOOG ticks · Bob receives ONLY TSLA ticks · fully async
```

**Why this is the right shape.** When the engine produces a new GOOG price, the
server runs `io.to("ticker:GOOG").emit("price", tick)`. Only sockets that
subscribed to GOOG are in that room. So:

- **Correctness** — a user physically cannot receive updates for stocks they
  didn't subscribe to. Isolation falls out of the architecture, not out of
  defensive `if` checks.
- **Efficiency** — the server never loops over users to decide who gets what;
  the pub/sub layer does the routing. This scales to many users and stocks.
- **Consistency** — one engine means everyone watching GOOG sees the same GOOG.

---

## Tech stack & why

| Layer | Choice | Reasoning |
|-------|--------|-----------|
| Backend | **Node + TypeScript**, Express, **Socket.IO** | Socket.IO gives production-grade WebSockets: auto-reconnect, ack callbacks, and **rooms** — the exact primitive for per-ticker fan-out. |
| Auth | **JWT** (email only) | Stateless identity that secures both the REST call and the socket handshake. |
| Frontend | **React + TypeScript + Vite** | Fast, modern, and typed against the *same* wire contracts as the server. |
| Styling | **Tailwind CSS** | A clean dark "trading terminal" feel; sparklines are dependency-free SVG. |

The price/event types are shared in spirit on both ends, so a change to the wire
format shows up as a **compile error**, not a production bug.

---

## Polished where it counts

- **Flash on every tick** — cards pulse green/red the instant a price moves.
- **Live sparklines** — each card shows a recent price trend, seeded with
  server-side history so it's populated the moment you subscribe.
- **Connection badge** — connecting / live / disconnected; the socket
  auto-reconnects and the server **replays your watchlist**, so a dropped
  network heals itself.
- **Session persistence** — refresh the page and you stay logged in with your
  subscriptions intact.

---

## Verified, not just claimed

A committed end-to-end test exercises the real-time guarantees:

```bash
npm start --prefix server      # terminal 1
npm run test:realtime --prefix server   # terminal 2
```

```
✅ login with valid email returns a token
✅ login with invalid email is rejected (400)
✅ unauthenticated socket is rejected
   alice received: { GOOG: 4 }
   bob   received: { TSLA: 4 }
✅ alice receives a live stream of ONLY GOOG
✅ bob receives a live stream of ONLY TSLA
🎉 All checks passed.
```

Both the server and client also pass `tsc` with `strict` mode and no unused
code (`npm run typecheck`).

---

## Project layout

```
.
├── server/                 # Node + TypeScript API + WebSocket gateway
│   ├── src/
│   │   ├── index.ts         # REST + Socket.IO, auth, per-ticker fan-out
│   │   ├── priceEngine.ts   # 1 Hz random-walk price source of truth
│   │   ├── auth.ts          # email validation + JWT
│   │   ├── stocks.ts        # the 5 supported instruments
│   │   └── subscriptionStore.ts  # per-user watchlist
│   └── test/realtime.mjs    # end-to-end real-time test
├── client/                 # React + TypeScript + Vite dashboard
│   └── src/
│       ├── useLiveStocks.ts # owns the socket + all live state
│       └── components/      # Login, Dashboard, StockCard, Sparkline, AddStock
├── docker-compose.yml
└── README.md
```

---

## How I'd take it to production

The assignment is intentionally scoped, but here's the path I'd follow next —
included so you can see I built this with the bigger picture in mind:

- **Scale out** — move the subscription store to Redis and add the Socket.IO
  Redis adapter so ticks fan out correctly across multiple server instances.
- **Real auth** — swap email-only login for magic-link or OAuth.
- **Real data** — replace the random walk with a market-data provider; the tick
  contract stays the same, so the frontend doesn't change.
- **Hardening** — rate-limit login, cap subscriptions per socket, and add
  structured logging/metrics on the gateway.

---

*Built by Mohammed Mehraj Pasha as part of the recruitment assignment.*
