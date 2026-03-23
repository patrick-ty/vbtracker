-- Seed data for development
-- Run AFTER migrations 001-003
-- This seeds data for the FIRST team/season found for the current user
-- Run in Supabase SQL Editor

do $$
declare
  v_team_id uuid;
  v_season_id uuid;
  v_event1_id uuid;
  v_event2_id uuid;
  v_event3_id uuid;
  v_match_id uuid;
  v_player_ids uuid[];
begin
  -- Get the first team
  select id into v_team_id from teams limit 1;
  if v_team_id is null then
    raise exception 'No team found. Complete onboarding first.';
  end if;

  -- Get the active season
  select id into v_season_id from seasons where team_id = v_team_id and is_active = true limit 1;
  if v_season_id is null then
    raise exception 'No active season found.';
  end if;

  -- ─── Players (fill to 13 if fewer exist) ────────────────────────────

  -- Only add seed players whose jersey numbers don't already exist
  insert into players (team_id, jersey_number, first_name, last_name, position)
  select v_team_id, j::int, f::text, l::text, p::text
  from (values
    (1,  'Sofia',    'Martinez',  'S'),
    (2,  'Emma',     'Chen',      'OH'),
    (3,  'Ava',      'Johnson',   'OH'),
    (4,  'Mia',      'Williams',  'MB'),
    (5,  'Isabella', 'Brown',     'MB'),
    (7,  'Olivia',   'Davis',     'OPP'),
    (8,  'Charlotte','Wilson',    'DS'),
    (9,  'Amelia',   'Taylor',    'L'),
    (10, 'Harper',   'Anderson',  'OH'),
    (11, 'Ella',     'Thomas',    'S'),
    (12, 'Luna',     'Garcia',    'MB'),
    (14, 'Chloe',    'Rodriguez', 'DS'),
    (15, 'Lily',     'Lee',       'OPP')
  ) as seed(j, f, l, p)
  where not exists (
    select 1 from players where players.team_id = v_team_id and players.jersey_number = j::int
  );

  -- ─── Events ────────────────────────────────────────────────────────

  -- Delete existing events/matches to avoid duplicates
  delete from matches where team_id = v_team_id;
  delete from events where season_id = v_season_id;

  -- Event 1: Spring Invitational (most recent)
  insert into events (season_id, name, date, location)
  values (v_season_id, 'Spring Invitational', '2026-03-22', 'Central High School')
  returning id into v_event1_id;

  -- Event 2: League Day 4
  insert into events (season_id, name, date, location)
  values (v_season_id, 'League Day 4', '2026-03-15', 'Home Gym')
  returning id into v_event2_id;

  -- Event 3: Preseason Tournament
  insert into events (season_id, name, date, location)
  values (v_season_id, 'Preseason Tournament', '2026-03-01', 'Wilson Recreation Center')
  returning id into v_event3_id;

  -- ─── Matches ───────────────────────────────────────────────────────

  -- Spring Invitational: 3 matches (1 in progress, 2 completed)
  insert into matches (team_id, season_id, event_id, opponent_name, date, location, status, is_serving_first)
  values
    (v_team_id, v_season_id, v_event1_id, 'Eastside Eagles',   '2026-03-22', 'Central High School', 'completed',   true),
    (v_team_id, v_season_id, v_event1_id, 'Northview Hawks',   '2026-03-22', 'Central High School', 'completed',   false),
    (v_team_id, v_season_id, v_event1_id, 'Westlake Panthers', '2026-03-22', 'Central High School', 'in-progress', true);

  -- League Day 4: 2 matches (completed)
  insert into matches (team_id, season_id, event_id, opponent_name, date, location, status, is_serving_first)
  values
    (v_team_id, v_season_id, v_event2_id, 'Riverside Wolves', '2026-03-15', 'Home Gym', 'completed', true),
    (v_team_id, v_season_id, v_event2_id, 'Summit Tigers',    '2026-03-15', 'Home Gym', 'completed', false);

  -- Preseason Tournament: 4 matches (completed)
  insert into matches (team_id, season_id, event_id, opponent_name, date, location, status, is_serving_first)
  values
    (v_team_id, v_season_id, v_event3_id, 'Valley Vipers',    '2026-03-01', 'Wilson Rec Center', 'completed', true),
    (v_team_id, v_season_id, v_event3_id, 'Lakewood Sharks',  '2026-03-01', 'Wilson Rec Center', 'completed', false),
    (v_team_id, v_season_id, v_event3_id, 'Hilltop Falcons',  '2026-03-01', 'Wilson Rec Center', 'completed', true),
    (v_team_id, v_season_id, v_event3_id, 'Bayshore Dolphins','2026-03-01', 'Wilson Rec Center', 'completed', false);

  -- 1 standalone scrimmage
  insert into matches (team_id, season_id, opponent_name, date, location, status, is_serving_first)
  values
    (v_team_id, v_season_id, 'JV Squad', '2026-02-20', 'Home Gym', 'completed', true);

  raise notice 'Seeded: 13 players, 3 events, 10 matches + 1 standalone';
end $$;
