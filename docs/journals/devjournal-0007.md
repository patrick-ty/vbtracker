# Dev Journal #0007 — Live Entry UI Polish + Header Redesign

**Date:** 2026-03-26
**Session:** UI refinements, header layout, lineup controls, button design

## Summary

Extensive polish session on the live rally entry screen. Redesigned the header layout to show event info, scoreboard, and set scores. Added lineup management (Rotate + Swap), improved point button design, fixed serve/receive toggle logic, and cleaned up button labels/ordering.

## Header Redesign

Final layout uses the same 40/60 column split as the body:

```
←  │ Event Name               │      TEAM A    –    TEAM B
   │ Date                      │         3              2
   │ [S1 25-20][S2 19-25][S3]  │
───┼──────────────────────────-─┼──────────────────────────
   │ Rally log                  │  Entry panel
```

- **Left 40%**: Exit arrow, event name (text-xl bold), date, set score pills in a horizontal row
- **Right 60%**: Scoreboard centered with team names and score (text-5xl)
- Set pills: completed sets show score, current set is solid white with "S{n}"
- Vertical divider aligns with the body column split
- Used inline styles for the flex layout to avoid Tailwind grid issues

## Lineup Management

Added three controls above the player grid:

- **Swap** (purple): Tap to enter swap mode → tap first player → tap second player → positions exchange. Uses `courtPositions` in the store.
- **Rotate ↻** (blue): One-tap clockwise rotation (pos 1→6→5→4→3→2→1). Rotates the `courtPositions` mapping.
- **SUB** (orange): Existing substitution flow.

Added `courtPositions` to the Zustand store so rotation and swap can modify position mappings that persist during the session.

## Button Improvements

- **Point buttons**: "LOST" and "WON" grouped under a "POINT" label. Solid red/green fills. "Ball Over" as full-width button below.
- **Edit mode points**: Active state is solid fill, inactive is light dashed border with "Switch to..." text. Colors consistent: red always left, green always right.
- **Score options**: Ordered low-to-high left-to-right (0 Error → 3 Perfect). Serve shows Error/In/Ace (no numbers). Block/Dig shows Fail/Success (no numbers).
- **Serve/Receive toggle**: Auto-locked after rally 1 based on sideout rules. Shows hint text "Serving (won last point)".

## Undo Moved

Undo button moved from the header to the rally log pane (left column) — sits below the last rally card. Makes more sense contextually since it affects the rally log.

## Other Changes

- Team name updated to "Wave 11 Kali" in DB
- Mock set data added to header for testing 5-set display (TODO: remove)
- Removed co-author line from commits per user preference

## Git History (this session)

```
a154ed5 Lock serve/receive toggle after rally 1 based on sideout rules
27bac30 Add Swap button: tap two players to exchange court positions
63673d5 Fix rotate: store court positions in Zustand, rotate by position mapping
186964c Add Rotate button next to SUB - rotates lineup one position clockwise
2215c64 Exit arrow on left side of event panel, event/date/sets stacked beside it
025732b Header 40/60 split aligned with body columns, no extra dividers
d69ff83 Set cards in horizontal row below event info
d395dfc Set scores as vertical cards to the right of scoreboard
...plus many header iteration commits
```

## Known Issues / Next Session

1. **Mock set data in header** — TODO remove after testing
2. **Delete touch from entry panel** — needs a Delete button when touch is selected for editing
3. **Edit allSequences** — completed sequences within a rally aren't editable yet
4. **Drag-and-drop lineup** — still on backlog, Swap is the interim solution
5. **Rally editing state** — needs cleanup for consistent behavior
6. **Player selection on serve** — works but could use clearer visual feedback
