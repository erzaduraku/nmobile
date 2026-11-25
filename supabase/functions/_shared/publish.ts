// Shared Instagram publishing flow, used by instagram-publish (manual) and instagram-scheduler (planned posts).
import { admin, GRAPH } from './common.ts'

// Error with the HTTP status and Instagram details the manual endpoint returns to the app.
export class PublishError extends Error {
  constructor(message: string, public status = 400, public details?: unknown) { super(message) }
}

// Publishes JPEG bytes to an Instagram account as a feed post or story. Returns the media id and permalink.
export async function publishImage(igUserId: string, token: string, ownerId: string, bytes: Uint8Array, caption = '', type = 'post') {
  const db = admin()
  const path = `${ownerId}/${Date.now()}.jpg`
  let uploaded = false
  try {
    // 1) upload JPEG to the public temp bucket (Instagram fetches it by URL)
    const up = await db.storage.from('ig-temp').upload(path, bytes, { contentType: 'image/jpeg' })
    if (up.error) throw new PublishError(up.error.message, 500)
    uploaded = true
    const imageUrl = db.storage.from('ig-temp').getPublicUrl(path).data.publicUrl
    // 2) create media container
    const p = new URLSearchParams({ image_url: imageUrl, access_token: token })
    if (type === 'story') p.set('media_type', 'STORIES'); else p.set('caption', caption)
    const r1 = await fetch(`${GRAPH}/${igUserId}/media`, { method: 'POST', body: p })
    const c = await r1.json()
    if (!r1.ok || !c.id) throw new PublishError(c.error?.message || 'Container failed', 400, c)
    // 3) wait until the container is ready (max ~40 s)
    for (let i = 0; i < 20; i++) {
      const st = await (await fetch(`${GRAPH}/${c.id}?fields=status_code&access_token=${token}`)).json()
      if (st.status_code === 'FINISHED') break
      if (st.status_code === 'ERROR' || st.status_code === 'EXPIRED') throw new PublishError('Instagram could not process the image', 400, st)
      await new Promise((r) => setTimeout(r, 2000))
    }
    // 4) publish
    const r2 = await fetch(`${GRAPH}/${igUserId}/media_publish`, { method: 'POST', body: new URLSearchParams({ creation_id: c.id, access_token: token }) })
    const pub = await r2.json()
    if (!r2.ok || !pub.id) throw new PublishError(pub.error?.message || 'Publish failed', 400, pub)
    // 5) public link of the new post; retry once, it can lag
    let permalink: string | null = null
    for (let i = 0; i < 2 && !permalink; i++) {
      if (i) await new Promise((r) => setTimeout(r, 1500))
      const link = await (await fetch(`${GRAPH}/${pub.id}?fields=permalink&access_token=${token}`)).json()
      permalink = link.permalink || null
    }
    return { id: String(pub.id), permalink }
  } finally { if (uploaded) await db.storage.from('ig-temp').remove([path]) }
}
