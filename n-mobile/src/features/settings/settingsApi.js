import { supabase } from '../../lib/supabase.js'

export async function loadSettings(uid) {
  let { data, error } = await supabase.from('shop_settings').select('logo, phone, address, whatsapp, instagram').eq('user_id', uid).maybeSingle()
  // before migration 005 the whatsapp/instagram columns do not exist
  if (error) ({ data, error } = await supabase.from('shop_settings').select('logo, phone, address').eq('user_id', uid).maybeSingle())
  if (error) throw error
  return data
}
export async function saveSettings(uid, s) {
  const { error } = await supabase.from('shop_settings').upsert({ user_id: uid, ...s, updated_at: new Date().toISOString() })
  if (error) throw error
}

