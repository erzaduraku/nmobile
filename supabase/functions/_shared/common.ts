import { createClient } from 'npm:@supabase/supabase-js@2'

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
export const GRAPH = 'https://graph.instagram.com/v21.0'
export const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } })
export const admin = () => createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, { auth: { persistSession: false } })

// Returns the logged-in Supabase user from the request's JWT, or null.
export async function userFrom(req: Request) {
  const jwt = (req.headers.get('Authorization') || '').replace('Bearer ', '')
  if (!jwt) return null
  const { data } = await admin().auth.getUser(jwt)
  return data.user ?? null
}

// Refreshes a long-lived token if it expires within 10 days. Returns the usable token.
export async function freshToken(row: { user_id: string; access_token: string; token_expires_at: string | null }) {
  const exp = row.token_expires_at ? new Date(row.token_expires_at).getTime() : 0
  if (exp - Date.now() > 10 * 864e5) return row.access_token
  const r = await fetch(`https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${row.access_token}`)
  const j = await r.json()
  if (!r.ok || !j.access_token) return row.access_token
  await admin().from('instagram_accounts').update({ access_token: j.access_token, token_expires_at: new Date(Date.now() + j.expires_in * 1000).toISOString(), updated_at: new Date().toISOString() }).eq('user_id', row.user_id)
  return j.access_token as string
}
