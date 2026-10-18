// "Ia vlen me u promovu": picks the ONE published post most worth boosting, from its organic Instagram stats.
// Score = engagement rate = interactions / reach (interactions = total_interactions, or likes+comments+saved+shares).
// Only posts that had time to collect data (age >= MIN_AGE_H, Instagram data can lag up to 48h)
// and enough reach (>= MIN_REACH) are compared, and only recent ones (<= MAX_AGE_D) are suggested.
// With 2+ comparable posts the best must beat the account average by >= 20%;
// with a single one it needs a good absolute rate (>= GOOD_RATE). Pure function, no React.
export const MIN_AGE_H = 24, MAX_AGE_D = 30, MIN_REACH = 50, LIFT = 1.2, GOOD_RATE = 0.05

export const interactions = (s) => (s ? (typeof s.total_interactions === 'number' ? s.total_interactions : (s.likes || 0) + (s.comments || 0) + (s.saved || 0) + (s.shares || 0)) : 0)
export const engagement = (s) => (s && s.reach > 0 ? interactions(s) / s.reach : null)
const pct = (r) => (r * 100).toFixed(r < 0.1 ? 1 : 0).replace('.', ',') + '%'

export function pickPromote(posts, now = Date.now()) {
  const rows = (posts || []).map((p) => {
    const s = p.ig_stats, at = Date.parse(s?.timestamp || p.created_at || p.updated_at)
    return { p, s, ageH: (now - at) / 36e5, rate: engagement(s) }
  }).filter((r) => r.s && r.rate != null && r.s.reach >= MIN_REACH && r.ageH >= MIN_AGE_H)
  if (!rows.length) return null
  // account average, weighted by reach (all mature posts, also older than MAX_AGE_D)
  const avg = rows.reduce((a, r) => a + interactions(r.s), 0) / rows.reduce((a, r) => a + r.s.reach, 0)
  const cand = rows.filter((r) => r.ageH <= MAX_AGE_D * 24).sort((a, b) => b.rate - a.rate)[0]
  if (!cand) return null
  const s = cand.s, saveShare = (s.saved || 0) + (s.shares || 0)
  const extra = saveShare >= 3 && saveShare / Math.max(1, interactions(s)) >= 0.3 ? ' Shumë e ruajnë dhe e ndajnë.' : ''
  if (rows.length >= 2) {
    if (cand.rate < avg * LIFT) return null
    const x = (cand.rate / avg).toFixed(1).replace('.', ',')
    return { id: cand.p.id, rate: cand.rate, avg, reason: `Angazhim ${pct(cand.rate)}, ${x}× mbi mesataren tënde (${pct(avg)}).${extra}` }
  }
  if (cand.rate < GOOD_RATE) return null
  return { id: cand.p.id, rate: cand.rate, avg, reason: `Angazhim ${pct(cand.rate)} nga ${s.reach} persona të arritur, shumë mirë.${extra}` }
}
