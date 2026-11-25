-- 003_instagram: per-user Instagram connection for direct publishing.
-- Idempotent. Does not modify objects from 001/002.

-- 1) One row per app user = that user's own connected Instagram professional account.
--    access_token is a long-lived Instagram User token (~60 days). It is written ONLY by
--    the Edge Functions (service role) and must never be readable from the browser.
create table if not exists public.instagram_accounts (
  user_id uuid primary key references auth.users(id) on delete cascade,
  ig_user_id text not null,
  username text,
  access_token text not null,
  token_expires_at timestamptz,
  updated_at timestamptz not null default now()
);

-- 2) RLS: a user may see and delete (disconnect) only their own row.
--    No insert/update policies: clients cannot write tokens; the service role bypasses RLS.
alter table public.instagram_accounts enable row level security;
drop policy if exists "ig select own" on public.instagram_accounts;
drop policy if exists "ig delete own" on public.instagram_accounts;
create policy "ig select own" on public.instagram_accounts for select to authenticated using (auth.uid() = user_id);
create policy "ig delete own" on public.instagram_accounts for delete to authenticated using (auth.uid() = user_id);

-- 3) Column-level privileges: even with the select policy, the browser roles can read
--    every column EXCEPT access_token. Selecting it (or "*") fails with permission denied.
revoke all on public.instagram_accounts from anon, authenticated;
grant select (user_id, ig_user_id, username, token_expires_at, updated_at) on public.instagram_accounts to authenticated;
grant delete on public.instagram_accounts to authenticated;

-- 4) Public bucket 'ig-temp': Instagram's servers must download the image from a public
--    HTTPS URL (JPEG only). The publish function uploads here (service role) and deletes
--    the file after publishing. No client write policies are created on purpose.
insert into storage.buckets (id, name, public) values ('ig-temp', 'ig-temp', true) on conflict (id) do nothing;
