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
    if (!r1.ok || !s.access_token) {
      const msg = String(s.error_message || s.error?.message || 'Code exchange failed')
      console.error('instagram-oauth code exchange failed', r1.status, msg)
      return json({ error: msg, code: /scope|permission/i.test(msg) ? 'scope' : /redirect_uri/i.test(msg) ? 'redirect' : 'exchange', details: { error_type: s.error_type, error_message: msg } }, 400)
    }
    // 2) short-lived -> long-lived (~60 days)
    const r2 = await fetch(`https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${Deno.env.get('INSTAGRAM_APP_SECRET')}&access_token=${s.access_token}`)
    const l = await r2.json()
    if (!r2.ok || !l.access_token) { console.error('instagram-oauth long-lived exchange failed', r2.status, l.error?.message); return json({ error: 'Long-lived token exchange failed: ' + (l.error?.message || r2.status), code: 'exchange' }, 400) }
    // 3) account info
    const r3 = await fetch(`${GRAPH}/me?fields=user_id,username&access_token=${l.access_token}`)
    const me = await r3.json()
    if (!r3.ok) { console.error('instagram-oauth /me failed', r3.status, me.error?.message); return json({ error: 'Could not read account: ' + (me.error?.message || r3.status), code: 'account' }, 400) }
    // granted permissions (comma list), so the app knows e.g. whether statistics are allowed (migration 010)
    const granted = s.permissions ?? s.data?.[0]?.permissions
    const scopes = Array.isArray(granted) ? granted.join(',') : typeof granted === 'string' ? granted : null
    const { error } = await admin().from('instagram_accounts').upsert({ user_id: user.id, ig_user_id: String(me.user_id ?? s.user_id), username: me.username, access_token: l.access_token, scopes, token_expires_at: new Date(Date.now() + l.expires_in * 1000).toISOString(), updated_at: new Date().toISOString() })
    if (error) { console.error('instagram-oauth save failed', error.message); return json({ error: error.message }, 500) }
    // scopes == null: Instagram did not report the granted permissions (unknown, treated as ok)
    return json({ username: me.username, scopes, missingInsights: scopes != null && !scopes.includes('instagram_business_manage_insights') })
  } catch (e) { console.error('instagram-oauth', String(e)); return json({ error: String(e) }, 500) }
})
