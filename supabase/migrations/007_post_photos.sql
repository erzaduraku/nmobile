-- 007_post_photos: keep the optional second product photo as a file, like the main photo.
-- Safe to run more than once (idempotent). Does not modify 001-006.

-- 1) Second photo of a draft/post (path inside the private 'posts' bucket, <user_id>/<post id>-photo2-<version>.jpg|png).
--    Before this it was stored as a large base64 dataURL inside posts.extra->photo2, which bloated
--    every row and the localStorage copy. The app now writes extra.photo2 = '' and uses this column;
--    old rows that still have extra.photo2 keep working (the app reads it as a fallback).
--    The storage policies from 002 already cover these files.
alter table public.posts add column if not exists photo2_path text;
