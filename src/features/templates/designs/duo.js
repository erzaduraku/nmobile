import { drawDeco, drawLogo } from '../../../lib/canvas/draw.js'
import { stack, shade } from '../shared/blocks.js'
import { proPhoto, proTitle } from '../shared/pro.js'
import { safe, footer, chip } from '../shared/kit.js'
import { onLight } from '../shared/styles.js'

// =============== DY PRODUKTE: e bardhë me shirit të kuq, dy telefona krah për krah ===============
export default function duo(ctx, W, H, d, t) {
  const { st, M, top, bottom } = safe(W, H)
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H)
  drawDeco(ctx, W, H, t, 'back', false)
  drawLogo(ctx, W / 2, st ? 120 : top, 50, 'red', d.logo, 'center')
  let y = top + (st ? 10 : 84)
  if ((d.title || '').trim()) { chip(ctx, d.title.trim().toUpperCase(), W / 2, y, 22, t.accent, '#fff', 'center'); y += 66 }
  y += proTitle(ctx, d, W / 2, y, W - 2 * M, st ? 100 : 80, t, { color: '#111', align: 'center', maxLines: 2 }) + 6
  const textH = st ? 470 : 300
  const pTop = y + 10, pBot = bottom - textH, ph = pBot - pTop
  // shiriti i kuq horizontal pas telefonave (forma e vetme)
  const g = ctx.createLinearGradient(0, 0, W, 0); g.addColorStop(0, t.accent); g.addColorStop(1, shade(t.accent, -0.35))
  ctx.fillStyle = g; ctx.fillRect(0, pTop + ph * 0.42, W, ph * 0.4)
  const two = !!d.img2
  if (two) {
    proPhoto(ctx, d.img, W * 0.31, pTop + ph / 2, W * 0.44, ph, -0.06)
    proPhoto(ctx, d.img2, W * 0.69, pTop + ph / 2, W * 0.44, ph, 0.06)
  } else proPhoto(ctx, d.img, W / 2, pTop + ph / 2, W * 0.7, ph, 0)
  const fh = footer(ctx, W, bottom, d, { color: '#333', icon: t.accent, line: '#EEE', M })
  stack(ctx, d, t, onLight(t, { skip: { colors: true, meta: true, info: true, spec: true, slogan: true }, align: 'center', price: 88, priceColor: t.accent }), M, pBot + 14, W - 2 * M, textH - 20 - fh, 'center')
  drawDeco(ctx, W, H, t, 'front', false)
}
