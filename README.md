# Smart Bookmarks App

A real-time bookmark manager built with **Next.js + Supabase + Socket.IO**.

Users can:
- Sign in with Google (Supabase Auth)
- Add and delete personal bookmarks
- See bookmark updates sync across multiple tabs in real time

## Tech Stack

- Frontend: Next.js 14 (App Router), React 18, Tailwind CSS
- Auth + Database: Supabase (OAuth + Postgres)
- Realtime transport: Socket.IO (custom Node server)

## Project Structure

```text
.
├── app/                    # Next.js App Router pages
│   ├── page.js            # Landing + auth gate
│   └── dashboard/page.js  # Protected dashboard UI
├── components/            # Reusable UI components
├── lib/
│   ├── auth.js            # Sign-in/sign-out helpers
│   ├── bookmarks.js       # Bookmark state + socket sync hook
│   ├── socket.js          # Socket.IO client
│   └── supabase-client.js # Browser Supabase client factory
├── server/
│   ├── index.js           # Socket.IO server + Supabase writes
│   └── package.json       # Server dependencies
└── README.md
```

## Prerequisites

- npm
- Node.js 18+
- A Supabase project

## Environment Variables

Create a `.env` file in the project root:

```bash
# Frontend socket endpoint
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

# Supabase (frontend)
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY

# Optional app URL used in some OAuth/callback setups
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

The Socket.IO server (`server/index.js`) currently reads:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`

Add this to root `.env` and load accordingly:

```bash
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

## Supabase Setup

### 1. Enable Google OAuth

In Supabase Dashboard:
- `Authentication` -> `Providers` -> `Google` -> enable
- Configure Google client ID/secret and authorized redirect URLs

### 2. Create `bookmarks` table

Run this SQL in Supabase SQL editor:

```sql
create table if not exists public.bookmarks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  url text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_bookmarks_user_id on public.bookmarks(user_id);

alter table public.bookmarks enable row level security;

create policy "Users can view own bookmarks"
on public.bookmarks
for select
using (auth.uid() = user_id);

create policy "Users can insert own bookmarks"
on public.bookmarks
for insert
with check (auth.uid() = user_id);

create policy "Users can delete own bookmarks"
on public.bookmarks
for delete
using (auth.uid() = user_id);
```

## Installation

Install frontend deps:

```bash
npm install
```

Install socket server deps:

```bash
cd server
npm install
cd ..
```

## Run Locally

Start frontend (terminal 1):

```bash
npm run dev
```

Start websocket server (terminal 2):

```bash
cd server
node index.js
```

App URLs:
- Frontend: `http://localhost:3000`
- Socket server: `http://localhost:3001`

## How Auth + Realtime Flow Works

1. User signs in on `/` using Google OAuth.
2. App routes authenticated users to `/dashboard`.
3. `useBookmarks` hook connects to Socket.IO with `session.access_token`.
4. Socket server verifies token (`supabase.auth.getUser(token)`).
5. Add/delete events are written to DB server-side and broadcast to all user tabs.
6. Tabs update local state instantly from websocket events.

## Scripts

Frontend scripts (root `package.json`):
- `npm run dev` - start Next.js dev server
- `npm run build` - production build
- `npm run start` - run production server

## Problems Encountered & Solved:

### 1. Login works but dashboard shows unauthorized briefly
This is handled by an auth-check grace flow in `app/dashboard/page.js`. If you still see flicker, verify auth callback/session persistence in Supabase settings.

### 2. Realtime updates not syncing
- Ensure Socket.IO server is running on `NEXT_PUBLIC_SOCKET_URL`
- Confirm frontend and server are using the same Supabase project
- Check browser console for socket `connect_error`

### 3. Add/delete fails silently
- Check websocket server logs
- Verify `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` is valid
- Confirm RLS policies exist and table name is `public.bookmarks`

## Security Notes

- Socket auth is token-based and user-scoped on the server.
- The server currently expects a service role key via `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` (name is misleading). For production, prefer a non-`NEXT_PUBLIC_` env name and keep it server-only.
- CORS is currently permissive (`origin: "*"`) in `server/index.js`. Lock this down before production.
