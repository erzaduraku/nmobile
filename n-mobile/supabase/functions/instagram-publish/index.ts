// Publishes a JPEG (base64) to the CURRENT user's own Instagram account as a feed post or story.
import { admin, cors, freshToken, GRAPH, json, userFrom } from '../_shared/common.ts'
import { decodeBase64 } from 'jsr:@std/encoding/base64'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  const db = admin()
  let path = ''
  try {
    const user = await userFrom(req)
    if (!user) return json({ error: 'Not logged in' }, 401)
    const { image, caption = '', type = 'post' } = await req.json()
    const { data: acc } = await db.from('instagram_accounts').select('*').eq('user_id', user.id).maybeSingle()
    if (!acc) return json({ error: 'Instagram not connected' }, 400)
    const token = await freshToken(acc)
    // 1) upload JPEG to the public temp bucket (Instagram fetches it by URL)
    path = `${user.id}/${Date.now()}.jpg`
    const up = await db.storage.from('ig-temp').upload(path, decodeBase64(String(image).split(',').pop()!), { contentType: 'image/jpeg' })
    if (up.error) return json({ error: up.error.message }, 500)
    const imageUrl = db.storage.from('ig-temp').getPublicUrl(path).data.publicUrl
    // 2) create media container
    const p = new URLSearchParams({ image_url: imageUrl, access_token: token })
    if (type === 'story') p.set('media_type', 'STORIES'); else p.set('caption', caption)
    const r1 = await fetch(`${GRAPH}/${acc.ig_user_id}/media`, { method: 'POST', body: p })
    const c = await r1.json()
    if (!r1.ok || !c.id) return json({ error: c.error?.message || 'Container failed', details: c }, 400)
    // 3) wait until the container is ready (max ~40 s)
    for (let i = 0; i < 20; i++) {
      const st = await (await fetch(`${GRAPH}/${c.id}?fields=status_code&access_token=${token}`)).json()
      if (st.status_code === 'FINISHED') break
      if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') return json({ error: 'Instagram could not process the image', details: st }, 400)
      await new Promise((r) => setTimeout(r, 2000))
    }
    // 4) publish
    const r2 = await fetch(`${GRAPH}/${acc.ig_user_id}/media_publish`, { method: 'POST', body: new URLSearchParams({ creation_id: c.id, access_token: token }) })
    const pub = await r2.json()
    if (!r2.ok || !pub.id) return json({ error: pub.error?.message || 'Publish failed', details: pub }, 400)
    // 5) public link of the new post (the app stores it for "Hape në Instagram"); retry once, it can lag
    let permalink: string | null = null
    for (let i = 0; i < 2 && !permalink; i++) {
      if (i) await new Promise((r) => setTimeout(r, 1500))
      const link = await (await fetch(`${GRAPH}/${pub.id}?fields=permalink&access_token=${token}`)).json()
      permalink = link.permalink || null
    }
    return json({ id: pub.id, permalink })
  } catch (e) { return json({ error: String(e) }, 500) }
  finally { if (path) await db.storage.from('ig-temp').remove([path]) }
})
