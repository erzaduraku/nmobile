import { shade } from './blocks.js'
// Sfond i kuq i thellë me valë "mëndafshi"
export function silkBg(ctx, W, H, t, mode = 'deep') {
  const a = t.accent
  const g = ctx.createLinearGradient(0, 0, W * 0.4, H)
  if (mode === 'deep') { g.addColorStop(0, '#0B0505'); g.addColorStop(0.55, shade(a, -0.78)); g.addColorStop(1, shade(a, -0.45)) }
  else { g.addColorStop(0, shade(a, 0.08)); g.addColorStop(0.6, a); g.addColorStop(1, shade(a, -0.45)) }
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H)
  const band = (y0, amp, th, col, alpha, ph) => {
    ctx.save(); ctx.globalAlpha = alpha
    const gg = ctx.createLinearGradient(0, y0 - amp, W, y0 + amp); gg.addColorStop(0, 'rgba(0,0,0,0)'); gg.addColorStop(0.45, col); gg.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.beginPath(); ctx.moveTo(-50, y0 + amp * Math.sin(ph))
    ctx.bezierCurveTo(W * 0.3, y0 - amp, W * 0.6, y0 + amp * 1.4, W + 50, y0 - amp * 0.6)
    ctx.lineTo(W + 50, y0 - amp * 0.6 + th)
    ctx.bezierCurveTo(W * 0.6, y0 + amp * 1.4 + th * 1.4, W * 0.3, y0 - amp + th * 0.6, -50, y0 + amp * Math.sin(ph) + th)
    ctx.closePath(); ctx.fillStyle = gg; ctx.fill(); ctx.restore()
  }
  const hi = mode === 'deep' ? a : shade(a, 0.45), lo = shade(a, -0.6)
  band(H * 0.78, H * 0.08, H * 0.09, hi, 0.55, 0.5)
  band(H * 0.84, H * 0.06, H * 0.05, shade(a, 0.3), 0.35, 1.2)
  band(H * 0.18, H * 0.06, H * 0.06, mode === 'deep' ? a : lo, 0.22, 2)
  band(H * 0.92, H * 0.05, H * 0.12, lo, 0.5, 0.2)
  // vinjetë
  const v = ctx.createRadialGradient(W * 0.7, H * 0.45, 0, W * 0.7, H * 0.45, Math.max(W, H) * 0.8)
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.35)'); ctx.fillStyle = v; ctx.fillRect(0, 0, W, H)
}
// Shkëlqim i kuq pas produktit
export function glow(ctx, x, y, r, col, a = 0.6) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.restore()
}
