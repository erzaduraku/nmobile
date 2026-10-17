-- 008_exported_status: separate "exported" (downloaded/shared) posts from posts published to Instagram.
-- Safe to run more than once (idempotent). Does not modify 001-007.

-- 1) Allow the new status value. 'posted' now means "published to Instagram from the app";
--    'exported' means the image was only downloaded or shared from the device.
alter table public.posts drop constraint if exists posts_status_check;
alter table public.posts add constraint posts_status_check check (status in ('draft', 'exported', 'posted'));

-- 2) Before this migration every export was saved as 'posted'. Rows without any Instagram
--    media id or link were never published by the app, so mark them as exported.
update public.posts set status = 'exported'
where status = 'posted' and ig_media_id is null and ig_permalink is null;
