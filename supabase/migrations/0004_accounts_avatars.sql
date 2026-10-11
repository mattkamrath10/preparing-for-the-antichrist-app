-- 0004: accounts + profile pictures. Safe to run more than once, with or without 0003.

-- 1. Profile picture URL (only pictures stored in this project's 'avatars' bucket are accepted)
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles drop constraint if exists profiles_avatar_url_check;
alter table public.profiles add constraint profiles_avatar_url_check
  check (avatar_url is null or (avatar_url like 'https://%/storage/v1/object/public/avatars/%' and length(avatar_url) < 500));

-- 2. Public-read 'avatars' bucket: 2 MB, images only
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152,
  allowed_mime_types = array['image/jpeg','image/png','image/webp'];

-- Members may only write/delete inside their own <user_id>/ folder
drop policy if exists "avatars public read" on storage.objects;
create policy "avatars public read" on storage.objects for select using (bucket_id = 'avatars');
drop policy if exists "avatars own insert" on storage.objects;
create policy "avatars own insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars own update" on storage.objects;
create policy "avatars own update" on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "avatars own delete" on storage.objects;
create policy "avatars own delete" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- 3. Feed view: author avatar only on non-anonymous posts (same columns as 0002, plus author_avatar at the end)
create or replace view public.comments_feed as
select c.id, c.room, c.body, c.anonymous, c.hidden, c.created_at,
  case when c.anonymous then 'Anonymous' else coalesce(p.username, 'Member') end as author,
  (c.user_id = auth.uid()) as is_mine,
  exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = c.user_id) as author_blocked,
  case when public.is_admin() then c.user_id else null end as user_id,
  case when c.anonymous then null else p.avatar_url end as author_avatar
from public.comments c
left join public.profiles p on p.id = c.user_id
where (not c.hidden) or public.is_admin() or c.user_id = auth.uid();
grant select on public.comments_feed to anon, authenticated;
