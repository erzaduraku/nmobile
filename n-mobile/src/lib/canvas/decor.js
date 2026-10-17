import { rng } from './draw.js'

/* Dekorimet e temave të reja. Vizatohen vetëm në shtresën e pasme (nën telefon,
   çmim dhe logo) dhe kryesisht në skaje, që të mos mbulojnë asgjë të rëndësishme. */
const edgePoint = (R, W, H) => { // pikë afër skajeve majtas/djathtas ose poshtë
  const side = R(); if (side < 0.4) return [R() * W * 0.16, R() * H]; if (side < 0.8) return [W - R() * W * 0.16, R() * H]; return [R() * W, H - R() * H * 0.1]
}
function star5(ctx, cx, cy, r, inner = 0.45) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, q = i % 2 ? r * inner : r; ctx.lineTo(cx + Math.cos(a) * q, cy + Math.sin(a) * q) } ctx.closePath(); ctx.fill() }
function flower(ctx, x, y, r, petal, center, n = 5) {
  ctx.fillStyle = petal
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * r * 0.55, y + Math.sin(a) * r * 0.55, r * 0.5, r * 0.32, a, 0, 7); ctx.fill() }
  ctx.fillStyle = center; ctx.beginPath(); ctx.arc(x, y, r * 0.24, 0, 7); ctx.fill()
}
function leaf(ctx, x, y, s, rot, color) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = color
  ctx.beginPath(); ctx.moveTo(0, -s); ctx.bezierCurveTo(s * 0.7, -s * 0.5, s * 0.6, s * 0.5, 0, s); ctx.bezierCurveTo(-s * 0.6, s * 0.5, -s * 0.7, -s * 0.5, 0, -s); ctx.fill()
  ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = s * 0.06; ctx.beginPath(); ctx.moveTo(0, -s * 0.9); ctx.lineTo(0, s * 1.2); ctx.stroke(); ctx.restore()
}
// Shqiponja dykrenore e stilizuar (siluetë simetrike)
function eagle(ctx, cx, cy, s, color) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s / 100, s / 100); ctx.fillStyle = color
  for (const k of [1, -1]) {
    ctx.save(); ctx.scale(k, 1); ctx.beginPath()
    ctx.moveTo(0, -30); ctx.lineTo(10, -48); ctx.lineTo(22, -62); ctx.lineTo(34, -64); ctx.lineTo(28, -54); ctx.lineTo(40, -52); ctx.lineTo(24, -42); ctx.lineTo(16, -26) // koka dhe sqepi
    // krahu me pendë
    ctx.lineTo(30, -40); for (let i = 0; i < 6; i++) { ctx.lineTo(48 + i * 9, -56 + i * 8); ctx.lineTo(44 + i * 8, -40 + i * 9) }
    ctx.lineTo(70, 22); ctx.lineTo(40, 8); ctx.lineTo(22, 20)
    // bishti
    ctx.lineTo(26, 46); ctx.lineTo(14, 40); ctx.lineTo(10, 62); ctx.lineTo(0, 54); ctx.closePath(); ctx.fill(); ctx.restore()
  }
  ctx.restore()
}

export function drawDecor2(ctx, W, H, t, layer, onDark) {
  if (layer !== 'back') return
  const R = rng(17)
  ctx.save()
  if (t.deco === 'blossom' || t.deco === 'flowers') {
    const n = 16
    for (let i = 0; i < n; i++) {
      const [x, y] = edgePoint(R, W, H); ctx.globalAlpha = 0.55 + R() * 0.4
      flower(ctx, x, y, 22 + R() * 30, i % 2 ? t.accent2 : (t.deco === 'flowers' ? t.accent : '#FFFFFF'), t.deco === 'flowers' ? '#FFD166' : t.accent, t.deco === 'flowers' ? 6 : 5)
    }
  } else if (t.deco === 'leaves') {
    const cols = [t.accent, t.accent2, '#8C3B12']
    for (let i = 0; i < 22; i++) { const [x, y] = edgePoint(R, W, H); ctx.globalAlpha = 0.6 + R() * 0.35; leaf(ctx, x, y, 20 + R() * 26, R() * 6.3, cols[i % 3]) }
  } else if (t.deco === 'crescent') {
    // hënë e re + yll në këndin e sipërm djathtas, yje të vegjël në skaje
    const cx = W - 150, cy = H * 0.2, r = 90
    ctx.globalAlpha = 0.9; ctx.fillStyle = t.gold
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.arc(cx + r * 0.38, cy - r * 0.12, r * 0.82, 0, 7, true); ctx.fill('evenodd')
    star5(ctx, cx + r * 0.55, cy - r * 0.1, r * 0.22)
    for (let i = 0; i < 18; i++) { const [x, y] = edgePoint(R, W, H); ctx.globalAlpha = 0.4 + R() * 0.5; star5(ctx, x, y, 4 + R() * 8) }
    // kornizë e hollë ari
    ctx.globalAlpha = 0.6; ctx.strokeStyle = t.gold; ctx.lineWidth = 3; ctx.strokeRect(26, 26, W - 52, H - 52)
  } else if (t.deco === 'sixstars') {
    // gjashtë yje në hark (si te flamuri i Kosovës), sipër në qendër, të zbehtë
    ctx.fillStyle = t.gold; ctx.globalAlpha = 0.85
    for (let i = 0; i < 6; i++) { const a = Math.PI * (1.18 + i * 0.128); star5(ctx, W / 2 + Math.cos(a) * W * 0.55, H * 0.42 + Math.sin(a) * W * 0.55 * 0.62 + H * 0.0, 30, 0.42) }
    ctx.globalAlpha = 0.18; ctx.fillStyle = '#fff'
    for (let i = 0; i < 20; i++) { const [x, y] = edgePoint(R, W, H); star5(ctx, x, y, 5 + R() * 6) }
  } else if (t.deco === 'eagle') {
    ctx.globalAlpha = onDark ? 0.22 : 0.06
    eagle(ctx, W * 0.5, H * 0.46, W * 0.8, onDark ? '#000' : t.accent)
    ctx.globalAlpha = 1; ctx.fillStyle = '#111'; ctx.fillRect(0, H - 14, W, 14); ctx.fillStyle = t.accent; ctx.fillRect(0, H - 22, W, 8)
  } else if (t.deco === 'school') {
    const pencil = (x, y, rot, c) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = c; ctx.fillRect(-60, -9, 100, 18); ctx.fillStyle = '#F5D7A1'; ctx.beginPath(); ctx.moveTo(40, -9); ctx.lineTo(62, 0); ctx.lineTo(40, 9); ctx.fill(); ctx.fillStyle = '#333'; ctx.beginPath(); ctx.moveTo(55, -3); ctx.lineTo(62, 0); ctx.lineTo(55, 3); ctx.fill(); ctx.fillStyle = '#F28B82'; ctx.fillRect(-72, -9, 12, 18); ctx.restore() }
    for (let i = 0; i < 10; i++) { const [x, y] = edgePoint(R, W, H); ctx.globalAlpha = 0.85; pencil(x, y, R() * 6.3, [t.accent, t.accent2, '#E11D2E'][i % 3]) }
    ctx.globalAlpha = 0.25; ctx.strokeStyle = onDark ? '#fff' : t.accent2; ctx.lineWidth = 2
    for (let y = 40; y < H; y += 46) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W * 0.1, y); ctx.moveTo(W * 0.9, y); ctx.lineTo(W, y); ctx.stroke() }
  }
  ctx.restore()
}
