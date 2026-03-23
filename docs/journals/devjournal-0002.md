# Dev Journal #0002 — Supabase Migration + Auth + Milestone Plan

**Date:** 2026-03-22
**Session:** Stack pivot to Supabase, auth implementation, milestone restructure

## Summary

Pivoted from Dexie.js/IndexedDB to **Supabase** (Postgres + built-in auth). Added login/signup pages, auth middleware, and a full SQL migration. Restructured the implementation from a big-bang plan into 8 incremental milestones. Confirmed the app builds and runs locally.

## What Was Done

### Stack Change: Dexie.js → Supabase
- **Why:** Rally data is deeply relational (Match→Set→Rally→Touch→Player). Analytics queries (avg scores, efficiency by position, trends) need SQL aggregation — painful in Firestore/IndexedDB, trivial in Postgres.
- Removed `dexie` package, deleted `src/lib/db.ts`
- Installed `@supabase/supabase-js` and `@supabase/ssr`
- Created Supabase client utilities:
  - `src/lib/supabase/client.ts` — browser client
  - `src/lib/supabase/server.ts` — server client (cookies-based)
  - `src/lib/supabase/middleware.ts` — session refresh + route protection

### Single-Team Simplification
- User clarified: this is a **single-team app** (~13-15 players + coach)
- Removed `Team` entity entirely — no team CRUD, no team selection
- `Player` no longer has `teamId` — uses `user_id` (the coach's auth ID)
- Nav changed from "Teams" to "Roster"

### Auth (Milestone 1)
- **Login page** (`/login`) — email+password + Google SSO button
- **Signup page** (`/signup`) — email+password with confirm
- **Auth callback** (`/auth/callback/route.ts`) — handles OAuth code exchange
- **Middleware** (`src/middleware.ts`) — redirects unauthenticated users to `/login`, redirects logged-in users away from login/signup
- Public routes: `/login`, `/signup`, `/auth/callback`, `/api/health`

### Database Schema
- SQL migration at `supabase/migrations/001_initial_schema.sql`
- **6 tables:** players, matches, sets, rallies, touches, rotations
- All tables have RLS enabled with policies that chain through the hierarchy
- TypeScript DB types at `src/lib/database.types.ts` with Row/Insert/Update + Relationships

### CI/CD Pipeline (created but deployment deferred)
- `Dockerfile` — multi-stage build for Cloud Run
- `cloudbuild.yaml` — builds image, pushes to GCR, deploys to Cloud Run
- `next.config.ts` — `output: "standalone"` for Docker
- **Decision:** Defer deployment until local version is fully working

### Milestone Plan
- Created `docs/MILESTONES.md` with 8 incremental milestones
- User preference: no big-bang approach, each milestone is deployable

## Architecture Decisions

| Decision | Choice | Why |
|----------|--------|-----|
| Database | Supabase Postgres | Relational data, SQL analytics, built-in auth |
| Auth | Supabase Auth | Email+password + Google SSO out of the box |
| State mgmt | Zustand | Lightweight, good for real-time rally entry |
| Styling | Tailwind CSS | iPad-first, utility classes for large touch targets |
| Framework | Next.js 16 App Router | SSR, API routes, middleware for auth |
| Deploy target | Google Cloud Run | Deferred until local is working |

## Supabase Project
- **Project ref:** `smypsbvwqnxcyrlkbajd`
- **URL:** `https://smypsbvwqnxcyrlkbajd.supabase.co`
- **Env vars:** in `.env.local` (gitignored)

## Current File Structure
```
src/
├── app/
│   ├── api/health/route.ts      # Health check endpoint
│   ├── auth/callback/route.ts   # OAuth callback
│   ├── login/page.tsx           # Login (email + Google)
│   ├── signup/page.tsx          # Signup with confirm
│   ├── globals.css
│   ├── layout.tsx               # Root layout, iPad viewport
│   └── page.tsx                 # Dashboard (protected)
├── lib/
│   ├── database.types.ts        # Supabase DB types (Row/Insert/Update)
│   ├── types.ts                 # UI constants (touch types, scores, labels)
│   └── supabase/
│       ├── client.ts            # Browser Supabase client
│       ├── middleware.ts        # Auth session + route guards
│       └── server.ts           # Server Supabase client
├── middleware.ts                # Next.js middleware (auth redirect)
└── stores/
    └── matchStore.ts            # Zustand store (uses Supabase for persistence)

Other key files:
├── Dockerfile                   # Multi-stage build for Cloud Run
├── cloudbuild.yaml              # Cloud Build pipeline (deferred)
├── supabase/migrations/001_initial_schema.sql  # DB schema + RLS
├── docs/MILESTONES.md           # 8-milestone plan
└── .env.local                   # Supabase URL + anon key (gitignored)
```

## Git History
```
be27f06 Add Supabase auth + database schema (Milestone 1)
c8b0226 Bootstrap project: data layer, CI/CD pipeline, milestone plan
d15e78e Initial commit from Create Next App
```

## Pending / Blockers

### Must do before continuing:
1. **Run SQL migration** — paste `supabase/migrations/001_initial_schema.sql` into Supabase Dashboard → SQL Editor → Run. Tables + RLS policies need to exist for auth and data to work.
2. **Test auth end-to-end** — sign up, sign in, verify middleware redirects work with real Supabase connection.

### Next milestone (Milestone 2: Roster Management):
- `/roster` page — list players, add/edit/remove
- Player form: jersey number, first name, last name, position (OH/MB/S/OPP/L/DS)
- CRUD operations against Supabase `players` table
- ~13-15 players per roster

### Deferred:
- CI/CD deployment to Cloud Run (until local is solid)
- Google SSO setup in Supabase (needs OAuth credentials in Supabase dashboard)
- PWA / offline support (Milestone 8)

## Environment Notes
- Node v25.6.1 at `/opt/homebrew/bin` — must add to PATH in shell commands
- `ls` aliased to `colorls` — use `/bin/ls` or `find` in scripts
- Next.js 16.2.1 — shows deprecation warning about middleware → proxy convention (non-blocking)
- Preview server config: `.claude/launch.json` uses `/bin/sh -c` wrapper for PATH
