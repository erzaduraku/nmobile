// Merges the app's own post rows with what is actually published on the connected Instagram account.
// - App rows matched by ig_media_id keep everything (Edito, Fshi…) and gain the live Instagram data.
// - Media that exist only on Instagram (made outside the app, or from another app login connected to
//   the same account) become read-only rows: { igOnly: true, id: 'ig:<media id>', … }.
// - App rows marked posted but not (or not yet) in the feed are kept.
// Pure function, no React. `stats` = { [media id]: insights } (latest known, any source).
export const igRowId = (mediaId) => 'ig:' + mediaId

const snippet = (c) => String(c || '').split('\n').map((l) => l.trim()).find(Boolean) || ''

export function mergeIgFeed(posts, media, stats = {}) {
  const out = [...(posts || [])]
  if (!media?.length) return out.map((p) => (p.ig_media_id && stats[p.ig_media_id] ? { ...p, ig_stats: stats[p.ig_media_id] } : p))
  const byMedia = new Map()
  out.forEach((p, i) => { if (p.ig_media_id) byMedia.set(String(p.ig_media_id), i) })
  for (const m of media) {
    const base = { likes: m.like_count ?? null, comments: m.comments_count ?? null, media_product_type: m.media_product_type || 'FEED', timestamp: m.timestamp }
    const st = stats[m.id] || m.stats || null
    const ig_stats = st ? { ...base, ...st } : (m.like_count != null || m.comments_count != null ? base : null)
    const i = byMedia.get(String(m.id))
    if (i != null) {
      const p = out[i]
      out[i] = { ...p, ig: m, ig_permalink: p.ig_permalink || m.permalink || null, ig_stats: st || p.ig_stats || ig_stats }
    } else {
      out.push({
        id: igRowId(m.id), igOnly: true, ig: m, status: 'posted', ig_media_id: m.id, ig_permalink: m.permalink || null,
        url: m.media_product_type === 'REELS' || m.media_type === 'VIDEO' ? m.thumbnail_url || null : m.media_url || m.thumbnail_url || null,
        model: snippet(m.caption), caption: m.caption || '', created_at: m.timestamp, updated_at: m.timestamp, ig_stats,
      })
    }
  }
  return out.sort((a, b) => String(b.updated_at || b.created_at).localeCompare(String(a.updated_at || a.created_at)))
}
