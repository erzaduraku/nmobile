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
- `006_instagram_permalink.sql` – `posts.ig_media_id` and `posts.ig_permalink` (link to the published Instagram post, for "Hape në Instagram") (applied).
- `007_post_photos.sql` – `posts.photo2_path` (second product photo stored as a file in the `posts` bucket instead of a dataURL in `extra`) (applied).
- `008_exported_status.sql` – new `posts.status` value `exported` (downloaded/shared only); old 'posted' rows without Instagram id/link become 'exported' (applied).
- `009_photo_original.sql` – `posts.photo_orig_path` (original upload kept while the background is removed, for undo) (applied).
- `010_instagram_insights.sql` – `posts.ig_stats` / `ig_stats_at` (cached Instagram statistics) and `instagram_accounts.scopes` (granted permissions) (applied).
- `011_instagram_shared.sql` – index on `instagram_accounts.ig_user_id` (same Instagram account on several app logins is allowed) and `instagram_media_stats` (statistics per Instagram media, server-only) (applied).
- `012_ig_deleted.sql` – `posts.ig_deleted_at` (post deleted directly on Instagram; hidden in the app, row kept) (applied).
- `013_draft_limit.sql` through `015_scheduled_posts.sql` – draft and posted limits, and scheduled publishing.
- `016_post_image_analysis.sql` – cached visual features. One row per user, image hash, provider, model and prompt version. Service role writes it; the user can read their own rows.
- `017_post_path_owner.sql` – a post path must be empty or start with that user's id.
- `018_analysis_links.sql` – links one cached analysis to each post or Instagram media that asked for it. A second post does not replace the first post id on the feature row.
- `019_recommendation_snapshots.sql` – recommendation history. Insert and select are limited to the owner. The same algorithm version does not insert the same snapshot twice; a new version keeps the old rows.

Run 016 through 019 in order if they are not already applied. Do not edit 001–017. Deploy `analyze-post-image` after 016 and 018, and set `GROQ_API_KEY` (optional `IMAGE_ANALYSIS_MODEL`) with `supabase secrets set`. That key is not a Vite variable.
