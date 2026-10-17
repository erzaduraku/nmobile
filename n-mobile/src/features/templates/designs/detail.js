import { drawDeco, drawLogo, photoBg, cutout } from '../../../lib/canvas/draw.js'
import { stack, shade } from '../shared/blocks.js'
import { proTitle } from '../shared/pro.js'
import { glow } from '../shared/silk.js'
import { safe, footer } from '../shared/kit.js'
import { onDark } from '../shared/styles.js'

// =============== DETAJ: telefoni i zmadhuar (fokus te kamera), pak tekst ===============
export default function detail(ctx, W, H, d, t) {
  const { st, M, top, bottom } = safe(W, H)
  const g = ctx.createRadialGradient(W * 0.65, H * 0.35, 0, W * 0.65, H * 0.35, H * 0.9); g.addColorStop(0, shade(t.accent, -0.55)); g.addColorStop(1, '#0A0506')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  glow(ctx, W * 0.66, H * 0.36, W * 0.6, t.accent, 0.45)
  drawDeco(ctx, W, H, t, 'back', true)
  // zmadhimi: pjesa e sipërme e produktit (zakonisht kamera), e prerë qëllimisht
  if (d.img) {
    const cut = cutout(d.img), info = photoBg(d.img)
    const src = cut || d.img
    const [sx, sy, iw, ih] = cut ? [0, 0, cut.width, cut.height] : (info.box || [0, 0, d.img.naturalWidth, d.img.naturalHeight])
    const rw = iw * 0.62, rh = ih * 0.46 // zona e kamerës
    const k = Math.max((W * 1.05) / rw, (H * (st ? 0.62 : 0.72)) / rh)
    ctx.save(); ctx.translate(W * 0.58, H * (st ? 0.36 : 0.38)); ctx.rotate(-0.1)
    if (cut) { ctx.shadowColor = 'rgba(0,0,0,.6)'; ctx.shadowBlur = 60 }
    ctx.drawImage(src, sx, sy, rw, rh, -rw * k * 0.45, -rh * k * 0.5, rw * k, rh * k)
    ctx.restore()
    // errësim i butë poshtë që teksti të lexohet
    const fd = ctx.createLinearGradient(0, H * 0.5, 0, H); fd.addColorStop(0, 'rgba(10,5,6,0)'); fd.addColorStop(0.55, 'rgba(10,5,6,.92)'); fd.addColorStop(1, '#0A0506')
    ctx.fillStyle = fd; ctx.fillRect(0, H * 0.5, W, H * 0.5)
  }
  drawLogo(ctx, M, st ? 120 : top, 50, 'white', d.logo)
  const fh = footer(ctx, W, bottom, d, { color: 'rgba(255,255,255,.75)', icon: t.accent, M })
  // pak tekst: seria + modeli + çmimi
  const boxH = st ? 420 : 330, y0 = bottom - fh - boxH
  const th = proTitle(ctx, d, M, y0, W * 0.7, st ? 92 : 78, t, { color: '#fff', maxLines: 2 })
  stack(ctx, d, t, onDark(t, { skip: { spec: true, colors: true, meta: true, info: true, slogan: true }, price: 84 }), M, y0 + th + 16, W - 2 * M, boxH - th - 16, 'top')
  drawDeco(ctx, W, H, t, 'front', true)
}
