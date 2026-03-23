# VBTracker — Milestone Plan

Single-team app for one coach's roster (~13-15 players).
Stack: Next.js 16, Supabase (Postgres + Auth), Zustand, Tailwind, Recharts.
Each milestone is a deployable increment. Ship early, ship often.

---

## Milestone 1: Skeleton App + Auth ✅
**Goal:** Protected shell with authentication.

- [x] Auth system (email+password, Google SSO) via Supabase Auth
- [x] Login + signup pages
- [x] Auth middleware (session refresh, route protection)
- [x] OAuth callback handler
- [x] Protected dashboard with nav
- [x] Health check endpoint (`/api/health`)
- [x] Dockerfile + Cloud Build config (deployment deferred)
- [x] SQL migration with 6 tables + RLS policies

**Ship criteria:** User can sign in, see a protected dashboard. DB schema deployed.

---

## Milestone 2: Roster Management ✅
**Goal:** Manage a roster of ~13-15 players.

- [x] `/roster` page — list players sorted by jersey number
- [x] Add player form (jersey #, first name, last name, position)
- [x] Edit player inline
- [x] Delete player with confirmation
- [x] Position selector (OH, MB, S, OPP, L, DS)
- [x] CRUD via server actions against Supabase `players` table
- [x] iPad-optimized touch targets (min 44px)

**Ship criteria:** User can add 12+ players with jersey numbers and positions, data persists across sessions.

---

## Milestone 3: Match Setup + Court Diagram
**Goal:** Start a new match with lineup and visual rotation.

- [ ] Match creation form (opponent, date, location)
- [ ] Visual SVG court diagram (bird's eye, positions 1-6)
- [ ] Drag/tap players onto court positions for starting lineup
- [ ] Match list on dashboard (recent/in-progress)

**Ship criteria:** User can create a match, set a 6-player starting lineup on a visual court, see it saved.

---

## Milestone 4: Live Rally Entry Wizard
**Goal:** Core feature — fast courtside rally-by-rally data capture.

- [ ] Sequential touch wizard (type → score → player per touch)
- [ ] Variable touches (1-3) with "Log Rally" at any point
- [ ] Point outcome (Our Point / Their Point)
- [ ] Smart touch-type suggestions
- [ ] Score display (rally count, set score)
- [ ] Undo last touch / undo last rally
- [ ] Rotation prompt on sideout + auto-rotate

**Ship criteria:** User can track a full set of rallies live, with correct scoring and rotation tracking.

---

## Milestone 5: Set & Match Flow
**Goal:** Full match lifecycle with multi-set support.

- [ ] Set transitions (first to 25, win by 2; 5th set to 15)
- [ ] New rotation setup between sets
- [ ] Match completion + summary
- [ ] Substitution tracking during sets

**Ship criteria:** User can track a full 3-5 set match from start to finish.

---

## Milestone 6: Stats Dashboard + Export
**Goal:** View aggregated stats and export raw data.

- [ ] Per-player stats (touch counts, avg scores by type)
- [ ] Per-match summary (point distribution, efficiency)
- [ ] Per-set breakdown
- [ ] Bar charts / tables (Recharts)
- [ ] Export to CSV and JSON

**Ship criteria:** After a match, user sees meaningful player stats and can export data.

---

## Milestone 7: Paper Sheet OCR Pipeline
**Goal:** Alternative data entry via photographing paper scoring sheets.

- [ ] Design printable scoring sheet template (optimized for AI extraction)
- [ ] Photo upload UI (camera capture on iPad/iPhone)
- [ ] AI vision pipeline (Claude API) to extract structured rally data
- [ ] Review/edit screen to verify extracted data before saving
- [ ] Save corrected data to same DB schema

**Ship criteria:** User can photograph a filled scoring sheet and get structured rally data imported.

---

## Milestone 8: PWA + Offline + Polish
**Goal:** Installable, offline-capable iPad app.

- [ ] PWA manifest + service worker
- [ ] Offline data entry (full functionality without network)
- [ ] iPad home screen install flow
- [ ] Responsive polish (phone, desktop)
- [ ] Performance optimization

**Ship criteria:** App installs to iPad home screen, works fully offline, syncs when back online.
