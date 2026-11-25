-- N Mobile: cilësimet e dyqanit për çdo përdorues
create table if not exists public.shop_settings (
  user_id uuid primary key references auth.users(id) on delete cascade default auth.uid(),
  phone text,
  address text,
  logo text,              -- logoja si dataURL (e zvogëluar në 600px) ose URL nga bucket-i 'logos'
  updated_at timestamptz not null default now()
);

alter table public.shop_settings enable row level security;

drop policy if exists "lexo te miat" on public.shop_settings;
drop policy if exists "shto te miat" on public.shop_settings;
drop policy if exists "ndrysho te miat" on public.shop_settings;
drop policy if exists "fshi te miat" on public.shop_settings;
create policy "lexo te miat" on public.shop_settings for select to authenticated using (auth.uid() = user_id);
create policy "shto te miat" on public.shop_settings for insert to authenticated with check (auth.uid() = user_id);
create policy "ndrysho te miat" on public.shop_settings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "fshi te miat" on public.shop_settings for delete to authenticated using (auth.uid() = user_id);

-- OPSIONALE: bucket për logot (skedarët në folderin <user_id>/...)
insert into storage.buckets (id, name, public) values ('logos', 'logos', true) on conflict (id) do nothing;
drop policy if exists "logos lexo" on storage.objects;
drop policy if exists "logos ngarko" on storage.objects;
drop policy if exists "logos ndrysho" on storage.objects;
drop policy if exists "logos fshi" on storage.objects;
create policy "logos lexo" on storage.objects for select using (bucket_id = 'logos');
create policy "logos ngarko" on storage.objects for insert to authenticated with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "logos ndrysho" on storage.objects for update to authenticated using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "logos fshi" on storage.objects for delete to authenticated using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
