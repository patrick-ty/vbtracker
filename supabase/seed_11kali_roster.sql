-- Replace current team roster with real 11 Kali roster
-- Run in Supabase SQL Editor

do $$
declare
  v_team_id uuid;
begin
  -- Get the first team (the one created during onboarding)
  select id into v_team_id from teams order by created_at limit 1;
  if v_team_id is null then
    raise exception 'No team found.';
  end if;

  -- Clear existing players
  delete from players where team_id = v_team_id;

  -- Insert 11 Kali roster
  insert into players (team_id, jersey_number, first_name, last_name, position) values
    (v_team_id, 4,  'Poppy',     'Brophy',     'NONE'),
    (v_team_id, 6,  'Taylor',    'Jensen',     'NONE'),
    (v_team_id, 8,  'Marin',     'Morales',    'NONE'),
    (v_team_id, 9,  'Olivia',    'Alexander',  'NONE'),
    (v_team_id, 10, 'Annaliese', 'Erickson',   'NONE'),
    (v_team_id, 11, 'Elisa',     'Ty',         'NONE'),
    (v_team_id, 12, 'Yasmin',    'Sheikho',    'NONE'),
    (v_team_id, 15, 'Taylor',    'Deitch',     'NONE'),
    (v_team_id, 17, 'Marina',    'Torres',     'NONE'),
    (v_team_id, 21, 'Evelyn',    'Tanner',     'NONE'),
    (v_team_id, 23, 'Allie',     'Ahlering',   'NONE'),
    (v_team_id, 30, 'Addison',   'Keehr',      'NONE'),
    (v_team_id, 67, 'Milly',     'Dunbar',     'NONE');

  -- Update team name
  update teams set name = '11 Kali' where id = v_team_id;

  raise notice 'Updated team to 11 Kali with 13 players';
end $$;
