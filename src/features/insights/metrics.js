// Rates compared inside one format. A post with more likes is not ahead when its reach is much higher.
import { engagement, interactions, MIN_AGE_H, MIN_REACH } from '../posts/promote.js'

export { engagement, interactions }

export function pct(r) {
  if (r == null || !Number.isFinite(r)) return null
  return (r * 100).toFixed(r < 0.1 ? 1 : 0).replace('.', ',') + '%'
}

export function mediaFormat(post) {
  const t = post?.ig_stats?.media_product_type || post?.ig?.media_product_type
  if (t === 'STORY') return 'story'
  if (t === 'REELS' || post?.ig?.media_type === 'VIDEO') return 'reel'
  if (post?.type === 'story') return 'story'
  return 'feed'
}

export const FORMAT_LABEL = { feed: 'Postim', reel: 'Reel', story: 'Story' }

/** Saves are not returned for stories, so only shares count there. */
export function saveShareRate(stats, format) {
  if (!stats || !(stats.reach > 0)) return null
  const saves = format === 'story' ? 0 : (stats.saved || 0)
  return (saves + (stats.shares || 0)) / stats.reach
}

export function comparable(post, now = Date.now()) {
  const stats = post?.ig_stats
  const rate = engagement(stats)
  const at = Date.parse(stats?.timestamp || post?.created_at || post?.updated_at)
  if (!stats || rate == null || !(stats.reach >= MIN_REACH) || !Number.isFinite(at)) return null
  const ageH = (now - at) / 36e5
  if (!(ageH >= MIN_AGE_H)) return null
  return { post, stats, rate, ageH, format: mediaFormat(post), saveShare: saveShareRate(stats, mediaFormat(post)) }
}

export function accountAverage(rows) {
  const reach = rows.reduce((a, r) => a + (r.stats.reach || 0), 0)
  if (!(reach > 0)) return null
  return rows.reduce((a, r) => a + interactions(r.stats), 0) / reach
}

/** 0–10 percentile inside the cohort. Null until the cohort has 3 posts. */
export function scoreRate(rate, rows) {
  if (rate == null || !rows || rows.length < 3) return null
  const rates = rows.map((r) => r.rate)
  const below = rates.filter((x) => x < rate).length
  const same = rates.filter((x) => x === rate).length
  const pctile = (below + (same - 1) / 2) / (rates.length - 1)
  return Math.round(Math.min(1, Math.max(0, pctile)) * 100) / 10
}

export function bestAndWeakest(rows) {
  if (!rows.length) return { best: null, weakest: null }
  const best = rows.reduce((a, b) => (b.rate > a.rate ? b : a))
  if (rows.length < 2) return { best, weakest: null }
  const weakest = rows.reduce((a, b) => (b.rate < a.rate ? b : a))
  if (weakest.post.id === best.post.id) return { best, weakest: null }
  return { best, weakest }
}
