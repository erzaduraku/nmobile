-- 018_analysis_links: one cached visual analysis can belong to more than one post.
-- The feature row stays unique per user, image hash and analysis configuration (migration 016).
-- This table records which post or Instagram media asked for that analysis.
-- It does not move post_id on the feature row, so a second post cannot take the first post's link.
-- Written only by analyze-post-image (service role). Authenticated users can read their own rows.

create table if not exists public.post_image_analysis_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  analysis_id uuid not null references public.post_image_analyses(id) on delete cascade,
  post_id uuid references public.posts(id) on delete cascade,
  media_id text,
  created_at timestamptz not null default now(),
  constraint post_image_analysis_links_target check (post_id is not null or media_id is not null)
);

create unique index if not exists post_image_analysis_links_post_idx
  on public.post_image_analysis_links (user_id, post_id);

create unique index if not exists post_image_analysis_links_media_idx
  on public.post_image_analysis_links (user_id, media_id);

create index if not exists post_image_analysis_links_analysis_idx
  on public.post_image_analysis_links (analysis_id);

alter table public.post_image_analysis_links enable row level security;

drop policy if exists "analysis links select own" on public.post_image_analysis_links;
create policy "analysis links select own" on public.post_image_analysis_links
  for select to authenticated
  using (auth.uid() = user_id);

revoke all on public.post_image_analysis_links from anon;
revoke insert, update, delete on public.post_image_analysis_links from authenticated;
grant select on public.post_image_analysis_links to authenticated;
