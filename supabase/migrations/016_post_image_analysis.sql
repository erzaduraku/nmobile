-- 016_post_image_analysis: cached visual features for a post image.
-- Idempotent. Does not copy Instagram statistics (those stay on posts.ig_stats).
-- Written only by the analyze-post-image Edge Function (service role).
-- Authenticated users can read their own rows.

create table if not exists public.post_image_analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  media_id text,
  image_path text,
  image_hash text not null,
  provider text not null,
  model text not null,
  prompt_version text not null,
  features jsonb not null,
  created_at timestamptz not null default now()
);

create unique index if not exists post_image_analyses_cache_idx
  on public.post_image_analyses (user_id, image_hash, provider, model, prompt_version);

create index if not exists post_image_analyses_post_idx
  on public.post_image_analyses (user_id, post_id, created_at desc);

alter table public.post_image_analyses enable row level security;

drop policy if exists "analyses select own" on public.post_image_analyses;
create policy "analyses select own" on public.post_image_analyses
  for select to authenticated
  using (auth.uid() = user_id);

revoke all on public.post_image_analyses from anon;
revoke insert, update, delete on public.post_image_analyses from authenticated;
grant select on public.post_image_analyses to authenticated;
