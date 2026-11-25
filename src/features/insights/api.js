import { supabase } from '../../lib/supabase.js'
import { invokeFn } from '../instagram/instagram.js'

export async function listAnalyses() {
  if (!supabase) return []
  const { data, error } = await supabase.from('post_image_analyses')
    .select('id,post_id,media_id,image_path,image_hash,provider,model,prompt_version,features,created_at')
    .order('created_at', { ascending: false })
    .limit(100)
  if (error) throw error
  return data || []
}

/** One image per call. A cached hash does not call Groq again. */
export function analyzePostImage(post) {
  const body = post.igOnly
    ? { media_id: String(post.ig_media_id || ''), image_url: post.url || '' }
    : { post_id: post.id }
  return invokeFn('analyze-post-image', body)
}
