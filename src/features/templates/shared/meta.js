import { font, rr } from '../../../lib/canvas/draw.js'

// Versioni / rajoni i pajisjes. flag: eu | us | jp | globe | null
export const REGIONS = [
  { id: 'CE', label: 'CE (EU)', flag: 'eu' },
  { id: 'US', label: 'US', flag: 'us' },
  { id: 'LL/A', label: 'LL/A (US)', flag: 'us' },
  { id: 'JP', label: 'JP', flag: 'jp' },
  { id: 'Global', label: 'Global', flag: 'globe' },
]
export const regionFlag = (r) => (REGIONS.find((x) => x.id.toLowerCase() === (r || '').trim().toLowerCase()) || {}).flag || null

// Flamuj vektorë (w = gjerësia, raport 3:2)
export function drawFlag(ctx, kind, x, y, w, color = '#fff') {
  const h = w * 2 / 3
  ctx.save()
  if (kind === 'globe') {
    const r = h / 2, cx = x + w / 2, cy = y + h / 2
    ctx.strokeStyle = color; ctx.lineWidth = Math.max(1.5, w * 0.07)
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.ellipse(cx, cy, r * 0.45, r, 0, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(cx - r, cy); ctx.lineTo(cx + r, cy); ctx.stroke()
    ctx.restore(); return
  }
  rr(ctx, x, y, w, h, w * 0.08); ctx.clip()
  if (kind === 'eu') {
    ctx.fillStyle = '#003399'; ctx.fillRect(x, y, w, h)
    ctx.fillStyle = '#FFCC00'
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, sx = x + w / 2 + Math.cos(a) * h * 0.33, sy = y + h / 2 + Math.sin(a) * h * 0.33; star(ctx, sx, sy, h * 0.055) }
  } else if (kind === 'us') {
    for (let i = 0; i < 13; i++) { ctx.fillStyle = i % 2 ? '#fff' : '#B22234'; ctx.fillRect(x, y + (h / 13) * i, w, h / 13 + 0.5) }
    ctx.fillStyle = '#3C3B6E'; ctx.fillRect(x, y, w * 0.4, h * 7 / 13)
    ctx.fillStyle = '#fff'; for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) { ctx.beginPath(); ctx.arc(x + w * 0.05 + c * w * 0.075, y + h * 0.07 + r * h * 0.12, w * 0.012, 0, Math.PI * 2); ctx.fill() }
  } else if (kind === 'jp') {
    ctx.fillStyle = '#fff'; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#BC002D'; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, h * 0.3, 0, Math.PI * 2); ctx.fill()
  }
  ctx.restore()
  ctx.save(); rr(ctx, x, y, w, h, w * 0.08); ctx.strokeStyle = 'rgba(0,0,0,.15)'; ctx.lineWidth = 1; ctx.stroke(); ctx.restore()
}
function star(ctx, cx, cy, r) { ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5, rr2 = i % 2 ? r * 0.45 : r; ctx.lineTo(cx + Math.cos(a) * rr2, cy + Math.sin(a) * rr2) } ctx.closePath(); ctx.fill() }

// Chip-at e pajisjes në dy rreshta: [seria, kapaciteti, kodi/versioni] dhe [gjendja, shënimet]
export function metaRows(d) {
  const code = (d.code || '').trim(), reg = (d.region || '').trim(), flag = reg && regionFlag(reg)
  const r1 = [], r2 = []
  if ((d.seriesBadge || '').trim()) r1.push({ text: d.seriesBadge.trim(), strong: true })
  if ((d.capacity || '').trim()) r1.push({ text: d.capacity.trim() })
  if (code || reg) r1.push({ flag, text: [code, reg && 'Modeli: ' + reg].filter(Boolean).join('  ·  ') })
  if ((d.condition || '').trim()) r2.push({ text: d.condition.trim() })
  if (d.noActive) r2.push({ dot: true, text: 'No Active' })
  for (const n of d.notes || []) if ((n || '').trim() && !/^no active$/i.test(n.trim())) r2.push({ dot: true, text: n.trim() })
  return [r1, r2].filter((r) => r.length)
}
export const hasMeta = (d) => metaRows(d).length > 0

/* Një rresht chip-ash. Kthen gjerësinë totale; me measure=true vetëm mat. */
export function metaRow(ctx, chips, x, y, sz, { color = '#111', bg = 'rgba(0,0,0,.06)', accent = '#E10600', align = 'left', maxW = 9999 } = {}, measure = false) {
  if (!chips.length) return 0
  ctx.save(); ctx.font = font('Montserrat', 700, sz)
  const h = sz * 1.9, fw = sz * 1.5, padX = sz * 0.7, gap = sz * 0.5
  const ws = chips.map((c) => padX * 2 + ctx.measureText(c.text).width + (c.flag ? fw + sz * 0.45 : 0) + (c.dot ? sz * 0.9 : 0))
  let tot = ws.reduce((a, b) => a + b, 0) + gap * (chips.length - 1)
  const k = Math.min(1, maxW / tot)
  if (measure) { ctx.restore(); return tot * k }
  ctx.translate(align === 'center' ? x - (tot * k) / 2 : x, y); ctx.scale(k, k)
  let cx = 0
  chips.forEach((c, i) => {
    rr(ctx, cx, 0, ws[i], h, h / 2); ctx.fillStyle = c.strong ? accent : bg; ctx.fill()
    let tx = cx + padX
    if (c.flag) { drawFlag(ctx, c.flag, tx, (h - fw * 2 / 3) / 2, fw, color); tx += fw + sz * 0.45 }
    if (c.dot) { ctx.beginPath(); ctx.arc(tx + sz * 0.3, h / 2, sz * 0.28, 0, Math.PI * 2); ctx.fillStyle = accent; ctx.fill(); tx += sz * 0.9 }
    ctx.fillStyle = c.strong ? '#fff' : color; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText(c.text, tx, h / 2 + 1)
    cx += ws[i] + gap
  })
  ctx.restore(); return tot * k
}

// Ngjyrat e disponueshme: pika + emri + diferenca e çmimit ("● Blu +50€")
export function colorsRow(ctx, d, x, y, sz, { color = '#111', align = 'left', maxW = 9999 } = {}, measure = false) {
  const cs = (d.colors || []).filter((c) => (c.name || '').trim() || c.hex)
  if (!cs.length) return 0
  ctx.save(); ctx.font = font('Montserrat', 600, sz)
  const lab = (c) => [(c.name || '').trim(), (c.delta || '').trim() && (/^[+-]/.test(c.delta.trim()) ? c.delta.trim() : '+' + c.delta.trim()).replace(/(\d)$/, '$1€')].filter(Boolean).join(' ')
  const ws = cs.map((c) => sz * 1.35 + ctx.measureText(lab(c)).width)
  const gap = sz * 1.1, tot = ws.reduce((a, b) => a + b, 0) + gap * (cs.length - 1), k = Math.min(1, maxW / tot)
  if (measure) { ctx.restore(); return tot * k }
  ctx.translate(align === 'center' ? x - (tot * k) / 2 : x, y); ctx.scale(k, k)
  let cx = 0
  cs.forEach((c, i) => {
    ctx.beginPath(); ctx.arc(cx + sz * 0.45, sz * 0.62, sz * 0.45, 0, Math.PI * 2); ctx.fillStyle = c.hex || '#888'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(128,128,128,.5)'; ctx.stroke()
    ctx.fillStyle = color; ctx.textBaseline = 'middle'; ctx.textAlign = 'left'; ctx.fillText(lab(c), cx + sz * 1.25, sz * 0.66)
    cx += ws[i] + gap
  })
  ctx.restore(); return tot * k
}
