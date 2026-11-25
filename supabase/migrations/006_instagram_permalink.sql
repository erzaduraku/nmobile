-- 006_instagram_permalink: remember which Instagram post a row was published as.
-- Safe to run more than once (idempotent). Does not modify 001-005.

-- 1) Instagram media id returned by media_publish (direct publishing from the app).
--    Kept so the permalink can be looked up again later if it is missing.
alter table public.posts add column if not exists ig_media_id text;

-- 2) Public Instagram URL of the published post (e.g. https://www.instagram.com/p/<code>/).
--    The app uses it for the "Hape në Instagram" button, so the user can open the exact
--    post on Instagram (for example to delete it there, which the API does not allow).
--    Not secret: it is the post's public link. Existing RLS policies from 002 already cover it.
alter table public.posts add column if not exists ig_permalink text;
