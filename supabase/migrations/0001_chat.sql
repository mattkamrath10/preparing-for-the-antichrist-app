-- Preparing For The Antichrist App: per-slide debate chat.
-- Run once in Supabase Dashboard -> SQL Editor -> New query -> paste -> Run.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  terms_version int not null default 0,
  terms_accepted_at timestamptz,
  is_admin boolean not null default false,
  banned boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  slide int not null check (slide between 1 and 26),
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null,
  body text not null check (char_length(body) between 1 and 2000),
  hidden boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists comments_slide_idx on public.comments(slide, created_at);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  comment_id uuid not null references public.comments(id) on delete cascade,
  reporter_id uuid not null references auth.users(id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (comment_id, reporter_id)
);

create table if not exists public.blocks (
  blocker_id uuid not null references auth.users(id) on delete cascade,
  blocked_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id)
);

-- Helpers
create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.can_post() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and terms_version >= 1 and not banned);
$$;

-- Server-side hate-term filter (keep in sync with src/lib/filter.ts)
create or replace function public.reject_hate_terms() returns trigger language plpgsql as $$
declare t text := lower(regexp_replace(new.body, '[^a-zA-Z0-9/ ]', ' ', 'g'));
begin
  if t ~ '(kike|k1ke|heeb|zhid|christ ?killer|oven dodger|gas the|1488|14/88|sieg heil|white power|race traitor|subhuman|vermin)' then
    raise exception 'Post contains a blocked term';
  end if;
  return new;
end $$;
drop trigger if exists comments_filter on public.comments;
create trigger comments_filter before insert or update of body on public.comments for each row execute function public.reject_hate_terms();

-- Auto-hide a comment once 3 different users report it
create or replace function public.auto_hide_reported() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from public.reports where comment_id = new.comment_id) >= 3 then
    update public.comments set hidden = true where id = new.comment_id;
  end if;
  return new;
end $$;
drop trigger if exists reports_autohide on public.reports;
create trigger reports_autohide after insert on public.reports for each row execute function public.auto_hide_reported();

-- Stop non-admins changing anything but their own body via update
create or replace function public.protect_comment_cols() returns trigger language plpgsql as $$
begin
  if not public.is_admin() then
    if new.hidden is distinct from old.hidden or new.user_id <> old.user_id or new.slide <> old.slide then
      raise exception 'Not allowed';
    end if;
  end if;
  return new;
end $$;
drop trigger if exists comments_protect on public.comments;
create trigger comments_protect before update on public.comments for each row execute function public.protect_comment_cols();

create or replace function public.protect_profile_cols() returns trigger language plpgsql as $$
begin
  if not public.is_admin() and (new.is_admin is distinct from coalesce(old.is_admin,false) or new.banned is distinct from coalesce(old.banned,false)) then
    raise exception 'Not allowed';
  end if;
  return new;
end $$;
drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect before insert or update on public.profiles for each row execute function public.protect_profile_cols();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.comments enable row level security;
alter table public.reports  enable row level security;
alter table public.blocks   enable row level security;

drop policy if exists "profiles read" on public.profiles;
create policy "profiles read" on public.profiles for select using (true);
drop policy if exists "profiles self insert" on public.profiles;
create policy "profiles self insert" on public.profiles for insert with check (id = auth.uid());
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update using (id = auth.uid() or public.is_admin());

drop policy if exists "comments read" on public.comments;
create policy "comments read" on public.comments for select using (not hidden or public.is_admin() or user_id = auth.uid());
drop policy if exists "comments insert" on public.comments;
create policy "comments insert" on public.comments for insert with check (user_id = auth.uid() and public.can_post() and hidden = false);
drop policy if exists "comments update" on public.comments;
create policy "comments update" on public.comments for update using (user_id = auth.uid() or public.is_admin());
drop policy if exists "comments delete" on public.comments;
create policy "comments delete" on public.comments for delete using (user_id = auth.uid() or public.is_admin());

drop policy if exists "reports insert" on public.reports;
create policy "reports insert" on public.reports for insert with check (reporter_id = auth.uid());
drop policy if exists "reports admin read" on public.reports;
create policy "reports admin read" on public.reports for select using (public.is_admin());

drop policy if exists "blocks own" on public.blocks;
create policy "blocks own" on public.blocks for all using (blocker_id = auth.uid()) with check (blocker_id = auth.uid());

-- Realtime
do $$ begin
  alter publication supabase_realtime add table public.comments;
exception when duplicate_object then null; end $$;

-- Make yourself admin AFTER you have signed in once and accepted the rules:
-- update public.profiles set is_admin = true where id = (select id from auth.users where email = 'YOUR-EMAIL');
