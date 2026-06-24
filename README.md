# FishHaven

A safe, AI-moderated Christian community platform for everyone — individuals, families, and communities, all ages, kids included. Built from the handoff bundle in `design/christian-kids-community/`.

- **Frontend**: Next.js 15 (App Router) + React 19 + custom CSS tokens
- **Auth**: Auth.js v5 — Google OAuth + magic-link email (Resend). No Supabase Auth. One login owns an **account** with multiple **profiles** (adults + children) selected via a profile picker; optional per-profile PINs; a PIN-locked admin/guardian zone.
- **Backend**: Supabase Postgres — `accounts` / `people` / `activity` / `strikes` (+ Auth.js adapter tables). All privileged access goes through `SECURITY DEFINER` RPCs callable only by `service_role`.
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
3. Apply the schema — two equivalent options:
   - **SQL editor (one-shot):** paste and run `supabase/schema.sql`.
   - **Supabase CLI (migrations):** `supabase link` then `supabase db push` applies `supabase/migrations/`.

   Either way this creates `public.accounts`, `public.people` (profiles), `public.activity`, `public.strikes`, all the identity/activity/strike RPCs (`SECURITY DEFINER`, EXECUTE granted only to `service_role`), and the `next_auth.*` tables used by the Auth.js Supabase adapter. `supabase/schema.sql` mirrors the migration; `supabase/migrations/` is the source of truth.

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

Every interaction (view, reaction, chat message, strike, prayer, doodle stroke) is logged via `POST /api/activity` into the Supabase `public.activity` table, keyed to the **active profile** (`person_id`), which the server derives from the signed `fh_active_profile` cookie and re-confirms belongs to the account. The API is server-authenticated with Auth.js — clients never touch the service-role key. Read back with `GET /api/activity?limit=50` (scoped to the active profile; requires a selected profile).

Allowed events: `view_page`, `post_reaction`, `send_chat`, `strike_triggered`, `pray_for`, `submit_prayer`, `doodle_stroke`, `join_community`, `create_post`.

## Project layout

```
app/
  layout.tsx           — root layout + global CSS
  page.tsx             — / → redirect to /login or /app
  login/page.tsx       — Google + magic-link sign-in
  app/page.tsx         — entry routing → active profile → HavenApp
  app/profiles/        — profile picker (page, PickerClient, actions)
  app/admin/           — admin/guardian zone (page, AdminGate, actions)
  app/chat/actions.ts  — server-side chat moderation + strike recording
  api/auth/[...nextauth]/route.ts  — Auth.js handlers
  api/activity/route.ts             — activity sheet POST/GET
  globals.css          — design tokens ported from the prototype
auth.config.ts         — edge-safe Auth.js config (used by middleware)
auth.ts                — full Auth.js v5 config (adapter + account provisioning)
middleware.ts          — gates /app/*
components/
  HavenApp.tsx         — top-level client shell + route state
  shell.tsx            — Sidebar, TopBar, AngelFloat
  primitives.tsx       — Angel, Avatar, Hearts, Badge, LevelPill, VerseCard
  screens/             — HomePage, DiscoverPage, CommunityPage, DoodlePage,
                         ChatPage, PrayerPage, ProfilePage, ClassroomPage
lib/
  data.ts              — seed content (communities, users, feed, etc.)
  accounts.ts          — account/profile RPC wrappers (service role, server only)
  session.ts           — signed-cookie helpers (active profile + admin unlock)
  guards.ts            — server-action authorization (active-adult / admin-unlock)
  rate-limit.ts        — in-memory rate limiter + PIN throttle
  supabase.ts          — Supabase clients (anon + service role); server only
  activity.ts          — client helper → /api/activity
supabase/
  migrations/          — F1 schema + RPCs (source of truth)
  schema.sql           — one-shot mirror of the migration
  tests/               — pgTAP tests (supabase test db)
design/                — original handoff bundle (kept for reference)
```

## Notes

- **Why "bypassing Supabase for login"?** Auth.js handles Google OAuth and magic-link email directly via Resend. Supabase Auth is not used; only Supabase's Postgres (via `@auth/supabase-adapter`) stores verification tokens and linked Google accounts.
- Chat moderation runs **server-side** (`app/app/chat/actions.ts`): the blocklist (`dumb`, `stupid`, `hate`, `shut up`) is matched on the server and the strike is recorded server-side against the active profile, so a tampered client can't fabricate or evade the persisted record. Strikes are cleared only from the admin zone. Swap the blocklist for a real classifier (e.g. an LLM moderation API), and move chat *delivery* server-side, before any real-world launch — today chat messages are still client-side demo state.
- The doodle canvas draws on a local `<canvas>` — cursors for other "friends" are simulated. Wiring real-time two-way drawing (Supabase Realtime channel or a socket) is a natural next step.
