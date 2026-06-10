# Answerini

A free, self-hosted live quiz platform — a Kahoot alternative built for large events (300+ players) with no paid tier limits.

## Features

- **Host dashboard** — Create rooms, add multiple-choice questions, kick players, control game flow
- **Player join** — Enter 6-digit PIN + nickname (no account required)
- **Real-time gameplay** — Live question sync, countdown, timers, answer locking
- **Kahoot-style scoring** — Faster correct answers earn more points (500–1000) plus streak bonuses
- **Leaderboards** — Top 5 after every question, final podium at game end
- **Scale-ready** — Supports up to 500 players per room; uses Upstash Redis on Vercel for shared state

## Quick Start (Local)

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- **Host:** `/host` → create room → add questions → share PIN
- **Players:** `/join` → enter PIN and nickname

> **Note:** Without Redis env vars, game state is stored in memory (fine for local dev, not for production or multiple Vercel instances).

## Deploy to Vercel

1. Push this repo to GitHub and import in [Vercel](https://vercel.com).
2. Add **Upstash Redis** from the Vercel Marketplace (recommended for 300+ concurrent players).
3. Set environment variables (auto-filled if using Marketplace):

```env
UPSTASH_REDIS_REST_URL=https://...
UPSTASH_REDIS_REST_TOKEN=...
```

4. Deploy. No other config required.

## How It Works

| Layer | Tech |
|-------|------|
| Frontend | Next.js 16 App Router, React, Tailwind CSS |
| API | Next.js Route Handlers |
| State | Upstash Redis (production) / in-memory (local) |
| Sync | Client polling (~800ms) — serverless-friendly |

### Game Flow

1. **Lobby** — Players join; host adds questions and starts
2. **Countdown** — 3-second “Get ready!”
3. **Question** — Timed multiple choice; points by speed
4. **Reveal** — Correct answer highlighted (3s auto-advance)
5. **Leaderboard** — Top 5 scores; host clicks next
6. **Finished** — Final standings; host can reset to lobby

## Project Structure

```
src/
├── app/           # Pages & API routes
├── components/    # UI (AnswerButton, Leaderboard, Host/Player views)
├── hooks/         # useRoomState polling hook
└── lib/           # Game engine, Redis store, scoring
```

## API Overview

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/rooms` | Create room |
| GET | `/api/rooms/[pin]` | Public room state (also runs game ticks) |
| POST | `/api/rooms/[pin]/join` | Join as player |
| POST | `/api/rooms/[pin]/answer` | Submit answer |
| POST | `/api/rooms/[pin]/host` | Host actions (start, next, add question, …) |

## License

MIT — use freely for your events and organizations.
