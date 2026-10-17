import { drawDeco, drawLogo } from '../../../lib/canvas/draw.js'
import { stack, shade } from '../shared/blocks.js'
import { proPhoto, proTitle } from '../shared/pro.js'
import { safe, footer, topTitle } from '../shared/kit.js'
import { onDark } from '../shared/styles.js'

// =============== DIAGONALE: gjysmë e kuqe / gjysmë e zezë, telefoni mbi vijën ndarëse ===============
export default function diagonal(ctx, W, H, d, t) {
  const { st, M, top, bottom } = safe(W, H)
  ctx.fillStyle = '#111111'; ctx.fillRect(0, 0, W, H)
  const yL = H * (st ? 0.62 : 0.66), yR = H * (st ? 0.38 : 0.3)
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, shade(t.accent, 0.1)); g.addColorStop(1, shade(t.accent, -0.35))
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, yR); ctx.lineTo(0, yL); ctx.closePath(); ctx.fillStyle = g; ctx.fill()
  // vija e hollë e bardhë në ndarje
  ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,.7)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(0, yL + 14); ctx.lineTo(W, yR + 14); ctx.stroke(); ctx.restore()
  drawDeco(ctx, W, H, t, 'back', true)
  drawLogo(ctx, M, st ? 120 : top, 50, 'white', d.logo)
  let y = top + (st ? 10 : 90)
  const tw = W * 0.56
  y += topTitle(ctx, d, M, y, { style: 'ribbon', accent: '#111', color: '#fff', z: st ? 26 : 22, maxW: tw })
  y += proTitle(ctx, d, M, y, tw, st ? 104 : 86, { ...t, accent: '#111' }, { color: '#fff', maxLines: 3 })
  // telefoni djathtas, mbi vijë
  const pcx = W * 0.7, pcy = (yL + yR) / 2 + (st ? 40 : 30)
  proPhoto(ctx, d.img, pcx, pcy, W * 0.5, H * (st ? 0.5 : 0.62), -0.12)
  const fh = footer(ctx, W, bottom, d, { color: 'rgba(255,255,255,.8)', icon: t.accent, M })
  // teksti poshtë majtas në pjesën e zezë
  const by = Math.max(y + 30, yL - (st ? 40 : 10))
  stack(ctx, d, t, onDark(t, { skip: { colors: true, meta: true, slogan: true }, price: 96 }), M, by, W * 0.48, bottom - fh - 12 - by, 'bottom')
  drawDeco(ctx, W, H, t, 'front', true)
}
