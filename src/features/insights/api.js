import { supabase } from '../../lib/supabase.js'
import { invokeFn } from '../instagram/instagram.js'
import { recommendationRows } from './snapshots.js'

export { recommendationRows } from './snapshots.js'

const ANALYSIS_COLUMNS = 'id,post_id,media_id,image_path,image_hash,provider,model,prompt_version,features,created_at'

export async function listAnalyses() {
  if (!supabase) return []
  const direct = await supabase.from('post_image_analyses').select(ANALYSIS_COLUMNS).order('created_at', { ascending: false }).limit(100)
  if (direct.error) throw direct.error
  const linked = await supabase.from('post_image_analysis_links')
    .select(`post_id,media_id,created_at,analysis:post_image_analyses(${ANALYSIS_COLUMNS})`)
    .order('created_at', { ascending: false })
    .limit(200)
  if (linked.error) return direct.data || []
  const fromLinks = []
  for (const row of linked.data || []) {
    if (!row.analysis) continue
    fromLinks.push({ ...row.analysis, post_id: row.post_id || row.analysis.post_id, media_id: row.media_id || row.analysis.media_id })
  }
  const covered = new Set(fromLinks.map((r) => `${r.id}:${r.post_id || ''}:${r.media_id || ''}`))
  const rest = (direct.data || []).filter((r) => !covered.has(`${r.id}:${r.post_id || ''}:${r.media_id || ''}`))
  return [...fromLinks, ...rest]
}

/** One image per call. A cached hash does not call Groq again. The browser URL is not proof of ownership. */
export function analyzePostImage(post) {
  const body = post.igOnly
    ? { media_id: String(post.ig_media_id || '') }
    : { post_id: post.id }
  return invokeFn('analyze-post-image', body)
}

export async function saveRecommendationSnapshots(userId, postId, items) {
  if (!supabase || !userId) return { saved: 0 }
  const rows = recommendationRows(userId, postId, items)
  if (!rows.length) return { saved: 0 }
  const { error } = await supabase.from('recommendation_snapshots').upsert(rows, { onConflict: 'user_id,dedupe_key,algorithm_version', ignoreDuplicates: true })
  if (error) throw error
  return { saved: rows.length }
}
