-- 0002: chat rooms (main + per chapter), unique usernames, per-message Anonymous.
-- Run AFTER 0001, in Supabase Dashboard -> SQL Editor.

-- Shared hate-term check
create or replace function public.has_hate_term(t text) returns boolean language sql immutable as $$
  select lower(regexp_replace(coalesce(t,''), '[^a-zA-Z0-9/ ]', ' ', 'g'))
    ~ '(kike|k1ke|heeb|zhid|christ ?killer|oven dodger|gas the|1488|14/88|sieg heil|white power|race traitor|subhuman|vermin)';
$$;

-- Profiles: optional unique username
alter table public.profiles alter column display_name drop not null;
alter table public.profiles drop constraint if exists profiles_display_name_check;
alter table public.profiles add column if not exists username text;
alter table public.profiles drop constraint if exists profiles_username_format;
alter table public.profiles add constraint profiles_username_format check (username is null or username ~ '^[A-Za-z0-9_]{3,20}$');
create unique index if not exists profiles_username_unique on public.profiles (lower(username));

create or replace function public.check_username() returns trigger language plpgsql as $$
begin
  if new.username is not null and (public.has_hate_term(new.username) or lower(new.username) in ('anonymous','admin','moderator')) then
    raise exception 'That username is not allowed';
  end if;
  return new;
end $$;
drop trigger if exists profiles_username_check on public.profiles;
create trigger profiles_username_check before insert or update of username on public.profiles for each row execute function public.check_username();

-- Comments: rooms + anonymous flag
alter table public.comments add column if not exists room text;
update public.comments set room = 'chapter-' || slide where room is null;
alter table public.comments alter column room set not null;
alter table public.comments drop constraint if exists comments_room_format;
alter table public.comments add constraint comments_room_format check (room = 'main' or room ~ '^chapter-[0-9]{1,2}$');
alter table public.comments alter column slide drop not null;
alter table public.comments drop constraint if exists comments_slide_check;
alter table public.comments alter column display_name drop not null;
alter table public.comments add column if not exists anonymous boolean not null default false;
create index if not exists comments_room_idx on public.comments(room, created_at);

create or replace function public.reject_hate_terms() returns trigger language plpgsql as $$
begin
  if public.has_hate_term(new.body) then raise exception 'Post contains a blocked term'; end if;
  return new;
end $$;

-- Non-admins may only change their own body
create or replace function public.protect_comment_cols() returns trigger language plpgsql as $$
begin
  if not public.is_admin() then
    if new.hidden is distinct from old.hidden or new.user_id <> old.user_id or new.room <> old.room or new.anonymous <> old.anonymous then
      raise exception 'Not allowed';
    end if;
  end if;
  return new;
end $$;

-- Posting: rules accepted, not banned; named posts need a username
drop policy if exists "comments insert" on public.comments;
create policy "comments insert" on public.comments for insert with check (
  user_id = auth.uid() and public.can_post() and hidden = false
  and (anonymous or exists (select 1 from public.profiles where id = auth.uid() and username is not null))
);

-- Raw table is no longer readable by members (it holds user_id). Read through comments_feed.
drop policy if exists "comments read" on public.comments;
create policy "comments read" on public.comments for select using (public.is_admin() or user_id = auth.uid());

-- Public feed: hides who wrote anonymous posts from everyone except the author and admins
create or replace view public.comments_feed as
select c.id, c.room, c.body, c.anonymous, c.hidden, c.created_at,
  case when c.anonymous then 'Anonymous' else coalesce(p.username, 'Member') end as author,
  (c.user_id = auth.uid()) as is_mine,
  exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = c.user_id) as author_blocked,
  case when public.is_admin() then c.user_id else null end as user_id
from public.comments c
left join public.profiles p on p.id = c.user_id
where (not c.hidden) or public.is_admin() or c.user_id = auth.uid();
grant select on public.comments_feed to anon, authenticated;

-- Block the author of a comment without revealing who they are
create or replace function public.block_author(p_comment uuid) returns void language plpgsql security definer set search_path = public as $$
declare a uuid;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  select user_id into a from public.comments where id = p_comment;
  if a is null or a = auth.uid() then return; end if;
  insert into public.blocks(blocker_id, blocked_id) values (auth.uid(), a) on conflict do nothing;
end $$;
grant execute on function public.block_author(uuid) to authenticated;

-- Realtime: the raw table is no longer broadcast; the app uses broadcast pings + polling.
do $$ begin
  alter publication supabase_realtime drop table public.comments;
exception when others then null; end $$;

-- Make yourself admin (after signing in once):
-- update public.profiles set is_admin = true where id = (select id from auth.users where email = 'YOUR-EMAIL');
