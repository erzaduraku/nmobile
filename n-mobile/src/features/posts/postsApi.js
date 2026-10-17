import { supabase } from '../../lib/supabase.js'

// Posts history + drafts (table posts, private bucket 'posts'; see migrations 002 and 004).
const up = async (path, blob, type) => { const r = await supabase.storage.from('posts').upload(path, blob, { contentType: type, upsert: true }); if (r.error) throw r.error }

/* Creates or updates a post row. `id` = existing row (draft) or null.
   preview: rendered image blob; photo: original photo blob (drafts only, uploaded once). Returns the id. */
export async function savePost(uid, meta, { id = null, preview = null, photo = null, photoPath = null } = {}) {
  const row = { ...meta, updated_at: new Date().toISOString() }
  if (preview) { const p = `${uid}/${id || Date.now()}-${meta.status === 'draft' ? 'draft' : 'post'}.${preview.type === 'image/jpeg' ? 'jpg' : 'png'}`; await up(p, preview, preview.type); row.image_path = p }
  if (photo && !photoPath) { const p = `${uid}/photo-${Date.now()}.jpg`; await up(p, photo, 'image/jpeg'); row.photo_path = p } else if (photoPath) row.photo_path = photoPath
  if (id) { const { error } = await supabase.from('posts').update(row).eq('id', id); if (error) throw error; return { id, photo_path: row.photo_path } }
  const { data, error } = await supabase.from('posts').insert({ user_id: uid, ...row }).select('id').single()
  if (error) throw error
  return { id: data.id, photo_path: row.photo_path }
}
export async function listPosts() {
  const { data, error } = await supabase.from('posts').select('*').order('updated_at', { ascending: false }).limit(60)
  if (error) throw error
  const paths = data.flatMap((p) => [p.image_path, p.photo_path]).filter(Boolean)
  const urls = paths.length ? (await supabase.storage.from('posts').createSignedUrls(paths, 3600)).data || [] : []
  const map = Object.fromEntries(urls.map((u) => [u.path, u.signedUrl]))
  return data.map((p) => ({ ...p, url: map[p.image_path], photoUrl: map[p.photo_path] }))
}
export async function deletePost(p) {
  const files = [p.image_path, p.photo_path].filter(Boolean)
  if (files.length) await supabase.storage.from('posts').remove(files)
  const { error } = await supabase.from('posts').delete().eq('id', p.id)
  if (error) throw error
}
