-- Migration: permanent room code per saved game (share PIN/QR before game day)
-- Run in Supabase SQL Editor if you already set up Answerini.

alter table public.saved_games
  add column if not exists fixed_pin text;

create unique index if not exists saved_games_fixed_pin_unique
  on public.saved_games (fixed_pin)
  where fixed_pin is not null;
