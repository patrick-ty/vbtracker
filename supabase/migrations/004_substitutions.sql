-- Migration 004: Add substitutions table
-- Tracks player swaps during live play. Lineup is inherited from match start,
-- modified by substitutions at specific rally numbers.

create table substitutions (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references sets(id) on delete cascade,
  rally_number int not null,
  player_out int not null,
  player_in int not null,
  created_at timestamptz not null default now()
);

create index idx_substitutions_set_id on substitutions(set_id);

alter table substitutions enable row level security;

create policy "Members can view substitutions"
  on substitutions for select
  using (exists (
    select 1 from sets
    join matches on matches.id = sets.match_id
    where sets.id = substitutions.set_id
    and matches.team_id in (select user_team_ids())
  ));

create policy "Coaches can manage substitutions"
  on substitutions for all
  using (exists (
    select 1 from sets
    join matches on matches.id = sets.match_id
    where sets.id = substitutions.set_id
    and matches.team_id in (select user_coach_team_ids())
  ))
  with check (exists (
    select 1 from sets
    join matches on matches.id = sets.match_id
    where sets.id = substitutions.set_id
    and matches.team_id in (select user_coach_team_ids())
  ));
