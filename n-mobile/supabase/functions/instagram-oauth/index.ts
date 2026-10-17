// Exchanges the OAuth "code" for a long-lived token and stores it for the CURRENT user.
import { admin, cors, GRAPH, json, userFrom } from '../_shared/common.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  try {
    const user = await userFrom(req)
    if (!user) return json({ error: 'Not logged in' }, 401)
    const { code } = await req.json()
    const redirect = Deno.env.get('INSTAGRAM_REDIRECT_URI')!
    // 1) code -> short-lived token
    const form = new URLSearchParams({ client_id: Deno.env.get('INSTAGRAM_APP_ID')!, client_secret: Deno.env.get('INSTAGRAM_APP_SECRET')!, grant_type: 'authorization_code', redirect_uri: redirect, code: String(code).replace(/#_$/, '') })
    const r1 = await fetch('https://api.instagram.com/oauth/access_token', { method: 'POST', body: form })
    const s = await r1.json()
    if (!r1.ok || !s.access_token) return json({ error: s.error_message || 'Code exchange failed', details: s }, 400)
    // 2) short-lived -> long-lived (~60 days)
    const r2 = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${Deno.env.get('INSTAGRAM_APP_SECRET')}&access_token=${s.access_token}`)
    const l = await r2.json()
    if (!r2.ok || !l.access_token) return json({ error: 'Long-lived token exchange failed', details: l }, 400)
    // 3) account info
    const r3 = await fetch(`${GRAPH}/me?fields=user_id,username&access_token=${l.access_token}`)
    const me = await r3.json()
    if (!r3.ok) return json({ error: 'Could not read account', details: me }, 400)
    const { error } = await admin().from('instagram_accounts').upsert({ user_id: user.id, ig_user_id: String(me.user_id ?? s.user_id), username: me.username, access_token: l.access_token, token_expires_at: new Date(Date.now() + l.expires_in * 1000).toISOString(), updated_at: new Date().toISOString() })
    if (error) return json({ error: error.message }, 500)
    return json({ username: me.username })
  } catch (e) { return json({ error: String(e) }, 500) }
})
