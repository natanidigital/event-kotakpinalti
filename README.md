# KotakPinalti Event

Mobile-first football event team drawing app.

## Phase 1 included
- Next.js + TypeScript + Tailwind CSS
- Mobile-first player screen
- Wheel-of-Fortune prototype
- Player name input
- One-spin UI lock for the current page session
- Team availability cards
- `/join/[code]` route
- `/admin` prototype dashboard
- KotakPinalti event color system

## Phase 2 backend integration
- Supabase email/password admin login; server-verified session and owner RLS.
- Atomic creation of draft events with 2–12 teams, custom colors and capacities.
- Admin opens/closes events and shares `/join/[code]`.
- Player registration through server routes, with an HttpOnly event session cookie.
- Server-authoritative Balanced/Pure assignment before wheel animation.
- Repeat requests return the same stored result; capacity is enforced in PostgreSQL.
- Realtime admin roster with polling fallback; public capacity refresh every 5 seconds.

## Database setup
Apply the existing Backend Schema V1 first, then run
`supabase/migrations/002_backend_integration.sql` once in the same Supabase SQL Editor.
The migration does not remove event/player data. It revokes direct public access to
the original assignment RPC and the old availability view, adds token-verified
registration/spin RPCs, and restricts assignment writes to the atomic function.

Create an admin user in Supabase Authentication using an email/password account.
There is no public signup screen. Event ownership is tied to the authenticated
user. Public Supabase signup should be disabled if only invited admins should
create events.

The one-spin guarantee is per event session/player record. Clearing cookies or
using another browser creates a new identity; real-person deduplication requires
an additional verified identity mechanism.

## Local setup and validation
Copy `.env.example` to `.env.local` and fill the two public Supabase values.
Do not put a service-role key in either variable. This app needs no service-role key.

```sh
npm ci
npm test
npm run typecheck
npm run build
npm run dev
```

Database tests run the migration in a local PostgreSQL engine (PGlite) against the
V1 contract fixture. They verify rollback, owner isolation, token isolation,
idempotency, Balanced/Pure capacity and closed-event behavior. PGlite runs in one
process; multi-connection production contention and realtime require a live
Supabase check.

Phase 3 remains:
- event logo/banner via Storage
- QR join link
- CSV/Excel export

## Deploy
Upload all files/folders from this project to the root of:
`natanidigital/event-kotakpinalti`

Commit to `main`. The already-linked Vercel project should detect the commit and deploy automatically.
