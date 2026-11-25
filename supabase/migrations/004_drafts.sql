-- 004_drafts: drafts + device version fields for posts.
-- Safe to run more than once (idempotent). Does not modify 001-003.

-- 1) New optional device fields shown on the image and in the caption.
alter table public.posts add column if not exists model_code text;                         -- e.g. "A3717"
alter table public.posts add column if not exists region text;                             -- e.g. "CE", "US", "LL/A", "JP", "Global" or custom text
alter table public.posts add column if not exists no_active boolean not null default false; -- true = new, never activated device

-- 2) Draft support. Existing rows were all exported/published, so they default to 'posted'.
alter table public.posts add column if not exists status text not null default 'posted';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'posts_status_check') then
    alter table public.posts add constraint posts_status_check check (status in ('draft', 'posted'));
  end if;
end $$;

-- 3) Original product photo of a draft (path inside the private 'posts' bucket),
--    so a draft can be reopened and edited later. The bucket policies from 002 already cover it.
alter table public.posts add column if not exists photo_path text;

-- 4) Last change time (drafts are autosaved and listed by this).
alter table public.posts add column if not exists updated_at timestamptz not null default now();

-- 5) Index for the filtered list (All / Drafts / Posted), newest first.
create index if not exists posts_user_status_updated_idx on public.posts (user_id, status, updated_at desc);
