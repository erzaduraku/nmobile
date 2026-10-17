import { drawDeco, drawLogo } from '../../../lib/canvas/draw.js'
import { stack } from '../shared/blocks.js'
import { proPhoto, proTitle } from '../shared/pro.js'
import { safe, footer, chip } from '../shared/kit.js'
import { onLight } from '../shared/styles.js'
import { glow } from '../shared/silk.js'

// =============== SPECIFIKIME: e bardhë, logo në qendër, seria e hollë + modeli gjigant ===============
export default function specsheet(ctx, W, H, d, t) {
  const { st, M, top, bottom } = safe(W, H)
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H)
  drawDeco(ctx, W, H, t, 'back', false)
  drawLogo(ctx, W / 2, st ? 120 : top, 50, 'red', d.logo, 'center')
  let y = top + (st ? 10 : 84)
  if ((d.seriesBadge || '').trim()) { chip(ctx, d.seriesBadge.trim(), W / 2, y, 24, '#111', '#fff', 'center'); y += 72 }
  y += proTitle(ctx, d, W / 2, y, W - 2 * M, st ? 120 : 80, t, { color: '#111', align: 'center', maxLines: 2 }) + 6
  const textH = st ? 600 : 400
  const pTop = y, pBot = bottom - textH, pcy = (pTop + pBot) / 2
  glow(ctx, W / 2, pcy + 40, W * 0.42, t.accent, 0.14)
  proPhoto(ctx, d.img, W / 2, pcy, W * 0.6, pBot - pTop, 0)
  const fh = footer(ctx, W, bottom, d, { color: '#333', icon: t.accent, line: '#EEE', M })
  stack(ctx, { ...d, seriesBadge: '' }, t, onLight(t, { skip: { colors: true, slogan: true, info: true, meta: !st }, align: 'center', price: 84, priceColor: t.accent }), M, pBot + 10, W - 2 * M, textH - 16 - fh, 'center')
  drawDeco(ctx, W, H, t, 'front', false)
}
