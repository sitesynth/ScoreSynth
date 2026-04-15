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

-- avatars: authenticated users update their own avatar
create policy "avatars_update" on storage.objects
  for update using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- avatars: authenticated users delete their own avatar
create policy "avatars_delete" on storage.objects
  for delete using (
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

-- ═══════════════════════════════════════════════════════════════
-- NOTIFICATIONS
-- Run this block in Supabase SQL Editor to enable notifications
-- and automatic welcome messages for new users.
-- ═══════════════════════════════════════════════════════════════

create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  type       text not null default 'system',
  title      text not null,
  body       text not null,
  read       boolean not null default false,
  created_at timestamptz not null default now()
);

create index on public.notifications(user_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select using (auth.uid() = user_id);

create policy "notifications_update_own" on public.notifications
  for update using (auth.uid() = user_id);

-- Trigger: send welcome notification when a new profile is created
create or replace function public.create_welcome_notification()
returns trigger language plpgsql security definer as $$
begin
  insert into public.notifications (user_id, type, title, body)
  values (
    new.id,
    'welcome',
    'Welcome to ScoreSynth!',
    'Hi ' || new.display_name || E'! We''re so glad you joined our community of music lovers.\n\nCommunity Guidelines:\n• Be respectful and supportive to fellow musicians\n• Only share sheet music you have the right to distribute\n• Leave helpful comments — constructive feedback is welcome\n• No spam or self-promotion unrelated to music\n\nCan''t find the sheet music you need? Just let me know — I personally search for missing scores and upload them to the portal. Send me a message and I''ll do my best to find it for you!'
  );
  return new;
end;
$$;

create trigger on_profile_created_welcome
  after insert on public.profiles
  for each row execute function public.create_welcome_notification();

-- ═══════════════════════════════════════════════════════════════
-- NOTIFICATIONS v2 — extra columns + smart triggers
-- Run this block once in Supabase SQL Editor to add like/comment/
-- message notifications with deep-link support.
-- ═══════════════════════════════════════════════════════════════

-- Add deep-link columns (idempotent)
alter table public.notifications
  add column if not exists score_id      uuid references public.scores(id) on delete set null,
  add column if not exists actor_handle  text;

-- ── LIKE NOTIFICATIONS ──────────────────────────────────────────
create or replace function public.notify_score_liked()
returns trigger language plpgsql security definer as $$
declare
  v_author_id   uuid;
  v_title       text;
  v_handle      text;
begin
  select author_id, title into v_author_id, v_title
    from public.scores where id = new.score_id;
  select handle into v_handle
    from public.profiles where id = new.user_id;
  -- skip self-likes
  if v_author_id = new.user_id then return new; end if;
  insert into public.notifications (user_id, type, title, body, score_id, actor_handle)
  values (
    v_author_id,
    'like',
    v_handle || ' liked your score',
    '"' || v_title || '"',
    new.score_id,
    v_handle
  );
  return new;
end;
$$;

drop trigger if exists on_score_liked on public.likes;
create trigger on_score_liked
  after insert on public.likes
  for each row execute function public.notify_score_liked();

-- ── COMMENT NOTIFICATIONS ────────────────────────────────────────
create or replace function public.notify_score_commented()
returns trigger language plpgsql security definer as $$
declare
  v_author_id   uuid;
  v_title       text;
  v_handle      text;
begin
  select author_id, title into v_author_id, v_title
    from public.scores where id = new.score_id;
  select handle into v_handle
    from public.profiles where id = new.author_id;
  -- skip self-comments
  if v_author_id = new.author_id then return new; end if;
  insert into public.notifications (user_id, type, title, body, score_id, actor_handle)
  values (
    v_author_id,
    'comment',
    v_handle || ' commented on your score',
    new.text,
    new.score_id,
    v_handle
  );
  return new;
end;
$$;

drop trigger if exists on_score_commented on public.comments;
create trigger on_score_commented
  after insert on public.comments
  for each row execute function public.notify_score_commented();

-- ── MESSAGE NOTIFICATIONS ────────────────────────────────────────
-- Fires when a new message row is inserted; notifies the recipient.
create or replace function public.notify_new_message()
returns trigger language plpgsql security definer as $$
declare
  v_recipient_id uuid;
  v_sender_handle text;
  v_p1 uuid;
  v_p2 uuid;
begin
  select participant_1, participant_2 into v_p1, v_p2
    from public.conversations where id = new.conversation_id;
  -- recipient is the other participant
  if v_p1 = new.sender_id then
    v_recipient_id := v_p2;
  else
    v_recipient_id := v_p1;
  end if;
  select handle into v_sender_handle
    from public.profiles where id = new.sender_id;
  insert into public.notifications (user_id, type, title, body, actor_handle)
  values (
    v_recipient_id,
    'message',
    'New message from ' || v_sender_handle,
    new.body,
    v_sender_handle
  );
  return new;
end;
$$;

drop trigger if exists on_new_message on public.messages;
create trigger on_new_message
  after insert on public.messages
  for each row execute function public.notify_new_message();
