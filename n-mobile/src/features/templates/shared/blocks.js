// Shared canvas building blocks for all templates: slash motif, badges, the data stack.
import { metaRows, metaRow, colorsRow } from './meta.js'
import { photoBg, rr, font, fit, wrapFit, drawLines, drawPhoto, drawLogo, burst, drawDeco, icon, logoWidth } from '../../../lib/canvas/draw.js'

export const SIZES = { post: { w: 1080, h: 1350 }, story: { w: 1080, h: 1920 } }
// "818.99" / "818,99" / "1.199" / "899" -> "818,99€" / "1199€" / "899€"; teksti tjetër mbetet siç është
export function priceNum(p) {
  let s = (p || '').trim().replace(/\s|€|eur/gi, '')
  if (!/^\d[\d.,]*$/.test(s)) return null
  const li = Math.max(s.lastIndexOf('.'), s.lastIndexOf(','))
  if (li >= 0 && s.length - li - 1 <= 2 && s.length - li - 1 > 0) s = s.slice(0, li).replace(/[.,]/g, '') + '.' + s.slice(li + 1)
  else s = s.replace(/[.,]/g, '')
  const n = Number(s); return Number.isFinite(n) ? n : null
}
export const fmtPrice = (p) => { const n = priceNum(p); if (n == null) return (p || '').trim(); return (Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',')) + '€' }
export const ink = (hex) => { if (!hex || hex[0] !== '#') return '#fff'; const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; return 0.299 * r + 0.587 * g + 0.114 * b > 150 ? '#111' : '#fff' }
export const hasP = (d) => Boolean((d.price || '').trim())
export const specParts = (sp) => (sp || '').split(/\s*[|,;•]\s*/).map((x) => x.trim()).filter(Boolean)
export const specText = (sp) => specParts(sp).join('  |  ')
export const DICT = { iphone: 'iPhone', ipad: 'iPad', airpods: 'AirPods', macbook: 'MacBook', galaxy: 'Galaxy', samsung: 'Samsung', xiaomi: 'Xiaomi', redmi: 'Redmi', poco: 'POCO', huawei: 'Huawei', honor: 'Honor', pixel: 'Pixel', google: 'Google', oneplus: 'OnePlus', oppo: 'OPPO', realme: 'realme', vivo: 'vivo', motorola: 'Motorola', nokia: 'Nokia', pro: 'Pro', max: 'Max', ultra: 'Ultra', plus: 'Plus', mini: 'mini', note: 'Note', fold: 'Fold', flip: 'Flip', fe: 'FE', se: 'SE', lite: 'Lite', edge: 'Edge', air: 'Air' }
// Shkronja të mëdha të zgjuara: "iphone 18 pro 256gb" -> "iPhone 18 Pro 256GB"
export function smartCase(s) {
  return (s || '').trim().replace(/\s+/g, ' ').split(' ').map((w) => {
    if (!w || /[A-Z]/.test(w.slice(1)) || (/[A-Z]/.test(w[0]) && w.length > 1 && w !== w.toUpperCase())) return w
    const l = w.toLowerCase()
    if (DICT[l]) return DICT[l]
    if (/^\d+(gb|tb|mp|mah|hz|w)$/.test(l)) return l.replace(/[a-z]+$/, (u) => (u === 'mah' ? 'mAh' : u === 'hz' ? 'Hz' : u.toUpperCase()))
    if (/^\d+g$/.test(l)) return l.toUpperCase()
    if (/^[a-z]\d+[a-z]*$/.test(l)) return l.toUpperCase()
    return l[0].toUpperCase() + l.slice(1)
  }).join(' ')
}
// "20" / "20%" -> "-20%"
export function normOffer(o) { const s = (o || '').trim(); if (/^\d+([.,]\d+)?\s*%?$/.test(s)) return '-' + s.replace(/\s*%?$/, '') + '%'; return s }
export const ASK = 'Pyet për çmimin'
export const badgeFor = (t, d) => (t.id === 'standard' ? (d.offer ? t.badge : 'E re në N Mobile') : t.badge)
export const modelText = (d) => (d.model || '').trim() || 'Modeli i telefonit'
export const HF = (t, size, w) => font(t.head.f, w || t.head.w, size, t.head.s)
export const SKEW = 0.24

// ---------- Motivi i prerjes diagonale (si te logoja) ----------
export function slashPath(ctx, x, y, w, h) { const o = h * SKEW; ctx.beginPath(); ctx.moveTo(x + o, y); ctx.lineTo(x + w + o, y); ctx.lineTo(x + w, y + h); ctx.lineTo(x, y + h); ctx.closePath() }
export function slash(ctx, x, y, w, h, color) { slashPath(ctx, x, y, w, h); ctx.fillStyle = color; ctx.fill() }
export function slashes(ctx, x, y, h, color, n = 2) { for (let i = 0; i < n; i++) slash(ctx, x + i * h * 0.42, y, h * 0.16, h, color) }
export function shadowUnder(ctx, cx, cy, w, alpha = 0.35) {
  ctx.save(); const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, w / 2); g.addColorStop(0, `rgba(0,0,0,${alpha})`); g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.translate(cx, cy); ctx.scale(1, 0.16); ctx.translate(-cx, -cy); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, w / 2, 0, 7); ctx.fill(); ctx.restore()
}
// Badge oferte: paralelogram i pjerrët
export function offerTag(ctx, text, x, y, h, bg, fg, align = 'left') {
  if (!text) return 0
  ctx.save(); ctx.font = font('Barlow Condensed', 800, h * 0.72, 'italic')
  const w = ctx.measureText(text).width + h * 0.9, dx = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x
  ctx.shadowColor = 'rgba(0,0,0,.25)'; ctx.shadowBlur = 24; ctx.shadowOffsetY = 8
  slash(ctx, dx, y, w, h, bg); ctx.shadowColor = 'transparent'
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, dx + w / 2 + h * SKEW / 2, y + h * 0.54)
  ctx.restore(); return w
}

// ---------- Blloku i të dhënave (shfaq çdo fushë të plotësuar) ----------
export const SHIELD = 'M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1zM9 12l2 2 4-4'

export function iconLine(ctx, d, text, x, y, size, color, iconColor, align, maxW, weight = 600) {
  const is = size * 1.05, gap = size * 0.45
  fit(ctx, text, 'Inter', weight, size, maxW - is - gap, 14)
  const tw = ctx.measureText(text).width, total = is + gap + tw
  const sx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x
  icon(ctx, d, sx, y - is * 0.82, is, iconColor); ctx.fillStyle = color; ctx.textAlign = 'left'; ctx.fillText(text, sx + is + gap, y)
}

/* s = stili: { align, model, spec, price, info, cta, contact, kicker, skip:{} }
   çdo element: ngjyra dhe madhësia; pjesët bosh nuk vizatohen. */
export function items(ctx, d, t, s, w, k) {
  const A = s.align || 'left', out = [], gap = (g) => out.push({ h: g * k, draw() {} })
  const kick = s.kicker && ((d.title || '').trim() || badgeFor(t, d))
  if (kick) { const sz = 26 * k; out.push({ h: sz * 1.2, draw(x, y) { ctx.save(); ctx.font = font('Montserrat', 800, sz); ctx.letterSpacing = `${4 * k}px`; const tx = kick.toUpperCase(); const tw = ctx.measureText(tx).width; const sx = A === 'center' ? x - (tw + sz * 1.2) / 2 : x; slashes(ctx, sx, y, sz, s.kicker, 2); ctx.fillStyle = s.kickerText || s.model.color; ctx.textAlign = 'left'; ctx.fillText(tx, sx + sz * 1.2, y + sz * 0.86); ctx.restore() } }); gap(22) }
  // modeli
  const ms = s.model.size * k
  let txt = modelText(d); if (s.model.upper) txt = txt.toUpperCase()
  const MF = s.model.f || t.head.f, MW = s.model.w || t.head.w, MS = s.model.style ?? t.head.s
  const m = wrapFit(ctx, txt, MF, MW, ms, w, s.model.lines || 2, 30 * k, MS)
  if (m.lines.length === 1) { ctx.font = font(MF, MW, m.size, MS); const tw = ctx.measureText(m.lines[0]).width; m.size = Math.min(m.size * 1.5, m.size * (w * 0.98) / tw) }
  const lh = m.size * (s.model.lh || 1.0)
  const ser = (d.series || '').trim()
  if (ser && !s.skip?.model) { const sz = Math.max(24, m.size * 0.36); out.push({ h: sz * 1.15, draw(x, y) { ctx.save(); ctx.fillStyle = s.model.color; ctx.globalAlpha = 0.75; ctx.textAlign = A; ctx.font = font('Montserrat', 400, sz); ctx.letterSpacing = `${sz * 0.06}px`; ctx.fillText(ser, x, y + sz * 0.9); ctx.restore() } }) }
  if (!s.skip?.model) out.push({ h: lh * m.lines.length, draw(x, y) { ctx.fillStyle = s.model.color; ctx.textAlign = A; ctx.font = font(s.model.f || t.head.f, s.model.w || t.head.w, m.size, s.model.style ?? t.head.s); m.lines.forEach((l, i) => ctx.fillText(l, x, y + m.size * 0.86 + i * lh)) } })
  // slogani
  const slog = (d.slogan || '').trim()
  if (slog && !s.skip?.slogan) { gap(14); const sz = (s.slogan?.size || 30) * k; const sl = wrapFit(ctx, slog, 'Montserrat', 500, sz, w, 2, 18 * k); out.push({ h: sl.size * 1.25 * sl.lines.length, draw(x, y) { ctx.save(); ctx.fillStyle = s.slogan?.color || s.info?.color || s.model.color; ctx.globalAlpha = s.slogan?.color ? 1 : 0.85; ctx.textAlign = A; ctx.font = font('Montserrat', 500, sl.size); sl.lines.forEach((l, i) => ctx.fillText(l, x, y + sl.size * 0.95 + i * sl.size * 1.25)); ctx.restore() } }) }
  // seria, kapaciteti, kodi / versioni, gjendja, shënimet
  const rows = s.skip?.meta ? [] : metaRows(d)
  if (rows.length) {
    if (!s.skip?.model || slog) gap(18)
    const mz = (s.meta?.size || 24) * k, mc = s.meta?.color || s.spec?.color || s.model.color
    const light = /255, ?255, ?255|#fff\b/i.test(mc) || ink(mc) === '#111'
    rows.forEach((row, ri) => { if (ri) gap(10); out.push({ h: mz * 1.9, draw(x, y) { metaRow(ctx, row, x, y, mz, { color: mc, bg: s.meta?.bg || (light ? 'rgba(255,255,255,.12)' : 'rgba(0,0,0,.06)'), accent: s.meta?.accent || t.accent, align: A, maxW: w }) } }) })
    gap(s.skip?.model ? 22 : 4)
  }
  // specifikat
  const sp0 = specParts(d.spec)
  const sp = s.spec?.mode === 'icons' ? sp0.slice(0, 4) : sp0
  if (sp.length && !s.skip?.spec) {
    gap(s.spec.gap ?? 22); const sz = s.spec.size * k
    if (s.spec.mode === 'icons') {
      const n = sp.length, iz = sz * 1.9, cell = Math.min(w / n, sz * 7)
      out.push({ h: iz + sz * 2.1, draw(x, y) { ctx.save(); const tot = cell * n; let cx = A === 'center' ? x - tot / 2 : x
        sp.forEach((p) => { const mx = cx + cell / 2; specIcon(ctx, p, mx - iz / 2, y, iz, s.spec.icon || t.accent, s.spec.tile)
          ctx.font = font('Montserrat', 700, sz); const kk = Math.min(1, (cell - 10) / ctx.measureText(p).width); ctx.font = font('Montserrat', 700, sz * kk); ctx.fillStyle = s.spec.color; ctx.textAlign = 'center'; ctx.fillText(p, mx, y + iz + sz * 1.45); cx += cell }); ctx.restore() } })
    } else if (s.spec.mode === 'chips') {
      out.push({ h: sz * 2, draw(x, y) { ctx.save(); ctx.font = font('Inter', 600, sz); const ws = sp.map((p) => ctx.measureText(p).width + sz * 1.4); let tot = ws.reduce((a, c) => a + c, 0) + (sp.length - 1) * sz * 0.5; const kk = Math.min(1, w / tot); ctx.font = font('Inter', 600, sz * kk); let cx = A === 'center' ? x - (tot * kk) / 2 : x
        sp.forEach((p, i) => { const cw = ws[i] * kk; rr(ctx, cx, y, cw, sz * 2 * kk, sz * kk); ctx.fillStyle = s.spec.bg; ctx.fill(); ctx.fillStyle = s.spec.color; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(p, cx + cw / 2, y + sz * kk + 1); cx += cw + sz * 0.5 * kk }); ctx.restore() } })
    } else {
      out.push({ h: sz * 1.2, draw(x, y) { ctx.save(); ctx.font = font('Inter', 600, sz); const sep = sz * 1.6; const ws = sp.map((p) => ctx.measureText(p).width); const tot = ws.reduce((a, c) => a + c, 0) + sep * (sp.length - 1); const kk = Math.min(1, w / tot); ctx.font = font('Inter', 600, sz * kk); let cx = A === 'center' ? x - (tot * kk) / 2 : x; ctx.textAlign = 'left'
        sp.forEach((p, i) => { ctx.fillStyle = s.spec.color; ctx.fillText(p, cx, y + sz * 0.92); cx += ws[i] * kk; if (i < sp.length - 1) { slash(ctx, cx + sep * kk / 2 - sz * 0.22, y + sz * 0.12, sz * 0.16, sz * 0.95, s.spec.sep); cx += sep * kk } }); ctx.restore() } })
    }
  }
  // ngjyrat
  if ((d.colors || []).some((c) => (c.name || '').trim() || c.hex) && !s.skip?.colors) {
    gap(18); const cz = (s.colors?.size || 24) * k
    out.push({ h: cz * 1.3, draw(x, y) { colorsRow(ctx, d, x, y, cz, { color: s.colors?.color || s.spec?.color || s.model.color, align: A, maxW: w }) } })
  }
  // çmimi
  if (!s.skip?.price) {
    if (hasP(d)) {
      gap(s.price.gap ?? 26); const pz = s.price.size * k, pt = fmtPrice(d.price)
      const op = (d.oldPrice || '').trim() && fmtPrice(d.oldPrice)
      if (op) { const oz = Math.max(22, pz * 0.34); out.push({ h: oz * 1.25, draw(x, y) { ctx.save(); ctx.font = font('Montserrat', 600, oz); ctx.fillStyle = s.price.color; ctx.globalAlpha = 0.6; ctx.textAlign = A; ctx.fillText(op, x, y + oz); const tw = ctx.measureText(op).width, sx = A === 'center' ? x - tw / 2 : x; ctx.globalAlpha = 0.9; ctx.fillStyle = s.price.strike || t.accent; ctx.fillRect(sx - 4, y + oz * 0.62, tw + 8, Math.max(3, oz * 0.1)); ctx.restore() } }) }
      const PF = (z) => s.price.f ? font(s.price.f, 700, z) : HF(t, z, 800)
      ctx.font = PF(pz); const ps = Math.min(pz, pz * (w * 0.95) / Math.max(1, ctx.measureText(pt).width))
      out.push({ h: ps * (s.price.bg ? 1.25 : (s.price.under ? 1.08 : 0.9)), draw(x, y) { ctx.save(); ctx.font = PF(ps); const tw = ctx.measureText(pt).width
        if (s.price.bg) { const bw = tw + ps * 0.7, bh = ps * 1.18, bx = A === 'center' ? x - bw / 2 : x; slash(ctx, bx, y, bw, bh, s.price.bg); ctx.fillStyle = s.price.color; ctx.textAlign = 'center'; ctx.fillText(pt, bx + bw / 2 + bh * SKEW / 2, y + ps * 0.98) }
        else { ctx.fillStyle = s.price.color; ctx.textAlign = A; ctx.fillText(pt, x, y + ps * 0.82); if (s.price.under) { const ux = A === 'center' ? x - tw / 2 : x; slash(ctx, ux, y + ps * 1.0, Math.min(tw, ps * 1.4), ps * 0.06, s.price.under) } }
        ctx.restore() } })
    } else if (s.ask !== false) {
      gap(20); const az = 34 * k
      out.push({ h: az * 1.1, draw(x, y) { ctx.save(); ctx.font = font('Montserrat', 800, az); ctx.fillStyle = s.price.color; ctx.textAlign = A; ctx.fillText(ASK, x, y + az * 0.9); ctx.restore() } })
    }
  }
  // info / garancion
  const info = (d.info || '').trim()
  if (info) { gap(22); const iz = (s.info?.size || 31) * k; out.push({ h: iz * 1.2, draw(x, y) { ctx.save(); iconLine(ctx, SHIELD, info, x, y + iz * 0.95, iz, s.info?.color || s.model.color, s.info?.icon || t.accent, A, w, 600); ctx.restore() } }) }
  // CTA
  const cta = (d.cta || '').trim()
  if (cta && !s.skip?.cta) {
    gap(28); const cz = (s.cta?.size || 32) * k, ch = cz * 2.1
    out.push({ h: ch, draw(x, y) { ctx.save(); ctx.font = font('Montserrat', 800, cz); const tw = ctx.measureText(cta).width, cw = tw + cz * 3.1; const bx = A === 'center' ? x - cw / 2 : x
      ctx.shadowColor = 'rgba(0,0,0,.18)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6; rr(ctx, bx, y, cw, ch, ch / 2); ctx.fillStyle = s.cta.bg; ctx.fill(); ctx.shadowColor = 'transparent'
      ctx.fillStyle = s.cta.color; ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(cta, bx + cz * 1.0, y + ch / 2 + 1)
      ctx.beginPath(); const ax = bx + cw - cz * 1.0, ay = y + ch / 2; ctx.moveTo(ax - cz * 0.45, ay - cz * 0.38); ctx.lineTo(ax, ay); ctx.lineTo(ax - cz * 0.45, ay + cz * 0.38); ctx.strokeStyle = s.cta.color; ctx.lineWidth = cz * 0.13; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.stroke(); ctx.restore() } })
  }
  return out
}
// Vendos bllokun në kutinë (x,y,w,h); zvogëlon gjithçka derisa të hyjë
export function stack(ctx, d, t, s, x, y, w, h, valign = 'top') {
  let k = 1.3, it
  for (; k > 0.5; k -= 0.04) { it = items(ctx, d, t, s, w, k); if (it.reduce((a, c) => a + c.h, 0) <= h) break }
  const tot = it.reduce((a, c) => a + c.h, 0)
  let yy = valign === 'bottom' ? y + h - tot : valign === 'center' ? y + (h - tot) / 2 : y
  const ax = s.align === 'center' ? x + w / 2 : x
  ctx.save(); ctx.textBaseline = 'alphabetic'; for (const i of it) { i.draw(ax, yy); yy += i.h } ctx.restore()
  return tot
}
export function photoCard(ctx, img, x, y, w, h, r, bg, shadow = 0.18) {
  ctx.save(); ctx.shadowColor = `rgba(0,0,0,${shadow})`; ctx.shadowBlur = 60; ctx.shadowOffsetY = 26; rr(ctx, x, y, w, h, r); ctx.fillStyle = bg; ctx.fill(); ctx.restore()
  drawPhoto(ctx, img, x, y, w, h, { r, bg })
}

export function shade(hex, a) { const n = parseInt(hex.slice(1), 16); const f = (c) => Math.max(0, Math.min(255, Math.round(c + (a < 0 ? c * a : (255 - c) * a)))); return `rgb(${f(n >> 16)},${f((n >> 8) & 255)},${f(n & 255)})` }
export function cutCard(ctx, x, y, w, h, fill, c = 34) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w - c, y); ctx.lineTo(x + w, y + c); ctx.lineTo(x + w, y + h); ctx.lineTo(x + c, y + h); ctx.lineTo(x, y + h - c); ctx.closePath(); ctx.fillStyle = fill; ctx.fill() }

// Ikona lucide (24x24) për specifikat sipas fjalës kyçe
const IC = {
  cpu: ['M12 20v2','M12 2v2','M17 20v2','M17 2v2','M2 12h2','M2 17h2','M2 7h2','M20 12h2','M20 17h2','M20 7h2','M7 20v2','M7 2v2','M4 4h16v16H4z','M8 8h8v8H8z'],
  disk: ['M22 12H2','M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z','M6 16h.01','M10 16h.01'],
  cam: ['M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z','M12 10a3 3 0 1 0 0 6 3 3 0 0 0 0-6z'],
  bat: ['M2 8h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2H2z','M22 11v2','M6 11v2','M10 11v2'],
  scr: ['M7 2h10a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z','M12 18h.01'],
  ok: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z','m9 12 2 2 4-4'],
}
export function specKind(p) { const q = p.toLowerCase(); if (/ram/.test(q)) return 'cpu'; if (/mp|kamer|camera/.test(q)) return 'cam'; if (/mah|bater|w\b/.test(q)) return 'bat'; if (/\d\s*(gb|tb)/.test(q)) return 'disk'; if (/["”]|inch|hz|amoled|oled|ekran/.test(q)) return 'scr'; return 'ok' }
export function specIcon(ctx, p, x, y, z, color, tile) {
  ctx.save()
  if (tile) { rr(ctx, x, y, z, z, z * 0.28); ctx.fillStyle = tile; ctx.fill() }
  const k = (z * 0.56) / 24; ctx.translate(x + z * 0.22, y + z * 0.22); ctx.scale(k, k)
  ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  for (const d of IC[specKind(p)]) ctx.stroke(new Path2D(d))
  ctx.restore()
}
