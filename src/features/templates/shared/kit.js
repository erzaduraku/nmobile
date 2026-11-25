import { font, rr, drawLogo } from '../../../lib/canvas/draw.js'
import { shade, slash, slashes } from './blocks.js'

/* Mjete për template-t e reja: zonat e sigurta, footer-i me kontakt,
   tekst i konturuar, forma dekorative. */

// Zonat e sigurta: Post 60px; Story pa tekst të rëndësishëm në 250px sipër / 340px poshtë
export function safe(W, H) {
  const st = H > 1500
  return { st, M: st ? 70 : 60, top: st ? 250 : 60, bottom: st ? H - 340 : H - 60 }
}

// Ikona lucide (24x24): telefon, whatsapp (flluskë), pin, instagram
const I = {
  phone: ['M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'],
  whatsapp: ['M7.9 20A9 9 0 1 0 4 16.1L2 22z'],
  address: ['M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0z', 'M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  instagram: ['M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5z', 'M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z', 'M17.5 6.5h.01'],
}
export function glyph(ctx, kind, x, y, z, color, lw = 2) {
  ctx.save(); ctx.translate(x, y); ctx.scale(z / 24, z / 24); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  for (const p of I[kind]) ctx.stroke(new Path2D(p)); ctx.restore()
}
export const contactItems = (d) => {
  const c = d.contact || {}
  return [['phone', c.phone], ['whatsapp', c.whatsapp], ['address', c.address], ['instagram', c.instagram && '@' + c.instagram.replace(/^@/, '')]]
    .filter(([, v]) => (v || '').trim()).map(([k, v]) => [k, v.trim()])
}
// Footer i ngushtë me ikona; kthen lartësinë (0 kur s'ka kontakt). y = vija e poshtme
export function footer(ctx, W, yBottom, d, { color = '#fff', icon, line = null, size = 24, M = 60 } = {}) {
  const it = contactItems(d); if (!it.length) return 0
  ctx.save(); ctx.font = font('Montserrat', 600, size)
  const iz = size * 1.1, gap = size * 1.4
  const ws = it.map(([, v]) => iz + size * 0.4 + ctx.measureText(v).width)
  const tot = ws.reduce((a, b) => a + b, 0) + gap * (it.length - 1), k = Math.min(1, (W - 2 * M) / tot)
  const h = size * 2.2, y = yBottom - h
  if (line) { ctx.fillStyle = line; ctx.fillRect(M, y, W - 2 * M, 2) }
  ctx.translate(W / 2 - (tot * k) / 2, y + h / 2 + 4); ctx.scale(k, k)
  let x = 0
  it.forEach(([kind, v], i) => {
    glyph(ctx, kind, x, -iz / 2, iz, icon || color, 2)
    ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.fillText(v, x + iz + size * 0.4, 1)
    x += ws[i] + gap
  })
  ctx.restore(); return h
}
// Tekst gjigant i konturuar (pas telefonit)
export function outlineText(ctx, text, cx, cy, maxW, maxSize, color, lw = 3, fam = 'Montserrat', w = 900) {
  let z = maxSize; ctx.save(); ctx.font = font(fam, w, z)
  const tw = ctx.measureText(text).width; if (tw > maxW) { z = (z * maxW) / tw; ctx.font = font(fam, w, z) }
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineWidth = lw; ctx.strokeStyle = color; ctx.lineJoin = 'round'
  ctx.strokeText(text, cx, cy); ctx.restore(); return z
}
// Etiketë e ofertës si rreth i madh
export function offerDisc(ctx, text, cx, cy, r, bg, fg) {
  if (!(text || '').trim()) return
  ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = bg; ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10; ctx.fill(); ctx.shadowColor = 'transparent'
  ctx.lineWidth = r * 0.04; ctx.strokeStyle = fg; ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(cx, cy, r * 0.86, 0, Math.PI * 2); ctx.stroke(); ctx.globalAlpha = 1
  let z = r * 0.62; ctx.font = font('Montserrat', 900, z); const tw = ctx.measureText(text).width; if (tw > r * 1.5) { z *= (r * 1.5) / tw; ctx.font = font('Montserrat', 900, z) }
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, cx, cy + z * 0.05); ctx.restore()
}
// Valë e butë në fund (forma e vetme dekorative)
export function wave(ctx, W, y, h, color, alpha = 1) {
  ctx.save(); ctx.globalAlpha = alpha; ctx.beginPath(); ctx.moveTo(0, y + h * 0.4)
  ctx.bezierCurveTo(W * 0.3, y - h * 0.2, W * 0.65, y + h * 0.9, W, y + h * 0.1); ctx.lineTo(W, y + h * 3); ctx.lineTo(0, y + h * 3); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.restore()
}
export function chip(ctx, text, x, y, z, bg, fg, align = 'left') {
  ctx.save(); ctx.font = font('Montserrat', 800, z); const w = ctx.measureText(text).width + z * 1.6, h = z * 1.9
  const bx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x
  rr(ctx, bx, y, w, h, h / 2); ctx.fillStyle = bg; ctx.fill(); ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, bx + w / 2, y + h / 2 + 1); ctx.restore(); return h
}
/* "Titulli sipër" (x.title, e.g. SUPER OFERTA NË N MOBILE!): small bold uppercase banner near the top.
   style: 'label' (tracked text after two slashes), 'chip' (pill), 'ribbon' (slanted band).
   Shrinks to maxW. Returns the height used incl. the gap below it; 0 when empty, so the gap closes. */
export function topTitle(ctx, d, x, y, { style = 'label', align = 'left', z = 24, maxW = 9999, accent = '#E10600', color = '#fff', gap = 22, measure = false } = {}) {
  const tx = (d.title || '').trim().toUpperCase(); if (!tx) return 0
  ctx.save()
  const set = (s) => { ctx.font = font('Montserrat', 800, s); ctx.letterSpacing = `${s * 0.14}px` }
  const pad = (s) => (style === 'label' ? s * 1.5 : s * 1.7)
  let s = z; set(s); let tw = ctx.measureText(tx).width
  if (tw + pad(s) > maxW) { s = Math.max(14, (s * maxW) / (tw + pad(s))); set(s); tw = ctx.measureText(tx).width }
  const h = style === 'label' ? s * 1.2 : s * 2, w = tw + pad(s)
  if (measure) { ctx.restore(); return h + gap }
  const bx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x
  ctx.textBaseline = 'middle'; ctx.textAlign = 'left'
  if (style === 'label') { slashes(ctx, bx, y, h, accent, 2); ctx.fillStyle = color; ctx.fillText(tx, bx + s * 1.5, y + h / 2 + 1) }
  else {
    if (style === 'chip') { rr(ctx, bx, y, w, h, h / 2); ctx.fillStyle = accent; ctx.fill() }
    else slash(ctx, bx, y, w + h * 0.36, h, accent)
    ctx.fillStyle = color; ctx.fillText(tx, bx + s * 0.85 + (style === 'ribbon' ? h * 0.18 : 0), y + h / 2 + 1)
  }
  ctx.restore(); return h + gap
}
export const deep = (t) => shade(t.accent, -0.72)
export { drawLogo }
