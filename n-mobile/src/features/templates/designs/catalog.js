import { drawDeco } from '../../../lib/canvas/draw.js'
import { stack } from '../shared/blocks.js'
import { proScene, proDisc, proPhoto, proTitle, proHeader, proFrame } from '../shared/pro.js'

// =============== KATALOG (pro: teksti majtas, telefoni i madh djathtas) ===============
export default function catalog(ctx, W, H, d, t) {
  const st = H > 1500, M = 80
  proScene(ctx, W, H, t, [[W * 0.86, H * 0.5, 620, 0.55, 1], [W * 0.55, H * 0.85, 420, 0.35, 2], [W * 0.1, H * 0.05, 380, 0.12, 2]])
  drawDeco(ctx, W, H, t, 'back', false)
  const top = st ? 170 : 64
  proHeader(ctx, W, top, d, t)
  // telefoni: post = gjysma e djathtë; story = poshtë, i madh
  const pcx = st ? W * 0.6 : W * 0.75, pcy = st ? H * 0.74 : H * 0.57
  proDisc(ctx, pcx + 60, pcy + 40, st ? 400 : 290, t)
  proPhoto(ctx, d.img, pcx, pcy, st ? W * 0.78 : W * 0.46, st ? H * 0.38 : H * 0.7, -0.1)
  // teksti
  const lw = st ? W - 2 * M : W * 0.48, ty = top + (st ? 140 : 150)
  const th = proTitle(ctx, d, M, ty, lw, st ? 112 : 100, t, { maxLines: 4 })
  stack(ctx, d, t, { skip: { model: true }, model: { size: 10, color: '#111' }, spec: { mode: 'icons', size: 24, color: '#222', icon: t.accent, tile: '#FBE9E9', gap: 0 }, price: { size: 92, color: '#111', f: 'Montserrat' }, info: { color: '#555', size: 26 }, cta: { bg: t.accent, color: '#fff', size: 30 } },
    M, ty + th + 34, lw, (st ? H * 0.53 : H - 80) - (ty + th + 34), 'top')
  proFrame(ctx, W, H)
  drawDeco(ctx, W, H, t, 'front', false)
}
