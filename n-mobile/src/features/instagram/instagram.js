import { supabase } from '../../lib/supabase.js'
export const IG_APP_ID = import.meta.env.VITE_INSTAGRAM_APP_ID
export const IG_REDIRECT = import.meta.env.VITE_INSTAGRAM_REDIRECT_URI || (typeof location !== 'undefined' ? location.origin + '/' : '')
export const igReady = Boolean(IG_APP_ID)

// instagram_business_manage_insights = post statistics (views, reach, saves, shares)
export const IG_SCOPES = 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights'
// false = connected before statistics were requested (or without that permission): ask to reconnect
export const hasInsightsScope = (acc) => !acc?.scopes || acc.scopes.includes('instagram_business_manage_insights')
// Calls an Edge Function and returns its JSON. On a non-2xx answer supabase-js only says
// "Edge Function returned a non-2xx status code"; the real reason is in the response body
// (error.context is the Response), so it is read and turned into a clear Albanian message.
export async function invokeFn(name, body) {
  const { data, error } = await supabase.functions.invoke(name, { body })
  if (!error && !data?.error) return data
  let j = data || null, status = 0
  if (error?.context && typeof error.context.json === 'function') {
    status = error.context.status || 0
    try { j = await error.context.clone().json() } catch { try { j = { error: await error.context.text() } } catch {} }
  }
  const e = new Error(friendlyError(j, status, error?.message))
  e.status = status; e.body = j; e.code = j?.code
  throw e
}
export function friendlyError(j, status, fallback) {
  const raw = [j?.error, j?.details?.error_message, j?.details?.error?.message, j?.details?.message].filter(Boolean).join(' ')
  if (j?.code === 'scope' || /invalid[_ ]scope|scope/i.test(raw)) return 'Instagrami nuk e pranoi lejen për statistikat (instagram_business_manage_insights). Shtoje lejen te aplikacioni në Meta dhe provo sërish.'
  if (/redirect_uri/i.test(raw)) return 'Adresa e kthimit (redirect URI) nuk përputhet me atë të regjistruar në Meta.'
  if (/code has been used|authorization code|verification code|expired/i.test(raw)) return 'Kodi i lidhjes me Instagramin skadoi ose u përdor tashmë. Provo ta lidhësh sërish.'
  if (/not connected/i.test(raw)) return 'Instagrami nuk është i lidhur.'
  if (status === 401 || /not logged in|jwt/i.test(raw)) return 'Seanca ka skaduar. Dil dhe hyr sërish.'
  if (raw) return raw.length > 160 ? raw.slice(0, 157) + '…' : raw
  if (status >= 500) return 'Gabim në server. Provo sërish pas pak.'
  return fallback && !/non-2xx/i.test(fallback) ? fallback : 'Diçka shkoi keq. Provo sërish.'
}
export function startInstagramLogin() {
  // The redirect comes back to IG_REDIRECT; the state must be stored on that same site (origin)
  const back = new URL(IG_REDIRECT, location.href).origin
  if (back !== location.origin) { alert(`Për ta lidhur Instagramin, hape aplikacionin te ${back.replace(/^https?:\/\//, '')}`); return }
  // localStorage (not sessionStorage): it survives when Instagram returns in a new tab or from the PWA
  const state = crypto.randomUUID(); localStorage.setItem('nm_ig_state', state)
  const q = new URLSearchParams({ client_id: IG_APP_ID, redirect_uri: IG_REDIRECT, response_type: 'code', scope: IG_SCOPES, state })
  location.href = 'https://www.instagram.com/oauth/authorize?' + q
}
// Thirret në hapje: nëse URL ka ?code nga Instagrami, e përfundon lidhjen
export async function finishInstagramLogin() {
  const u = new URL(location.href), code = u.searchParams.get('code'), state = u.searchParams.get('state')
  // Instagram sends ?error=…&error_reason=…&error_description=… when the login was cancelled or a permission (scope) is not allowed
  const err = u.searchParams.get('error'), reason = u.searchParams.get('error_reason') || '', desc = u.searchParams.get('error_description') || ''
  if (!code && !err) return null
  history.replaceState(null, '', u.pathname)
  if (err) {
    if (/denied|cancel/i.test(err + reason)) throw new Error('Lidhja e Instagramit u anulua.')
    throw new Error(friendlyError({ error: `${err} ${reason} ${desc}` }, 400))
  }
  const saved = localStorage.getItem('nm_ig_state') || sessionStorage.getItem('nm_ig_state')
  // Instagram can append '#_' to the redirect; compare without it. Only reject a real mismatch
  // (a missing saved state, e.g. login finished in another tab, is allowed: the exchange still needs the user's session).
  if (saved && (state || '').replace(/#_$/, '') !== saved) throw new Error('Lidhja e Instagramit u anulua (state i pavlefshëm). Provo sërish.')
  localStorage.removeItem('nm_ig_state'); sessionStorage.removeItem('nm_ig_state') // a code can be exchanged only once (also protects against a double call)
  return invokeFn('instagram-oauth', { code })
}
export async function getInstagramAccount() {
  const { data } = await supabase.from('instagram_accounts').select('username, ig_user_id, token_expires_at, scopes').maybeSingle()
  return data
}
export async function disconnectInstagram(uid) { await supabase.from('instagram_accounts').delete().eq('user_id', uid) }
export async function publishToInstagram(jpegDataUrl, caption, type) {
  return invokeFn('instagram-publish', { image: jpegDataUrl, caption, type })
}
// Gjen linqet e postimeve të publikuara (serveri përdor tokenin; shfletuesi merr vetëm linqet)
export async function findPermalinks(items) {
  return invokeFn('instagram-permalink', { items })
}
export const igProfileUrl = (u) => { u = String(u || '').trim(); if (/^https?:\/\//.test(u)) return u; u = u.replace(/^@/, ''); return u ? `https://www.instagram.com/${u}/` : '' }
// Statistikat e postimeve (views, reach, likes, comments, saved, shares) – tokeni mbetet në server
export async function fetchInsights(items) {
  return invokeFn('instagram-insights', { items })
}
// Çka është publikuar realisht në llogarinë e lidhur të Instagramit (edhe jashtë aplikacionit).
// Gabimet e pritura vijnë si { error, code: 'reconnect' | 'not_connected' | 'instagram' }.
export async function listInstagramMedia(limit = 50) {
  try { return await invokeFn('instagram-media', { limit }) } catch (e) { return { error: e.message, code: e.code || 'instagram' } }
}
