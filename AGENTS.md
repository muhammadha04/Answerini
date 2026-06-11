<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Cursor Cloud specific instructions

Answerini is a single Next.js 16 app (npm). See `README.md` for full Supabase setup.

### Services

| Service | Required locally? | Notes |
|---------|-------------------|-------|
| Next.js dev server | Yes | `npm run dev` → http://localhost:3000 |
| Supabase (hosted) | Yes for auth/saved games | Copy `.env.example` → `.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Run `supabase/schema.sql` once in the Supabase SQL Editor. |
| Upstash Redis | No | Optional locally; live rooms use in-memory store (`src/lib/store.ts`) when Redis env vars are unset. |

### Commands

- Install: `npm install`
- Dev: `npm run dev`
- Lint: `npm run lint` (currently reports pre-existing React hooks lint errors in components)
- Build: `npm run build`
- Production: `npm run start` (after build)

### Local dev without Supabase credentials

Homepage, `/join`, and anonymous live rooms via `POST /api/rooms` (no `savedGameId`) work with placeholder Supabase env vars. Host login (`/login`, `/host`) and saved games require real Supabase credentials and schema.

### Hello-world smoke test (no auth)

```bash
# Create room, add question, join player (in-memory store)
ROOM=$(curl -s -X POST http://localhost:3000/api/rooms -H 'Content-Type: application/json' -d '{"title":"Smoke Test"}')
PIN=$(echo "$ROOM" | python3 -c "import sys,json; print(json.load(sys.stdin)['pin'])")
HOST_TOKEN=$(echo "$ROOM" | python3 -c "import sys,json; print(json.load(sys.stdin)['hostToken'])")
curl -s -X POST "http://localhost:3000/api/rooms/$PIN/host" -H 'Content-Type: application/json' \
  -d "{\"action\":\"addQuestion\",\"hostToken\":\"$HOST_TOKEN\",\"text\":\"2+2?\",\"options\":[{\"text\":\"3\"},{\"text\":\"4\"}],\"correctIndex\":1}"
curl -s -X POST "http://localhost:3000/api/rooms/$PIN/join" -H 'Content-Type: application/json' -d '{"name":"Tester"}'
curl -s "http://localhost:3000/api/rooms/$PIN" | python3 -m json.tool
```
