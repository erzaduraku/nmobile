-- 012_ig_deleted: remember app posts whose Instagram media was deleted directly on Instagram.
-- Idempotent. Does not modify 001-011.

-- Set by the instagram-media / instagram-insights Edge Functions when Instagram answers that the
-- post's ig_media_id no longer exists (error code 100). Such rows are hidden from "Postimet"
-- (also from counts and the promote suggestion). Rows and photos are NOT deleted.
-- NULL = still on Instagram (or never published).
alter table public.posts add column if not exists ig_deleted_at timestamptz;
