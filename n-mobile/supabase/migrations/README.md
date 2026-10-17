# Database migrations

Run each file once, in order, in the Supabase dashboard: **SQL Editor → New query → paste → Run**.

| File | Purpose | Status |
|---|---|---|
| `001_initial.sql` | `shop_settings` table (logo, phone, address per user) + RLS, optional public `logos` bucket. Identical to `../schema.sql`. | Already applied |
| `002_posts.sql` | `posts` table (history of generated posts) + RLS, private `posts` storage bucket + per-user policies. | New – run it |

## Rules
- Never edit a migration that has already been applied (including `../schema.sql`).
- Every future database change = a **new numbered file** (`003_....sql`, `004_....sql`, ...).
- Write migrations to be idempotent (`if not exists`, `drop policy if exists`, `on conflict do nothing`) and comment what each block does and why.

## Files
- `001_initial.sql` – shop settings (already applied).
- `002_posts.sql` – posts history table + private `posts` bucket.
- `003_instagram.sql` – per-user Instagram accounts (token hidden from clients) + `ig-temp` bucket.
- `004_drafts.sql` – drafts (`status` draft/posted, `photo_path`, `updated_at`) and device fields (`model_code`, `region`, `no_active`).
- `005_extra_fields.sql` – `posts.extra` (jsonb with optional fields) and `shop_settings.whatsapp` / `instagram`.
