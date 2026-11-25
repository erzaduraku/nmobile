// Product photos of drafts/posts: preparation (downscale, keep transparency) and
// on-device storage in IndexedDB. localStorage is ~5 MB and silently dropped big
// dataURLs, so photo blobs live here; the posts list in localStorage only keeps metadata.
const DB = 'nm_photos', STORE = 'blobs'
let dbp = null
function db() {
  if (!dbp) dbp = new Promise((res, rej) => {
    if (typeof indexedDB === 'undefined') return rej(new Error('IndexedDB missing'))
    const r = indexedDB.open(DB, 1)
    r.onupgradeneeded = () => r.result.createObjectStore(STORE)
    r.onsuccess = () => res(r.result)
    r.onerror = () => rej(r.error)
  }).catch((e) => { dbp = null; throw e })
  return dbp
}
function tx(mode, fn) {
  return db().then((d) => new Promise((res, rej) => {
    const t = d.transaction(STORE, mode), s = t.objectStore(STORE), r = fn(s)
    t.oncomplete = () => res(r?.result); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error)
  }))
}
export const idbPut = (key, blob) => tx('readwrite', (s) => s.put(blob, key))
export const idbGet = (key) => tx('readonly', (s) => s.get(key)).catch(() => undefined)
export const idbDel = (...keys) => tx('readwrite', (s) => { keys.forEach((k) => s.delete(k)) }).catch(() => {})
export const idbKeys = () => tx('readonly', (s) => s.getAllKeys()).catch(() => [])
export const photoKey = (id, which = 'photo') => `${id}:${which}`

// Same-origin image from a Blob (object URL), so canvases that draw it are never tainted.
export function blobToImg(blob) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(blob), i = new Image()
    i.onload = () => res(i); i.onerror = (e) => { URL.revokeObjectURL(url); rej(e) }; i.src = url
  })
}
export const blobToDataURL = (b) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = () => rej(r.error); r.readAsDataURL(b) })
export const dataURLToBlob = async (u) => (await fetch(u)).blob()
// Fetches a stored photo (signed Storage URL, dataURL or blob: URL) as a Blob. null if gone.
export async function fetchBlob(url) {
  if (!url) return null
  try { const r = await fetch(url); if (!r.ok) return null; const b = await r.blob(); return b.size && b.type.startsWith('image/') ? b : (b.size ? new Blob([b], { type: 'image/jpeg' }) : null) } catch { return null }
}

// Downscales a picked photo to max `max` px on the long side. Keeps PNG when the image has
// transparency (cut-out phones), otherwise JPEG 0.9. Small JPEGs are kept byte-for-byte.
export async function prepPhoto(file, max = 1600) {
  const img = await blobToImg(file)
  try {
    const w = img.naturalWidth, h = img.naturalHeight, k = Math.min(1, max / Math.max(w, h))
    const maybeAlpha = /png|webp|gif|avif|heic/i.test(file.type || '')
    if (k === 1 && /jpe?g/i.test(file.type || '')) return file
    const c = document.createElement('canvas'); c.width = Math.round(w * k); c.height = Math.round(h * k)
    const x = c.getContext('2d'); x.drawImage(img, 0, 0, c.width, c.height)
    let alpha = false
    if (maybeAlpha) { const d = x.getImageData(0, 0, c.width, c.height).data; for (let i = 3; i < d.length; i += 4) if (d[i] < 250) { alpha = true; break } }
    if (alpha) return await new Promise((r) => c.toBlob(r, 'image/png'))
    const j = document.createElement('canvas'); j.width = c.width; j.height = c.height
    const y = j.getContext('2d'); y.fillStyle = '#fff'; y.fillRect(0, 0, j.width, j.height); y.drawImage(c, 0, 0)
    return await new Promise((r) => j.toBlob(r, 'image/jpeg', 0.9))
  } finally { URL.revokeObjectURL(img.src) }
}
