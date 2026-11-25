-- 011_instagram_shared: support the same Instagram account connected to several app logins,
-- and cache statistics for posts that exist only on Instagram (made outside the app).
-- Idempotent. Does not modify 001-010.

-- 1) instagram_accounts keeps one row per APP user (primary key user_id, see 003). There is
--    deliberately NO unique constraint on ig_user_id: two app logins may connect the same
--    Instagram account, each with its own token. This index only speeds up lookups by account.
create index if not exists instagram_accounts_ig_user_id_idx on public.instagram_accounts (ig_user_id);

-- 2) Last statistics per Instagram media, keyed by Instagram account + media id (not by app user),
--    so every app login connected to that account sees the same numbers, including for posts
--    that have no row in public.posts. Written and read ONLY by the Edge Functions
--    (instagram-insights writes, instagram-media reads) with the service role.
create table if not exists public.instagram_media_stats (
  ig_user_id text not null,
  media_id text not null,
  stats jsonb not null,          -- { views, reach, likes, comments, saved, shares, total_interactions, media_product_type, timestamp, fetched_at }
  fetched_at timestamptz not null default now(),
  primary key (ig_user_id, media_id)
);

-- 3) RLS on with no policies and no grants: browsers cannot read or write it directly.
alter table public.instagram_media_stats enable row level security;
revoke all on public.instagram_media_stats from anon, authenticated;
