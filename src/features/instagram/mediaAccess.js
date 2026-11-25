// A Graph response is proof of ownership only when this user's token could read that media id.
// The URL supplied by the browser is never consulted.

const CDN_HOST = /(^|\.)cdninstagram\.com$|(^|\.)fbcdn\.net$/

export function allowedCdn(raw) {
  let url
  try { url = new URL(String(raw || '')) } catch { return null }
  if (url.protocol !== 'https:') return null
  return CDN_HOST.test(url.hostname.toLowerCase()) ? url.href : null
}

/** Returns the CDN URL to download, or an error status. `clientUrl` is ignored. */
export function ownedMediaUrl(account, graphBody) {
  if (!account?.ig_user_id) return { ok: false, status: 400, error: 'Instagrami nuk është i lidhur.' }
  const id = graphBody?.id != null ? String(graphBody.id) : ''
  if (!/^[0-9]+$/.test(id)) return { ok: false, status: 404, error: 'Postimi i Instagramit nuk u gjet.' }
  const href = allowedCdn(graphBody.media_url)
  if (!href) return { ok: false, status: 404, error: 'Fotoja e këtij postimi nuk është e arritshme.' }
  return { ok: true, id, url: href }
}
