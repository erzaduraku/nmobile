// localStorage wrapper (all keys prefixed nm_) and image/file helpers.
export const LS = {
  get: (k, d = '') => { try { return localStorage.getItem('nm_' + k) ?? d } catch { return d } },
  set: (k, v) => { try { v ? localStorage.setItem('nm_' + k, v) : localStorage.removeItem('nm_' + k) } catch (e) {} },
}
// Remote (http) images are requested with CORS so drawing them never taints a canvas
// (a tainted canvas breaks getImageData/toBlob, i.e. preview, export and saving).
export const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); if (/^https?:/i.test(src)) i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src })
export const readFile = (f) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f) })
// Downscales an image (used for the custom logo kept in localStorage / DB)
// Draws the image scaled down to at most `max` px on its longest side (optional background fill)
async function scaled(dataUrl, max, fill) {
  const img = await loadImg(dataUrl); const k = Math.min(1, max / Math.max(img.width, img.height))
  const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k
  const x = c.getContext('2d'); if (fill) { x.fillStyle = fill; x.fillRect(0, 0, c.width, c.height) }
  x.drawImage(img, 0, 0, c.width, c.height); return c
}
export const shrink = async (dataUrl, max = 600) => (await scaled(dataUrl, max)).toDataURL('image/png')
export const shrinkJpeg = async (dataUrl, max = 1400) => (await scaled(dataUrl, max, '#fff')).toDataURL('image/jpeg', 0.88)
