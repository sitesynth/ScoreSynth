-- Add explicit onboarding completion state for profile routing.
alter table public.profiles
  add column if not exists onboarding_completed boolean not null default false;

-- Existing users already have working profiles; don't force them through onboarding again.
update public.profiles
set onboarding_completed = true
where onboarding_completed = false;
