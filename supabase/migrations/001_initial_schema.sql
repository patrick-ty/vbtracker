-- VBTracker initial schema
-- Single-team app: each user (coach) has their own roster and matches

-- Players (roster)
create table players (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  jersey_number integer not null,
  first_name text not null,
  last_name text not null,
  position text not null check (position in ('OH', 'MB', 'S', 'OPP', 'L', 'DS', 'NONE')),
  avatar_url text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create index idx_players_user_id on players(user_id);

-- Matches
create table matches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  opponent_name text not null default '',
  date date not null default current_date,
  location text not null default '',
  status text not null default 'in-progress' check (status in ('in-progress', 'completed')),
  is_serving_first boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_matches_user_id on matches(user_id);

-- Sets within a match
create table sets (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references matches(id) on delete cascade,
  set_number integer not null,
  our_score integer not null default 0,
  their_score integer not null default 0,
  status text not null default 'in-progress' check (status in ('in-progress', 'completed'))
);

create index idx_sets_match_id on sets(match_id);

-- Rallies within a set
create table rallies (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references sets(id) on delete cascade,
  rally_number integer not null,
  point_won boolean not null
);

create index idx_rallies_set_id on rallies(set_id);

-- Touches within a rally (1-3 per rally)
create table touches (
  id uuid primary key default gen_random_uuid(),
  rally_id uuid not null references rallies(id) on delete cascade,
  touch_number integer not null check (touch_number between 1 and 3),
  type text not null check (type in ('serve', 'pass', 'set', 'attack', 'block', 'dig')),
  score integer not null check (score between 0 and 3),
  player_jersey_number integer not null
);

create index idx_touches_rally_id on touches(rally_id);

-- Rotation snapshots per set
create table rotations (
  id uuid primary key default gen_random_uuid(),
  set_id uuid not null references sets(id) on delete cascade,
  rotation_number integer not null,
  positions jsonb not null default '{}'
);

create index idx_rotations_set_id on rotations(set_id);

-- Row Level Security: each user can only see their own data
alter table players enable row level security;
alter table matches enable row level security;
alter table sets enable row level security;
alter table rallies enable row level security;
alter table touches enable row level security;
alter table rotations enable row level security;

-- Players: user owns their roster
create policy "Users can manage their own players"
  on players for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Matches: user owns their matches
create policy "Users can manage their own matches"
  on matches for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Sets: accessible if user owns the parent match
create policy "Users can manage sets in their matches"
  on sets for all
  using (
    exists (
      select 1 from matches where matches.id = sets.match_id and matches.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from matches where matches.id = sets.match_id and matches.user_id = auth.uid()
    )
  );

-- Rallies: accessible if user owns the parent match (via set)
create policy "Users can manage rallies in their matches"
  on rallies for all
  using (
    exists (
      select 1 from sets
      join matches on matches.id = sets.match_id
      where sets.id = rallies.set_id and matches.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from sets
      join matches on matches.id = sets.match_id
      where sets.id = rallies.set_id and matches.user_id = auth.uid()
    )
  );

-- Touches: accessible if user owns the parent match (via rally → set)
create policy "Users can manage touches in their matches"
  on touches for all
  using (
    exists (
      select 1 from rallies
      join sets on sets.id = rallies.set_id
      join matches on matches.id = sets.match_id
      where rallies.id = touches.rally_id and matches.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from rallies
      join sets on sets.id = rallies.set_id
      join matches on matches.id = sets.match_id
      where rallies.id = touches.rally_id and matches.user_id = auth.uid()
    )
  );

-- Rotations: accessible if user owns the parent match (via set)
create policy "Users can manage rotations in their matches"
  on rotations for all
  using (
    exists (
      select 1 from sets
      join matches on matches.id = sets.match_id
      where sets.id = rotations.set_id and matches.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from sets
      join matches on matches.id = sets.match_id
      where sets.id = rotations.set_id and matches.user_id = auth.uid()
    )
  );
