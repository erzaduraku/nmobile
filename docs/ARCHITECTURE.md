# N Mobile – Architecture

## Folder tree
```
src/
  main.jsx                 fonts, mounts <App>; ?test exposes window.__nm for render scripts
  app/                     App.jsx (auth gate), Editor.jsx (screens + bottom nav), tabs.js (steps, nav)
  hooks/useEditor.jsx      all editor state and actions, returned as one `ed` object
  features/
    editor/                PhotoTab, TemplateTab, DetailsTab, PublishTab, caption.js
    themes/                themes.js (seasonal palettes + headline fonts), ThemeTab, icons
    templates/             index.js (TEMPLATES, renderTo, fontsReady)
      shared/blocks.js     formatting (smartCase, normOffer, fmtPrice), text stack layout, spec icons
      shared/pro.js        light/dark "pro" scene, two-tone title, product placement, pills
      shared/silk.js       deep-red / full-red silk wave background, glow
      designs/             hero, red, studio, catalog, bento (one file per template)
    auth/                  Auth, NewPassword (Supabase email/password)
    posts/                 HomePage, PostsTab, postsApi.js
    settings/              SettingsPage, settingsApi.js
    instagram/instagram.js OAuth start/finish, account, disconnect, publish
  components/ui/           Logo (SVG), PostCanvas
  lib/                     supabase.js, storage.js, canvas/draw.js (photo analysis, cutout, logo), canvas/logoGeom.js
supabase/
  schema.sql, migrations/001..017, functions/{instagram-oauth,instagram-publish,instagram-refresh,instagram-scheduler,analyze-post-image,_shared}
scripts/                   icons, render (test PNGs), ui-screens, logo-sheet
```

## Data flow
Photo -> `readFile`/`shrink` -> `HTMLImageElement` in `useEditor` -> `PostCanvas` calls
`renderTo(canvas, tpl, type, theme, data)` -> template draw function. The same function renders
the preview and the export (JPEG/PNG blob), so preview equals output.
Photos with a uniform light background are analysed (`photoBg`) and cut out (`cutout`, edge flood fill
with soft alpha), so products sit cleanly on any background and are never cropped (contain-fit).

## State
A single hook (`useEditor`) owns the editor state. Persistent small values (CTA, info, logo cache)
go through `LS` (localStorage, `nm_` prefix). Screens are local state in `Editor.jsx` (no router).

## Storage layers
- localStorage: preferences and a short list of post metadata (`nm_` prefix).
- IndexedDB (`nm_photos`): the product photo, the untouched original, and the optional second photo for drafts kept on the device. A failed write is shown to the user and the draft is not marked saved.
- Supabase: `shop_settings` (logo), `posts` table + private `posts` bucket (signed URLs),
  `instagram_accounts`, public `ig-temp` bucket (temporary images for Instagram), `post_image_analyses` (migration 016).
- Drafts autosave 2.5 s after the last edit. Opening another post flushes the current draft before any photo load. Scheduled posts are published by `instagram-scheduler` (pg_cron, migration 015). After Instagram accepts a post, `ig_media_id` is stored before later cleanup, and a later run does not publish that row again.
- Insights (`features/insights`) reads the cached image analysis and engagement numbers. It sits beside promote scoring and does not replace it.
- Edge functions (Deno): OAuth code exchange, publishing, token refresh, the scheduler, and image analysis.

## Themes and new templates
Themes live in `features/themes/themes.json` (colors, decoration id, badge, caption titles, hashtags, date window); `suggestTheme()` picks the nearest holiday inside its window, else the season. New decorations are in `lib/canvas/decor.js` and draw only on the back layer near the edges. New templates (`offer2, stock, diagonal, detail, duo, pricehero, specsheet, cards`) share `shared/kit.js` (safe zones, contact footer, outline text) and `shared/styles.js`. Extra optional fields are kept in `posts.extra` (migration 005).

## Spec fields
RAM, storage, camera, battery and screen are separate fields in `features/editor/specFields.js`. They are serialized into the existing `posts.spec` text column (`"12GB RAM | 256GB | 48MP | 5000mAh"`), so no migration is needed; `parseSpec` converts old free-text specs back into fields (unknown parts are kept as "extra").

## Drafts
`useEditor` autosaves a draft 2.5 s after the last change (`persist("draft")`): signed in, the row in `posts` gets `status=draft`, a JPEG preview and the original photo (`photo_path`); offline, localStorage keeps up to 10 drafts with a downscaled photo. Export/share/publish calls `remember()`, which turns the same row into `status=posted`. Device fields (`code`, `region`, `noActive`) are drawn by `shared/meta.js` (vector flags) inside the common text stack, so every template shows them.

## Security
- RLS on all tables; users only see their own rows.
- `instagram_accounts.access_token` is not granted to `anon`/`authenticated` (column-level grants);
  only edge functions read it with the service role.
- `INSTAGRAM_APP_SECRET` and `GROQ_API_KEY` live only as function secrets. Applied SQL is never edited; changes are new migrations.
- Instagram OAuth finishes only when the returned `state` matches the value saved when login started. A missing saved state is rejected.
- `image_path`, `photo_path`, `photo2_path`, and `photo_orig_path` are null or start with that row's `user_id` (migration 017). `analyze-post-image` and `instagram-scheduler` refuse any other path before they download it with the service role. The scheduler also publishes a container only after Instagram reports `FINISHED`.

## Tech debt
- Instagram flow is untested against the live API.
- Automated checks are `node --test` (insights, OAuth state, storage-path ownership, and the “already published” decision). There is no ESLint script.
- `ig-temp` files are deleted after publishing, but failures may leave files behind (no cleanup job). Temporary object names are unguessable.
- Old template ids saved in posts fall back to the first template.
- Migrations run through 017. IndexedDB, drafts, scheduling, and insights are in the app as described above.

## Next steps
Cleanup job for `ig-temp`, carousel posts, unit tests for formatting.
