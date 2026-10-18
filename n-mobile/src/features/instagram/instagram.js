import { supabase } from '../../lib/supabase.js'
export const IG_APP_ID = import.meta.env.VITE_INSTAGRAM_APP_ID
export const IG_REDIRECT = import.meta.env.VITE_INSTAGRAM_REDIRECT_URI || (typeof location !== 'undefined' ? location.origin + '/' : '')
export const igReady = Boolean(IG_APP_ID)

// instagram_business_manage_insights = post statistics (views, reach, saves, shares)
export const IG_SCOPES = 'instagram_business_basic,instagram_business_content_publish,instagram_business_manage_insights'
// false = connected before statistics were requested (or without that permission): ask to reconnect
export const hasInsightsScope = (acc) => !acc?.scopes || acc.scopes.includes('instagram_business_manage_insights')
export function startInstagramLogin() {
  const state = crypto.randomUUID(); sessionStorage.setItem('nm_ig_state', state)
  const q = new URLSearchParams({ client_id: IG_APP_ID, redirect_uri: IG_REDIRECT, response_type: 'code', scope: IG_SCOPES, state })
  location.href = 'https://www.instagram.com/oauth/authorize?' + q
}
// Thirret në hapje: nëse URL ka ?code nga Instagrami, e përfundon lidhjen
export async function finishInstagramLogin() {
  const u = new URL(location.href), code = u.searchParams.get('code'), state = u.searchParams.get('state')
  if (!code) return null
  history.replaceState(null, '', u.pathname)
  if (state !== sessionStorage.getItem('nm_ig_state')) throw new Error('Lidhja e Instagramit u anulua (state i pavlefshëm)')
  const { data, error } = await supabase.functions.invoke('instagram-oauth', { body: { code } })
  if (error || data?.error) throw new Error(data?.error || error.message)
  return data
}
export async function getInstagramAccount() {
  const { data } = await supabase.from('instagram_accounts').select('username, ig_user_id, token_expires_at, scopes').maybeSingle()
  return data
}
export async function disconnectInstagram(uid) { await supabase.from('instagram_accounts').delete().eq('user_id', uid) }
export async function publishToInstagram(jpegDataUrl, caption, type) {
  const { data, error } = await supabase.functions.invoke('instagram-publish', { body: { image: jpegDataUrl, caption, type } })
  if (error || data?.error) throw new Error(data?.error || error.message)
  return data
}
// Gjen linqet e postimeve të publikuara (serveri përdor tokenin; shfletuesi merr vetëm linqet)
export async function findPermalinks(items) {
  const { data, error } = await supabase.functions.invoke('instagram-permalink', { body: { items } })
  if (error || data?.error) throw new Error(data?.error || error.message)
  return data
}
export const igProfileUrl = (u) => { u = String(u || '').trim(); if (/^https?:\/\//.test(u)) return u; u = u.replace(/^@/, ''); return u ? `https://www.instagram.com/${u}/` : '' }
// Statistikat e postimeve (views, reach, likes, comments, saved, shares) – tokeni mbetet në server
export async function fetchInsights(items) {
  const { data, error } = await supabase.functions.invoke('instagram-insights', { body: { items } })
  if (error || data?.error) throw new Error(data?.error || error.message)
  return data
}
// Çka është publikuar realisht në llogarinë e lidhur të Instagramit (edhe jashtë aplikacionit).
// Gabimet e pritura vijnë si { error, code: 'reconnect' | 'not_connected' | 'instagram' }.
export async function listInstagramMedia(limit = 50) {
  const { data, error } = await supabase.functions.invoke('instagram-media', { body: { limit } })
  if (error) throw new Error(error.message)
  return data
}
