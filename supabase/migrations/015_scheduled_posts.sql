-- 015_scheduled_posts: plan a post for a chosen time; the instagram-scheduler edge function publishes it.
-- Run once in the Supabase SQL Editor (after 013 and 014). Safe to run again.

-- 1) When the post should go out, and why a planned post failed (shown in the app).
alter table public.posts add column if not exists scheduled_at timestamptz;
alter table public.posts add column if not exists schedule_error text;

-- 2) New statuses: scheduled (waiting), publishing (locked by the scheduler), failed (needs a new time).
alter table public.posts drop constraint if exists posts_status_check;
alter table public.posts add constraint posts_status_check
  check (status in ('draft', 'exported', 'posted', 'scheduled', 'publishing', 'failed'));

-- 3) Fast lookup of due posts.
create index if not exists posts_status_scheduled_at_idx on public.posts (status, scheduled_at);

-- 4) Extensions for the timer and the HTTP call.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;

-- 5) Random shared secret, kept only in Vault (never written in this file).
do $$
begin
  if not exists (select 1 from vault.secrets where name = 'instagram_scheduler_secret') then
    perform vault.create_secret(replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
      'instagram_scheduler_secret', 'Header x-scheduler-secret for the instagram-scheduler edge function');
  end if;
end $$;

-- 6) The edge function checks the header with this; only the service role may call it.
create or replace function public.check_scheduler_secret(s text)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from vault.decrypted_secrets where name = 'instagram_scheduler_secret' and decrypted_secret = s and s <> '')
$$;
revoke all on function public.check_scheduler_secret(text) from public, anon, authenticated;
grant execute on function public.check_scheduler_secret(text) to service_role;

-- 7) Every 5 minutes: call the scheduler (project URL is public; the secret is read from Vault at run time).
select cron.unschedule(jobid) from cron.job where jobname = 'instagram-scheduler';
select cron.schedule('instagram-scheduler', '*/5 * * * *', $job$
  select net.http_post(
    url := 'https://zeqkuzsgbbcrwrfmqaqf.supabase.co/functions/v1/instagram-scheduler',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-scheduler-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'instagram_scheduler_secret')),
    body := '{}'::jsonb,
    timeout_milliseconds := 150000)
$job$);
