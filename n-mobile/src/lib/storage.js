// localStorage wrapper (all keys prefixed nm_) and image/file helpers.
export const LS = {
  get: (k, d = '') => { try { return localStorage.getItem('nm_' + k) ?? d } catch { return d } },
  set: (k, v) => { try { v ? localStorage.setItem('nm_' + k, v) : localStorage.removeItem('nm_' + k) } catch (e) {} },
}
export const loadImg = (src) => new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src })
export const readFile = (f) => new Promise((res) => { const r = new FileReader(); r.onload = () => res(r.result); r.readAsDataURL(f) })
// Downscales an image (used for the custom logo kept in localStorage / DB)
export async function shrink(dataUrl, max = 600) {
  const img = await loadImg(dataUrl); const k = Math.min(1, max / Math.max(img.width, img.height))
  const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return c.toDataURL('image/png')
}
export async function shrinkJpeg(dataUrl, max = 1400) {
  const img = await loadImg(dataUrl); const k = Math.min(1, max / Math.max(img.width, img.height))
  const c = document.createElement('canvas'); c.width = img.width * k; c.height = img.height * k
  const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); x.drawImage(img, 0, 0, c.width, c.height); return c.toDataURL('image/jpeg', 0.88)
}
