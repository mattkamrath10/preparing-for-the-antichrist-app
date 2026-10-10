-- 0003: admin-uploaded chapter images.
-- Run AFTER 0001 and 0002, in Supabase Dashboard -> SQL Editor.

-- Public-read storage bucket (5 MB limit, images only)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('chapter-images', 'chapter-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = true, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "chapter images public read" on storage.objects;
create policy "chapter images public read" on storage.objects for select using (bucket_id = 'chapter-images');
drop policy if exists "chapter images admin insert" on storage.objects;
create policy "chapter images admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'chapter-images' and public.is_admin());
drop policy if exists "chapter images admin update" on storage.objects;
create policy "chapter images admin update" on storage.objects for update to authenticated using (bucket_id = 'chapter-images' and public.is_admin()) with check (bucket_id = 'chapter-images' and public.is_admin());
drop policy if exists "chapter images admin delete" on storage.objects;
create policy "chapter images admin delete" on storage.objects for delete to authenticated using (bucket_id = 'chapter-images' and public.is_admin());

-- Which image each page uses (slug = 'hero', 'intro', 'closing', 'chapter-01' ... 'chapter-20')
create table if not exists public.chapter_images (
  slug text primary key check (slug ~ '^(hero|intro|closing|chapter-[0-9]{2})$'),
  path text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null default auth.uid()
);
alter table public.chapter_images enable row level security;
drop policy if exists "chapter_images read" on public.chapter_images;
create policy "chapter_images read" on public.chapter_images for select using (true);
drop policy if exists "chapter_images admin insert" on public.chapter_images;
create policy "chapter_images admin insert" on public.chapter_images for insert to authenticated with check (public.is_admin());
drop policy if exists "chapter_images admin update" on public.chapter_images;
create policy "chapter_images admin update" on public.chapter_images for update to authenticated using (public.is_admin()) with check (public.is_admin());
drop policy if exists "chapter_images admin delete" on public.chapter_images;
create policy "chapter_images admin delete" on public.chapter_images for delete to authenticated using (public.is_admin());
grant select on public.chapter_images to anon, authenticated;
grant insert, update, delete on public.chapter_images to authenticated;
