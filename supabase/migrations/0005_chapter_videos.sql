-- 0005: admin-added YouTube videos per page. Safe to run more than once.
create extension if not exists pgcrypto;
create table if not exists public.chapter_videos (
  id uuid primary key default gen_random_uuid(),
  slug text not null check (slug ~ '^(hero|intro|closing|chapter-[0-9]{2})$'),
  youtube_id text not null check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  is_short boolean not null default false,
  position int not null default 0,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null default auth.uid()
);
create index if not exists chapter_videos_slug_pos on public.chapter_videos (slug, position);
alter table public.chapter_videos enable row level security;
drop policy if exists "chapter videos read" on public.chapter_videos;
create policy "chapter videos read" on public.chapter_videos for select using (true);
drop policy if exists "chapter videos admin insert" on public.chapter_videos;
create policy "chapter videos admin insert" on public.chapter_videos for insert to authenticated with check (public.is_admin());
drop policy if exists "chapter videos admin update" on public.chapter_videos;
create policy "chapter videos admin update" on public.chapter_videos for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "chapter videos admin delete" on public.chapter_videos;
create policy "chapter videos admin delete" on public.chapter_videos for delete to authenticated using (public.is_admin());
grant select on public.chapter_videos to anon, authenticated;
grant insert, update, delete on public.chapter_videos to authenticated;
