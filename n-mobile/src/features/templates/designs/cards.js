import { drawDeco, drawLogo, rr, font, fit } from '../../../lib/canvas/draw.js'
import { stack, specParts, specIcon, hasP, fmtPrice, ASK } from '../shared/blocks.js'
import { proPhoto, proTitle } from '../shared/pro.js'
import { metaRows, metaRow, colorsRow } from '../shared/meta.js'
import { safe, footer, topTitle } from '../shared/kit.js'

// =============== KARTA: karta gri të rrumbullakëta; bosh = fshihet, të tjerat zgjerohen ===============
export default function cards(ctx, W, H, d, t) {
  const { st, M, top, bottom } = safe(W, H)
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H)
  drawDeco(ctx, W, H, t, 'back', false)
  const G = 18, R = 36, grey = '#F2F2F2'
  const card = (x, y, w, h, fill = grey) => { rr(ctx, x, y, w, h, R); ctx.fillStyle = fill; ctx.fill() }
  drawLogo(ctx, M, st ? 120 : top, 50, 'red', d.logo)
  const fh = footer(ctx, W, bottom, d, { color: '#333', icon: t.accent, M })
  let y0 = top + (st ? 0 : 80)
  if (st) y0 += topTitle(ctx, d, M, y0, { style: 'chip', accent: t.accent, color: '#fff', z: 24, maxW: W - 2 * M, gap: 18 })
  else topTitle(ctx, d, W - M, top + 4, { style: 'chip', align: 'right', accent: t.accent, color: '#fff', z: 20, maxW: W - 2 * M - 300 })
  const y1 = bottom - fh - (fh ? 12 : 0)
  // karta e poshtme: seria + modeli + CTA
  const botH = st ? 380 : 290
  const by = y1 - botH
  card(M, by, W - 2 * M, botH, '#111')
  const th = proTitle(ctx, d, M + 40, by + 36, W - 2 * M - 80, st ? 84 : 68, t, { color: '#fff', maxLines: 2 })
  stack(ctx, d, t, { skip: { model: true, spec: true, price: true, meta: true, colors: true, info: true }, model: { size: 10, color: '#fff' }, slogan: { size: 24, color: 'rgba(255,255,255,.8)' }, cta: { bg: t.accent, color: '#fff', size: 26 } }, M + 40, by + 36 + th + 10, W - 2 * M - 80, botH - th - 60, 'top')
  // rrjeta sipër
  const gy = y0, gh = by - G - y0, LW = (W - 2 * M - G) * 0.56, RX = M + LW + G, RW = W - M - RX
  card(M, gy, LW, gh)
  proPhoto(ctx, d.img, M + LW / 2, gy + gh / 2, LW * 0.86, gh * 0.9, 0)
  if ((d.offer || '').trim()) { ctx.save(); ctx.font = font('Montserrat', 900, 40); const ow = ctx.measureText(d.offer).width + 44; rr(ctx, M + 22, gy + 22, ow, 64, 32); ctx.fillStyle = t.accent; ctx.fill(); ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(d.offer, M + 44, gy + 56); ctx.restore() }
  // kartat djathtas (vetëm ato me përmbajtje)
  const sp = specParts(d.spec).slice(0, 4), rows = metaRows(d), cols = (d.colors || []).filter((c) => (c.name || '').trim() || c.hex)
  const info = (d.info || '').trim()
  const list = [{ id: 'price', w: 1.2 }]
  if (sp.length) list.push({ id: 'spec', w: 0.5 + sp.length * 0.32 })
  if (cols.length) list.push({ id: 'colors', w: 0.55 })
  if (rows.length || info) list.push({ id: 'meta', w: 0.5 + rows.length * 0.25 + (info ? 0.25 : 0) })
  const tw = list.reduce((a, c) => a + c.w, 0), avail = gh - G * (list.length - 1)
  let cy = gy
  for (const c of list) {
    const h = (avail * c.w) / tw, x = RX + 30, w = RW - 60
    if (c.id === 'price') {
      card(RX, cy, RW, h, t.accent)
      ctx.save(); ctx.fillStyle = '#fff'
      const old = (d.oldPrice || '').trim() && hasP(d) ? fmtPrice(d.oldPrice) : ''
      ctx.font = font('Montserrat', 700, 24); ctx.globalAlpha = 0.8; ctx.fillText('ÇMIMI', x, cy + 52)
      if (old) { const ow = ctx.measureText(old).width; ctx.fillText(old, x + w - ow, cy + 52); ctx.fillRect(x + w - ow - 4, cy + 44, ow + 8, 3) }
      ctx.globalAlpha = 1
      const pt = hasP(d) ? fmtPrice(d.price) : ASK
      fit(ctx, pt, 'Montserrat', 900, hasP(d) ? Math.min(110, h * 0.5) : 46, w, 26); ctx.fillText(pt, x, cy + h - 34)
      ctx.restore()
    } else if (c.id === 'spec') {
      card(RX, cy, RW, h)
      const lh = Math.min(70, (h - 40) / sp.length)
      sp.forEach((p, i) => { const yy = cy + 20 + (h - 40 - lh * sp.length) / 2 + i * lh; specIcon(ctx, p, x - 8, yy + lh / 2 - 22, 44, t.accent, '#fff'); ctx.save(); ctx.fillStyle = '#111'; fit(ctx, p, 'Montserrat', 700, 28, w - 60, 16); ctx.textBaseline = 'middle'; ctx.fillText(p, x + 50, yy + lh / 2); ctx.restore() })
    } else if (c.id === 'colors') {
      card(RX, cy, RW, h)
      ctx.save(); ctx.fillStyle = '#777'; ctx.font = font('Montserrat', 700, 20); ctx.fillText('NGJYRAT', x, cy + 40); ctx.restore()
      colorsRow(ctx, d, x, cy + 56, 22, { color: '#222', maxW: w })
    } else {
      card(RX, cy, RW, h)
      let yy = cy + 24 + Math.max(0, (h - 48 - rows.length * 52 - (info ? 40 : 0)) / 2)
      rows.forEach((r) => { metaRow(ctx, r, x - 10, yy, 21, { color: '#222', bg: '#fff', accent: t.accent, maxW: w + 20 }); yy += 52 })
      if (info) { ctx.save(); ctx.fillStyle = '#333'; fit(ctx, info, 'Montserrat', 600, 23, w, 14); ctx.fillText(info, x, yy + 28); ctx.restore() }
    }
    cy += h + G
  }
  drawDeco(ctx, W, H, t, 'front', false)
}
