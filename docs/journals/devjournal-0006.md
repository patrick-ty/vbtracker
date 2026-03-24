# Dev Journal #0006 — Live Rally Entry Redesign (Milestone 4)

**Date:** 2026-03-23
**Session:** Rally data model, live entry UI, two-column redesign

## Summary

Built the live rally entry system (Milestone 4). Started with a modal-based approach that had poor UX, went through plan mode to redesign, and implemented a two-column layout with all controls visible simultaneously. Also restructured the rally data model to support sequences (multiple sets of touches per rally) and proper serve tracking.

## Rally Data Model

### New: Sequences Table
Rallies now contain sequences, and sequences contain touches:
```
Rally (serve to point)
  ├── Sequence 1 (is_serve=true): serve touch
  ├── Sequence 2: up to 3 touches (pass/set/attack)
  ├── Sequence 3: up to 3 touches (ball came back)
  └── ...until point scored
```

**Migrations:**
- `004_substitutions.sql` — substitutions table for lineup changes
- `005_sequences.sql` — sequences table between rallies and touches, reparented touches from rally_id to sequence_id, added server_jersey_number to rallies

### Serve Model
Serves are their own sequence with result: Ace (our point), In (play continues), Error (their point). Not scored on the 0-3 scale — just 3 outcomes.

### Touch Scoring by Type
- **Pass/Set/Attack**: 0-3 scale (Error, Poor, Good, Perfect)
- **Block/Dig**: Binary (Success/Fail)
- **Serve**: Ace/In/Error

## Live Entry UI — Redesign

### Problem
Original implementation used bottom modals for each step (serve score, touch type, touch score, outcome). This forced the operator to bounce between the player bar at the top and modals at the bottom — too slow for courtside use.

### Solution: Two-Column Layout (iPad Landscape)
```
┌────────────────────────────────────────────────────────┐
│  11 KALI          3 – 2          WESTLAKE PANTHERS     │
│  Spring Invitational · Mar 22        Set 1 · Rally 6   │
├──────────────────────┬─────────────────────────────────┤
│  Rally Log (40%)     │  Entry Panel (60%)              │
│  - Completed rallies │  [Serving ←→ Receiving] toggle  │
│  - Current rally     │  Player grid (court positions)  │
│                      │  Type row (PAS/SET/ATK/BLK/DIG) │
│                      │  Score row (dynamic by type)    │
│                      │  [Their Point][Ball Over][Our Point] │
│                      │  [Undo] [SUB]                   │
└──────────────────────┴─────────────────────────────────┘
```

### Key Design Decisions
- **All controls visible simultaneously** — no modals, no hiding
- **Selection model** — replaced entryStep state machine with selectedPlayer/selectedType
- **3 taps per touch**: player → type → score (auto-commits)
- **Court position player grid**: 2x3 mirroring front/back row
- **Serve/Receive auto-sets** from sideout rules: win = serve next, lose = receive next
- **Ball Over button**: closes current sequence (even at <3 touches) when ball goes over net
- **Point buttons always visible**: Their Point / Our Point end the rally at any time
- **Ace/Error auto-point**: serve aces and errors automatically log the point

### Component Architecture
```
live-entry-client.tsx          — layout shell (two-column flex)
  components/
    LiveHeader.tsx             — scoreboard + context
    RallyLog.tsx               — left column
    RallyCard.tsx              — completed rally display (tappable to edit)
    CurrentRallyCard.tsx       — in-progress rally with edit chips
    EntryPanel.tsx             — right column container
    ServeReceiveToggle.tsx     — auto-set toggle with override
    PlayerGrid.tsx             — court position layout
    TypeRow.tsx                — 5 type buttons
    ScoreRow.tsx               — dynamic by type
    PointButtons.tsx           — point + ball over (+ flip in edit mode)
    UtilityRow.tsx             — undo + sub (+ save/cancel in edit mode)
```

### Store: Selection Model
Replaced `entryStep` state machine with:
```typescript
selectedPlayer: number | null;
selectedType: TouchType | null;
editTarget: null | { kind: 'serve' } | { kind: 'touch'; index: number };
editingRallyIndex: number | null;
subState: null | { step: 'pick_in' } | { step: 'pick_out'; playerIn: number };
```

Phase is derived: `isServing && !serve` = serve_entry, otherwise touch_entry.

## Rally Editing
- **Tap completed rally card** → enters edit mode, card highlights blue
- **Edit touches**: tap individual touch chips to select, modify via entry panel
- **Delete rally**: button on rally card footer when editing
- **Flip point**: point buttons show current assignment, tap other team to flip
- **Delete touch/serve**: available when selected (WIP — needs to be in entry panel)

## Sideout Logic
Simple rule: `win point → we serve next, lose point → we receive next`. The toggle auto-sets accordingly and is overridable.

## Other Changes
- Team-scoped roster: `/teams/[id]/roster` route, roster removed from profile menu
- Match overview page: `/matches/[id]` with result banner, set list, lineup, details
- Set detail page: `/matches/[id]/sets/[number]` with rally timeline, player stats, rotations
- Set-level lineup editor: `/matches/[id]/sets/[number]/lineup`
- 11 Kali roster seeded from real data (wavevb.com)
- GitHub remote added: `https://github.com/patrick-ty/vbtracker.git`

## Files Created/Modified

```
New:
  src/app/matches/[id]/live/components/  — 11 component files
  src/app/matches/[id]/page.tsx          — match overview
  src/app/matches/[id]/sets/[number]/    — set detail + lineup
  src/app/teams/[id]/roster/page.tsx     — team-scoped roster
  supabase/migrations/004_substitutions.sql
  supabase/migrations/005_sequences.sql
  supabase/seed_11kali_roster.sql

Rewritten:
  src/stores/matchStore.ts               — selection model (from entryStep machine)
  src/app/matches/[id]/live/live-entry-client.tsx — two-column layout
  src/app/matches/[id]/live/page.tsx     — loads rally log from DB
  src/lib/types.ts                       — score options by type, serve labels
```

## Git History
```
d8514be Add flip point and point buttons during rally editing
8d98745 Add delete rally, ball over, serve labels, sequence display fixes
02ed8dc Redesign live rally entry: two-column layout, selection model, no modals
a2de5ff WIP: Live rally entry, match/set views, sequences model (Milestone 4)
cc1174e Add dev journal #0005 — domain restructure and dashboard session
939c71a Add multi-team domain model, coach/team dashboards, seasons, events (Milestone 3)
461558d Add roster management with photo upload and crop (Milestone 2)
```

## Known Issues / Next Session
1. **Delete touch from entry panel** — currently delete buttons are on the rally card chips, should be a Delete button in the entry panel when a touch is selected
2. **Edit allSequences** — editing touches in completed sequences within a rally doesn't work yet (only current sequence is editable)
3. **Rally editing state** — `editRally` loads data into the store but the RallyCard shows a mix of saved + live data that can be confusing
4. **Drag-and-drop lineup** — requested for court position assignment
5. **Dev journal update for MILESTONES.md** — milestone plan is stale
6. **UI polish** — typography hierarchy is better but still needs refinement on some screens
