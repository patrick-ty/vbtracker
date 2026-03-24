-- Migration 005: Add sequences table between rallies and touches
-- Rally → Sequences → Touches
-- Sequence 1 is always the serve. Subsequent sequences are touch sets (up to 3).

-- Create sequences table
create table sequences (
  id uuid primary key default gen_random_uuid(),
  rally_id uuid not null references rallies(id) on delete cascade,
  sequence_number int not null,
  is_serve boolean not null default false
);

create index idx_sequences_rally_id on sequences(rally_id);

-- Migrate: reparent touches from rally_id to sequence_id
-- Step 1: Add sequence_id column to touches
alter table touches add column sequence_id uuid references sequences(id) on delete cascade;

-- Step 2: For each existing rally that has touches, create a sequence and link touches
do $$
declare
  r record;
  v_seq_id uuid;
begin
  for r in (select distinct rally_id from touches) loop
    -- Create a single sequence per existing rally (legacy data)
    insert into sequences (rally_id, sequence_number, is_serve)
    values (r.rally_id, 1, false)
    returning id into v_seq_id;

    update touches set sequence_id = v_seq_id where rally_id = r.rally_id;
  end loop;
end $$;

-- Step 3: Drop old policies and rally_id from touches, make sequence_id required
drop policy if exists "Members can view touches" on touches;
drop policy if exists "Coaches can manage touches" on touches;
alter table touches drop constraint touches_rally_id_fkey;
alter table touches drop column rally_id;
alter table touches alter column sequence_id set not null;

-- Drop old index, create new one
drop index if exists idx_touches_rally_id;
create index idx_touches_sequence_id on touches(sequence_id);

-- Add serve columns to rallies (server info at rally level for quick queries)
alter table rallies add column server_jersey_number int;

-- RLS for sequences
alter table sequences enable row level security;

create policy "Members can view sequences"
  on sequences for select
  using (exists (
    select 1 from rallies
    join sets on sets.id = rallies.set_id
    join matches on matches.id = sets.match_id
    where rallies.id = sequences.rally_id
    and matches.team_id in (select user_team_ids())
  ));

create policy "Coaches can manage sequences"
  on sequences for all
  using (exists (
    select 1 from rallies
    join sets on sets.id = rallies.set_id
    join matches on matches.id = sets.match_id
    where rallies.id = sequences.rally_id
    and matches.team_id in (select user_coach_team_ids())
  ))
  with check (exists (
    select 1 from rallies
    join sets on sets.id = rallies.set_id
    join matches on matches.id = sets.match_id
    where rallies.id = sequences.rally_id
    and matches.team_id in (select user_coach_team_ids())
  ));

-- Update touches RLS to go through sequences
drop policy if exists "Members can view touches" on touches;
drop policy if exists "Coaches can manage touches" on touches;

create policy "Members can view touches"
  on touches for select
  using (exists (
    select 1 from sequences
    join rallies on rallies.id = sequences.rally_id
    join sets on sets.id = rallies.set_id
    join matches on matches.id = sets.match_id
    where sequences.id = touches.sequence_id
    and matches.team_id in (select user_team_ids())
  ));

create policy "Coaches can manage touches"
  on touches for all
  using (exists (
    select 1 from sequences
    join rallies on rallies.id = sequences.rally_id
    join sets on sets.id = rallies.set_id
    join matches on matches.id = sets.match_id
    where sequences.id = touches.sequence_id
    and matches.team_id in (select user_coach_team_ids())
  ))
  with check (exists (
    select 1 from sequences
    join rallies on rallies.id = sequences.rally_id
    join sets on sets.id = rallies.set_id
    join matches on matches.id = sets.match_id
    where sequences.id = touches.sequence_id
    and matches.team_id in (select user_coach_team_ids())
  ));
