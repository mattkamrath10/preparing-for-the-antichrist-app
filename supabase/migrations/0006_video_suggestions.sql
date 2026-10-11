-- 0006: members suggest videos, admins approve. Run AFTER 0005. Safe to run more than once.

alter table public.chapter_videos add column if not exists status text not null default 'approved';
alter table public.chapter_videos add column if not exists submitted_by uuid references auth.users(id) on delete set null;
alter table public.chapter_videos add column if not exists note text;
alter table public.chapter_videos add column if not exists reviewed_by uuid references auth.users(id) on delete set null;
alter table public.chapter_videos add column if not exists reviewed_at timestamptz;
alter table public.chapter_videos drop constraint if exists chapter_videos_status_check;
alter table public.chapter_videos add constraint chapter_videos_status_check check (status in ('pending','approved','rejected'));
alter table public.chapter_videos drop constraint if exists chapter_videos_note_check;
alter table public.chapter_videos add constraint chapter_videos_note_check check (note is null or length(note) <= 300);
create index if not exists chapter_videos_status on public.chapter_videos (status, created_at desc);
create index if not exists chapter_videos_submitter on public.chapter_videos (submitted_by, created_at desc);

-- Server-side rules for inserts and reviews
create or replace function public.chapter_videos_guard() returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    if public.is_admin() then return new; end if;  -- admin inserts: status defaults to 'approved'
    if auth.uid() is null or not public.can_post() then raise exception 'Sign in and accept the rules first'; end if;
    new.status := 'pending';
    new.submitted_by := auth.uid();
    new.created_by := auth.uid();
    new.reviewed_by := null; new.reviewed_at := null;
    if new.note is not null and public.has_hate_term(new.note) then raise exception 'Note contains a blocked term'; end if;
    if (select count(*) from public.chapter_videos where submitted_by = auth.uid() and created_at > now() - interval '24 hours') >= 3 then
      raise exception 'You can suggest up to 3 videos per 24 hours';
    end if;
    select coalesce(max(position), 0) + 1 into new.position from public.chapter_videos where slug = new.slug;
    return new;
  end if;
  -- UPDATE (only admins reach this through RLS): stamp reviews
  if new.status is distinct from old.status then
    new.reviewed_by := auth.uid(); new.reviewed_at := now();
  end if;
  return new;
end $$;
drop trigger if exists chapter_videos_guard on public.chapter_videos;
create trigger chapter_videos_guard before insert or update on public.chapter_videos for each row execute function public.chapter_videos_guard();

-- RLS
drop policy if exists "chapter videos read" on public.chapter_videos;
create policy "chapter videos read" on public.chapter_videos for select
  using (status = 'approved' or submitted_by = auth.uid() or public.is_admin());
drop policy if exists "chapter videos member suggest" on public.chapter_videos;
create policy "chapter videos member suggest" on public.chapter_videos for insert to authenticated
  with check (status = 'pending' and submitted_by = auth.uid() and public.can_post());
drop policy if exists "chapter videos member delete pending" on public.chapter_videos;
create policy "chapter videos member delete pending" on public.chapter_videos for delete to authenticated
  using (submitted_by = auth.uid() and status = 'pending');
-- (admin insert/update/delete policies from 0005 stay in place)
