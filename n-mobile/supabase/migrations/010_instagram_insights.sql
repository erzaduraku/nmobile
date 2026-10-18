-- 010_instagram_insights: cached Instagram statistics per post + granted Instagram permissions.
-- Safe to run more than once (idempotent). Does not modify 001-009.

-- 1) Last statistics read from Instagram for a published post (written by the
--    instagram-insights Edge Function): { views, reach, likes, comments, saved, shares,
--    total_interactions, media_product_type, timestamp, fetched_at }. Shown in "Postimet"
--    and used for the "worth promoting" suggestion. Existing RLS policies from 002 cover it.
alter table public.posts add column if not exists ig_stats jsonb;
alter table public.posts add column if not exists ig_stats_at timestamptz;

-- 2) Permissions the user granted when connecting Instagram (comma list, e.g.
--    "instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights").
--    Written by the instagram-oauth Edge Function. NULL = connected before this migration (unknown).
--    Not secret, so the browser may read it (the token column stays hidden, see 003).
alter table public.instagram_accounts add column if not exists scopes text;
grant select (scopes) on public.instagram_accounts to authenticated;
