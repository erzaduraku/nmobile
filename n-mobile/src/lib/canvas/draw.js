import { drawDecor2 } from './decor.js'
import { N_SHAPE, SLASH, LOGO_VARIANTS, MARK_W, L, WORD, WORD_FONT } from './logoGeom.js'
// Ndihmës për vizatim në canvas
export const rng = (seed = 7) => () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646 }

export function rr(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath()
}

export const font = (family, weight, size, style = '') => {
  const w = family === 'Bebas Neue' ? 400 : weight
  return `${style} ${w} ${size}px "${family}", "Montserrat", sans-serif`.trim()
}

// Zvogëlon madhësinë e fontit derisa teksti të hyjë në gjerësi
export function fit(ctx, text, family, weight, size, maxW, min = 20, style = '') {
  let s = size
  ctx.font = font(family, weight, s, style)
  while (ctx.measureText(text).width > maxW && s > min) { s -= 2; ctx.font = font(family, weight, s, style) }
  return s
}

// Ndan tekstin në max rreshta, duke zvogëluar fontin nëse duhet
export function wrapFit(ctx, text, family, weight, size, maxW, maxLines = 2, min = 30, style = '') {
  let s = size
  for (;;) {
    ctx.font = font(family, weight, s, style)
    const words = text.split(/\s+/); const lines = []; let cur = ''
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w
      if (ctx.measureText(t).width <= maxW || !cur) cur = t; else { lines.push(cur); cur = w }
    }
    if (cur) lines.push(cur)
    const ok = lines.length <= maxLines && lines.every((l) => ctx.measureText(l).width <= maxW)
    if (ok || s <= min) return { size: s, lines: lines.slice(0, maxLines) }
    s -= 3
  }
}

export function drawLines(ctx, lines, x, y, lh) { lines.forEach((l, i) => ctx.fillText(l, x, y + i * lh)) }

// Analizon skajet e fotos: a është sfond i njëtrajtshëm (p.sh. i bardhë)?
const BG = new WeakMap()
export function photoBg(img) {
  if (!img) return { uniform: false, color: '#eee' }
  if (BG.has(img)) return BG.get(img)
  const c = document.createElement('canvas'); c.width = 64; c.height = 64; const x = c.getContext('2d', { willReadFrequently: true })
  x.drawImage(img, 0, 0, 64, 64); const px = x.getImageData(0, 0, 64, 64).data
  // Already cut out (PNG with transparency): no background to guess, box = visible pixels.
  // (Before this, transparent pixels were read as black and the flood fill ate dark phone edges.)
  let clear = 0; for (let i = 3; i < px.length; i += 4) if (px[i] < 200) clear++
  if (clear > 64) {
    let x0 = 64, y0 = 64, x1 = -1, y1 = -1
    for (let yy = 0; yy < 64; yy++) for (let xx = 0; xx < 64; xx++) if (px[(yy * 64 + xx) * 4 + 3] > 16) { x0 = Math.min(x0, xx); y0 = Math.min(y0, yy); x1 = Math.max(x1, xx); y1 = Math.max(y1, yy) }
    const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height, fx = iw / 64, fy = ih / 64
    const r = { uniform: false, alpha: true, color: '#ffffff', light: true }
    if (x1 >= x0) { const bx = Math.max(0, (x0 - 1) * fx), by = Math.max(0, (y0 - 1) * fy); r.box = [bx, by, Math.min(iw, (x1 + 2) * fx) - bx, Math.min(ih, (y1 + 2) * fy) - by] }
    BG.set(img, r); return r
  }
  const sm = []; for (let i = 0; i < 64; i++) for (const [u, v] of [[i, 0], [i, 63], [0, i], [63, i], [i, 1], [1, i], [62, i], [i, 62]]) { const o = (v * 64 + u) * 4; sm.push([px[o], px[o + 1], px[o + 2]]) }
  const avg = [0, 1, 2].map((k) => sm.reduce((a, p) => a + p[k], 0) / sm.length)
  const dev = Math.sqrt(sm.reduce((a, p) => a + (p[0] - avg[0]) ** 2 + (p[1] - avg[1]) ** 2 + (p[2] - avg[2]) ** 2, 0) / sm.length)
  const r = { uniform: dev < 18, color: `rgb(${avg.map(Math.round).join(',')})`, light: (avg[0] + avg[1] + avg[2]) / 3 > 200 }
  if (r.uniform) { // gjen kutinë e produktit (pa sfondin përreth)
    let x0 = 64, y0 = 64, x1 = -1, y1 = -1
    for (let yy = 0; yy < 64; yy++) for (let xx = 0; xx < 64; xx++) { const o = (yy * 64 + xx) * 4; if (Math.abs(px[o] - avg[0]) + Math.abs(px[o + 1] - avg[1]) + Math.abs(px[o + 2] - avg[2]) > 40) { x0 = Math.min(x0, xx); y0 = Math.min(y0, yy); x1 = Math.max(x1, xx); y1 = Math.max(y1, yy) } }
    if (x1 > x0 && y1 > y0) { const iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height; const fx = iw / 64, fy = ih / 64
      r.box = [Math.max(0, (x0 - 1) * fx), Math.max(0, (y0 - 1) * fy), Math.min(iw, (x1 + 2) * fx) - Math.max(0, (x0 - 1) * fx), Math.min(ih, (y1 + 2) * fy) - Math.max(0, (y0 - 1) * fy)] }
  }
  BG.set(img, r); return r
}

// Foto: sfond i njëtrajtshëm -> contain mbi ngjyrën e skajeve; përndryshe cover. Asnjëherë shirita të turbullt.
export function drawPhoto(ctx, img, x, y, w, h, { r = 0, mode = 'auto', bg = null, pad = 0 } = {}) {
  ctx.save()
  rr(ctx, x, y, w, h, r); ctx.clip()
  if (img) {
    const info = photoBg(img)
    let m = mode
    if (m === 'auto') m = 'contain' // produkti nuk pritet kurrë
    if (!info.alpha || bg) { ctx.fillStyle = info.uniform ? info.color : (bg || info.color); ctx.fillRect(x, y, w, h) } // cut-outs sit on the card itself
    const [sx, sy, iw, ih] = m === 'contain' && info.box ? info.box : [0, 0, img.naturalWidth || img.width, img.naturalHeight || img.height]
    const p2 = m === 'contain' ? Math.max(pad, Math.min(w, h) * 0.07) : pad
    const bx = x + p2, by = y + p2, bw = w - p2 * 2, bh = h - p2 * 2
    const k = m === 'cover' ? Math.max(bw / iw, bh / ih) : Math.min(bw / iw, bh / ih)
    const dw = iw * k, dh = ih * k
    ctx.drawImage(img, sx, sy, iw, ih, bx + (bw - dw) / 2, by + (bh - dh) / 2, dw, dh)
  } else {
    const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, '#ddd'); g.addColorStop(1, '#bbb')
    ctx.fillStyle = g; ctx.fillRect(x, y, w, h)
  }
  ctx.restore()
}

// Logoja N Mobile. variant: red | dark | white | black. Kthen gjerësinë.
export function drawMark(ctx, x, y, h, variant = 'red') {
  const P = LOGO_VARIANTS[variant] || LOGO_VARIANTS.red, k = h / 100
  const poly = (p) => p.forEach(([px, py], i) => (i ? ctx.lineTo : ctx.moveTo).call(ctx, x + px * k, y + py * k))
  ctx.save()
  // klip "evenodd": gjithçka përveç prerjes
  ctx.beginPath(); ctx.rect(x - h, y - h, h * 4, h * 3); poly(SLASH); ctx.closePath(); ctx.clip('evenodd')
  ctx.beginPath(); poly(N_SHAPE); ctx.closePath(); ctx.fillStyle = P.a; ctx.fill()
  ctx.restore()
  return MARK_W * k
}
export function logoWidth(ctx, h, custom = null) {
  if (custom) return ((custom.naturalWidth || custom.width) / (custom.naturalHeight || custom.height)) * h * 1.15
  ctx.save(); ctx.font = `italic 800 ${h * L.textSize}px "${WORD_FONT}", sans-serif`; const w = h * L.textX + ctx.measureText(WORD).width; ctx.restore(); return w
}
export function drawLogo(ctx, x, y, h, variant = 'red', custom = null, align = 'left') {
  if (custom) {
    const iw = custom.naturalWidth || custom.width, ih = custom.naturalHeight || custom.height
    const w = (iw / ih) * h * 1.15, hh = h * 1.15
    const dx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x
    ctx.drawImage(custom, dx, y - (hh - h) / 2, w, hh)
    return w
  }
  if (variant === 'white-on-dark') variant = 'dark'
  const P = LOGO_VARIANTS[variant] || LOGO_VARIANTS.red
  ctx.save()
  ctx.font = `italic 800 ${h * L.textSize}px "${WORD_FONT}", sans-serif`
  const tw = ctx.measureText(WORD).width
  const tx = h * L.textX, total = tx + tw
  const dx = align === 'center' ? x - total / 2 : align === 'right' ? x - total : x
  drawMark(ctx, dx, y, h, variant)
  ctx.fillStyle = P.text; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
  ctx.fillText(WORD, dx + tx, y + h * L.baseline)
  // nënvizim "swoosh": i hollë majtas, më i trashë djathtas
  const lx = dx + h * L.lineStart, rx = dx + total, ly = y + h * L.lineY, lh = h * L.lineH
  ctx.beginPath(); ctx.moveTo(lx, ly + lh * 0.55); ctx.quadraticCurveTo((lx + rx) / 2, ly + lh * 0.9, rx + h * 0.06, ly - lh * 0.2)
  ctx.lineTo(rx - h * 0.02, ly + lh); ctx.quadraticCurveTo((lx + rx) / 2, ly + lh * 1.6, lx, ly + lh * 0.75); ctx.closePath()
  ctx.fillStyle = P.line; ctx.fill()
  ctx.restore()
  return total
}

export function pill(ctx, text, x, y, { size = 34, bg = '#E10600', color = '#fff', family = 'Montserrat', weight = 800, align = 'left', padX = 28, padY = 16 } = {}) {
  ctx.save()
  ctx.font = font(family, weight, size)
  const w = ctx.measureText(text).width + padX * 2, h = size + padY * 2
  const dx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x
  rr(ctx, dx, y, w, h, h / 2); ctx.fillStyle = bg; ctx.fill()
  ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.textAlign = 'center'
  ctx.fillText(text, dx + w / 2, y + h / 2 + size * 0.05)
  ctx.restore()
  return { w, h }
}

export function burst(ctx, cx, cy, r, color, points = 18) {
  ctx.beginPath()
  for (let i = 0; i < points * 2; i++) {
    const a = (Math.PI * i) / points - Math.PI / 2, rad = i % 2 ? r * 0.84 : r
    ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad)
  }
  ctx.closePath(); ctx.fillStyle = color; ctx.fill()
}

export function star(ctx, cx, cy, r, color, inner = 0.45) {
  ctx.beginPath()
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI * i) / 5 - Math.PI / 2, rad = i % 2 ? r * inner : r
    ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad)
  }
  ctx.closePath(); ctx.fillStyle = color; ctx.fill()
}

export function heart(ctx, cx, cy, s, color) {
  ctx.beginPath()
  ctx.moveTo(cx, cy + s * 0.35)
  ctx.bezierCurveTo(cx - s * 1.1, cy - s * 0.4, cx - s * 0.45, cy - s * 1.05, cx, cy - s * 0.45)
  ctx.bezierCurveTo(cx + s * 0.45, cy - s * 1.05, cx + s * 1.1, cy - s * 0.4, cx, cy + s * 0.35)
  ctx.fillStyle = color; ctx.fill()
}

// Elementet dekorative të temës. layer: 'back' | 'front'
export function drawDeco(ctx, W, H, t, layer = 'back', onDark = true) {
  if (!t.deco) return
  if (['blossom', 'flowers', 'leaves', 'crescent', 'sixstars', 'eagle', 'school'].includes(t.deco)) return drawDecor2(ctx, W, H, t, layer, onDark)
  const R = rng(layer === 'back' ? 11 : 29)
  ctx.save()
  // shtresa e përparme vetëm në shirita anësorë: nuk mbulon telefonin, çmimin ose logon
  if (layer === 'front' && t.deco !== 'tape') { ctx.beginPath(); ctx.rect(0, H * 0.12, W * 0.07, H * 0.76); ctx.rect(W * 0.93, H * 0.12, W * 0.07, H * 0.76); ctx.clip() }
  if (t.deco === 'snow') {
    const n = layer === 'back' ? 70 : 26
    for (let i = 0; i < n; i++) {
      const x = R() * W, y = R() * H, r = 3 + R() * (layer === 'back' ? 9 : 6)
      ctx.globalAlpha = 0.35 + R() * 0.5
      ctx.fillStyle = onDark ? '#fff' : '#C9D6E3'
      ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill()
    }
    if (layer === 'back') {
      ctx.strokeStyle = onDark ? 'rgba(255,255,255,.5)' : 'rgba(31,122,69,.35)'; ctx.lineWidth = 5; ctx.lineCap = 'round'
      for (let i = 0; i < 6; i++) {
        const x = R() * W, y = R() * H, s = 24 + R() * 30
        ctx.globalAlpha = 0.7
        for (let k = 0; k < 3; k++) { const a = (k * Math.PI) / 3; ctx.beginPath(); ctx.moveTo(x - Math.cos(a) * s, y - Math.sin(a) * s); ctx.lineTo(x + Math.cos(a) * s, y + Math.sin(a) * s); ctx.stroke() }
      }
    }
  } else if (t.deco === 'stars') {
    const n = layer === 'back' ? 40 : 14
    for (let i = 0; i < n; i++) {
      ctx.globalAlpha = 0.5 + R() * 0.5
      star(ctx, R() * W, R() * H, 6 + R() * (layer === 'back' ? 22 : 12), i % 3 ? t.gold : (onDark ? '#fff' : t.accent2), i % 2 ? 0.42 : 0.2)
    }
    if (layer === 'back') for (let i = 0; i < 40; i++) {
      ctx.globalAlpha = 0.8; ctx.fillStyle = [t.gold, '#fff', '#C9CED6'][i % 3]
      ctx.save(); ctx.translate(R() * W, R() * H); ctx.rotate(R() * 3); ctx.fillRect(-10, -4, 20, 8); ctx.restore()
    }
  } else if (t.deco === 'tape' && layer === 'front') {
    const band = (y, rot) => {
      ctx.save(); ctx.translate(W / 2, y); ctx.rotate(rot)
      ctx.fillStyle = t.accent2; ctx.fillRect(-W, -34, W * 2, 68)
      ctx.fillStyle = '#000'; ctx.font = font('Bebas Neue', 400, 48); ctx.textBaseline = 'middle'
      for (let x = -W; x < W; x += 330) ctx.fillText('BLACK FRIDAY  •', x, 3)
      ctx.restore()
    }
    band(H - 22, -0.03)
  } else if (t.deco === 'hearts') {
    const n = layer === 'back' ? 26 : 8
    for (let i = 0; i < n; i++) {
      ctx.globalAlpha = 0.25 + R() * 0.55
      heart(ctx, R() * W, R() * H, 14 + R() * (layer === 'back' ? 34 : 18), i % 2 ? t.accent : t.accent2)
    }
  } else if (t.deco === 'sun') {
    if (layer === 'back') {
      ctx.globalAlpha = 0.9
      const cx = W - 60, cy = 60
      ctx.fillStyle = t.gold
      for (let i = 0; i < 16; i++) { ctx.save(); ctx.translate(cx, cy); ctx.rotate((i * Math.PI) / 8); ctx.fillRect(150, -8, 70, 16); ctx.restore() }
      ctx.beginPath(); ctx.arc(cx, cy, 130, 0, 7); ctx.fill()
    }
    const n = layer === 'back' ? 34 : 12
    for (let i = 0; i < n; i++) {
      ctx.globalAlpha = 0.7; ctx.fillStyle = [t.accent, t.accent2, t.gold][i % 3]
      ctx.beginPath(); ctx.arc(R() * W, R() * H, 4 + R() * 9, 0, 7); ctx.fill()
    }
  }
  ctx.restore()
}

// Ikonë lucide (24x24) e vizatuar me vija
export function icon(ctx, d, x, y, size, color) {
  ctx.save(); ctx.translate(x, y); ctx.scale(size / 24, size / 24)
  ctx.strokeStyle = color; ctx.lineWidth = 2.2; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
  ctx.stroke(new Path2D(d)); ctx.restore()
}

/* Prerja e sfondit uniform (p.sh. foto me sfond të bardhë): mbushje nga skajet
   me tolerancë, me kalim të butë në kufi. Kthen një canvas me alfa, ose null. */
const CUT = new WeakMap()
export function cutout(img) {
  if (!img) return null
  if (CUT.has(img)) return CUT.get(img)
  const info = photoBg(img)
  let res = null
  if (info.alpha) { // cut-out photo: use it as is (cropped to the visible product)
    const [sx, sy, iw, ih] = info.box || [0, 0, img.naturalWidth || img.width, img.naturalHeight || img.height]
    const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(iw)); c.height = Math.max(1, Math.round(ih))
    c.getContext('2d').drawImage(img, sx, sy, iw, ih, 0, 0, c.width, c.height); res = c
  } else if (info.uniform) {
    const [sx, sy, iw, ih] = info.box || [0, 0, img.naturalWidth || img.width, img.naturalHeight || img.height]
    const pad = Math.round(Math.max(iw, ih) * 0.02)
    const k = Math.min(1, 1400 / Math.max(iw, ih))
    const W = Math.round((iw + pad * 2) * k), H = Math.round((ih + pad * 2) * k)
    const c = document.createElement('canvas'); c.width = W; c.height = H
    const x = c.getContext('2d', { willReadFrequently: true })
    x.fillStyle = info.color; x.fillRect(0, 0, W, H)
    x.drawImage(img, sx - pad, sy - pad, iw + pad * 2, ih + pad * 2, 0, 0, W, H)
    const id = x.getImageData(0, 0, W, H), p = id.data
    const [br, bg, bb] = info.color.match(/\d+/g).map(Number)
    const dist = (o) => Math.max(Math.abs(p[o] - br), Math.abs(p[o + 1] - bg), Math.abs(p[o + 2] - bb))
    const T0 = 14, T1 = 46, seen = new Uint8Array(W * H), q = new Int32Array(W * H); let qh = 0, qt = 0
    const push = (i) => { if (!seen[i]) { seen[i] = 1; q[qt++] = i } }
    for (let i = 0; i < W; i++) { push(i); push((H - 1) * W + i) }
    for (let j = 0; j < H; j++) { push(j * W); push(j * W + W - 1) }
    while (qh < qt) {
      const i = q[qh++], o = i * 4, dd = dist(o)
      if (dd >= T1) continue
      p[o + 3] = dd <= T0 ? 0 : Math.round(255 * (dd - T0) / (T1 - T0))
      if (dd > T0 + 6) continue // kufiri: mos u fut më thellë
      const u = i % W, v = (i / W) | 0
      if (u > 0) push(i - 1); if (u < W - 1) push(i + 1); if (v > 0) push(i - W); if (v < H - 1) push(i + W)
    }
    x.putImageData(id, 0, 0); res = c
  }
  CUT.set(img, res); return res
}
