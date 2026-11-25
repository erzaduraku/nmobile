// "Ia vlen me u promovu": picks the ONE published post most worth boosting, from its organic Instagram stats.
// Score = engagement rate = interactions / reach.
// Feed, Reel and Story are never compared with each other. A missing metric stays missing; only a real 0 counts as zero.
// Only posts that had time to collect data (age >= MIN_AGE_H) and enough reach (>= MIN_REACH) are compared,
// and only recent ones (<= MAX_AGE_D) are suggested.
// With 2+ posts of the same format the best must beat that format's average by >= 20%;
// with a single one it needs a good absolute rate (>= GOOD_RATE). Pure function, no React.
import { latestPosted } from './limits.js'

export const MIN_AGE_H = 24, MAX_AGE_D = 30, MIN_REACH = 50, LIFT = 1.2, GOOD_RATE = 0.05
export const FORMAT_LABEL = { feed: 'Postim', reel: 'Reel', story: 'Story' }

const numeric = (v) => typeof v === 'number' && Number.isFinite(v)

export function mediaFormat(post) {
  const t = post?.ig_stats?.media_product_type || post?.ig?.media_product_type
  if (t === 'STORY') return 'story'
  if (t === 'REELS' || post?.ig?.media_type === 'VIDEO') return 'reel'
  if (post?.type === 'story') return 'story'
  return 'feed'
}

/** Names of interaction fields that are actually numbers. Stories never count a missing `saved`. */
export function presentMetrics(stats) {
  if (!stats) return []
  if (numeric(stats.total_interactions)) return ['total_interactions']
  const story = stats.media_product_type === 'STORY'
  const keys = story ? ['likes', 'comments', 'shares'] : ['likes', 'comments', 'saved', 'shares']
  return keys.filter((k) => numeric(stats[k]))
}

export function interactions(stats) {
  const keys = presentMetrics(stats)
  if (!keys.length) return null
  return keys.reduce((sum, key) => sum + stats[key], 0)
}

export function engagement(stats) {
  const n = interactions(stats)
  if (n == null || !(stats?.reach > 0)) return null
  return n / stats.reach
}

/** True when the rate had to be built from a partial set of fields. */
export function metricsPartial(stats) {
  if (!stats || numeric(stats.total_interactions)) return false
  const story = stats.media_product_type === 'STORY'
  const expected = story ? ['shares'] : ['likes', 'comments', 'saved', 'shares']
  return expected.some((key) => !numeric(stats[key]))
}

const pct = (r) => (r * 100).toFixed(r < 0.1 ? 1 : 0).replace('.', ',') + '%'

function saveShareNote(stats) {
  const n = interactions(stats)
  if (n == null || !(n > 0)) return ''
  const saved = numeric(stats.saved) ? stats.saved : null
  const shares = numeric(stats.shares) ? stats.shares : null
  if (saved == null && shares == null) return ''
  const sum = (saved || 0) + (shares || 0)
  if (sum < 3 || sum / n < 0.3) return ''
  if (saved == null) return ' Shumë e ndajnë.'
  if (shares == null) return ' Shumë e ruajnë.'
  return ' Shumë e ruajnë dhe e ndajnë.'
}

function partialNote(stats) {
  return metricsPartial(stats) ? ' Disa statistika mungojnë, ndaj ky krahasim ka siguri më të ulët.' : ''
}

function decision(cand, avg, peers) {
  const s = cand.s
  const note = saveShareNote(s) + partialNote(s)
  if (peers >= 2) {
    if (cand.rate < avg * LIFT) return null
    const x = (cand.rate / avg).toFixed(1).replace('.', ',')
    return { id: cand.p.id, rate: cand.rate, avg, format: cand.format, sampleSize: peers, insufficient: false, reason: `Angazhim ${pct(cand.rate)}, ${x}× mbi mesataren e formatit ${FORMAT_LABEL[cand.format]} (${pct(avg)}).${note}` }
  }
  if (cand.rate < GOOD_RATE) {
    return { id: null, rate: cand.rate, avg: null, format: cand.format, sampleSize: peers, insufficient: true, reason: `Nuk ka mjaft postime ${FORMAT_LABEL[cand.format]} për krahasim (vetëm ${peers}). Nuk përdoret mesatarja e një formati tjetër.` }
  }
  return { id: cand.p.id, rate: cand.rate, avg, format: cand.format, sampleSize: peers, insufficient: false, reason: `Angazhim ${pct(cand.rate)} nga ${s.reach} persona të arritur, shumë mirë për formatin ${FORMAT_LABEL[cand.format]}.${note}` }
}

// Only the MAX_POSTED most recent published posts are analysed.
export function pickPromote(posts, now = Date.now()) {
  const rows = latestPosted(posts).map((p) => {
    const s = p.ig_stats, at = Date.parse(s?.timestamp || p.created_at || p.updated_at)
    return { p, s, format: mediaFormat(p), ageH: (now - at) / 36e5, rate: engagement(s) }
  }).filter((r) => r.s && r.rate != null && r.s.reach >= MIN_REACH && r.ageH >= MIN_AGE_H)
  if (!rows.length) return null
  const qualified = []
  const blocked = []
  for (const format of ['feed', 'reel', 'story']) {
    const group = rows.filter((r) => r.format === format)
    if (!group.length) continue
    const reach = group.reduce((a, r) => a + r.s.reach, 0)
    const avg = group.reduce((a, r) => a + interactions(r.s), 0) / reach
    const cand = group.filter((r) => r.ageH <= MAX_AGE_D * 24).sort((a, b) => b.rate - a.rate)[0]
    if (!cand) continue
    const picked = decision(cand, avg, group.length)
    if (!picked) continue
    if (picked.insufficient) blocked.push(picked)
    else qualified.push(picked)
  }
  if (qualified.length) return qualified.sort((a, b) => b.rate - a.rate)[0]
  if (blocked.length) return blocked.sort((a, b) => b.rate - a.rate)[0]
  return null
}
