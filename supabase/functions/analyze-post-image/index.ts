// Analyzes one post image with Groq and caches the features by image hash.
// Body: { post_id } for an app post, or { media_id, image_url } for an Instagram-only post.
// The image URL is accepted only from Instagram CDNs. App images are read from the private posts bucket.
// GROQ_API_KEY is read here and never sent to the browser. A missing key returns { configured: false }.
import { admin, cors, json, userFrom } from '../_shared/common.ts'
import { analyzeWithGroq, DEFAULT_MODEL, PROMPT_VERSION, PROVIDER, sha256, validateVision } from '../_shared/vision.ts'

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_BYTES = 8_000_000

function allowedCdn(raw: string) {
  let url: URL
  try { url = new URL(raw) } catch { return null }
  if (url.protocol !== 'https:') return null
  const host = url.hostname.toLowerCase()
  const ok = host === 'cdninstagram.com' || host.endsWith('.cdninstagram.com')
    || host === 'fbcdn.net' || host.endsWith('.fbcdn.net')
  return ok ? url : null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const user = await userFrom(req)
    if (!user) return json({ error: 'Not logged in' }, 401)
    const body = await req.json().catch(() => ({}))
    const db = admin()
    let bytes: Uint8Array | null = null
    let imagePath: string | null = null
    let postId: string | null = null
    let mediaId: string | null = null

    if (body.post_id) {
      if (!UUID.test(String(body.post_id))) return json({ error: 'Postimi nuk u gjet.' }, 404)
      const { data: post, error } = await db.from('posts').select('id,user_id,image_path,ig_media_id').eq('id', body.post_id).maybeSingle()
      if (error || !post || post.user_id !== user.id) return json({ error: 'Postimi nuk u gjet.' }, 404)
      if (!post.image_path) return json({ error: 'Ky postim nuk ka foto të ruajtur.' }, 400)
      const file = await db.storage.from('posts').download(post.image_path)
      if (file.error || !file.data) return json({ error: 'Fotoja nuk u lexua.' }, 400)
      bytes = new Uint8Array(await file.data.arrayBuffer())
      imagePath = post.image_path
      postId = post.id
      mediaId = post.ig_media_id || null
    } else if (body.media_id && body.image_url) {
      const url = allowedCdn(String(body.image_url))
      if (!url) return json({ error: 'Adresa e fotos nuk lejohet.' }, 400)
      const r = await fetch(url, { redirect: 'manual' })
      if (r.status >= 300 && r.status < 400) return json({ error: 'Fotoja e Instagramit nuk u mor.' }, 400)
      const type = r.headers.get('content-type') || ''
      if (!r.ok || !type.startsWith('image/')) return json({ error: 'Fotoja e Instagramit nuk u mor.' }, 400)
      bytes = new Uint8Array(await r.arrayBuffer())
      mediaId = String(body.media_id).slice(0, 64)
    } else return json({ error: 'Mungon postimi.' }, 400)

    if (!bytes || bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES) return json({ error: 'Fotoja është shumë e madhe ose bosh.' }, 400)
    const hash = await sha256(bytes)
    const model = Deno.env.get('IMAGE_ANALYSIS_MODEL') || DEFAULT_MODEL
    const { data: cached } = await db.from('post_image_analyses').select('*').eq('user_id', user.id).eq('image_hash', hash).eq('provider', PROVIDER).eq('model', model).eq('prompt_version', PROMPT_VERSION).maybeSingle()
    if (cached?.features) return json({ configured: true, cached: true, analysis: cached })

    const apiKey = Deno.env.get('GROQ_API_KEY')
    if (!apiKey) return json({ configured: false, cached: false, analysis: null })

    const result = await analyzeWithGroq(apiKey, bytes, model)
    if (result.rateLimit) return json({ configured: true, code: 'rate_limit', error: 'Limiti falas i Groq u arrit. Provo më vonë.' }, 429)
    const features = result.features ? validateVision(result.features) : null
    if (!features) return json({ configured: true, code: 'failed', error: 'Analiza e fotos dështoi.' }, 502)

    const row = { user_id: user.id, post_id: postId, media_id: mediaId, image_path: imagePath, image_hash: hash, provider: PROVIDER, model, prompt_version: PROMPT_VERSION, features }
    const inserted = await db.from('post_image_analyses').insert(row).select('*').maybeSingle()
    if (inserted.error) {
      const again = await db.from('post_image_analyses').select('*').eq('user_id', user.id).eq('image_hash', hash).eq('provider', PROVIDER).eq('model', model).eq('prompt_version', PROMPT_VERSION).maybeSingle()
      if (again.data) return json({ configured: true, cached: true, analysis: again.data })
      return json({ configured: true, code: 'failed', error: 'Analiza nuk u ruajt.' }, 500)
    }
    return json({ configured: true, cached: false, analysis: inserted.data })
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'Analiza dështoi.' }, 500)
  }
})
