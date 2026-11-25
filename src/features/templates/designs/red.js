import { drawLogo, drawDeco } from '../../../lib/canvas/draw.js'
import { stack } from '../shared/blocks.js'
import { proPhoto, proTitle, proPill } from '../shared/pro.js'
import { silkBg, glow } from '../shared/silk.js'
import { topTitle } from '../shared/kit.js'

// =============== E KUQE E PLOTË (qendër, produkti hero, ikona poshtë) ===============
export default function red(ctx, W, H, d, t) {
  const st = H > 1500, M = 70
  silkBg(ctx, W, H, t, 'full')
  drawDeco(ctx, W, H, t, 'back', true)
  const top = st ? 170 : 60
  drawLogo(ctx, W / 2, top, 56, 'white', d.logo, 'center')
  let y = top + 104
  const T = { ...t, accent: '#FFFFFF' }
  y += topTitle(ctx, d, W / 2, y, { style: 'chip', align: 'center', accent: '#fff', color: t.accent, z: st ? 26 : 22, maxW: W - 2 * M, gap: 18 })
  y += proTitle(ctx, d, W / 2, y, W - 160, st ? 118 : 92, T, { color: 'rgba(255,255,255,.78)', align: 'center', maxLines: 2 }) + 10
  // produkti në mes
  const bottomTxt = st ? 500 : 400
  const pTop = y, pBot = H - (st ? 250 : 40) - bottomTxt, pcy = (pTop + pBot) / 2
  glow(ctx, W / 2, pcy, (pBot - pTop) * 0.75, '#FFFFFF', 0.28)
  proPhoto(ctx, d.img, W / 2, pcy, W * 0.8, pBot - pTop, 0)
  if (d.offer) proPill(ctx, d.offer, W - M, pTop + 10, 40, '#fff', t.accent, 'right')
  stack(ctx, d, t, { align: 'center', skip: { model: true }, model: { size: 10, color: '#fff' }, spec: { mode: 'icons', size: 24, color: '#fff', icon: '#fff', tile: 'rgba(255,255,255,.14)', gap: 0 }, price: { size: 86, color: '#fff', f: 'Montserrat' }, info: { color: '#fff', icon: '#fff', size: 26 }, cta: { bg: '#fff', color: t.accent, size: 30 } },
    M, pBot + 16, W - 2 * M, bottomTxt - 16, 'center')
  drawDeco(ctx, W, H, t, 'front', true)
}
