-- Seed past teams with past seasons for testing the Past tab
-- Run in Supabase SQL Editor

do $$
declare
  v_user_id uuid;
  v_team_id uuid;
  v_season_id uuid;
  v_event_id uuid;
begin
  -- Get the current user
  select created_by into v_user_id from teams limit 1;
  if v_user_id is null then
    raise exception 'No user found.';
  end if;

  -- ─── Team: 15U Thunder (2 past seasons) ────────────────────────────

  insert into teams (name, created_by)
  values ('15U Thunder', v_user_id)
  returning id into v_team_id;

  insert into team_members (team_id, user_id, role)
  values (v_team_id, v_user_id, 'head_coach');

  -- Season 2024-2025 (inactive)
  insert into seasons (team_id, name, is_active)
  values (v_team_id, '2024-2025', false)
  returning id into v_season_id;

  insert into events (season_id, name, date, location)
  values (v_season_id, 'Fall Classic', '2024-10-12', 'Riverside Arena')
  returning id into v_event_id;

  insert into matches (team_id, season_id, event_id, opponent_name, date, location, status, is_serving_first) values
    (v_team_id, v_season_id, v_event_id, 'Storm Chasers',  '2024-10-12', 'Riverside Arena', 'completed', true),
    (v_team_id, v_season_id, v_event_id, 'Lightning Bolts', '2024-10-12', 'Riverside Arena', 'completed', false),
    (v_team_id, v_season_id, v_event_id, 'Wave Riders',     '2024-10-12', 'Riverside Arena', 'completed', true);

  insert into events (season_id, name, date, location)
  values (v_season_id, 'Winter Invitational', '2025-01-18', 'Central Sports Complex')
  returning id into v_event_id;

  insert into matches (team_id, season_id, event_id, opponent_name, date, location, status, is_serving_first) values
    (v_team_id, v_season_id, v_event_id, 'Frost Giants',   '2025-01-18', 'Central Sports Complex', 'completed', true),
    (v_team_id, v_season_id, v_event_id, 'Ice Queens',     '2025-01-18', 'Central Sports Complex', 'completed', false);

  -- Season 2023-2024 (inactive)
  insert into seasons (team_id, name, is_active)
  values (v_team_id, '2023-2024', false)
  returning id into v_season_id;

  insert into events (season_id, name, date, location)
  values (v_season_id, 'Spring Tournament', '2024-03-09', 'Eastside Gym')
  returning id into v_event_id;

  insert into matches (team_id, season_id, event_id, opponent_name, date, location, status, is_serving_first) values
    (v_team_id, v_season_id, v_event_id, 'Blazers',   '2024-03-09', 'Eastside Gym', 'completed', true),
    (v_team_id, v_season_id, v_event_id, 'Raptors',   '2024-03-09', 'Eastside Gym', 'completed', false),
    (v_team_id, v_season_id, v_event_id, 'Mavericks', '2024-03-09', 'Eastside Gym', 'completed', true),
    (v_team_id, v_season_id, v_event_id, 'Stallions', '2024-03-09', 'Eastside Gym', 'completed', false);

  -- Add some players
  insert into players (team_id, jersey_number, first_name, last_name, position) values
    (v_team_id, 1, 'Zoe',      'Parker',   'S'),
    (v_team_id, 3, 'Riley',    'Cooper',   'OH'),
    (v_team_id, 5, 'Maya',     'Bennett',  'MB'),
    (v_team_id, 7, 'Aria',     'Foster',   'OPP'),
    (v_team_id, 9, 'Nora',     'Rivera',   'L'),
    (v_team_id, 11,'Grace',    'Murphy',   'OH'),
    (v_team_id, 12,'Stella',   'Brooks',   'DS'),
    (v_team_id, 14,'Hazel',    'Hughes',   'MB');

  -- ─── Team: 13U Blaze (1 past season) ──────────────────────────────

  insert into teams (name, created_by)
  values ('13U Blaze', v_user_id)
  returning id into v_team_id;

  insert into team_members (team_id, user_id, role)
  values (v_team_id, v_user_id, 'head_coach');

  -- Season 2024-2025 (inactive)
  insert into seasons (team_id, name, is_active)
  values (v_team_id, '2024-2025', false)
  returning id into v_season_id;

  insert into events (season_id, name, date, location)
  values (v_season_id, 'League Day 1', '2024-09-14', 'Home Gym')
  returning id into v_event_id;

  insert into matches (team_id, season_id, event_id, opponent_name, date, location, status, is_serving_first) values
    (v_team_id, v_season_id, v_event_id, 'Mini Rockets',  '2024-09-14', 'Home Gym', 'completed', true),
    (v_team_id, v_season_id, v_event_id, 'Junior Jaguars','2024-09-14', 'Home Gym', 'completed', false);

  insert into events (season_id, name, date, location)
  values (v_season_id, 'League Day 2', '2024-10-05', 'Northside Academy')
  returning id into v_event_id;

  insert into matches (team_id, season_id, event_id, opponent_name, date, location, status, is_serving_first) values
    (v_team_id, v_season_id, v_event_id, 'Phoenix Rising',  '2024-10-05', 'Northside Academy', 'completed', true),
    (v_team_id, v_season_id, v_event_id, 'Shooting Stars',  '2024-10-05', 'Northside Academy', 'completed', false),
    (v_team_id, v_season_id, v_event_id, 'Silver Arrows',   '2024-10-05', 'Northside Academy', 'completed', true);

  insert into players (team_id, jersey_number, first_name, last_name, position) values
    (v_team_id, 2, 'Paisley',  'Adams',    'S'),
    (v_team_id, 4, 'Savannah', 'Clark',    'OH'),
    (v_team_id, 6, 'Violet',   'Hall',     'MB'),
    (v_team_id, 8, 'Penelope', 'Young',    'OH'),
    (v_team_id, 10,'Aurora',   'King',     'L'),
    (v_team_id, 13,'Ellie',    'Wright',   'OPP');

  -- ─── Team: 11U Wildcats (1 past season) ───────────────────────────

  insert into teams (name, created_by)
  values ('11U Wildcats', v_user_id)
  returning id into v_team_id;

  insert into team_members (team_id, user_id, role)
  values (v_team_id, v_user_id, 'head_coach');

  -- Season 2023-2024 (inactive)
  insert into seasons (team_id, name, is_active)
  values (v_team_id, '2023-2024', false)
  returning id into v_season_id;

  insert into events (season_id, name, date, location)
  values (v_season_id, 'Beginners Jamboree', '2023-11-04', 'Community Center')
  returning id into v_event_id;

  insert into matches (team_id, season_id, event_id, opponent_name, date, location, status, is_serving_first) values
    (v_team_id, v_season_id, v_event_id, 'Tiny Titans',   '2023-11-04', 'Community Center', 'completed', true),
    (v_team_id, v_season_id, v_event_id, 'Little Lions',  '2023-11-04', 'Community Center', 'completed', false),
    (v_team_id, v_season_id, v_event_id, 'Pint Size Power','2023-11-04', 'Community Center', 'completed', true);

  insert into players (team_id, jersey_number, first_name, last_name, position) values
    (v_team_id, 1, 'Ivy',     'Scott',    'NONE'),
    (v_team_id, 2, 'Willow',  'Green',    'NONE'),
    (v_team_id, 3, 'Ruby',    'Baker',    'NONE'),
    (v_team_id, 4, 'Jade',    'Nelson',   'NONE'),
    (v_team_id, 5, 'Ember',   'Carter',   'NONE'),
    (v_team_id, 6, 'Sage',    'Mitchell', 'NONE'),
    (v_team_id, 7, 'Wren',    'Perez',    'NONE');

  raise notice 'Seeded: 3 past teams (15U Thunder, 13U Blaze, 11U Wildcats) with past seasons and matches';
end $$;
