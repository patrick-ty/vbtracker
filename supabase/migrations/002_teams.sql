-- Migration 002: Add teams + team_members, migrate from user_id to team_id
-- Restructures ownership from per-user to per-team for multi-tenant SaaS

-- ─── 1. Create new tables ────────────────────────────────────────────

create table teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('head_coach', 'assistant_coach', 'viewer')),
  created_at timestamptz not null default now(),
  unique (team_id, user_id)
);

create index idx_team_members_user_id on team_members(user_id);
create index idx_team_members_team_id on team_members(team_id);

-- ─── 2. Helper functions for RLS ─────────────────────────────────────

create or replace function user_team_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select team_id from team_members where user_id = auth.uid()
$$;

create or replace function user_coach_team_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select team_id from team_members
  where user_id = auth.uid() and role in ('head_coach', 'assistant_coach')
$$;

-- ─── 3. Add team_id columns (nullable for now) ───────────────────────

alter table players add column team_id uuid references teams(id) on delete cascade;
alter table matches add column team_id uuid references teams(id) on delete cascade;

-- ─── 4. Backfill: create a team for each existing user ───────────────

do $$
declare
  r record;
  new_team_id uuid;
begin
  for r in (
    select distinct user_id from (
      select user_id from players
      union
      select user_id from matches
    ) all_users
  ) loop
    insert into teams (name, created_by)
    values ('My Team', r.user_id)
    returning id into new_team_id;

    insert into team_members (team_id, user_id, role)
    values (new_team_id, r.user_id, 'head_coach');

    update players set team_id = new_team_id where user_id = r.user_id;
    update matches set team_id = new_team_id where user_id = r.user_id;
  end loop;
end $$;

-- ─── 5. Drop old RLS policies BEFORE dropping columns ────────────────

drop policy if exists "Users can manage their own players" on players;
drop policy if exists "Users can manage their own matches" on matches;
drop policy if exists "Users can manage sets in their matches" on sets;
drop policy if exists "Users can manage rallies in their matches" on rallies;
drop policy if exists "Users can manage touches in their matches" on touches;
drop policy if exists "Users can manage rotations in their matches" on rotations;

-- ─── 6. Make team_id NOT NULL, drop user_id ──────────────────────────

alter table players alter column team_id set not null;
alter table players drop column user_id;

alter table matches alter column team_id set not null;
alter table matches drop column user_id;

drop index if exists idx_players_user_id;
drop index if exists idx_matches_user_id;

create index idx_players_team_id on players(team_id);
create index idx_matches_team_id on matches(team_id);

-- ─── 7. RLS on new tables ───────────────────────────────────────────

alter table teams enable row level security;
alter table team_members enable row level security;

create policy "Members can view their teams"
  on teams for select
  using (id in (select user_team_ids()));

create policy "Authenticated users can create teams"
  on teams for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "Head coach can update team"
  on teams for update
  using (id in (
    select team_id from team_members
    where user_id = auth.uid() and role = 'head_coach'
  ));

create policy "Members can view team members"
  on team_members for select
  using (team_id in (select user_team_ids()));

create policy "Coaches can manage team members"
  on team_members for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or team_id in (select user_coach_team_ids())
  );

create policy "Coaches can update team members"
  on team_members for update
  using (team_id in (select user_coach_team_ids()));

create policy "Coaches can remove team members"
  on team_members for delete
  using (team_id in (select user_coach_team_ids()));

-- ─── 8. New RLS policies for players ────────────────────────────────

create policy "Members can view players"
  on players for select
  using (team_id in (select user_team_ids()));

create policy "Coaches can insert players"
  on players for insert
  with check (team_id in (select user_coach_team_ids()));

create policy "Coaches can update players"
  on players for update
  using (team_id in (select user_coach_team_ids()));

create policy "Coaches can delete players"
  on players for delete
  using (team_id in (select user_coach_team_ids()));

-- ─── 9. New RLS policies for matches ────────────────────────────────

create policy "Members can view matches"
  on matches for select
  using (team_id in (select user_team_ids()));

create policy "Coaches can insert matches"
  on matches for insert
  with check (team_id in (select user_coach_team_ids()));

create policy "Coaches can update matches"
  on matches for update
  using (team_id in (select user_coach_team_ids()));

create policy "Coaches can delete matches"
  on matches for delete
  using (team_id in (select user_coach_team_ids()));

-- ─── 10. New RLS policies for child tables ──────────────────────────

create policy "Members can view sets"
  on sets for select
  using (exists (
    select 1 from matches where matches.id = sets.match_id
    and matches.team_id in (select user_team_ids())
  ));

create policy "Coaches can manage sets"
  on sets for all
  using (exists (
    select 1 from matches where matches.id = sets.match_id
    and matches.team_id in (select user_coach_team_ids())
  ))
  with check (exists (
    select 1 from matches where matches.id = sets.match_id
    and matches.team_id in (select user_coach_team_ids())
  ));

create policy "Members can view rallies"
  on rallies for select
  using (exists (
    select 1 from sets
    join matches on matches.id = sets.match_id
    where sets.id = rallies.set_id
    and matches.team_id in (select user_team_ids())
  ));

create policy "Coaches can manage rallies"
  on rallies for all
  using (exists (
    select 1 from sets
    join matches on matches.id = sets.match_id
    where sets.id = rallies.set_id
    and matches.team_id in (select user_coach_team_ids())
  ))
  with check (exists (
    select 1 from sets
    join matches on matches.id = sets.match_id
    where sets.id = rallies.set_id
    and matches.team_id in (select user_coach_team_ids())
  ));

create policy "Members can view touches"
  on touches for select
  using (exists (
    select 1 from rallies
    join sets on sets.id = rallies.set_id
    join matches on matches.id = sets.match_id
    where rallies.id = touches.rally_id
    and matches.team_id in (select user_team_ids())
  ));

create policy "Coaches can manage touches"
  on touches for all
  using (exists (
    select 1 from rallies
    join sets on sets.id = rallies.set_id
    join matches on matches.id = sets.match_id
    where rallies.id = touches.rally_id
    and matches.team_id in (select user_coach_team_ids())
  ))
  with check (exists (
    select 1 from rallies
    join sets on sets.id = rallies.set_id
    join matches on matches.id = sets.match_id
    where rallies.id = touches.rally_id
    and matches.team_id in (select user_coach_team_ids())
  ));

create policy "Members can view rotations"
  on rotations for select
  using (exists (
    select 1 from sets
    join matches on matches.id = sets.match_id
    where sets.id = rotations.set_id
    and matches.team_id in (select user_team_ids())
  ));

create policy "Coaches can manage rotations"
  on rotations for all
  using (exists (
    select 1 from sets
    join matches on matches.id = sets.match_id
    where sets.id = rotations.set_id
    and matches.team_id in (select user_coach_team_ids())
  ))
  with check (exists (
    select 1 from sets
    join matches on matches.id = sets.match_id
    where sets.id = rotations.set_id
    and matches.team_id in (select user_coach_team_ids())
  ));

-- ─── 11. Storage: update avatar bucket policies ─────────────────────

drop policy if exists "Users can upload avatars" on storage.objects;
drop policy if exists "Users can update their avatars" on storage.objects;
drop policy if exists "Anyone can view avatars" on storage.objects;

create policy "Coaches can upload avatars" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1]::uuid in (select user_coach_team_ids())
  );

create policy "Coaches can update avatars" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1]::uuid in (select user_coach_team_ids())
  );

create policy "Anyone can view avatars" on storage.objects
  for select to public
  using (bucket_id = 'avatars');
