import { font, fit, wrapFit, drawLines, drawPhoto, drawLogo, drawDeco } from '../../../lib/canvas/draw.js'
import { fmtPrice, ink, hasP, specParts, ASK, badgeFor, slash, slashes, offerTag, stack, shade, cutCard, specIcon } from '../shared/blocks.js'

// =============== 9. BENTO (pllaka të errëta me cepa të prerë) ===============
export default function bento(ctx, W, H, d, t) {
  const st = H > 1500, M = 44, G = 18
  const bg = '#16161A'; ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H)
  drawDeco(ctx, W, H, t, 'back', true)
  const card = '#222228'
  const top = st ? 160 : 44
  drawLogo(ctx, M + 6, top, 54, 'dark', d.logo)
  const head = ((d.title || '').trim() || badgeFor(t, d)).toUpperCase()
  ctx.save(); let hz = 24; ctx.font = font('Montserrat', 800, hz); ctx.letterSpacing = '4px'; const hmax = W - 2 * M - 400; if (ctx.measureText(head).width > hmax) { hz = Math.max(14, hz * hmax / ctx.measureText(head).width); ctx.font = font('Montserrat', 800, hz) } const hw = ctx.measureText(head).width; ctx.fillStyle = 'rgba(255,255,255,.75)'; ctx.textAlign = 'right'; ctx.fillText(head, W - M - 6, top + 38); ctx.restore()
  slashes(ctx, W - M - hw - 54, top + 14 + (24 - hz) * 0.6, 28 * hz / 24, t.accent, 2)
  let y = top + 96
  const bottom = H - (st ? 220 : 40)
  const LW = Math.round((W - 2 * M - G) * 0.58), RW = W - 2 * M - G - LW, RX = M + LW + G
  // pllaka e madhe e fotos
  const fh = Math.round((bottom - y) * 0.66)
  cutCard(ctx, M, y, LW, fh, card)
  ctx.save(); ctx.beginPath(); ctx.moveTo(M, y); ctx.lineTo(M + LW - 34, y); ctx.lineTo(M + LW, y + 34); ctx.lineTo(M + LW, y + fh); ctx.lineTo(M + 34, y + fh); ctx.lineTo(M, y + fh - 34); ctx.closePath(); ctx.clip(); drawPhoto(ctx, d.img, M, y, LW, fh); ctx.restore()
  offerTag(ctx, d.offer, M + 24, y + fh - 104, 80, t.accent, '#fff')
  // pllaka e çmimit (e kuqe)
  const prH = Math.round(fh * 0.5) - G / 2
  const pg = ctx.createLinearGradient(RX, y, RX + RW, y + prH); pg.addColorStop(0, t.accent); pg.addColorStop(1, shade(t.accent, -0.35))
  cutCard(ctx, RX, y, RW, prH, pg)
  ctx.save(); ctx.globalAlpha = 0.18; slashes(ctx, RX + RW - 120, y + 20, prH - 40, '#fff', 2); ctx.restore()
  ctx.fillStyle = ink(t.accent); ctx.textAlign = 'left'
  ctx.font = font('Montserrat', 700, 24); ctx.globalAlpha = 0.85; ctx.fillText('ÇMIMI', RX + 34, y + 60)
  const old = (d.oldPrice || '').trim() && hasP(d) ? fmtPrice(d.oldPrice) : ''
  if (old) { ctx.font = font('Montserrat', 700, 26); ctx.textAlign = 'right'; const ow = ctx.measureText(old).width; ctx.fillText(old, RX + RW - 34, y + 60); ctx.fillRect(RX + RW - 34 - ow - 4, y + 51, ow + 8, 3); ctx.textAlign = 'left' }
  ctx.globalAlpha = 1
  if (hasP(d)) { fit(ctx, fmtPrice(d.price), t.head.f, 800, 110, RW - 68, 30, t.head.s); ctx.fillText(fmtPrice(d.price), RX + 34, y + prH - 46) }
  else { const w2 = wrapFit(ctx, ASK, 'Montserrat', 800, 44, RW - 68, 2, 24); drawLines(ctx, w2.lines, RX + 34, y + prH - 50 - (w2.lines.length - 1) * w2.size * 1.1, w2.size * 1.1) }
  // pllaka e specifikave
  const sy = y + prH + G, sh = fh - prH - G
  cutCard(ctx, RX, sy, RW, sh, card)
  const sp = specParts(d.spec)
  if (sp.length) { let yy = sy + 66; const lh2 = Math.min(64, (sh - 70) / sp.length); sp.slice(0, 4).forEach((p) => { specIcon(ctx, p, RX + 26, yy - 38, 46, t.accent); ctx.fillStyle = '#fff'; fit(ctx, p, 'Barlow Condensed', 700, 40, RW - 110, 20, 'italic'); ctx.fillText(p, RX + 80, yy); yy += lh2 }) }
  else { ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.font = font('Montserrat', 700, 26); ctx.fillText('N MOBILE', RX + 34, sy + sh / 2 + 10) }
  // pllaka e poshtme: modeli + info + CTA + kontakti
  y += fh + G
  cutCard(ctx, M, y, W - 2 * M, bottom - y, '#fff')
  stack(ctx, d, t, { skip: { price: true, spec: true }, model: { size: st ? 92 : 70, color: '#111', lines: 2, lh: 0.98 }, info: { color: '#333', size: 25 }, cta: { bg: t.accent, color: '#fff', size: 26 } },
    M + 40, y + 34, W - 2 * M - 80, bottom - y - 64, 'center')
  drawDeco(ctx, W, H, t, 'front', true)
}
