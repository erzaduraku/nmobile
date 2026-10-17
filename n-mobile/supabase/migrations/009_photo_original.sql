-- 009_photo_original: keep the uploaded photo when its background was removed.
-- Safe to run more than once (idempotent). Does not modify 001-008.

-- 1) photo_path now holds the photo the templates use (a transparent PNG cut-out after
--    "Hiq sfondin"). photo_orig_path keeps the photo as it was uploaded, so
--    "Rikthe origjinalin" (undo) still works after a reload or on another device.
--    NULL = the background was not removed (photo_path is the original).
--    Files live in the private 'posts' bucket; the storage policies from 002 already cover them.
alter table public.posts add column if not exists photo_orig_path text;
