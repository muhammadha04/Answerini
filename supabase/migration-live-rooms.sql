-- Migration: add live_rooms table for Vercel/serverless room persistence
-- Run in Supabase SQL Editor if you already set up Answerini before this change.

create table if not exists public.live_rooms (
  pin text primary key,
  room_id text not null,
  room_data jsonb not null,
  expires_at timestamptz not null,
  updated_at timestamptz default now() not null
);

create index if not exists live_rooms_expires_at_idx on public.live_rooms (expires_at);

alter table public.live_rooms enable row level security;
