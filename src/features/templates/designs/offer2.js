import { drawDeco, drawLogo } from '../../../lib/canvas/draw.js'
import { stack, shade } from '../shared/blocks.js'
import { proPhoto, proTitle } from '../shared/pro.js'
import { glow } from '../shared/silk.js'
import { safe, footer, offerDisc, chip } from '../shared/kit.js'
import { onDark } from '../shared/styles.js'

// =============== OFERTË: e kuqe e plotë, rreth gjigant i ofertës, telefoni në qendër ===============
export default function offer2(ctx, W, H, d, t) {
  const { st, M, top, bottom } = safe(W, H)
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, t.accent); g.addColorStop(1, shade(t.accent, -0.5)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  // forma e vetme: një rreth i madh i errët pas telefonit
  ctx.save(); ctx.beginPath(); ctx.arc(W * 0.5, H * (st ? 0.48 : 0.5), W * 0.52, 0, Math.PI * 2); ctx.fillStyle = shade(t.accent, -0.35); ctx.fill(); ctx.restore()
  drawDeco(ctx, W, H, t, 'back', true)
  drawLogo(ctx, M, st ? 120 : top, 52, 'white', d.logo)
  let y = top + (st ? 0 : 84)
  const title = (d.title || '').trim() || t.badge || 'Ofertë speciale'
  chip(ctx, title.toUpperCase(), M, y, 24, '#fff', t.accent); y += 70
  y += proTitle(ctx, d, M, y, W * 0.62, st ? 108 : 88, { ...t, accent: '#FFD8D8' }, { color: '#fff', maxLines: 3 })
  // telefoni
  const textH = st ? 500 : 400
  const pTop = y - (st ? 60 : 50), pBot = bottom - textH, pcy = (pTop + pBot) / 2
  glow(ctx, W / 2, pcy, (pBot - pTop) * 0.7, '#fff', 0.18)
  proPhoto(ctx, d.img, W * 0.56, pcy, W * 0.8, (pBot - pTop) * 1.05, -0.05)
  offerDisc(ctx, d.offer, W - M - (st ? 130 : 110), top + (st ? 120 : 110), st ? 130 : 115, '#fff', t.accent)
  const fh = footer(ctx, W, bottom, d, { color: '#fff', line: 'rgba(255,255,255,.25)', M })
  stack(ctx, d, t, onDark(t, { skip: { colors: true, meta: true, slogan: true, info: !st }, align: 'center', ctaBg: '#fff', ctaFg: t.accent, icon: '#fff', price: 110, strike: '#fff' }), M, pBot + 10, W - 2 * M, textH - 20 - fh, 'center')
  drawDeco(ctx, W, H, t, 'front', true)
}
