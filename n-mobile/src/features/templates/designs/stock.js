import { drawDeco, drawLogo } from '../../../lib/canvas/draw.js'
import { stack, shade, modelText } from '../shared/blocks.js'
import { proPhoto, proTitle } from '../shared/pro.js'
import { silkBg, glow } from '../shared/silk.js'
import { safe, footer, outlineText, chip } from '../shared/kit.js'
import { onDark } from '../shared/styles.js'

// =============== SOT NË STOK: emri gjigant i konturuar pas telefonit ===============
export default function stock(ctx, W, H, d, t) {
  const { st, M, top, bottom } = safe(W, H)
  silkBg(ctx, W, H, t, 'deep')
  drawDeco(ctx, W, H, t, 'back', true)
  drawLogo(ctx, W / 2, st ? 120 : top, 50, 'white', d.logo, 'center')
  let y = top + (st ? 10 : 80)
  chip(ctx, ((d.title || '').trim() || 'SOT NË STOK').toUpperCase(), W / 2, y, 26, t.accent, '#fff', 'center')
  y += 80
  const textH = st ? 600 : 440
  const pTop = y, pBot = bottom - textH, pcy = (pTop + pBot) / 2
  // emri gjigant (fjalët në dy rreshta), i konturuar
  const words = modelText(d).toUpperCase().split(/\s+/)
  const half = Math.ceil(words.length / 2), l1 = words.slice(0, half).join(' '), l2 = words.slice(half).join(' ')
  const z = outlineText(ctx, l1, W / 2, pcy - (l2 ? (st ? 150 : 110) : 0), W + 140, st ? 300 : 230, 'rgba(255,255,255,.28)', 3)
  if (l2) outlineText(ctx, l2, W / 2, pcy + (st ? 150 : 110), W + 140, z * 1.1, shade(t.accent, 0.2), 3)
  glow(ctx, W / 2, pcy, (pBot - pTop) * 0.6, t.accent, 0.5)
  proPhoto(ctx, d.img, W / 2, pcy, W * 0.6, (pBot - pTop) * 1.02, 0.06)
  const fh = footer(ctx, W, bottom, d, { color: 'rgba(255,255,255,.85)', icon: t.accent, M })
  let ty = pBot + 14
  ty += proTitle(ctx, d, W / 2, ty, W - 2 * M, st ? 80 : 60, t, { color: '#fff', align: 'center', maxLines: 1 }) + 6
  stack(ctx, d, t, onDark(t, { skip: { colors: true, meta: true, slogan: true, info: true, spec: !st }, align: 'center', price: 96 }), M, ty, W - 2 * M, bottom - fh - 16 - ty, 'center')
  drawDeco(ctx, W, H, t, 'front', true)
}
