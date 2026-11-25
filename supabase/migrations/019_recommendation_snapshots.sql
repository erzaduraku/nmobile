-- 019_recommendation_snapshots: keep each recommendation the account was shown.
-- A later algorithm version inserts new rows. The same version does not duplicate a row.
-- Users can read and insert only their own rows. They cannot update or delete history.

create table if not exists public.recommendation_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete set null,
  category text,
  format text,
  recommendation_type text not null,
  template_id text,
  theme_id text,
  score numeric,
  evidence jsonb not null default '{}'::jsonb,
  sample_size integer,
  confidence numeric,
  algorithm_version text not null,
  dedupe_key text not null,
  created_at timestamptz not null default now(),
  unique (user_id, dedupe_key, algorithm_version)
);

create index if not exists recommendation_snapshots_user_idx
  on public.recommendation_snapshots (user_id, created_at desc);

alter table public.recommendation_snapshots enable row level security;

drop policy if exists "snapshots select own" on public.recommendation_snapshots;
create policy "snapshots select own" on public.recommendation_snapshots
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "snapshots insert own" on public.recommendation_snapshots;
create policy "snapshots insert own" on public.recommendation_snapshots
  for insert to authenticated
  with check (auth.uid() = user_id);

revoke all on public.recommendation_snapshots from anon;
revoke update, delete on public.recommendation_snapshots from authenticated;
grant select, insert on public.recommendation_snapshots to authenticated;
