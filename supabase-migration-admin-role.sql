-- ═══════════════════════════════════════════════════════════════
-- Migration: Admin role support
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- 1. Add role column to profiles (safe if already exists)
alter table public.profiles
  add column if not exists role text not null default 'user';

-- 2. Grant admin to mayyascoresynth
update public.profiles
  set role = 'admin'
  where handle = 'mayyascoresynth';

-- 3. Drop old scores update/delete policies and replace with admin-aware ones
drop policy if exists "scores_update_own" on public.scores;
drop policy if exists "scores_delete_own" on public.scores;

create policy "scores_update_own" on public.scores
  for update using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create policy "scores_delete_own" on public.scores
  for delete using (
    auth.uid() = author_id
    or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );
