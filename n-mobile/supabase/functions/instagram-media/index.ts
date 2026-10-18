// Lists what is actually published on the CURRENT user's connected Instagram account
// (also posts made outside the app or from another app login connected to the same account).
// Body: { limit?: number (<= 100, default 50) }
// -> { account: { ig_user_id, username }, media: Media[] }  or  { error, code: 'reconnect' | 'not_connected' | 'instagram' }
// Media = { id, caption, media_type, media_product_type, media_url, thumbnail_url, permalink, timestamp,
//           like_count, comments_count, stats? }   (stats = cached insights from instagram_media_stats, migration 011)
// Feed via GET /me/media (paginated), active stories (last 24h) via GET /me/stories when available.
// Token stays server-side; expected failures answer 200 with a code so the app can show a clear message.
import { admin, cors, freshToken, json, userFrom } from '../_shared/common.ts'

const G = 'https://graph.instagram.com/v26.0'
const FIELDS = 'id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp,like_count,comments_count'
const isAuthErr = (e?: { code?: number; type?: string }) => !!e && (e.code === 190 || e.code === 102 || e.type === 'OAuthException' && e.code !== 4 && e.code !== 100)
// Instagram returns "2026-10-17T21:40:00+0000"; normalise to ISO 8601
const iso = (t?: string) => (t ? new Date(t.replace(/([+-]\d\d)(\d\d)$/, '$1:$2')).toISOString() : null)

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const user = await userFrom(req)
    if (!user) return json({ error: 'Not logged in' }, 401)
    const body = await req.json().catch(() => ({}))
    const limit = Math.min(100, Math.max(1, Number(body?.limit) || 50))
    const db = admin()
    const { data: acc } = await db.from('instagram_accounts').select('*').eq('user_id', user.id).maybeSingle()
    if (!acc) return json({ error: 'Instagram not connected', code: 'not_connected' })
    const token = await freshToken(acc)

    const media: Record<string, unknown>[] = []
    let url: string | null = `${G}/me/media?fields=${FIELDS}&limit=${Math.min(limit, 50)}&access_token=${token}`
    while (url && media.length < limit) {
      const r = await fetch(url), j = await r.json().catch(() => ({}))
      if (!r.ok || j.error) {
        if (media.length) break // keep what we already have
        return json({ error: j.error?.message || 'Instagram error', code: isAuthErr(j.error) ? 'reconnect' : 'instagram' })
      }
      media.push(...(j.data || []))
      url = j.paging?.next || null
    }
    // active stories (optional: ignore any error)
    try {
      const r = await fetch(`${G}/me/stories?fields=${FIELDS}&access_token=${token}`), j = await r.json()
      if (r.ok && Array.isArray(j.data)) for (const s of j.data) media.push({ ...s, media_product_type: s.media_product_type || 'STORY' })
    } catch { /* stories not available */ }

    const list = media.slice(0, limit + 30).map((m) => ({ ...m, timestamp: iso(m.timestamp as string) }))
    // attach cached statistics for this Instagram account
    const ids = list.map((m) => String(m.id))
    if (ids.length) {
      const { data: cached } = await db.from('instagram_media_stats').select('media_id, stats').eq('ig_user_id', String(acc.ig_user_id)).in('media_id', ids)
      const by = new Map((cached || []).map((c) => [c.media_id, c.stats]))
      for (const m of list) if (by.has(String(m.id))) (m as Record<string, unknown>).stats = by.get(String(m.id))
    }
    list.sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
    return json({ account: { ig_user_id: acc.ig_user_id, username: acc.username }, media: list })
  } catch (e) { return json({ error: String(e) }, 500) }
})
