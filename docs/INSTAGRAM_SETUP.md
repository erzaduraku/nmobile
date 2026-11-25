# Postimi direkt në Instagram – udhëzues hap pas hapi

Aplikacioni përdor API-në zyrtare **Instagram API with Instagram Login** (`graph.instagram.com`).
Çdo përdorues i aplikacionit e lidh **llogarinë e vet** të Instagramit te **Cilësime → Lidhe Instagramin**.
Tokeni ruhet vetëm në server (Supabase), shfletuesi nuk e sheh kurrë.

> Butoni i vjetër “Shpërndaj (menyja e telefonit)” mbetet gjithmonë si rezervë.

---

## 0. Çfarë të duhet
- Llogari Instagram **Profesionale** (Business ose Creator)
- Llogari Facebook (për Meta for Developers)
- Projekti Supabase (i konfiguruar sipas README-së kryesore)
- Aplikacioni i publikuar në **HTTPS** (p.sh. Vercel). **Meta nuk pranon `localhost` si adresë kthimi (redirect).**

## 1. Kthe Instagramin në llogari Profesionale
1. Instagram → Profili → ☰ → **Settings and privacy** → **Account type and tools**.
2. **Switch to professional account** → zgjidh **Business** (dyqan) ose **Creator**.
3. Zgjidh kategorinë (p.sh. *Electronics store*) dhe përfundo.

## 2. Publiko aplikacionin në Vercel (HTTPS)
1. Ngarko projektin në GitHub → https://vercel.com → **Add New Project** → zgjidh repon.
2. Te **Environment Variables** shto `VITE_SUPABASE_URL` dhe `VITE_SUPABASE_ANON_KEY` → **Deploy**.
3. Shëno adresën, p.sh. `https://nmobile.vercel.app/` – kjo është **Redirect URI** (me `/` në fund).

## 3. Krijo llogarinë e zhvilluesit dhe aplikacionin te Meta
1. Hap https://developers.facebook.com → **Get Started** → regjistrohu si zhvillues (verifiko telefonin/emailin).
2. **My Apps → Create App**.
3. Te *Use cases* zgjidh **Manage messaging & content on Instagram** → Next.
4. Jepi emër (p.sh. “N Mobile Posts”), emailin e kontaktit → **Create app**.

## 4. Konfiguro produktin Instagram
1. Në panelin e aplikacionit: **Use cases → Customize** (te Instagram) ose **Instagram → API setup with Instagram login**.
2. Te *Permissions* sigurohu që janë shtuar: `instagram_business_basic` dhe `instagram_business_content_publish`.
3. Te **Set up Instagram business login → Business login settings**:
   - **OAuth redirect URIs**: `https://nmobile.vercel.app/` (saktësisht si në hapin 2) → **Save**.
4. Kopjo **Instagram App ID** dhe **Instagram App Secret** (te *App settings* të seksionit Instagram).
   ⚠️ Përdor ID/Secret-in e **Instagramit**, jo atë të Facebook App-it.

## 5. Shto llogarinë si tester (Development mode)
Sa kohë aplikacioni është në **Development mode**, mund të lidhen **vetëm** llogaritë që kanë rol në aplikacion.
1. **App roles → Roles → Add People → Instagram Tester** → shkruaj emrin e llogarisë së Instagramit.
2. Në Instagram (web ose app): **Settings → Apps and websites → Tester invites** → **Accept**.
3. Përsërite për çdo llogari tjetër që do ta provojë (deri sa të marrësh App Review).

## 6. Instalo Supabase CLI dhe publiko funksionet
```bash
npm install -g supabase            # ose: npx supabase ...
supabase login
supabase link --project-ref XXXXXXXX   # ID-ja nga URL-ja e projektit
```
Ekzekuto migrimin e ri **`supabase/migrations/003_instagram.sql`** te SQL Editor (si 002).

Vendos sekretet (vetëm në server):
```bash
supabase secrets set INSTAGRAM_APP_ID=123456789 INSTAGRAM_APP_SECRET=abc123... INSTAGRAM_REDIRECT_URI=https://nmobile.vercel.app/
```
Publiko funksionet:
```bash
supabase functions deploy instagram-oauth
supabase functions deploy instagram-publish
supabase functions deploy instagram-refresh
```

## 7. Variablat e aplikacionit (Vercel dhe `.env.local`)
```
VITE_INSTAGRAM_APP_ID=123456789
VITE_INSTAGRAM_REDIRECT_URI=https://nmobile.vercel.app/
```
Ribëj **Deploy** në Vercel. (App ID është publik; **Secret-i nuk vendoset kurrë këtu.**)

## 8. Provoje
1. Hap aplikacionin → hyr → **Cilësime → Lidhe Instagramin** → lejo qasjen.
2. Kthehesh te aplikacioni dhe sheh `@llogaria`. Te **Posto** shfaqet **“Posto direkt (@llogaria)”**.
3. **Shkëput** e heq lidhjen (fshin tokenin nga databaza).

## 9. Rifreskimi i tokenit
Tokeni zgjat ~60 ditë dhe rifreskohet automatikisht kur postohet. Për siguri, planifiko `instagram-refresh` një herë në ditë:
Supabase → **Integrations → Cron** → job i ri → *HTTP request* `POST https://XXXX.supabase.co/functions/v1/instagram-refresh` me header `Authorization: Bearer <SERVICE_ROLE_KEY>`.

## 10. Që çdo përdorues (jo vetëm testerët) të lidhet: App Review
1. **App settings → Basic**: plotëso Privacy Policy URL, Terms URL, ikonën, kategorinë, emailin.
2. **Business verification**: *Meta Business Suite → Settings → Security Center → Start verification* (dokumente të biznesit: certifikata e regjistrimit, adresa, telefoni).
3. **App Review → Permissions and features**: kërko **Advanced Access** për `instagram_business_basic` dhe `instagram_business_content_publish`.
   - Shpjego përdorimin: “Pronari i dyqanit krijon postime nga fotot e produkteve dhe i publikon në llogarinë e vet.”
   - Ngarko video (screencast) që tregon: hyrjen, Lidhe Instagramin, ekranin e lejeve, krijimin e postimit dhe publikimin.
4. Pas aprovimit: kalo aplikacionin në **Live mode** (çelësi lart në panel).

## Kufizime të Instagramit
- Maksimumi **25 postime në 24 orë** për llogari (përmes API-së).
- Vetëm **JPEG** (aplikacioni e konverton vetë); imazhi duhet të jetë në URL publike (bucket `ig-temp`, fshihet pas postimit).
- Raporti i fotos për Feed: nga 4:5 deri 1.91:1 → Post 1080×1350 (4:5) është në rregull.
- **Stories** mbështeten (1080×1920); caption-i nuk shfaqet te Story.
- Llogaritë personale (jo profesionale) nuk mund të lidhen.

## 11. Analiza e fotos (Groq) dhe pronësia e medias

Sekretet e mëposhtme vendosen vetëm te Supabase, jo te Vercel:

```bash
supabase secrets set GROQ_API_KEY=gsk_...
# opsionale, nëse Groq e riemërton modelin falas:
supabase secrets set IMAGE_ANALYSIS_MODEL=qwen/qwen3.8-27b
supabase functions deploy analyze-post-image
```

`GROQ_API_KEY` merret te https://console.groq.com/keys. Plani falas mjafton për provë (rreth 30 kërkesa në minutë, 1000 në ditë; një foto numërohet afër 2048 tokenësh hyrje). Nëse llogaria del nga plani falas, Groq liston rreth $0.80 për 1M tokenë hyrje dhe $4 për 1M tokenë dalje. Aplikacioni nuk e ndërron planin vetë.

Ekzekuto migrimet `016` deri `019` para se ta përdorësh analizën. `016` ruan tiparet e fotos. `018` ruan lidhjen e asaj analize me postimin. `017` nuk lejon që një postim të tregojë një skedar jashtë folderit të pronarit. `019` ruan rekomandimet e shfaqura.

Kur analizohet një postim i Instagramit, funksioni e kërkon atë `media_id` me tokenin e llogarisë së lidhur të përdoruesit. URL-ja që dërgon shfletuesi nuk përdoret. Nëse Instagrami nuk e kthen atë media, kërkesa refuzohet me 404 dhe tokeni nuk i kthehet shfletuesit.

Testet (`npm test`) nuk thërrasin Groq-un dhe nuk publikojnë në Instagram. Lidhja e gjallë duhet provuar me dore pasi sekretet të jenë vendosur.
