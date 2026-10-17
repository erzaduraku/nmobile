-- 005_extra_fields: extra post fields + shop contact info.
-- Safe to run more than once (idempotent). Does not modify 001-004.

-- 1) Extra optional post fields as one JSON object (title, slogan, series, series badge,
--    capacity, old price, colors with price delta, condition, notes, second photo).
--    JSON keeps the table stable when the editor gets new optional fields.
alter table public.posts add column if not exists extra jsonb not null default '{}'::jsonb;

-- 2) Shop contact shown in the template footer and at the end of captions.
--    phone and address already exist from 001; add WhatsApp and the Instagram handle.
alter table public.shop_settings add column if not exists whatsapp text;
alter table public.shop_settings add column if not exists instagram text;
