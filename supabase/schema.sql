-- Answerini Supabase Schema
-- Run this entire script in Supabase SQL Editor (Dashboard → SQL → New query)

-- ---------------------------------------------------------------------------
-- 1. Profiles (extends auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. Saved games (reusable quiz templates)
-- ---------------------------------------------------------------------------
create table if not exists public.saved_games (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  title text not null,
  description text default '' not null,
  settings jsonb default '{
    "questionTimeLimit": 20,
    "showLeaderboardAfterEach": true,
    "shuffleAnswers": true,
    "maxPlayers": 500
  }'::jsonb not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create index if not exists saved_games_user_id_idx on public.saved_games (user_id);

alter table public.saved_games enable row level security;

create policy "saved_games_select_own"
  on public.saved_games for select
  using (auth.uid() = user_id);

create policy "saved_games_insert_own"
  on public.saved_games for insert
  with check (auth.uid() = user_id);

create policy "saved_games_update_own"
  on public.saved_games for update
  using (auth.uid() = user_id);

create policy "saved_games_delete_own"
  on public.saved_games for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 3. Saved questions
-- options jsonb shape: [{"id":"uuid","text":"Answer A"}, ...]
-- ---------------------------------------------------------------------------
create table if not exists public.saved_questions (
  id uuid default gen_random_uuid() primary key,
  game_id uuid references public.saved_games on delete cascade not null,
  sort_order int not null default 0,
  text text not null,
  options jsonb not null,
  correct_option_id text not null,
  time_limit int not null default 20,
  image_url text,
  created_at timestamptz default now() not null
);

create index if not exists saved_questions_game_id_idx on public.saved_questions (game_id, sort_order);

alter table public.saved_questions enable row level security;

create policy "saved_questions_select_own"
  on public.saved_questions for select
  using (
    exists (
      select 1 from public.saved_games g
      where g.id = saved_questions.game_id and g.user_id = auth.uid()
    )
  );

create policy "saved_questions_insert_own"
  on public.saved_questions for insert
  with check (
    exists (
      select 1 from public.saved_games g
      where g.id = saved_questions.game_id and g.user_id = auth.uid()
    )
  );

create policy "saved_questions_update_own"
  on public.saved_questions for update
  using (
    exists (
      select 1 from public.saved_games g
      where g.id = saved_questions.game_id and g.user_id = auth.uid()
    )
  );

create policy "saved_questions_delete_own"
  on public.saved_questions for delete
  using (
    exists (
      select 1 from public.saved_games g
      where g.id = saved_questions.game_id and g.user_id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- 4. Live rooms (server-side only via service role — fixes Vercel serverless)
-- Run this block if you already ran an older schema.sql without live_rooms.
-- ---------------------------------------------------------------------------
create table if not exists public.live_rooms (
  pin text primary key,
  room_id text not null,
  room_data jsonb not null,
  expires_at timestamptz not null,
  updated_at timestamptz default now() not null
);

create index if not exists live_rooms_expires_at_idx on public.live_rooms (expires_at);

alter table public.live_rooms enable row level security;
-- No client policies: only the server (service role) reads/writes live rooms.

-- ---------------------------------------------------------------------------
-- 5. Permanent room code (optional fixed PIN per saved game)
-- ---------------------------------------------------------------------------
alter table public.saved_games
  add column if not exists fixed_pin text;

create unique index if not exists saved_games_fixed_pin_unique
  on public.saved_games (fixed_pin)
  where fixed_pin is not null;

alter table public.saved_games
  add column if not exists short_link text;

-- ---------------------------------------------------------------------------
-- 6. Updated_at trigger for saved_games
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists saved_games_updated_at on public.saved_games;
create trigger saved_games_updated_at
  before update on public.saved_games
  for each row execute function public.set_updated_at();
