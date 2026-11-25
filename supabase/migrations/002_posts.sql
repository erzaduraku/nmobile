-- 002_posts: storage for generated Instagram posts (history per user).
-- Safe to run more than once (idempotent). Does not touch objects from 001.

-- 1) Table: one row per generated post. Stores the form data and choices so a
--    post can be listed / recreated later; the rendered PNG lives in Storage.
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  model text,
  price text,              -- optional; free text such as "899" or "899,99€"
  offer text,              -- optional, e.g. "-20%"
  spec text,               -- optional spec line, e.g. "12GB RAM | 256GB | 200MP"
  info text,               -- optional info/warranty text
  cta text,                -- optional button text, e.g. "Bli Tani!"
  template text not null,  -- template id (minimal, dark, catalog, ...)
  type text not null check (type in ('post', 'story')),
  theme text not null default 'standard',
  caption text,
  image_path text,         -- object path inside the 'posts' bucket: <user_id>/<file>.png
  created_at timestamptz not null default now()
);

-- 2) Index: the app lists a user's posts newest first.
create index if not exists posts_user_created_idx on public.posts (user_id, created_at desc);

-- 3) Row Level Security: every user can only see and change their own posts.
alter table public.posts enable row level security;
drop policy if exists "posts select own" on public.posts;
drop policy if exists "posts insert own" on public.posts;
drop policy if exists "posts update own" on public.posts;
drop policy if exists "posts delete own" on public.posts;
create policy "posts select own" on public.posts for select to authenticated using (auth.uid() = user_id);
create policy "posts insert own" on public.posts for insert to authenticated with check (auth.uid() = user_id);
create policy "posts update own" on public.posts for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "posts delete own" on public.posts for delete to authenticated using (auth.uid() = user_id);

-- 4) Storage bucket 'posts': private (images are read through signed URLs),
--    because shop posts may contain unpublished prices.
insert into storage.buckets (id, name, public) values ('posts', 'posts', false) on conflict (id) do nothing;

-- 5) Storage policies: files must be stored under a folder named after the
--    user's id (<user_id>/...), and only that user can read/write/delete them.
drop policy if exists "posts files read own" on storage.objects;
drop policy if exists "posts files insert own" on storage.objects;
drop policy if exists "posts files update own" on storage.objects;
drop policy if exists "posts files delete own" on storage.objects;
create policy "posts files read own" on storage.objects for select to authenticated using (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "posts files insert own" on storage.objects for insert to authenticated with check (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "posts files update own" on storage.objects for update to authenticated using (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "posts files delete own" on storage.objects for delete to authenticated using (bucket_id = 'posts' and (storage.foldername(name))[1] = auth.uid()::text);
