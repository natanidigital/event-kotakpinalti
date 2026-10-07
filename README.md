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

## Important
The current wheel uses browser-side prototype randomness only. Do **not** use it for a real event yet.

The next phase adds Supabase:
- events / teams / players / assignments tables
- atomic server-side assignment
- Balanced Random and Pure Random
- hard team capacity enforcement
- persistent anti-double-spin protection
- Supabase Realtime admin report
- admin authentication
- event logo/banner via Storage
- QR join link
- CSV/Excel export

## Deploy
Upload all files/folders from this project to the root of:
`natanidigital/event-kotakpinalti`

Commit to `main`. The already-linked Vercel project should detect the commit and deploy automatically.
