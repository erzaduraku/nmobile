-- 014_posted_limit: keep at most the 20 most recent published posts per user (first in, first out),
-- and at most 20 cached Instagram statistics per Instagram account.
-- Safe to run more than once (idempotent). Does not modify 001-013.
--
-- Only app data is removed. Nothing is ever deleted on Instagram itself.
-- The app (postsApi.savePost -> prunePosted) already removes the oldest posted rows AND their
-- Storage photos before a new post is saved as posted, so normally the posts trigger finds nothing.
-- It is a database-side safety net: Supabase does not allow deleting Storage files from SQL,
-- so rows removed here could leave their photos behind; that is why the client cleans up first.

-- 1) posts: after a row becomes 'posted', delete that user's posted rows beyond the 20 newest.
--    Posted rows are final (later edits become a new draft), so updated_at = when it was posted.
create or replace function public.enforce_posted_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.posts
  where id in (
    select id from public.posts
    where user_id = new.user_id and status = 'posted'
    order by updated_at desc, id desc
    offset 20
  );
  return null;
end;
$$;

drop trigger if exists posts_posted_limit on public.posts;
create trigger posts_posted_limit
after insert or update of status on public.posts
for each row
when (new.status = 'posted')
execute function public.enforce_posted_limit();

-- 2) instagram_media_stats (from 011, written by the instagram-insights Edge Function):
--    keep only the 20 newest media per Instagram account, newest = Instagram publish time
--    (stats->>'timestamp', ISO text, sorts correctly), falling back to when it was fetched.
create or replace function public.enforce_media_stats_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.instagram_media_stats
  where ig_user_id = new.ig_user_id
    and media_id in (
      select media_id from public.instagram_media_stats
      where ig_user_id = new.ig_user_id
      order by coalesce(stats->>'timestamp', fetched_at::text) desc, media_id desc
      offset 20
    );
  return null;
end;
$$;

drop trigger if exists media_stats_limit on public.instagram_media_stats;
create trigger media_stats_limit
after insert on public.instagram_media_stats
for each row
execute function public.enforce_media_stats_limit();
