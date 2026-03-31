-- ═══════════════════════════════════════════════════════════════
-- ScoreSynth — Supabase Schema
-- Run this entire file in the Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════

create extension if not exists "uuid-ossp";

-- ─────────────────────────────────────────────────────────────
-- PROFILES
-- Auto-created when a user signs up via trigger below
-- ─────────────────────────────────────────────────────────────
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  handle          text unique not null,
  display_name    text not null default '',
  bio             text not null default '',
  location        text not null default '',
  website         text not null default '',
  twitter         text not null default '',
  instagram       text not null default '',
  avatar_url      text,
  banner_gradient text not null default 'linear-gradient(135deg, #7a2318 0%, #c0392b 60%, #8b2c1e 100%)',
  created_at      timestamptz not null default now()
);

-- Auto-create profile row when a new user registers
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, handle, display_name)
  values (
    new.id,
    lower(regexp_replace(split_part(new.email, '@', 1), '[^a-z0-9]', '_', 'g')),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- SCORES
-- ─────────────────────────────────────────────────────────────
create table public.scores (
  id            uuid primary key default uuid_generate_v4(),
  title         text not null,
  composer      text not null default '',
  publisher     text not null default '',
  description   text not null default '',
  difficulty    text not null default 'Intermediate',
  category      text not null default 'piano',
  instruments   text[] not null default '{}',
  tag           text not null default 'free',
  price_display text,
  likes_count   integer not null default 0,
  views_count   integer not null default 0,
  pages         integer not null default 1,
  pdf_url       text,
  midi_url      text,
  author_id     uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index on public.scores(category);
create index on public.scores(author_id);
create index on public.scores(tag);
create index on public.scores(created_at desc);

-- ─────────────────────────────────────────────────────────────
-- COMMENTS
-- ─────────────────────────────────────────────────────────────
create table public.comments (
  id          uuid primary key default uuid_generate_v4(),
  score_id    uuid not null references public.scores(id) on delete cascade,
  author_id   uuid not null references public.profiles(id) on delete cascade,
  text        text not null,
  likes_count integer not null default 0,
  created_at  timestamptz not null default now()
);

create index on public.comments(score_id);

-- ─────────────────────────────────────────────────────────────
-- LIKES  (one row per user per score — no duplicates)
-- Triggers keep scores.likes_count in sync automatically
-- ─────────────────────────────────────────────────────────────
create table public.likes (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  score_id   uuid not null references public.scores(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, score_id)
);

create or replace function public.handle_like_insert()
returns trigger language plpgsql security definer as $$
begin
  update public.scores set likes_count = likes_count + 1 where id = new.score_id;
  return new;
end;
$$;

create or replace function public.handle_like_delete()
returns trigger language plpgsql security definer as $$
begin
  update public.scores set likes_count = greatest(likes_count - 1, 0) where id = old.score_id;
  return old;
end;
$$;

create trigger on_like_insert after insert on public.likes
  for each row execute procedure public.handle_like_insert();

create trigger on_like_delete after delete on public.likes
  for each row execute procedure public.handle_like_delete();

-- ─────────────────────────────────────────────────────────────
-- FOLLOWS
-- ─────────────────────────────────────────────────────────────
create table public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

create index on public.follows(followee_id);

-- ─────────────────────────────────────────────────────────────
-- VIEW COUNT RPC
-- Called from the score detail page on load (fire-and-forget)
-- ─────────────────────────────────────────────────────────────
create or replace function public.increment_view(score_id uuid)
returns void language sql security definer as $$
  update public.scores set views_count = views_count + 1 where id = score_id;
$$;

-- ═══════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════

alter table public.profiles enable row level security;
alter table public.scores   enable row level security;
alter table public.comments enable row level security;
alter table public.likes    enable row level security;
alter table public.follows  enable row level security;

-- ── PROFILES ──
create policy "profiles_select_public" on public.profiles
  for select using (true);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

-- ── SCORES ──
create policy "scores_select_public" on public.scores
  for select using (true);

create policy "scores_insert_auth" on public.scores
  for insert with check (auth.uid() = author_id);

create policy "scores_update_own" on public.scores
  for update using (auth.uid() = author_id);

create policy "scores_delete_own" on public.scores
  for delete using (auth.uid() = author_id);

-- ── COMMENTS ──
create policy "comments_select_public" on public.comments
  for select using (true);

create policy "comments_insert_auth" on public.comments
  for insert with check (auth.uid() = author_id);

create policy "comments_delete_own" on public.comments
  for delete using (auth.uid() = author_id);

-- ── LIKES ──
create policy "likes_select_public" on public.likes
  for select using (true);

create policy "likes_insert_auth" on public.likes
  for insert with check (auth.uid() = user_id);

create policy "likes_delete_own" on public.likes
  for delete using (auth.uid() = user_id);

-- ── FOLLOWS ──
create policy "follows_select_public" on public.follows
  for select using (true);

create policy "follows_insert_auth" on public.follows
  for insert with check (auth.uid() = follower_id);

create policy "follows_delete_own" on public.follows
  for delete using (auth.uid() = follower_id);

-- ═══════════════════════════════════════════════════════════════
-- STORAGE BUCKETS
-- Create these in the Supabase Dashboard > Storage, then run
-- the policies below in the SQL editor.
-- Buckets to create:
--   • score-files  (private)
--   • avatars      (public)
-- ═══════════════════════════════════════════════════════════════

-- score-files: authenticated users upload to their own folder
create policy "score_files_upload" on storage.objects
  for insert with check (
    bucket_id = 'score-files'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- score-files: authenticated users can download
create policy "score_files_read" on storage.objects
  for select using (
    bucket_id = 'score-files' and auth.role() = 'authenticated'
  );

-- avatars: public read
create policy "avatars_read_public" on storage.objects
  for select using (bucket_id = 'avatars');

-- avatars: authenticated users upload to their own folder
create policy "avatars_upload" on storage.objects
  for insert with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ═══════════════════════════════════════════════════════════════
-- ONE-TIME SETUP: Create MayyaScoreSynth admin profile
-- ─────────────────────────────────────────────────────────────
-- 1. Sign up on the site (via the auth modal on any score page)
--    using your email address.
-- 2. Then run the SQL below in Supabase SQL Editor,
--    replacing 'your@email.com' with the email you signed up with.
-- ═══════════════════════════════════════════════════════════════

-- update profile after signing up:
-- UPDATE public.profiles
-- SET
--   handle       = 'mayyascoresynth',
--   display_name = 'MayyaScoreSynth',
--   bio          = 'Official ScoreSynth sheet music collection'
-- WHERE id = (SELECT id FROM auth.users WHERE email = 'your@email.com');
