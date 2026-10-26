-- 013_draft_limit: keep at most 5 drafts per user (first in, first out).
-- Safe to run more than once (idempotent). Does not modify 001-012.
--
-- The app (postsApi.savePost) already removes the oldest drafts AND their Storage
-- files before a new draft is saved, so normally this trigger finds nothing to delete.
-- It is a database-side safety net (e.g. an old app version still open on a device):
-- Supabase does not allow deleting Storage files from SQL, so rows removed here could
-- leave their files behind; that is why the client cleans up first.

create or replace function public.enforce_draft_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Delete this user's drafts beyond the 5 newest (by created_at, oldest go first).
  delete from public.posts
  where id in (
    select id from public.posts
    where user_id = new.user_id and status = 'draft'
    order by created_at desc, id desc
    offset 5
  );
  return null;
end;
$$;

-- Fires only when a row becomes a draft (new draft, or status changed to draft);
-- autosaves of an existing draft do not change the count.
drop trigger if exists posts_draft_limit on public.posts;
create trigger posts_draft_limit
after insert or update of status on public.posts
for each row
when (new.status = 'draft')
execute function public.enforce_draft_limit();
