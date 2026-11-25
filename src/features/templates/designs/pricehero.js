import { drawDeco, drawLogo, font } from '../../../lib/canvas/draw.js'
import { stack, shade, hasP, priceNum, fmtPrice, ASK } from '../shared/blocks.js'
import { proPhoto, proTitle } from '../shared/pro.js'
import { silkBg } from '../shared/silk.js'
import { safe, footer, chip, topTitle } from '../shared/kit.js'
import { onDark } from '../shared/styles.js'

// =============== ÇMIMI SI HERO: çmim gjigant, telefoni anash ===============
export default function pricehero(ctx, W, H, d, t) {
  const { st, M, top, bottom } = safe(W, H)
  silkBg(ctx, W, H, t, 'full')
  drawDeco(ctx, W, H, t, 'back', true)
  drawLogo(ctx, M, st ? 120 : top, 50, 'white', d.logo)
  if ((d.offer || '').trim()) chip(ctx, d.offer.trim(), W - M, st ? 120 : top, 30, '#fff', t.accent, 'right')
  let y = top + (st ? 30 : 100)
  y += topTitle(ctx, d, M, y, { style: 'label', accent: '#fff', color: '#fff', z: st ? 26 : 22, maxW: W - 2 * M, gap: 18 })
  y += proTitle(ctx, d, M, y, W - 2 * M, st ? 80 : 62, { ...t, accent: '#FFD0D0' }, { color: '#fff', maxLines: 2 }) + 20
  // çmimi gjigant: euro të mëdha, centët lart të vegjël
  const n = priceNum(d.price), old = (d.oldPrice || '').trim()
  ctx.save(); ctx.fillStyle = '#fff'; ctx.textBaseline = 'alphabetic'
  if (old) { ctx.font = font('Montserrat', 700, 46); ctx.globalAlpha = 0.75; ctx.fillText(fmtPrice(old), M, y + 46); const ow = ctx.measureText(fmtPrice(old)).width; ctx.fillRect(M - 4, y + 28, ow + 8, 5); ctx.globalAlpha = 1; y += 66 }
  let pz = st ? 330 : 280
  if (n != null) {
    const eu = String(Math.floor(n)), ce = Number.isInteger(n) ? '' : ',' + n.toFixed(2).split('.')[1]
    ctx.font = font('Montserrat', 900, pz); let ew = ctx.measureText(eu).width
    const maxW = W * 0.62; if (ew > maxW) { pz *= maxW / ew; ctx.font = font('Montserrat', 900, pz); ew = ctx.measureText(eu).width }
    ctx.letterSpacing = `${-pz * 0.04}px`; ctx.fillText(eu, M - pz * 0.03, y + pz * 0.78); ctx.letterSpacing = '0px'
    ctx.font = font('Montserrat', 800, pz * 0.3); ctx.fillText(ce ? ce.slice(1) : '€', M + ew + 10, y + pz * 0.3)
    if (ce) ctx.fillText('€', M + ew + 10, y + pz * 0.62)
    y += pz * 0.85
  } else { ctx.font = font('Montserrat', 900, 90); ctx.fillText(hasP(d) ? fmtPrice(d.price) : ASK, M, y + 90); y += 110 }
  ctx.restore()
  // telefoni djathtas poshtë
  const fh = footer(ctx, W, bottom, d, { color: '#fff', line: 'rgba(255,255,255,.3)', M })
  const pTop = st ? y - 40 : y - 60 // phone starts just below the giant price
  proPhoto(ctx, d.img, W * 0.75, (pTop + bottom - fh) / 2 + 30, W * 0.46, bottom - fh - pTop, -0.1)
  stack(ctx, d, t, onDark(t, { skip: { price: true }, icon: '#fff', ctaBg: '#fff', ctaFg: t.accent }), M, y + 30, W * 0.5, bottom - fh - 20 - (y + 30), 'top')
  drawDeco(ctx, W, H, t, 'front', true)
}
