# Answerini

A free, self-hosted live quiz platform — a Kahoot alternative built for large events (300+ players) with saved games, login, and no paid tier limits.

## Features

- **User accounts** — Sign up / log in with Supabase Auth
- **Saved games** — Build quiz templates once, reuse every time you host
- **Host dashboard** — Go live from any saved game with one click
- **Player join** — Enter 6-digit PIN + nickname (no account required)
- **Real-time gameplay** — Live sync, countdown, timers, Kahoot-style scoring
- **Leaderboards** — Top 5 after every question, final podium
- **Scale-ready** — Up to 500 players per live session (Upstash Redis on Vercel)

## Setup

### 1. Supabase (auth + saved games)

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run the full script in [`supabase/schema.sql`](supabase/schema.sql)
3. In **Authentication → Providers**, enable Email
4. Copy **Project URL** and **anon public key** from **Settings → API**

### 2. Environment variables

Copy `.env.example` to `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
UPSTASH_REDIS_REST_URL=        # optional locally, required on Vercel for 300+ players
UPSTASH_REDIS_REST_TOKEN=
```

### 3. Run locally

```bash
npm install
npm run dev
```

- **Players:** `/join`
- **Hosts:** `/login` → `/host` → create/edit saved games → **Go Live**

## Deploy to Vercel

1. Import the GitHub repo
2. Add env vars: Supabase URL + anon key, Upstash Redis (Marketplace)
3. In Supabase **Authentication → URL Configuration**, add your Vercel domain to **Site URL** and **Redirect URLs**

## Workflow

```
Sign up → Create saved game → Add questions → Save
                ↓
         Go Live (creates PIN room with questions pre-loaded)
                ↓
         Share PIN → Players join → Start game
```

Live session state uses Redis; saved games and accounts use Supabase Postgres with Row Level Security.

## SQL Schema

Run [`supabase/schema.sql`](supabase/schema.sql) once in Supabase. It creates:

| Table | Purpose |
|-------|---------|
| `profiles` | User profile (auto-created on signup) |
| `saved_games` | Reusable quiz templates per user |
| `saved_questions` | Questions + answers (JSON options) |

## License

MIT
