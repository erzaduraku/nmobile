// Publishes a JPEG (base64) to the CURRENT user's own Instagram account as a feed post or story.
import { admin, cors, freshToken, json, userFrom } from '../_shared/common.ts'
import { publishImage, PublishError } from '../_shared/publish.ts'
import { decodeBase64 } from 'jsr:@std/encoding/base64'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const user = await userFrom(req)
    if (!user) return json({ error: 'Not logged in' }, 401)
    const { image, caption = '', type = 'post' } = await req.json()
    const { data: acc } = await admin().from('instagram_accounts').select('*').eq('user_id', user.id).maybeSingle()
    if (!acc) return json({ error: 'Instagram not connected' }, 400)
    const token = await freshToken(acc)
    return json(await publishImage(acc.ig_user_id, token, user.id, decodeBase64(String(image).split(',').pop()!), caption, type))
  } catch (e) {
    if (e instanceof PublishError) return json(e.details === undefined ? { error: e.message } : { error: e.message, details: e.details }, e.status)
    return json({ error: String(e) }, 500)
  }
})
