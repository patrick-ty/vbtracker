# Dev Journal #0003 — Roster Management (Milestone 2)

**Date:** 2026-03-22
**Session:** Build roster CRUD page

## Summary

Built Milestone 2: Roster Management. Coaches can now add, edit, and remove players from their roster via `/roster`. Also updated the milestone plan to reflect the Supabase pivot and mark completed work.

## What Was Done

### Roster Page (`/roster`)
- **Server component** (`page.tsx`) — fetches players from Supabase on the server
- **Client component** (`roster-client.tsx`) — interactive roster UI:
  - Player list sorted by jersey number
  - Inline add form with jersey #, first/last name, position radio selector
  - Inline edit (same form, pre-populated)
  - Delete with confirmation prompt
  - Error display for failed operations
  - Empty state when no players exist
- **Server actions** (`actions.ts`):
  - `getPlayers()` — fetch all players for authenticated user
  - `addPlayer(formData)` — insert new player
  - `updatePlayer(formData)` — update existing player
  - `deletePlayer(formData)` — remove player
  - All actions verify auth via `supabase.auth.getUser()` + RLS policies
  - All mutations call `revalidatePath('/roster')` for fresh data

### UI Design
- iPad-optimized: minimum 44px touch targets on all interactive elements
- Position selector: 6-column radio grid (OH, MB, S, OPP, L, DS) with labels
- Jersey numbers displayed prominently (large blue text)
- Dashed "+" button for add, consistent with dashboard card style

### Milestone Plan Update
- Updated `docs/MILESTONES.md` to reflect:
  - Supabase instead of IndexedDB/NextAuth
  - Single-team model (no Team entity)
  - Milestones 1 and 2 marked complete

## Files Changed
```
src/app/roster/
├── actions.ts          # Server actions for player CRUD
├── page.tsx            # Server component (data fetch)
└── roster-client.tsx   # Client component (interactive UI)

docs/MILESTONES.md      # Updated for Supabase pivot, M1+M2 checked off
```

## Technical Notes
- Supabase `.select('*')` returns `{}[]` generically — needed explicit `PlayerRow[]` cast + return type annotation to satisfy TypeScript
- Used `useTransition` for non-blocking server action calls with loading states
- Form uses `action={onSubmit}` pattern (React 19 form actions via `startTransition`)

## Prerequisite from Last Session
- SQL migration has been run in Supabase Dashboard ✅

## Next Steps (Milestone 3: Match Setup + Court Diagram)
- Match creation form (opponent, date, location)
- Visual SVG court diagram (bird's eye, positions 1-6)
- Drag/tap players onto court positions for starting lineup
- Match list on dashboard (recent/in-progress)
