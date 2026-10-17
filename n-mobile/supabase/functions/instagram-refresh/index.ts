// Refreshes every stored token that expires within 10 days. Run daily (Supabase cron / scheduler)
// with the service role key: POST /functions/v1/instagram-refresh  Authorization: Bearer <SERVICE_ROLE_KEY>
import { admin, cors, freshToken, json } from '../_shared/common.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors })
  if ((req.headers.get('Authorization') || '') !== `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`) return json({ error: 'Forbidden' }, 403)
  const { data } = await admin().from('instagram_accounts').select('user_id, access_token, token_expires_at')
  let n = 0
  for (const row of data || []) { const t = await freshToken(row); if (t !== row.access_token) n++ }
  return json({ refreshed: n })
})
