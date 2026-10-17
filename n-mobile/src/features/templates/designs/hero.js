import { drawLogo, drawDeco, font, rr } from '../../../lib/canvas/draw.js'
import { stack, shade } from '../shared/blocks.js'
import { proPhoto, proTitle, proPill } from '../shared/pro.js'
import { silkBg, glow } from '../shared/silk.js'

// =============== HERO I KUQ (e zezë -> e kuqe e thellë, valë mëndafshi) ===============
export default function hero(ctx, W, H, d, t) {
  const st = H > 1500, M = 76
  silkBg(ctx, W, H, t, 'deep')
  drawDeco(ctx, W, H, t, 'back', true)
  const top = st ? 170 : 64
  drawLogo(ctx, M, top, 56, 'white', d.logo)
  // telefoni djathtas, i madh
  const pcx = st ? W * 0.62 : W * 0.77, pcy = st ? H * 0.76 : H * 0.53
  glow(ctx, pcx, pcy, st ? 560 : 480, t.accent, 0.55)
  proPhoto(ctx, d.img, pcx, pcy, st ? W * 0.82 : W * 0.44, st ? H * 0.42 : H * 0.8, -0.08)
  // teksti majtas
  const lw = st ? W - 2 * M : W * 0.5
  let y = top + (st ? 150 : 140)
  y += proTitle(ctx, d, M, y, lw, st ? 124 : 104, t, { color: '#fff', maxLines: 3 }) + 18
  if (d.offer) {
    ctx.save(); ctx.font = font('Montserrat', 800, 40); const tw = ctx.measureText(d.offer).width
    rr(ctx, M, y, tw + 56, 72, 16); ctx.fillStyle = t.accent; ctx.fill(); ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText(d.offer, M + 28, y + 38); ctx.restore(); y += 100
  }
  ctx.fillStyle = t.accent; ctx.fillRect(M, y, 90, 5); y += 34
  stack(ctx, d, t, { skip: { model: true }, model: { size: 10, color: '#fff' }, spec: { mode: 'icons', size: 24, color: '#fff', icon: shade(t.accent, 0.35), tile: 'rgba(255,255,255,.06)', gap: 0 }, price: { size: 84, color: '#fff', f: 'Montserrat' }, info: { color: 'rgba(255,255,255,.85)', size: 26 }, cta: { bg: t.accent, color: '#fff', size: 30 } },
    M, y, lw, (st ? H * 0.56 : H - 70) - y, 'top')
  drawDeco(ctx, W, H, t, 'front', true)
}
