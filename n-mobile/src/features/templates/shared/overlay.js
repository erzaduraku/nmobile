import { font, rr, photoBg, wrapFit } from '../../../lib/canvas/draw.js'
import { fmtPrice, hasP, priceNum, modelText, ASK, specParts, specIcon } from './blocks.js'
import { metaRows } from './meta.js'
import { proPhoto } from './pro.js'
import { silkBg, glow } from './silk.js'

/* "Mbi foto" (text over photo): the user's photo fills the whole canvas (cover) and the text sits on
   soft scrims. A cut-out (transparent PNG after background removal) has no scene to fill with, so then
   d.imgOrig (the photo as uploaded) is used when the editor passes it; otherwise the cut-out product is
   placed in the template's free area (box) on a deep brand backdrop. */
export const srcOf = (d) => {
  const o = d.imgOrig || d.photoOrig || null
  if (o && !photoBg(o).alpha) return o
  return d.img || null
}

// Average luminance (0-255) of the photo in a canvas band, for adaptive scrims. Cached per image + size.
const LUM = new WeakMap()
function lumMap(img, W, H) {
  let m = LUM.get(img); if (!m) { m = new Map(); LUM.set(img, m) }
  const key = W + 'x' + H; if (m.has(key)) return m.get(key)
  let res = null
  try {
    const cw = 36, ch = Math.round((36 * H) / W), c = document.createElement('canvas'); c.width = cw; c.height = ch
    const x = c.getContext('2d', { willReadFrequently: true }); coverDraw(x, img, cw, ch)
    const p = x.getImageData(0, 0, cw, ch).data
    res = { cw, ch, p }
  } catch (e) { res = null }
  m.set(key, res); return res
}
export function regionLum(img, W, H, x0, y0, x1, y1) {
  const m = img && lumMap(img, W, H); if (!m) return 128
  const { cw, ch, p } = m
  const a = Math.max(0, Math.floor((x0 / W) * cw)), b = Math.min(cw, Math.ceil((x1 / W) * cw)), c = Math.max(0, Math.floor((y0 / H) * ch)), dd = Math.min(ch, Math.ceil((y1 / H) * ch))
  let s = 0, n = 0
  for (let yy = c; yy < dd; yy++) for (let xx = a; xx < b; xx++) { const o = (yy * cw + xx) * 4; s += 0.299 * p[o] + 0.587 * p[o + 1] + 0.114 * p[o + 2]; n++ }
  return n ? s / n : 128
}
function coverDraw(ctx, img, W, H, x = 0, y = 0) {
  const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, k = Math.max(W / iw, H / ih)
  ctx.drawImage(img, x + (W - iw * k) / 2, y + (H - ih * k) / 2, iw * k, ih * k)
}

/* Background. box = free area {cx, cy, w, h} for a cut-out product. Returns
   { img, cut, lum(x0,y0,x1,y1) } so scrims can adapt to how bright the photo is there. */
export function fullPhoto(ctx, W, H, d, t, box) {
  const img = srcOf(d)
  if (!img || photoBg(img).alpha) {
    silkBg(ctx, W, H, t, 'deep')
    const b = box || { cx: W / 2, cy: H / 2, w: W * 0.8, h: H * 0.55 }
    glow(ctx, b.cx, b.cy, Math.max(b.w, b.h) * 0.62, t.accent, 0.55)
    proPhoto(ctx, img, b.cx, b.cy, b.w, b.h, 0)
    return { img: null, cut: true, lum: () => 60 }
  }
  ctx.save(); coverDraw(ctx, img, W, H); ctx.restore()
  // soft vignette keeps the eye on the product in the middle
  const v = ctx.createRadialGradient(W / 2, H * 0.5, Math.min(W, H) * 0.35, W / 2, H * 0.5, Math.max(W, H) * 0.78)
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.28)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H)
  return { img, cut: false, lum: (x0, y0, x1, y1) => regionLum(img, W, H, x0, y0, x1, y1) }
}

/* Eased scrim: from = 'top' (dark at y0, clear at y1) or 'bottom' (clear at y0, dark at y1).
   lum = photo brightness there: bright photos get a stronger scrim. */
export function scrim(ctx, W, y0, y1, from = 'top', base = 0.55, lum = 128, tint = '0,0,0') {
  const a = Math.max(0.18, Math.min(0.9, base + ((lum - 110) / 255) * 0.55))
  const g = ctx.createLinearGradient(0, y0, 0, y1)
  for (let i = 0; i <= 8; i++) { const s = i / 8, e = from === 'top' ? 1 - s : s; g.addColorStop(s, `rgba(${tint},${(a * e * e * (3 - 2 * e)).toFixed(3)})`) }
  ctx.fillStyle = g; ctx.fillRect(0, y0, W, y1 - y0)
}
// Radial scrim in a corner (minimal layout)
export function cornerScrim(ctx, x, y, r, a = 0.6) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r)
  g.addColorStop(0, `rgba(0,0,0,${a})`); g.addColorStop(0.5, `rgba(0,0,0,${a * 0.55})`); g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2)
}
// Soft text shadow for white type on photos
export function softShadow(ctx, k = 1) { ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = 22 * k; ctx.shadowOffsetY = 3 * k }

// Frosted glass: the photo under the card, blurred by down/up-scaling (works on every browser), plus tint
export function glass(ctx, W, H, img, x, y, w, h, r, { tint = 'rgba(16,16,20,.42)', line = 'rgba(255,255,255,.22)' } = {}) {
  ctx.save(); rr(ctx, x, y, w, h, r); ctx.clip()
  if (img) {
    const f = 22, c = document.createElement('canvas'); c.width = Math.max(1, Math.round(W / f)); c.height = Math.max(1, Math.round(H / f))
    const cx = c.getContext('2d'); cx.imageSmoothingQuality = 'high'; coverDraw(cx, img, c.width, c.height)
    const c2 = document.createElement('canvas'); c2.width = c.width * 2; c2.height = c.height * 2
    const x2 = c2.getContext('2d'); x2.imageSmoothingQuality = 'high'; x2.drawImage(c, 0, 0, c2.width, c2.height)
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(c2, 0, 0, W, H)
  }
  ctx.fillStyle = tint; ctx.fillRect(x, y, w, h)
  const hl = ctx.createLinearGradient(0, y, 0, y + h); hl.addColorStop(0, 'rgba(255,255,255,.14)'); hl.addColorStop(0.35, 'rgba(255,255,255,.03)'); hl.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = hl; ctx.fillRect(x, y, w, h)
  ctx.restore()
  ctx.save(); rr(ctx, x + 1, y + 1, w - 2, h - 2, r); ctx.strokeStyle = line; ctx.lineWidth = 2; ctx.stroke(); ctx.restore()
}

// Seria: small tracked uppercase line. Returns height used.
export function seriesLine(ctx, d, x, y, { z = 26, color = '#fff', align = 'left', maxW = 9999, measure = false } = {}) {
  const s = (d.series || '').trim().toUpperCase(); if (!s) return 0
  if (measure) return z * 1.5
  ctx.save(); ctx.font = font('Montserrat', 600, z); ctx.letterSpacing = `${z * 0.28}px`
  const tw = ctx.measureText(s).width; if (tw > maxW) { const zz = (z * maxW) / tw; ctx.font = font('Montserrat', 600, zz); ctx.letterSpacing = `${zz * 0.28}px` }
  ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; softShadow(ctx, 0.6)
  ctx.fillText(s, x + (align === 'center' ? z * 0.14 : 0), y + z * 0.95); ctx.restore(); return z * 1.5
}

// Big product name (uppercase, heavy). Returns height used.
export function bigName(ctx, d, x, y, maxW, size, { align = 'left', lines = 2, color = '#fff', min = 40, upper = true, w = 900, measure = false } = {}) {
  let txt = modelText(d); if (upper) txt = txt.toUpperCase()
  const m = wrapFit(ctx, txt, 'Montserrat', w, size, maxW, lines, min)
  const lh = m.size * 0.98
  if (measure) return lh * m.lines.length
  ctx.save(); ctx.font = font('Montserrat', w, m.size); ctx.letterSpacing = `${-m.size * 0.015}px`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic'; softShadow(ctx)
  m.lines.forEach((l, i) => ctx.fillText(l, x, y + m.size * 0.8 + i * lh)); ctx.restore()
  return lh * m.lines.length
}

// All device details (badge, capacity, code / region, condition, No Active, notes) as one tracked line
export const subText = (d) => metaRows(d).flat().map((c) => c.text).join('  ·  ')
export function subLine(ctx, d, x, y, { z = 24, color = 'rgba(255,255,255,.92)', align = 'left', maxW = 9999, bars = null, measure = false } = {}) {
  const s = subText(d).toUpperCase(); if (!s) return 0
  ctx.save(); let zz = z; const set = (q) => { ctx.font = font('Montserrat', 600, q); ctx.letterSpacing = `${q * 0.2}px` }
  set(zz); const bw = bars ? zz * 2.2 : 0; let tw = ctx.measureText(s).width
  if (tw + bw * 2 > maxW) { zz = Math.max(15, (zz * maxW) / (tw + bw * 2)); set(zz); tw = ctx.measureText(s).width }
  const h = zz * 1.6
  if (measure) { ctx.restore(); return h }
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'
  const sx = align === 'center' ? x - tw / 2 : align === 'right' ? x - tw : x
  if (bars) { ctx.fillStyle = bars; ctx.fillRect(sx - bw, y + h / 2 - 1.5, bw - zz * 0.6, 3); ctx.fillRect(sx + tw + zz * 0.4, y + h / 2 - 1.5, bw - zz * 0.6, 3) }
  softShadow(ctx, 0.5); ctx.fillStyle = color; ctx.fillText(s, sx, y + h / 2 + 1)
  ctx.restore(); return h
}

/* Price with optional struck old price. Draws "1199" big + "€" small; returns { w, h } (measure = no draw).
   x is left / centre / right edge depending on align; y = top. */
export function priceText(ctx, d, x, y, z, { color = '#111', old = 'rgba(0,0,0,.45)', align = 'left', maxW = 9999, measure = false, shadow = false, oldSide = 'left' } = {}) {
  ctx.save()
  const n = priceNum(d.price), has = hasP(d)
  const od = has && (d.oldPrice || '').trim() ? fmtPrice(d.oldPrice) : ''
  let main = has ? (n != null ? fmtPrice(d.price).replace(/€$/, '') : fmtPrice(d.price)) : ASK, euro = has && n != null
  let zz = has ? z : z * 0.5
  const oz = () => zz * 0.36
  const meas = () => {
    ctx.font = font('Montserrat', 900, zz); ctx.letterSpacing = `${-zz * 0.03}px`; const mw = ctx.measureText(main).width
    ctx.letterSpacing = '0px'; ctx.font = font('Montserrat', 800, zz * 0.5); const ew = euro ? ctx.measureText('€').width + zz * 0.08 : 0
    ctx.font = font('Montserrat', 700, oz()); const ow = od ? ctx.measureText(od).width + zz * 0.28 : 0
    return { mw, ew, ow, w: mw + ew + ow }
  }
  let m = meas(); if (m.w > maxW) { zz *= maxW / m.w; m = meas() }
  const h = zz * 0.78
  if (measure) { ctx.restore(); return { w: m.w, h } }
  let sx = align === 'center' ? x - m.w / 2 : align === 'right' ? x - m.w : x
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'
  if (shadow) softShadow(ctx, 0.8)
  const base = y + h
  const drawOld = (ox) => { ctx.save(); ctx.font = font('Montserrat', 700, oz()); ctx.fillStyle = old; ctx.fillText(od, ox, base - zz * 0.36); const ow = ctx.measureText(od).width; ctx.fillRect(ox - 3, base - zz * 0.36 - oz() * 0.36, ow + 6, Math.max(2, oz() * 0.1)); ctx.restore() }
  if (od && oldSide === 'left') { drawOld(sx); sx += m.ow }
  ctx.fillStyle = color; ctx.font = font('Montserrat', 900, zz); ctx.letterSpacing = `${-zz * 0.03}px`; ctx.fillText(main, sx, base)
  ctx.letterSpacing = '0px'
  if (euro) { ctx.font = font('Montserrat', 800, zz * 0.5); ctx.fillText('€', sx + m.mw + zz * 0.08, base - zz * 0.3) }
  if (od && oldSide === 'right') drawOld(sx + m.mw + m.ew + zz * 0.28)
  ctx.restore(); return { w: m.w, h }
}

// Rounded pill with text. Returns { w, h }.
export function pillText(ctx, text, x, y, z, { bg = '#fff', fg = '#111', align = 'left', stroke = null, w = 800, track = 0.04, measure = false, h: hh = null, padX = 0.95 } = {}) {
  ctx.save(); ctx.font = font('Montserrat', w, z); ctx.letterSpacing = `${z * track}px`
  const tw = ctx.measureText(text).width, h = hh || z * 2, bw = tw + z * padX * 2
  if (measure) { ctx.restore(); return { w: bw, h } }
  const bx = align === 'center' ? x - bw / 2 : align === 'right' ? x - bw : x
  rr(ctx, bx, y, bw, h, h / 2)
  if (bg) { ctx.fillStyle = bg; ctx.fill() }
  if (stroke) { ctx.lineWidth = Math.max(2, z * 0.1); ctx.strokeStyle = stroke; ctx.stroke() }
  ctx.fillStyle = fg; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(text, bx + z * padX, y + h / 2 + z * 0.04)
  ctx.restore(); return { w: bw, h }
}

// Lucide "arrow-right" (24x24)
export function arrow(ctx, x, y, z, color, lw = 2.4) {
  ctx.save(); ctx.translate(x, y); ctx.scale(z / 24, z / 24); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.stroke(new Path2D('M5 12h14')); ctx.stroke(new Path2D('m12 5 7 7-7 7')); ctx.restore()
}
// CTA text + arrow (no box). Returns width.
export function ctaLink(ctx, d, x, y, z, { color = '#fff', arrowColor = null, align = 'left', measure = false } = {}) {
  const s = (d.cta || '').trim().toUpperCase(); if (!s) return 0
  ctx.save(); ctx.font = font('Montserrat', 800, z); ctx.letterSpacing = `${z * 0.12}px`
  const tw = ctx.measureText(s).width, w = tw + z * 1.6
  if (measure) { ctx.restore(); return w }
  const sx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x
  ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; softShadow(ctx, 0.5); ctx.fillText(s, sx, y)
  ctx.shadowColor = 'transparent'; arrow(ctx, sx + tw + z * 0.45, y - z * 0.55, z * 1.1, arrowColor || color, 2.6)
  ctx.restore(); return w
}

// Spec chips on photos (glass pills with a red icon). Returns height (0 when empty).
export function specChips(ctx, d, x, y, maxW, z, { align = 'left', bg = 'rgba(255,255,255,.16)', color = '#fff', icon = '#fff', line = 'rgba(255,255,255,.28)', measure = false, max = 4 } = {}) {
  const sp = specParts(d.spec).slice(0, max); if (!sp.length) return 0
  ctx.save(); ctx.font = font('Montserrat', 700, z)
  const iz = z * 1.5, h = z * 2.1, gap = z * 0.5
  const ws = sp.map((p) => ctx.measureText(p).width + iz + z * 1.3)
  const tot = ws.reduce((a, b) => a + b, 0) + gap * (sp.length - 1), k = Math.min(1, maxW / tot)
  if (measure) { ctx.restore(); return h * k }
  ctx.translate(align === 'center' ? x - (tot * k) / 2 : align === 'right' ? x - tot * k : x, y); ctx.scale(k, k)
  let cx = 0
  sp.forEach((p, i) => {
    rr(ctx, cx, 0, ws[i], h, h / 2); ctx.fillStyle = bg; ctx.fill(); ctx.lineWidth = 1.5; ctx.strokeStyle = line; ctx.stroke()
    specIcon(ctx, p, cx + z * 0.3, (h - iz) / 2, iz, icon)
    ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText(p, cx + z * 0.3 + iz + z * 0.1, h / 2 + 1)
    cx += ws[i] + gap
  })
  ctx.restore(); return h * k
}
