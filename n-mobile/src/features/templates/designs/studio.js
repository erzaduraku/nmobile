import { drawDeco } from '../../../lib/canvas/draw.js'
import { stack } from '../shared/blocks.js'
import { proScene, proDisc, proPhoto, proTitle, proHeader, proPill, proFrame } from '../shared/pro.js'

// =============== STUDIO (pro: titull në qendër sipër, telefoni poshtë mbi rreth) ===============
export default function studio(ctx, W, H, d, t) {
  const st = H > 1500
  proScene(ctx, W, H, t, [[W * 0.5, H * 0.78, 700, 0.5, 1], [W * 0.05, H * 0.55, 380, 0.25, 2], [W * 0.95, H * 0.4, 380, 0.25, 2]], true)
  drawDeco(ctx, W, H, t, 'back', true)
  const top = st ? 170 : 60
  proHeader(ctx, W, top, d, t, true, 'center')
  let y = top + 100
  if (d.offer) { proPill(ctx, d.offer, W / 2, y, 30, t.accent, '#fff', 'center'); y += 76 }
  y += proTitle(ctx, d, W / 2, y, W - 200, st ? 120 : 96, t, { align: 'center', maxLines: 3, color: '#fff' }) + 22
  const textH = stack(ctx, d, t, { align: 'center', skip: { model: true }, model: { size: 10, color: '#fff' }, spec: { size: 28, color: 'rgba(255,255,255,.8)', sep: t.accent, gap: 0 }, price: { size: 64, color: '#fff', f: 'Montserrat', gap: 18 }, info: { color: 'rgba(255,255,255,.8)', size: 25 }, cta: { bg: t.accent, color: '#fff', size: 28 } },
    120, y, W - 240, st ? 420 : 300, 'top')
  y += textH + 20
  // zona e telefonit deri poshtë
  const bottom = H - (st ? 250 : 40)
  const ph = bottom - y, pcy = y + ph / 2
  proDisc(ctx, W / 2, pcy + ph * 0.08, Math.min(W * 0.36, ph * 0.46), t, 1, true)
  proPhoto(ctx, d.img, W / 2, pcy, W * 0.8, ph * 0.98, -0.06)
  // CTA si pill mbi telefon, poshtë
  proFrame(ctx, W, H)
  drawDeco(ctx, W, H, t, 'front', true)
}
