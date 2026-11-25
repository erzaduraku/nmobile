// Finds the Instagram link (permalink) of the CURRENT user's already-published posts.
// Body: { items: [{ id, media_id?, caption?, at? }] }  ->  { links: { [id]: permalink }, profile }
// - media_id known: asks Instagram for that media's permalink.
// - no media_id (older posts): matches the user's recent Instagram media by caption, else by time (±10 min).
// Found links are saved on the user's own rows in public.posts. The token never leaves the server.
import { admin, cors, freshToken, GRAPH, json, userFrom } from '../_shared/common.ts'

const norm = (s: unknown) => String(s || '').replace(/\s+/g, ' ').trim()

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const user = await userFrom(req)
    if (!user) return json({ error: 'Not logged in' }, 401)
    const { items = [] } = await req.json()
    const db = admin()
    const { data: acc } = await db.from('instagram_accounts').select('*').eq('user_id', user.id).maybeSingle()
    if (!acc) return json({ error: 'Instagram not connected' }, 400)
    const profile = acc.username ? `https://www.instagram.com/${acc.username}/` : null
    const token = await freshToken(acc)
    const links: Record<string, string> = {}
    const ids: Record<string, string> = {}
    const list = (Array.isArray(items) ? items : []).slice(0, 30)
    let media: { id: string; permalink?: string; caption?: string; timestamp?: string }[] | null = null
    const used = new Set<string>()
    for (const it of list) {
      if (!it?.id) continue
      if (it.media_id) {
        const r = await (await fetch(`${GRAPH}/${encodeURIComponent(it.media_id)}?fields=permalink&access_token=${token}`)).json()
        if (r.permalink) { links[it.id] = r.permalink; ids[it.id] = String(it.media_id) }
        continue
      }
      if (!media) {
        const r = await (await fetch(`${GRAPH}/${acc.ig_user_id}/media?fields=id,permalink,caption,timestamp&limit=50&access_token=${token}`)).json()
        media = Array.isArray(r.data) ? r.data : []
      }
      const free = media.filter((m) => m.permalink && !used.has(m.id))
      const at = it.at ? new Date(it.at).getTime() : NaN
      const near = (m: { timestamp?: string }) => Math.abs(new Date(m.timestamp || 0).getTime() - at)
      let hit = norm(it.caption) ? free.filter((m) => norm(m.caption) === norm(it.caption)) : []
      if (hit.length > 1 && !isNaN(at)) hit.sort((a, b) => near(a) - near(b))
      if (!hit.length && !isNaN(at)) hit = free.filter((m) => near(m) < 10 * 60e3).sort((a, b) => near(a) - near(b))
      if (hit[0]) { used.add(hit[0].id); links[it.id] = hit[0].permalink!; ids[it.id] = hit[0].id }
    }
    // save on the user's own rows (local-only posts have non-uuid ids and are simply skipped)
    for (const id of Object.keys(links)) {
      if (!/^[0-9a-f-]{36}$/i.test(id)) continue
      await db.from('posts').update({ ig_permalink: links[id], ig_media_id: ids[id] }).eq('id', id).eq('user_id', user.id)
    }
    return json({ links, profile })
  } catch (e) { return json({ error: String(e) }, 500) }
})
