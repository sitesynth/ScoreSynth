-- ═══════════════════════════════════════════════════════════════
-- SECURITY PATCH — email handle leak remediation
-- Date: 2026-04-29
-- Run this entire file in Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════

-- ── STEP 1: Patch trigger — future signups never get email-derived handles ──────

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_handle  text;
  final_handle text;
  counter      int := 0;
begin
  base_handle  := 'user_' || left(replace(new.id::text, '-', ''), 8);
  final_handle := base_handle;

  while exists (select 1 from public.profiles p where p.handle = final_handle) loop
    counter      := counter + 1;
    final_handle := base_handle || '_' || counter::text;
  end loop;

  insert into public.profiles (id, handle, display_name)
  values (
    new.id,
    final_handle,
    coalesce(new.raw_user_meta_data->>'full_name', 'User')
  );
  return new;
end;
$$;

-- ── STEP 2: Rotate ALL existing email-derived handles ────────────────────────────
-- Detects handles generated from email local-part and replaces with user_<8hex>.

create or replace function public.rotate_leaked_handles()
returns table(
  profile_id uuid,
  old_handle text,
  new_handle text
)
language plpgsql security definer set search_path = public as $$
declare
  rec           record;
  email_derived text;
  safe_handle   text;
begin
  for rec in
    select p.id, p.handle, au.email
    from   public.profiles p
    join   auth.users au on au.id = p.id
  loop
    email_derived := lower(regexp_replace(split_part(rec.email, '@', 1), '[^a-z0-9]', '_', 'g'));
    if length(email_derived) < 3 then email_derived := 'user'; end if;
    email_derived := left(email_derived, 24);

    if rec.handle = email_derived
    or rec.handle like email_derived || '\_%' escape '\'
    then
      safe_handle := 'user_' || left(replace(rec.id::text, '-', ''), 8);

      while exists (
        select 1 from public.profiles where handle = safe_handle and id <> rec.id
      ) loop
        safe_handle := 'user_' || left(replace(rec.id::text, '-', ''), 10);
      end loop;

      update public.profiles set handle = safe_handle where id = rec.id;

      profile_id := rec.id;
      old_handle := rec.handle;
      new_handle := safe_handle;
      return next;
    end if;
  end loop;
end;
$$;

-- ── STEP 3: Execute ──────────────────────────────────────────────────────────────
select * from public.rotate_leaked_handles();
