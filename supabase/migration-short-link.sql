-- Migration: optional shortened invite link per saved game
alter table public.saved_games
  add column if not exists short_link text;
