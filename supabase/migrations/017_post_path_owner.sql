-- 017_post_path_owner: a post may only point at files inside its owner's storage folder.
-- Idempotent. Does not rewrite existing paths. If a row already points outside
-- that folder, this migration fails and must be inspected before it is forced.

alter table public.posts drop constraint if exists posts_paths_owned;

alter table public.posts add constraint posts_paths_owned check (
  (image_path is null or (image_path like user_id::text || '/%' and length(image_path) > length(user_id::text) + 1 and position('..' in image_path) = 0 and strpos(image_path, chr(92)) = 0))
  and (photo_path is null or (photo_path like user_id::text || '/%' and length(photo_path) > length(user_id::text) + 1 and position('..' in photo_path) = 0 and strpos(photo_path, chr(92)) = 0))
  and (photo2_path is null or (photo2_path like user_id::text || '/%' and length(photo2_path) > length(user_id::text) + 1 and position('..' in photo2_path) = 0 and strpos(photo2_path, chr(92)) = 0))
  and (photo_orig_path is null or (photo_orig_path like user_id::text || '/%' and length(photo_orig_path) > length(user_id::text) + 1 and position('..' in photo_orig_path) = 0 and strpos(photo_orig_path, chr(92)) = 0))
);
