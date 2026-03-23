# Dev Journal #0001 — Project Bootstrap

**Date:** 2026-03-22
**Session:** Initial setup

## What Was Done

### Project Initialization
- Created Next.js 14+ app with TypeScript, Tailwind CSS, App Router, src directory
- Installed core dependencies: Dexie.js (IndexedDB), Zustand (state), Recharts (charts), uuid
- Node.js v25.6.1 via `/opt/homebrew/bin`

### Data Layer
- **`src/lib/types.ts`** — Full TypeScript type definitions:
  - Team, Player, Match, GameSet, Rally, Touch, Rotation
  - TouchType enum: serve, pass, set, attack, block, dig
  - TouchScore: 0-3 (Error, Poor, Good, Perfect)
  - PlayerPosition: OH, MB, S, OPP, L, DS
  - Helper: `suggestTouchType()` for smart defaults in rally wizard
- **`src/lib/db.ts`** — Dexie.js schema v1 with 7 indexed tables
- **`src/stores/matchStore.ts`** — Zustand store for live match state:
  - Touch entry (type/score/player), rally logging, score tracking
  - Rotation management (standard VB rotation 1→6→5→4→3→2→1)
  - Undo last rally, sideout detection, serve tracking

### UI Shell
- **`src/app/layout.tsx`** — iPad-optimized viewport (no zoom/scale)
- **`src/app/page.tsx`** — Dashboard with "New Match" and "Manage Teams" cards

## Architecture Decisions
- **Local-first storage** (IndexedDB via Dexie) — works offline, sync later
- **Zustand over Redux** — lighter weight for real-time rally entry
- **App Router** — using Next.js app directory with client components for interactive pages
- **iPad-first** — large touch targets, landscape-optimized, no pinch-zoom

## Known Issues
- No auth yet (planned for Milestone 1)
- No CI/CD yet (planned for Milestone 1)
- No PWA config yet (later milestone)
- `ls` aliased to `colorls` on this machine — use `/bin/ls` in scripts
- `npx`/`node` require `/opt/homebrew/bin` in PATH

## Current File Structure
```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx       # Root layout, iPad viewport
│   └── page.tsx         # Dashboard home
├── lib/
│   ├── db.ts            # Dexie IndexedDB schema
│   └── types.ts         # All TypeScript types + helpers
└── stores/
    └── matchStore.ts    # Zustand live match state
```

## Next Steps
- See milestone plan in docs/MILESTONES.md
- Milestone 1: Skeleton app with auth + CI/CD to Cloud Run
