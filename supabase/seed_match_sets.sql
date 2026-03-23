-- Seed set scores for existing matches so W/L and scores display
-- Run in Supabase SQL Editor AFTER seed.sql and seed_past_teams.sql

do $$
declare
  r record;
  v_set_id uuid;
begin
  -- For each completed match, create 2-3 sets with realistic scores
  for r in (
    select id, row_number() over (order by created_at) as rn
    from matches
    where status = 'completed'
  ) loop
    case (r.rn % 5)
      -- Win 3-0
      when 0 then
        insert into sets (match_id, set_number, our_score, their_score, status)
        values (r.id, 1, 25, 18, 'completed');
        insert into sets (match_id, set_number, our_score, their_score, status)
        values (r.id, 2, 25, 20, 'completed');
        insert into sets (match_id, set_number, our_score, their_score, status)
        values (r.id, 3, 25, 22, 'completed');

      -- Win 2-0
      when 1 then
        insert into sets (match_id, set_number, our_score, their_score, status)
        values (r.id, 1, 25, 17, 'completed');
        insert into sets (match_id, set_number, our_score, their_score, status)
        values (r.id, 2, 25, 23, 'completed');

      -- Loss 0-2
      when 2 then
        insert into sets (match_id, set_number, our_score, their_score, status)
        values (r.id, 1, 20, 25, 'completed');
        insert into sets (match_id, set_number, our_score, their_score, status)
        values (r.id, 2, 18, 25, 'completed');

      -- Win 2-1
      when 3 then
        insert into sets (match_id, set_number, our_score, their_score, status)
        values (r.id, 1, 25, 21, 'completed');
        insert into sets (match_id, set_number, our_score, their_score, status)
        values (r.id, 2, 22, 25, 'completed');
        insert into sets (match_id, set_number, our_score, their_score, status)
        values (r.id, 3, 15, 12, 'completed');

      -- Loss 1-2
      when 4 then
        insert into sets (match_id, set_number, our_score, their_score, status)
        values (r.id, 1, 25, 19, 'completed');
        insert into sets (match_id, set_number, our_score, their_score, status)
        values (r.id, 2, 23, 25, 'completed');
        insert into sets (match_id, set_number, our_score, their_score, status)
        values (r.id, 3, 11, 15, 'completed');
    end case;
  end loop;

  raise notice 'Seeded sets for all completed matches';
end $$;
