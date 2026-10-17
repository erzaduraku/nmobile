# N Mobile – Postime për Instagram

Aplikacion web (PWA) për dyqanin **N Mobile**: ngarko foton e telefonit, zgjidh Post/Story, template-in dhe temën, shkruaj çmimin dhe poste në Instagram me caption të gatshëm.

## Si ta nisësh (kompjuter)

Duhet Node.js 18+.

```bash
npm install        # instalon paketat (vetëm herën e parë)
npm run dev        # nis aplikacionin për zhvillim → http://localhost:5173
npm run build      # krijon versionin final në folderin dist/
npm run preview    # shfaq versionin final → http://localhost:4173
```

Skripte për zhvillim (në `scripts/`, kërkojnë Google Chrome): `npm run icons` (ikonat e PWA-së), `npm run render-test` (PNG për çdo template × lloj × temë; `WHITE=1` / `NOPRICE=1` për variante), `node scripts/ui-screens.mjs` (pamje të ekraneve), `node scripts/logo-sheet.mjs` (fleta e logos).

Arkitektura: shiko `docs/ARCHITECTURE.md`. Instagrami: `docs/INSTAGRAM_SETUP.md`.

## Hyrja me llogari (Supabase)

Aplikacioni ka hyrje me email + fjalëkalim (Hyr / Regjistrohu / Harrova fjalëkalimin). Logoja ruhet në llogari, që të jenë njësoj në çdo telefon (dhe ruhen edhe në pajisje si rezervë).

1. Krijo një projekt falas në https://supabase.com.
2. Te **SQL Editor → New query**, ngjit krejt përmbajtjen e `supabase/schema.sql` dhe shtyp **Run**. Krijohet tabela `shop_settings` me RLS (secili përdorues sheh vetëm të dhënat e veta) dhe bucket-i opsional `logos`.
3. Te **Project Settings → API** kopjo *Project URL* dhe kodin *anon public*.
4. Kopjo `.env.example` si `.env.local` dhe plotësoji:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
5. Te **Authentication → URL Configuration** vendos *Site URL* adresën e aplikacionit (p.sh. `http://localhost:5173` ose linkun e Vercel), që linqet e emailit (konfirmimi, fjalëkalimi i ri) të kthehen te aplikacioni.
6. Rinise `npm run dev`. Në Vercel/Netlify shto të njëjtat dy variabla te *Environment Variables*.

**Migrimet e databazës:** ndryshimet e reja janë në `supabase/migrations/` (shiko `supabase/migrations/README.md`). `001_initial.sql` është kopje e `schema.sql` (tashmë i ekzekutuar) – ekzekuto me radhë vetëm skedarët e rinj, p.sh. `002_posts.sql`.

Pa `.env.local` aplikacioni prapë ndërtohet dhe punon: shfaq mesazhin “Hyrja nuk është konfiguruar” dhe lejon “Vazhdo pa llogari” (të dhënat ruhen vetëm në pajisje).

## Si ta instalosh në telefon

PWA instalohet vetëm përmes **HTTPS** (ose localhost).

1. **Rekomandohet:** publikoje falas në **Vercel** ose **Netlify** (lidh repon nga GitHub, ose tërhiq folderin `dist/` te app.netlify.com/drop). Merr një link `https://...`.
2. Hape linkun në telefon:
   - **Android (Chrome):** menyja ⋮ → *Shto në ekranin kryesor / Instalo aplikacionin*.
   - **iPhone (Safari):** butoni Shpërnda → *Shto në ekranin bazë*.
3. Për provë në të njëjtin rrjet Wi‑Fi: `npm run dev` dhe hap në telefon adresën `http://IP-e-kompjuterit:5173` (funksionon, por pa instalim PWA dhe pa “Posto në Instagram”, sepse këto kërkojnë HTTPS).

## Përdorimi

- **Kryefaqja** → butoni i madh **Krijo postim të ri** dhe postimet e fundit.
- Redaktori ka 5 hapa me shirit progresi dhe butonin **Vazhdo** poshtë: **Foto → Template → Tema → Detajet → Posto**.
- **Postimet** – historia (Edito / Fshi). **Cilësime** – lidhja me Instagramin, logoja, llogaria.

Templates (secili Post 1080×1350 dhe Story 1080×1920, me çdo temë): **Hero i kuq, E kuqe e plotë, Studio, Katalog i bardhë, Bento, Ofertë, Sot në stok, Diagonale, Detaj, Dy produkte, Çmimi si hero, Specifikime, Karta**.

Temat janë te `src/features/themes/themes.json` (Standard, Stinët, Festat); aplikacioni sugjeron temën sipas datës. Kontakti i dyqanit (telefon, WhatsApp, adresë, Instagram) vendoset te Cilësime.
Detajet: modeli (shkronjat rregullohen vetë, p.sh. “iphone 18 pro” → “iPhone 18 Pro”), çmimi (opsional), oferta (“20” → “-20%”), specifikat, info/garancion, teksti i butonit.

## Shënime

- “Posto në Instagram” hap menynë e ndarjes së telefonit me foton; zgjidh Instagram (Feed ose Story). Caption-i kopjohet automatikisht – ngjite në Instagram.
- Nëse shfletuesi nuk e mbështet ndarjen e fotove, fotoja shkarkohet dhe caption-i kopjohet.

## Drafte dhe fushat e reja
- Te **Detajet**: Specifikat si fusha të veçanta (RAM, Memoria, Kamera, Bateria, Ekrani – zgjidh ose shkruaj; në foto dalin deri në 4 me ikonë). *Kodi i modelit* (p.sh. A3717), *Versioni / Rajoni* (CE me flamurin e BE-së, US, LL/A, JP, Global ose tekst tjetër) dhe *No Active*. Dalin në foto dhe në caption.
- Puna ruhet vetë si **draft** (ose me “Ruaj si draft”). Te **Postimet**: Të gjitha / Draftet / Të postuara. Kur shkarkon ose poston, drafti bëhet “Postuar”.
- Në Supabase ekzekuto me radhë `supabase/migrations/002_posts.sql`, `003_instagram.sql`, `004_drafts.sql`, `005_extra_fields.sql` (SQL Editor).
