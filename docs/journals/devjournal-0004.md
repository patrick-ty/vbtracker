# Dev Journal #0004 — Match Setup, Court Diagram, Domain Restructure

**Date:** 2026-03-23
**Session:** Milestone 3 + teams/roles architecture

## Summary

Built Milestone 3 (match creation, SVG court diagram, lineup selection, match list on dashboard). Then restructured the entire domain model from user-based ownership to team-based, adding teams, team_members (with roles), and an onboarding flow.

## What Was Done

### Milestone 3: Match Setup + Court Diagram
- **Quick-start match creation** — "New Match" instantly creates a match and goes to lineup. Opponent name and details are optional, editable later via collapsible panel on the lineup page.
- **SVG court diagram** — bird's-eye volleyball court with positions 1-6. Tap a position to assign a player from the roster. Tap an assigned position to remove. Shows jersey number + last name on filled positions.
- **Player picker** — grid of available (unassigned) players with avatars, jersey numbers, names, and positions.
- **Fewer than 6 allowed** — lineup can be saved with any number of players (or skipped entirely).
- **Match list on dashboard** — in-progress and completed matches shown with opponent name, date, location, and status badge.
- **Dashboard converted to server component** — fetches matches server-side. Sign-out button extracted to separate client component.

### Domain Restructure: Teams + Roles
- **New `teams` table** — `id`, `name`, `created_by`, `created_at`
- **New `team_members` table** — `team_id`, `user_id`, `role` (head_coach, assistant_coach, viewer), unique constraint on (team_id, user_id)
- **Migrated ownership** — `players` and `matches` now FK to `team_id` instead of `user_id`
- **SQL migration 002** — creates tables, backfills existing data (creates a "My Team" for each existing user), drops old columns and indexes, replaces all RLS policies
- **RLS policies redesigned** — uses `user_team_ids()` and `user_coach_team_ids()` helper functions. Viewers can SELECT, coaches can do all CRUD. Child tables (sets, rallies, touches, rotations) trace up through matches.team_id.
- **Storage policies updated** — avatar paths now use team_id instead of user_id

### Auth Helper
- **`src/lib/auth.ts`** — `getTeamForUser()` returns `{ supabase, userId, teamId, teamName, role }` or null if not onboarded. `requireTeam()` throws if no team.
- Replaced `getAuthUserId()` in roster and match actions with `requireTeam()`

### Onboarding Flow
- **Middleware** — checks `team_members` for authenticated users. No membership → redirect to `/onboarding`. Already onboarded → redirect away from `/onboarding`.
- **`/onboarding` page** — welcome screen with team name input. Creates team + head_coach membership, redirects to `/roster`.
- **Dashboard header** — now shows team name instead of "VBTracker"

## Architecture: Entity Relationship

```
auth.users
    |
    +-- team_members (user_id, team_id, role)
    |
teams (id, name, created_by)
    |
    +-- players (team_id)
    +-- matches (team_id)
            |
            +-- sets (match_id)
                  |
                  +-- rallies (set_id)
                  |     +-- touches (rally_id)
                  +-- rotations (set_id)
```

### Roles
- `head_coach` — full CRUD, team owner
- `assistant_coach` — full CRUD (same permissions for stat entry)
- `viewer` — read-only (for parents, players granted access later)

## Files Changed/Created

```
New:
  src/lib/auth.ts                           # Team context helper
  src/app/onboarding/page.tsx               # Onboarding UI
  src/app/onboarding/actions.ts             # Team creation action
  src/app/matches/actions.ts                # Match CRUD actions
  src/app/matches/new/page.tsx              # Quick-start match creation
  src/app/matches/[id]/lineup/page.tsx      # Lineup server component
  src/app/matches/[id]/lineup/lineup-client.tsx  # Court diagram + player picker
  src/app/sign-out-button.tsx               # Extracted client component
  supabase/migrations/002_teams.sql         # Teams migration

Modified:
  src/app/page.tsx                          # Dashboard with match list + team name
  src/app/roster/actions.ts                 # Uses team_id via requireTeam()
  src/lib/database.types.ts                 # Added teams, team_members; players/matches use team_id
  src/lib/supabase/middleware.ts            # Onboarding redirect logic
  supabase/migrations/001_initial_schema.sql  # opponent_name default ''
```

## SQL to Run in Supabase

Run the contents of `supabase/migrations/002_teams.sql` in the Supabase SQL Editor. This will:
1. Create `teams` and `team_members` tables
2. Backfill existing users with a "My Team" team
3. Migrate players/matches from user_id to team_id
4. Replace all RLS policies
5. Update storage policies for avatars

## Next Steps
- Test the full flow: sign in → onboarding → add roster → create match → lineup
- Milestone 4: Live Rally Entry Wizard
