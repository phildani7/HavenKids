# FishHaven

A safe, AI-moderated Christian community platform for kids ages 7–18. Built from the handoff bundle in `design/christian-kids-community/`.

- **Frontend**: Next.js 15 (App Router) + React 19 + custom CSS tokens
- **Auth**: Auth.js v5 — Google OAuth + magic-link email (Resend). No Supabase Auth.
- **Backend**: Supabase Postgres (activity sheet + Auth.js adapter tables only)
- **Hosting**: Vercel (Fluid Compute, Node.js 24)

The UI port includes every screen from the prototype: home dashboard, discover, per-community (feed / classroom / doodle wall / chat / members / calendar / leaderboard / about), two-way doodle canvas, chat with the three-strike **Gabriel** moderation flow, prayer wall, profile, parents dashboard, classroom, and the floating Gabriel with live strike count.

## 1. Install

```bash
npm install
```

Requires Node 20+.

## 2. Configure environment

Copy the template and fill in values:

```bash
cp .env.example .env.local
```

### Auth.js secret

```bash
# macOS / Linux / Git Bash
openssl rand -base64 32
# PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Paste into `AUTH_SECRET`.

### Google OAuth

1. Go to <https://console.cloud.google.com/apis/credentials>
2. **Create Credentials → OAuth client ID → Web application**
3. Authorised JavaScript origin: `http://localhost:3000` (and your prod URL)
4. Authorised redirect URI:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://<your-vercel-domain>/api/auth/callback/google`
5. Copy the client ID and secret into `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.

### Resend (magic email links)

1. Sign up at <https://resend.com> and create an API key.
2. Paste into `AUTH_RESEND_KEY`.
3. `AUTH_EMAIL_FROM` — either `onboarding@resend.dev` for testing, or a verified sender on your own domain.

### Supabase

1. Create a project at <https://supabase.com>.
2. **Settings → API** → copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`
3. **SQL editor** → paste and run the contents of `supabase/schema.sql`. This creates the `public.activity` table (the activity sheet) and the `next_auth.*` tables used by the Auth.js Supabase adapter.

## 3. Run locally

```bash
npm run dev
```

Open <http://localhost:3000>. You'll be redirected to `/login`. Sign in with Google or request a magic link.

## 4. Deploy to Vercel

```bash
npm i -g vercel
vercel link
vercel env pull .env.local     # pull any already-set env
vercel deploy                   # preview
vercel deploy --prod            # production
```

Set all the env vars in **Vercel → Project → Settings → Environment Variables**, then redeploy. Don't forget to add the production URL as an allowed Google OAuth redirect.

## 5. Activity sheet

Every interaction (view, reaction, chat message, strike, prayer, doodle stroke) is logged via `POST /api/activity` into the Supabase `public.activity` table. The API is server-authenticated with Auth.js — clients never touch the service-role key. Read back with `GET /api/activity?limit=50` (scoped to the signed-in user by email).

Allowed events: `view_page`, `post_reaction`, `send_chat`, `strike_triggered`, `pray_for`, `submit_prayer`, `doodle_stroke`, `join_community`, `create_post`.

## Project layout

```
app/
  layout.tsx           — root layout + global CSS
  page.tsx             — / → redirect to /login or /app
  login/page.tsx       — Google + magic-link sign-in
  app/page.tsx         — authenticated shell (renders HavenApp)
  api/auth/[...nextauth]/route.ts  — Auth.js handlers
  api/activity/route.ts             — activity sheet POST/GET
  globals.css          — design tokens ported from the prototype
auth.ts                — Auth.js v5 config
middleware.ts          — gates /app/*
components/
  HavenApp.tsx         — top-level client shell + route state
  shell.tsx            — Sidebar, TopBar, AngelFloat
  primitives.tsx       — Angel, Avatar, Hearts, Badge, LevelPill, VerseCard
  screens/             — HomePage, DiscoverPage, CommunityPage, DoodlePage,
                         ChatPage, PrayerPage, ProfilePage, ParentsPage,
                         ClassroomPage
lib/
  data.ts              — seed content (communities, users, feed, etc.)
  supabase.ts          — admin Supabase client (service role, server only)
  activity.ts          — client helper → /api/activity
supabase/schema.sql    — one-shot SQL to provision Postgres
design/                — original handoff bundle (kept for reference)
```

## Notes

- **Why "bypassing Supabase for login"?** Auth.js handles Google OAuth and magic-link email directly via Resend. Supabase Auth is not used; only Supabase's Postgres (via `@auth/supabase-adapter`) stores verification tokens and linked Google accounts.
- The strike modal triggers on a small demo blocklist (`dumb`, `stupid`, `hate`, `shut up`). Swap in a real classifier (e.g. an LLM moderation API) before any real-world launch.
- The doodle canvas draws on a local `<canvas>` — cursors for other "friends" are simulated. Wiring real-time two-way drawing (Supabase Realtime channel or a socket) is a natural next step.
