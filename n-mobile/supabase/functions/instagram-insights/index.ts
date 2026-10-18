// Reads Instagram statistics for the CURRENT user's published posts (Instagram API with Instagram Login).
// Body: { items: [{ id, media_id }] }  ->  { stats: { [id]: Stats }, needsReconnect, errors }
// Stats = { views, reach, likes, comments, saved, shares, total_interactions, media_product_type, fetched_at }
// - like_count / comments_count come from the media fields (instagram_business_basic).
// - views / reach / saved / shares / total_interactions come from GET /{media-id}/insights, which needs
//   the instagram_business_manage_insights permission. Without it, needsReconnect = true and only the
//   field counts are returned. ('impressions' is deprecated for media after 2024-07-02; 'views' replaces it.)
// - Metrics differ per media type (STORY has no likes/comments/saved). If Instagram rejects a metric,
//   the remaining ones are retried one by one, so one unsupported metric never hides the others.
// Results are cached on the user's own rows (posts.ig_stats / ig_stats_at, migration 010). Token stays server-side.
import { admin, cors, freshToken, json, userFrom } from '../_shared/common.ts'

const G = 'https://graph.instagram.com/v26.0'
const METRICS: Record<string, string[]> = {
  FEED: ['views', 'reach', 'likes', 'comments', 'saved', 'shares', 'total_interactions'],
  REELS: ['views', 'reach', 'likes', 'comments', 'saved', 'shares', 'total_interactions'],
  STORY: ['views', 'reach', 'shares', 'total_interactions'],
}
type IgErr = { code?: number; message?: string; type?: string; error_subcode?: number }
const isPermission = (e?: IgErr) => !!e && (e.code === 10 || e.code === 200 || /permission|scope|not authorized/i.test(e.message || ''))

async function get(url: string) {
  const r = await fetch(url)
  const j = await r.json().catch(() => ({}))
  return { ok: r.ok && !j.error, j, err: j.error as IgErr | undefined }
}
const readValues = (data: unknown) => {
  const out: Record<string, number> = {}
  for (const m of Array.isArray(data) ? data : []) {
    const v = m?.values?.[0]?.value ?? m?.total_value?.value
    if (typeof v === 'number') out[m.name] = v
  }
  return out
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const user = await userFrom(req)
    if (!user) return json({ error: 'Not logged in' }, 401)
    const { items = [] } = await req.json()
    const db = admin()
    const { data: acc } = await db.from('instagram_accounts').select('*').eq('user_id', user.id).maybeSingle()
    if (!acc) return json({ error: 'Instagram not connected' }, 400)
    const token = await freshToken(acc)
    const scopes = String(acc.scopes || '')
    let needsReconnect = scopes !== '' && !scopes.includes('instagram_business_manage_insights')
    const stats: Record<string, Record<string, unknown>> = {}
    const errors: Record<string, string> = {}
    const list = (Array.isArray(items) ? items : []).filter((it) => it?.id && it?.media_id).slice(0, 30)
    for (const it of list) {
      const mid = encodeURIComponent(String(it.media_id))
      const s: Record<string, unknown> = {}
      const f = await get(`${G}/${mid}?fields=like_count,comments_count,media_product_type,media_type,timestamp&access_token=${token}`)
      if (!f.ok) { errors[it.id] = f.err?.message || 'media not found'; continue }
      s.likes = f.j.like_count ?? null; s.comments = f.j.comments_count ?? null
      s.media_product_type = f.j.media_product_type || 'FEED'; s.timestamp = f.j.timestamp || null
      if (!needsReconnect) {
        const metrics = METRICS[s.media_product_type as string] || METRICS.FEED
        let r = await get(`${G}/${mid}/insights?metric=${metrics.join(',')}&access_token=${token}`)
        let vals: Record<string, number> = {}
        if (r.ok) vals = readValues(r.j.data)
        else if (isPermission(r.err)) needsReconnect = true
        else { // an unsupported metric fails the whole call: retry one by one
          for (const m of metrics) { r = await get(`${G}/${mid}/insights?metric=${m}&access_token=${token}`); if (r.ok) Object.assign(vals, readValues(r.j.data)); else if (isPermission(r.err)) { needsReconnect = true; break } }
          if (!Object.keys(vals).length && !needsReconnect) errors[it.id] = r.err?.message || 'insights unavailable'
        }
        Object.assign(s, vals)
      }
      s.fetched_at = new Date().toISOString()
      stats[it.id] = s
    }
    // cache on the user's own rows (device-only rows have non-uuid ids and are skipped)
    for (const [id, s] of Object.entries(stats)) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) continue
      await db.from('posts').update({ ig_stats: s, ig_stats_at: s.fetched_at }).eq('id', id).eq('user_id', user.id)
    }
    return json({ stats, needsReconnect, errors })
  } catch (e) { return json({ error: String(e) }, 500) }
})
