import { font, rr, photoBg, drawLogo, cutout } from '../../../lib/canvas/draw.js'
import { modelText, shade } from './blocks.js'

/* Gjuha vizuale "pro": sfond i çelët, njolla të buta me ngjyrën e temës,
   titull i madh dy-ngjyrësh (fjala e fundit me ngjyrë, në rresht më vete). */

// Sfondi: gradient i butë + njolla të turbullta (blob) me ngjyrën kryesore
export function proScene(ctx, W, H, t, blobs, dark = false) {
  const g = ctx.createLinearGradient(0, 0, 0, H)
  if (dark) { g.addColorStop(0, '#17171B'); g.addColorStop(1, '#0B0B0D') } else { g.addColorStop(0, '#FFFFFF'); g.addColorStop(1, '#F4F2F3') }
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  for (const [x, y, r, a, c] of blobs) {
    const col = c === 2 ? shade(t.accent, 0.55) : c === 3 ? shade(t.accent, -0.35) : t.accent
    const rg = ctx.createRadialGradient(x, y, 0, x, y, r)
    rg.addColorStop(0, hexA(col, a)); rg.addColorStop(0.55, hexA(col, a * 0.45)); rg.addColorStop(1, hexA(col, 0))
    ctx.fillStyle = rg; ctx.fillRect(x - r, y - r, r * 2, r * 2)
  }
}
// Rreth i plotë me gradient (forma e fortë pas telefonit)
export function proDisc(ctx, x, y, r, t, alpha = 1, dark = false) {
  ctx.save(); ctx.globalAlpha = alpha
  const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r); if (dark) { g.addColorStop(0, t.accent); g.addColorStop(1, shade(t.accent, -0.55)) } else { g.addColorStop(0, shade(t.accent, 0.82)); g.addColorStop(1, shade(t.accent, 0.55)) }
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill(); ctx.restore()
}
function hexA(c, a) {
  if (c.startsWith('rgb(')) return c.replace('rgb(', 'rgba(').replace(')', `,${a})`)
  const n = parseInt(c.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`
}

/* Produkti pa kuti: pritet sfondi i bardhë (bbox) dhe vizatohet me "multiply"
   mbi sfond të çelët, që e bardha të zhduket. Kurrë nuk pritet vetë produkti:
   futet i tëri brenda kutisë (cx,cy = qendra), me një rrotullim të lehtë. */
export function proPhoto(ctx, img, cx, cy, maxW, maxH, rot = 0, align = 'center') {
  if (!img) { ctx.save(); rr(ctx, cx - maxW * 0.3, cy - maxH * 0.45, maxW * 0.6, maxH * 0.9, 50); ctx.fillStyle = '#ddd'; ctx.fill(); ctx.restore(); return }
  const info = photoBg(img), cut = cutout(img)
  const src = cut || img
  const [sx, sy, iw, ih] = cut ? [0, 0, cut.width, cut.height] : (info.box || [0, 0, img.naturalWidth || img.width, img.naturalHeight || img.height])
  // kutia e rrotulluar duhet të hyjë e tëra
  const c = Math.abs(Math.cos(rot)), s = Math.abs(Math.sin(rot))
  const k = Math.min(maxW / (iw * c + ih * s), maxH / (iw * s + ih * c))
  const dw = iw * k, dh = ih * k
  const light = info.uniform && lum(info.color) > 200
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot)
  // hije e butë poshtë
  ctx.save(); ctx.translate(0, dh * 0.47); ctx.scale(1, 0.12); const sg = ctx.createRadialGradient(0, 0, 0, 0, 0, dw * 0.55); sg.addColorStop(0, 'rgba(0,0,0,.28)'); sg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = sg; ctx.fillRect(-dw, -dw, dw * 2, dw * 2); ctx.restore()
  if (cut) { ctx.shadowColor = 'rgba(0,0,0,.45)'; ctx.shadowBlur = dw * 0.08; ctx.shadowOffsetY = dw * 0.04 }
  else if (light) ctx.globalCompositeOperation = 'multiply'
  else { rr(ctx, -dw / 2, -dh / 2, dw, dh, Math.min(dw, dh) * 0.06); ctx.clip() }
  ctx.drawImage(src, sx, sy, iw, ih, -dw / 2, -dh / 2, dw, dh)
  ctx.restore()
}
const lum = (c) => { const m = c.match(/\d+/g); if (!m) return 255; const [r, g, b] = m.map(Number); return 0.299 * r + 0.587 * g + 0.114 * b }

// Titulli dy-ngjyrësh. Kthen lartësinë. align: left | center
export function proTitle(ctx, d, x, y, w, size, t, { align = 'left', color = '#111', maxLines = 3 } = {}) {
  const words = modelText(d).split(/\s+/)
  // pjesa me ngjyrë: nga fjala e parë "Pro/Max/Ultra..." ose fjala e fundit
  let i = words.findIndex((w, j) => j > 0 && /^(pro|max|ultra|plus|mini|fold\d*|flip\d*|fe|edge|lite|note|neo|air)$/i.test(w))
  if (i < 0) i = words.length > 1 ? words.length - 1 : words.length
  const last = words.slice(i).join(' ') || null
  const rest = words.slice(0, i).join(' ')
  const F = (z) => font('Montserrat', 800, z)
  // rreshtat e pjesës së parë
  const wrap = (z) => { ctx.font = F(z); const out = []; let cur = ''; for (const wd of rest.split(' ')) { const tr = cur ? cur + ' ' + wd : wd; if (ctx.measureText(tr).width > w && cur) { out.push(cur); cur = wd } else cur = tr } out.push(cur); return out }
  let z = size, lines
  for (; z > 40; z -= 4) { lines = wrap(z); ctx.font = F(z); const lw = last ? ctx.measureText(last).width : 0; if (lines.length + (last ? 1 : 0) <= maxLines && Math.max(lw, ...lines.map((l) => ctx.measureText(l).width)) <= w) break }
  const lh = z * 1.02
  const ser = (d.series || '').trim()
  if (ser) { const sz = Math.max(26, z * 0.36); ctx.save(); ctx.textAlign = align; ctx.font = font('Montserrat', 400, sz); ctx.fillStyle = color; ctx.globalAlpha = 0.75; ctx.letterSpacing = `${sz * 0.06}px`; ctx.fillText(ser, x, y + sz * 0.9); ctx.restore(); y += sz * 1.25 }
  const serH = ser ? Math.max(26, z * 0.36) * 1.25 : 0
  ctx.save(); ctx.textAlign = align; ctx.font = F(z); ctx.letterSpacing = `${-z * 0.02}px`
  lines.forEach((l, i) => { ctx.fillStyle = color; ctx.fillText(l, x, y + z * 0.82 + i * lh) })
  if (last) { ctx.fillStyle = t.accent; ctx.fillText(last, x, y + z * 0.82 + lines.length * lh) }
  ctx.restore()
  return (lines.length + (last ? 1 : 0)) * lh + serH
}

// Kreu: logo + "ofertë" e vogël si pill me ngjyrë
export function proHeader(ctx, W, top, d, t, dark = false, align = 'left') {
  const M = 72
  drawLogo(ctx, align === 'center' ? W / 2 : M, top, 54, dark ? 'white' : 'red', d.logo, align)
  if (d.offer && align !== 'center') proPill(ctx, d.offer, W - M, top + 4, 34, t.accent, '#fff', 'right')
}
export function proPill(ctx, text, x, y, size, bg, fg, align = 'left') {
  ctx.save(); ctx.font = font('Montserrat', 800, size); const tw = ctx.measureText(text).width, h = size * 1.7, w = tw + size * 1.4
  const bx = align === 'right' ? x - w : align === 'center' ? x - w / 2 : x
  rr(ctx, bx, y, w, h, h / 2); ctx.fillStyle = bg; ctx.fill(); ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, bx + w / 2, y + h / 2 + 1); ctx.restore()
  return h
}
// Kartë me cepa të rrumbullakët rreth gjithë kanavacës (si te referencat)
export function proFrame(ctx, W, H, dark = false) {
  ctx.save(); rr(ctx, 22, 22, W - 44, H - 44, 48); ctx.strokeStyle = dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.06)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore()
}
