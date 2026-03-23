-- Migration 003: Add seasons and events
-- Hierarchy: team → seasons → events → matches

-- ─── 1. Seasons ──────────────────────────────────────────────────────

create table seasons (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references teams(id) on delete cascade,
  name text not null,
  date_start date,
  date_end date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_seasons_team_id on seasons(team_id);

-- ─── 2. Events ───────────────────────────────────────────────────────

create table events (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references seasons(id) on delete cascade,
  name text not null,
  date_start date not null default current_date,
  date_end date,
  location text not null default '',
  created_at timestamptz not null default now()
);

create index idx_events_season_id on events(season_id);

-- ─── 3. Add season_id and event_id to matches ───────────────────────

alter table matches add column season_id uuid references seasons(id) on delete set null;
alter table matches add column event_id uuid references events(id) on delete set null;

create index idx_matches_season_id on matches(season_id);
create index idx_matches_event_id on matches(event_id);

-- ─── 4. Backfill: create a default season for each team ─────────────

do $$
declare
  r record;
  new_season_id uuid;
begin
  for r in (select distinct id as team_id from teams) loop
    insert into seasons (team_id, name)
    values (r.team_id, '2025-2026')
    returning id into new_season_id;

    -- Link existing matches to this season
    update matches set season_id = new_season_id where team_id = r.team_id;
  end loop;
end $$;

-- ─── 5. RLS on seasons ──────────────────────────────────────────────

alter table seasons enable row level security;

create policy "Members can view seasons"
  on seasons for select
  using (team_id in (select user_team_ids()));

create policy "Coaches can insert seasons"
  on seasons for insert
  with check (team_id in (select user_coach_team_ids()));

create policy "Coaches can update seasons"
  on seasons for update
  using (team_id in (select user_coach_team_ids()));

create policy "Coaches can delete seasons"
  on seasons for delete
  using (team_id in (select user_coach_team_ids()));

-- ─── 6. RLS on events ───────────────────────────────────────────────

alter table events enable row level security;

create policy "Members can view events"
  on events for select
  using (exists (
    select 1 from seasons
    where seasons.id = events.season_id
    and seasons.team_id in (select user_team_ids())
  ));

create policy "Coaches can insert events"
  on events for insert
  with check (exists (
    select 1 from seasons
    where seasons.id = events.season_id
    and seasons.team_id in (select user_coach_team_ids())
  ));

create policy "Coaches can update events"
  on events for update
  using (exists (
    select 1 from seasons
    where seasons.id = events.season_id
    and seasons.team_id in (select user_coach_team_ids())
  ));

create policy "Coaches can delete events"
  on events for delete
  using (exists (
    select 1 from seasons
    where seasons.id = events.season_id
    and seasons.team_id in (select user_coach_team_ids())
  ));
