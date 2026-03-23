# Dev Journal #0005 — Domain Restructure + Multi-Team + Dashboards

**Date:** 2026-03-23
**Session:** Major domain pivot, coach/team dashboards, seasons, events, UI polish

## Summary

Restructured the entire domain model from single-team/user-owned to a proper multi-team SaaS architecture. Built two-tier dashboard (coach → team), added seasons, events, onboarding, settings, team/season switching, and iPad layout optimization. Seeded realistic test data across multiple teams and past seasons.

## Domain Model Change

### Before
```
auth.users
  └── players (user_id)
  └── matches (user_id)
```

### After
```
auth.users
  └── team_members (user_id, team_id, role)

teams (id, name, created_by)
  ├── players (team_id)
  ├── seasons (team_id, name, is_active)
  │     └── events (season_id, name, date_start, date_end, location)
  └── matches (team_id, season_id, event_id)
        └── sets → rallies → touches
```

### Roles
- `head_coach` — full CRUD, team owner
- `assistant_coach` — full CRUD for stat entry
- `viewer` — read-only (parents, players)

### Key Design Decisions
- **Coaches can manage multiple teams** (e.g., 17U + 11U) — each with own roster, staff, viewers
- **Seasons are explicit** — coach creates them (e.g., "2025-2026"), one is active per team
- **Events are multi-day** — `date_start` + optional `date_end` for tournaments spanning days
- **Matches can be standalone** — `event_id` is nullable for scrimmages
- **Active team stored in cookie** — persists across sessions via `vbt-active-team`
- **RLS uses helper functions** — `user_team_ids()` and `user_coach_team_ids()` for clean policies

## What Was Built

### Coach Dashboard (`/`)
- Shows all teams the coach manages
- **Current/Past tabs** — current = teams with active season, past = no active season
- **Season filter dropdown** on Past tab
- Team cards show: name, season, player count, match count, live badge
- "+ Add Team" links to onboarding

### Team Dashboard (`/teams/[id]`)
- **Season switcher** in header (dropdown when multiple seasons)
- **Events** as collapsible sections with date range, location, match count
- **Match rows**: W/L indicator, opponent name, set record (bold), individual set scores as tappable pills
- Set pills link to `/matches/[id]/sets/[number]` (not built yet)
- Match rows link to `/matches/[id]` (not built yet)
- "+ New Match" and "+ New Event" buttons
- Most recent event expanded by default

### Match Setup (Milestone 3)
- **Quick-start creation** — creates match instantly, opponent name optional
- **SVG court diagram** — bird's-eye view, positions 1-6, tap to assign players
- **Player picker** — side-by-side with court on tablet
- **Editable match details** — collapsible panel for opponent, date, location, serve-first
- Lineup can be saved with fewer than 6 players

### Other Features
- **Onboarding** (`/onboarding`) — team name + first season, accessible anytime for adding teams
- **Settings** (`/settings`) — edit team name, view role
- **User menu** — avatar dropdown with team switcher, roster link, settings, sign out
- **Light theme forced** — removed dark mode media query

### iPad Layout Pass
- Dashboard: two-column match lists, compact header
- Roster: two-column player grid, forms span full width
- Lineup: court + player picker side by side in landscape
- All touch targets ≥ 44px

## SQL Migrations

### 002_teams.sql
- Created `teams` and `team_members` tables
- Migrated `players` and `matches` from `user_id` to `team_id`
- Replaced all RLS policies with team-membership-based policies
- Updated avatar storage policies

### 003_seasons_events.sql
- Created `seasons` table (team_id, name, date_start, date_end, is_active)
- Created `events` table (season_id, name, date_start, date_end, location)
- Added `season_id` and `event_id` to matches
- Backfilled default "2025-2026" season per team

### Seed Data
- `seed.sql` — 13 players, 3 events, 10 matches + 1 standalone for current team
- `seed_past_teams.sql` — 3 past teams (15U Thunder, 13U Blaze, 11U Wildcats) across 2023-2025
- `seed_match_sets.sql` — 2-3 sets with realistic scores for all completed matches

## Files Created/Modified

```
New:
  src/lib/auth.ts                          # Team context, multi-team support, cookie-based team selection
  src/app/page.tsx                         # Coach dashboard (rewritten)
  src/app/coach-dashboard-client.tsx       # Current/Past tabs, team cards
  src/app/user-menu.tsx                    # Avatar dropdown with team switcher
  src/app/team-switcher-action.ts          # Server action to switch active team
  src/app/teams/[id]/page.tsx              # Team dashboard
  src/app/teams/[id]/dashboard-client.tsx  # Event groups, match list with W/L + set pills
  src/app/teams/[id]/season-switcher.tsx   # Season dropdown
  src/app/teams/[id]/season-switcher-action.ts
  src/app/matches/actions.ts               # Match CRUD (quick create, update)
  src/app/matches/new/page.tsx             # Auto-create + redirect
  src/app/matches/[id]/lineup/page.tsx     # Lineup server component
  src/app/matches/[id]/lineup/lineup-client.tsx  # Court diagram + player picker
  src/app/seasons/actions.ts               # Season + event CRUD
  src/app/settings/page.tsx                # Settings page
  src/app/settings/actions.ts              # Update team name
  src/app/settings/settings-form.tsx       # Settings form
  src/app/onboarding/page.tsx              # Team + season creation (updated)
  src/app/onboarding/actions.ts            # Creates team + membership + season
  supabase/migrations/002_teams.sql
  supabase/migrations/003_seasons_events.sql
  supabase/seed.sql
  supabase/seed_past_teams.sql
  supabase/seed_match_sets.sql

Modified:
  src/app/roster/actions.ts                # Uses team_id via requireTeam()
  src/app/roster/roster-client.tsx         # iPad layout, two-column grid
  src/lib/database.types.ts                # Added teams, team_members, seasons, events; matches has season_id/event_id
  src/lib/supabase/middleware.ts           # Onboarding redirect for new users
  src/app/globals.css                      # Removed dark mode
  supabase/migrations/001_initial_schema.sql  # Reference updates
```

## Git History
```
939c71a Add multi-team domain model, coach/team dashboards, seasons, events (Milestone 3)
461558d Add roster management with photo upload and crop (Milestone 2)
e4d5cfc Add dev journal #0002 — session context for continuity
be27f06 Add Supabase auth + database schema (Milestone 1)
c8b0226 Bootstrap project: data layer, CI/CD pipeline, milestone plan
d15e78e Initial commit from Create Next App
```

## Next Steps

### Immediate (Milestone 4 prep)
- Build match overview page (`/matches/[id]`) — match summary, set list, lineup
- Build set detail page (`/matches/[id]/sets/[number]`) — rally timeline, player stats
- These are the pages linked from the team dashboard

### Milestone 4: Live Rally Entry Wizard
- Sequential touch wizard (type → score → player)
- Point outcome tracking
- Score display + undo
- Rotation management on sideout

### Deferred
- Update MILESTONES.md to reflect domain restructure and new milestones
- CI/CD deployment
- PWA / offline support
- Viewer role invite flow (parents/players)
- Career stats across teams/seasons
