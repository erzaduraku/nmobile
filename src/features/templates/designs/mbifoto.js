import { drawLogo, drawDeco, font, rr, fit, wrapFit } from '../../../lib/canvas/draw.js'
import { slashPath, offerTag, specParts, shade, fmtPrice, ink } from '../shared/blocks.js'
import { metaRows, metaRow, colorsRow } from '../shared/meta.js'
import { safe, footer, contactItems, topTitle } from '../shared/kit.js'
import { fullPhoto, scrim, cornerScrim, softShadow, glass, seriesLine, bigName, subLine, priceText, pillText, ctaLink, specChips } from '../shared/overlay.js'

/* =============== MBI FOTO: fotoja e plotë si sfond, teksti sipër saj ===============
   Story: përmbajtja kryesore brenda 250px sipër / 340px poshtë (safe). */
const footH = (d, size = 24) => (contactItems(d).length ? size * 2.2 : 0)
const offerOf = (d) => (d.offer || '').trim()
// text on the theme colour: white, or near-black on light themes (e.g. gold)
const inkSoft = (c) => (ink(c) === '#fff' ? 'rgba(255,255,255,.75)' : 'rgba(0,0,0,.55)')

// 1. TITULL: emri i madh sipër në qendër, rreshti i detajeve, çmimi në pilulë të bardhë, ofertë si stiker
export function ovTitle(ctx, W, H, d, t) {
  const { st, M, top, bottom } = safe(W, H)
  const logoY = st ? 150 : 52, cx = W / 2, mw = W - 2 * M - 40
  const nz = st ? 112 : 96, pz = st ? 92 : 80
  let y = st ? top + 10 : logoY + 44 + 46
  const ttH = topTitle(ctx, d, cx, y, { style: 'label', align: 'center', z: st ? 24 : 22, maxW: mw, gap: 18, measure: true })
  const serH = seriesLine(ctx, d, cx, 0, { z: st ? 28 : 25, measure: true })
  const nmH = bigName(ctx, d, cx, 0, mw, nz, { align: 'center', measure: true })
  const subH = subLine(ctx, d, cx, 0, { z: st ? 24 : 22, maxW: mw, bars: 1, measure: true })
  const pm = priceText(ctx, d, 0, 0, pz, { measure: true, maxW: mw - pz })
  const ph = pz * 1.36, pw = pm.w + pz * 1.0
  const textBot = y + ttH + serH + nmH + (subH ? subH + 14 : 0) + 30 + ph
  const fh = footH(d), ctaH = (d.cta || '').trim() ? 76 : 0, botTop = bottom - fh - (fh ? 18 : 0) - ctaH
  const P = fullPhoto(ctx, W, H, d, t, { cx, cy: (textBot + botTop) / 2, w: W * 0.78, h: botTop - textBot - 60 })
  scrim(ctx, W, 0, textBot + 170, 'top', 0.6, P.lum(0, 0, W, textBot))
  scrim(ctx, W, botTop - 220, H, 'bottom', 0.5, P.lum(0, botTop - 120, W, H))
  drawDeco(ctx, W, H, t, 'front', true)
  drawLogo(ctx, cx, logoY, st ? 50 : 44, 'white', d.logo, 'center')
  y += topTitle(ctx, d, cx, y, { style: 'label', align: 'center', accent: t.accent, color: '#fff', z: st ? 24 : 22, maxW: mw, gap: 18 })
  y += seriesLine(ctx, d, cx, y, { z: st ? 28 : 25, align: 'center', maxW: mw })
  y += bigName(ctx, d, cx, y, mw, nz, { align: 'center' })
  if (subH) y += 14 + subLine(ctx, d, cx, y + 14, { z: st ? 24 : 22, maxW: mw, bars: t.accent, align: 'center' })
  y += 30
  // pilula e çmimit
  const px = cx - pw / 2
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12; rr(ctx, px, y, pw, ph, ph / 2); ctx.fillStyle = '#fff'; ctx.fill(); ctx.restore()
  priceText(ctx, d, cx, y + (ph - pm.h) / 2 - pz * 0.02, pz, { align: 'center', color: '#111', old: 'rgba(0,0,0,.42)', maxW: mw - pz })
  const of = offerOf(d)
  if (of) {
    const oz = st ? 34 : 30, om = pillText(ctx, of, 0, 0, oz, { measure: true, w: 900 })
    ctx.save(); ctx.translate(px + pw - om.w * 0.1, y + om.h * 0.08); ctx.rotate(-0.1)
    ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6
    pillText(ctx, of, -om.w / 2, -om.h / 2, oz, { bg: t.accent, fg: ink(t.accent), w: 900 }); ctx.restore()
  }
  // poshtë: CTA + kontakti
  if (ctaH) { const s = (d.cta || '').trim(); ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 20; pillText(ctx, s.toUpperCase(), cx, botTop, 26, { bg: t.accent, fg: ink(t.accent), align: 'center', track: 0.12, h: 60, padX: 1.4 }); ctx.restore() }
  footer(ctx, W, bottom, d, { color: '#fff', M })
}

// 2. SHIRIT: shirit xhami poshtë me emrin majtas dhe çmimin në bllok të kuq djathtas
export function ovBar(ctx, W, H, d, t) {
  const { st, M, top, bottom } = safe(W, H)
  const logoY = st ? 150 : 56
  const fh = footH(d), barBot = bottom - fh - (fh ? 16 : 0), barH = st ? 236 : 206, barY = barBot - barH
  const chipZ = st ? 25 : 23, chipH = specChips(ctx, d, M, 0, W - 2 * M, chipZ, { measure: true })
  const chipY = barY - (offerOf(d) ? 54 : 24) - chipH
  const zoneTop = st ? top + 90 : logoY + 110
  const P = fullPhoto(ctx, W, H, d, t, { cx: W / 2, cy: (zoneTop + chipY) / 2, w: W * 0.8, h: chipY - zoneTop - 30 })
  scrim(ctx, W, 0, st ? top + 200 : 300, 'top', 0.5, P.lum(0, 0, W, 260))
  scrim(ctx, W, (chipH ? chipY : barY) - 300, H, 'bottom', 0.62, P.lum(0, barY - 200, W, H))
  drawDeco(ctx, W, H, t, 'front', true)
  drawLogo(ctx, M, logoY, st ? 50 : 46, 'white', d.logo)
  if (st) topTitle(ctx, d, M, top + 10, { style: 'ribbon', accent: t.accent, color: ink(t.accent), z: 24, maxW: W - 2 * M })
  else topTitle(ctx, d, W - M, logoY + 2, { style: 'chip', align: 'right', accent: t.accent, color: ink(t.accent), z: 20, maxW: W - 2 * M - 330 })
  if (chipH) specChips(ctx, d, M, chipY, W - 2 * M, chipZ, { icon: '#fff' })
  // shiriti
  glass(ctx, W, H, P.img, M, barY, W - 2 * M, barH, 36, { tint: 'rgba(10,10,12,.58)' })
  const pad = 16, bw0 = priceText(ctx, d, 0, 0, st ? 84 : 76, { measure: true, maxW: 9999 }).w
  const bw = Math.max(st ? 330 : 300, Math.min(bw0 + 80, (W - 2 * M) * 0.5)), bx = W - M - pad - bw, by = barY + pad, bh = barH - pad * 2
  const g = ctx.createLinearGradient(bx, by, bx + bw, by + bh); g.addColorStop(0, t.accent); g.addColorStop(1, shade(t.accent, -0.3))
  rr(ctx, bx, by, bw, bh, 26); ctx.fillStyle = g; ctx.fill()
  const hasCta = (d.cta || '').trim()
  const pm = priceText(ctx, d, 0, 0, st ? 84 : 76, { measure: true, maxW: bw - 50 })
  const py = by + (bh - pm.h) / 2 - (hasCta ? 18 : 0)
  priceText(ctx, d, bx + bw / 2, py, st ? 84 : 76, { align: 'center', color: ink(t.accent), old: inkSoft(t.accent), maxW: bw - 50 })
  if (hasCta) ctaLink(ctx, d, bx + bw / 2, by + bh - 30, 19, { align: 'center', color: ink(t.accent) })
  // emri majtas
  const lx = M + 38, lw = bx - lx - 26
  const serH = seriesLine(ctx, d, lx, 0, { z: 21, measure: true }), nmH = bigName(ctx, d, lx, 0, lw, st ? 72 : 66, { lines: 2, min: 30, measure: true }), subH = subLine(ctx, d, lx, 0, { z: 18, maxW: lw, measure: true })
  let y = barY + (barH - serH - nmH - (subH ? subH + 10 : 0)) / 2
  y += seriesLine(ctx, d, lx, y, { z: 21, color: shade(t.accent, 0.55), maxW: lw })
  y += bigName(ctx, d, lx, y, lw, st ? 72 : 66, { lines: 2, min: 30 })
  if (subH) subLine(ctx, d, lx, y + 10, { z: 18, maxW: lw, color: 'rgba(255,255,255,.75)' })
  const of = offerOf(d)
  if (of) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 16; pillText(ctx, of, bx + bw - 4, barY - 30, 26, { bg: '#fff', fg: t.accent, align: 'right', w: 900 }); ctx.restore() }
  footer(ctx, W, bottom, d, { color: '#fff', M })
}

// 3. MINIMAL: vetëm logo e vogël, emri poshtë majtas dhe stiker i kuq rrethor me çmimin
export function ovMin(ctx, W, H, d, t) {
  const { st, M, top, bottom } = safe(W, H)
  const logoY = st ? 150 : 56, fh = footH(d, 22)
  const r = st ? 168 : 148, zb = bottom - fh - (fh ? 16 : 0)
  const scx = W - M - r, scy = zb - r
  const P = fullPhoto(ctx, W, H, d, t, { cx: W / 2, cy: (logoY + 100 + scy - r) / 2, w: W * 0.8, h: scy - r - logoY - 120 })
  cornerScrim(ctx, 0, 0, st ? 700 : 560, 0.3 + Math.max(0, P.lum(0, 0, 500, 300) - 120) / 400)
  scrim(ctx, W, 0, logoY + 190, 'top', 0.3, P.lum(0, 0, W, logoY + 80))
  scrim(ctx, W, scy - r - 260, H, 'bottom', 0.48, P.lum(0, scy - r, W, H))
  cornerScrim(ctx, 0, H, st ? 1000 : 860, 0.38)
  drawDeco(ctx, W, H, t, 'front', true)
  drawLogo(ctx, M, logoY, st ? 46 : 40, 'white', d.logo)
  topTitle(ctx, d, W - M, logoY + 4, { style: 'label', align: 'right', accent: t.accent, color: '#fff', z: st ? 22 : 19, maxW: W - 2 * M - 300 })
  // stikeri i çmimit
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.4)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 14
  const g = ctx.createLinearGradient(scx - r, scy - r, scx + r, scy + r); g.addColorStop(0, shade(t.accent, 0.12)); g.addColorStop(1, shade(t.accent, -0.32))
  ctx.beginPath(); ctx.arc(scx, scy, r, 0, Math.PI * 2); ctx.fillStyle = g; ctx.fill(); ctx.restore()
  ctx.save(); ctx.beginPath(); ctx.arc(scx, scy, r * 0.88, 0, Math.PI * 2); ctx.strokeStyle = 'rgba(255,255,255,.4)'; ctx.lineWidth = 2.5; ctx.setLineDash([2, 9]); ctx.lineCap = 'round'; ctx.stroke(); ctx.restore()
  const old = (d.price || '').trim() && (d.oldPrice || '').trim()
  const nd = { ...d, oldPrice: '' }, pz = st ? 96 : 86
  const pm = priceText(ctx, nd, 0, 0, pz, { measure: true, maxW: r * 1.5 })
  let py = scy - pm.h / 2 + (old ? 16 : 0)
  if (old) { ctx.save(); ctx.font = font('Montserrat', 700, 30); ctx.fillStyle = inkSoft(t.accent); ctx.textAlign = 'center'; const txt = fmtPrice(d.oldPrice); ctx.fillText(txt, scx, py - 18); const ow = ctx.measureText(txt).width; ctx.fillRect(scx - ow / 2 - 3, py - 29, ow + 6, 3); ctx.restore() }
  priceText(ctx, nd, scx, py, pz, { align: 'center', color: ink(t.accent), maxW: r * 1.5 })
  const of = offerOf(d)
  if (of) { ctx.save(); ctx.translate(scx - r * 0.62, scy - r * 0.78); ctx.rotate(-0.14); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 16; pillText(ctx, of, 0, 0, 28, { bg: '#fff', fg: t.accent, align: 'center', w: 900 }); ctx.restore() }
  // emri poshtë majtas
  const lw = scx - r - M - 30, hasCta = (d.cta || '').trim()
  const nz = st ? 84 : 76
  const nmH = bigName(ctx, d, M, 0, lw, nz, { lines: 3, upper: false, w: 800, min: 34, measure: true }), serH = seriesLine(ctx, d, M, 0, { z: 22, measure: true }), subH = subLine(ctx, d, M, 0, { z: 18, maxW: lw, measure: true })
  let y = zb - nmH - serH - (subH ? subH + 10 : 0) - (hasCta ? 66 : 0)
  y += seriesLine(ctx, d, M, y, { z: 22, maxW: lw })
  y += bigName(ctx, d, M, y, lw, nz, { lines: 3, upper: false, w: 800, min: 34 })
  if (subH) y += 10 + subLine(ctx, d, M, y + 10, { z: 18, maxW: lw, color: 'rgba(255,255,255,.85)' })
  if (hasCta) { ctx.fillStyle = t.accent; ctx.fillRect(M, y + 24, 54, 5); ctaLink(ctx, d, M + 72, y + 28, 22) }
  footer(ctx, W, bottom, d, { color: '#fff', M, size: 22 })
}

// 4. OFERTË: shirit diagonal i kuq në qoshe me zbritjen, brez i pjerrët poshtë me çmimin
export function ovDeal(ctx, W, H, d, t) {
  const { st, M, top, bottom } = safe(W, H)
  const logoY = st ? 150 : 56, fh = footH(d)
  let y0 = bottom - fh - (fh ? 22 : 0)
  const info = st && (d.info || '').trim(), infoH = info ? 52 : 0
  const bandH = st ? 168 : 150, bandY = y0 - infoH - bandH
  const mw = W - 2 * M
  const nz = st ? 96 : 84
  const nmH = bigName(ctx, d, M, 0, mw, nz, { measure: true }), serH = seriesLine(ctx, d, M, 0, { z: 24, measure: true })
  const sp = specParts(d.spec), spH = sp.length ? 50 : 0
  const textTop = bandY - 26 - nmH - serH - spH
  const zoneTop = st ? top + 80 : logoY + 120
  const P = fullPhoto(ctx, W, H, d, t, { cx: W / 2, cy: (zoneTop + textTop) / 2, w: W * 0.78, h: textTop - zoneTop - 30 })
  scrim(ctx, W, 0, st ? top + 180 : 300, 'top', 0.48, P.lum(0, 0, W, 260))
  scrim(ctx, W, textTop - 260, H, 'bottom', 0.66, P.lum(0, textTop, W, H))
  drawDeco(ctx, W, H, t, 'front', true)
  drawLogo(ctx, M, logoY, st ? 50 : 46, 'white', d.logo)
  topTitle(ctx, d, M, st ? top + 6 : logoY + 78, { style: 'label', accent: t.accent, color: '#fff', z: st ? 24 : 21, maxW: W * 0.55 })
  // shiriti diagonal
  const lab = offerOf(d) || 'OFERTË'
  if (!st) {
    ctx.save(); ctx.translate(W, 0); ctx.rotate(Math.PI / 4)
    const bh = 92, off = 250
    ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 8
    const g = ctx.createLinearGradient(0, off, 0, off + bh); g.addColorStop(0, shade(t.accent, 0.1)); g.addColorStop(1, shade(t.accent, -0.25))
    ctx.fillStyle = g; ctx.fillRect(-500, off, 1000, bh); ctx.shadowColor = 'transparent'
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fillRect(-500, off + 8, 1000, 2); ctx.fillRect(-500, off + bh - 10, 1000, 2)
    ctx.fillStyle = ink(t.accent); fit(ctx, lab, 'Montserrat', 900, 50, 300, 24); ctx.letterSpacing = '2px'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(lab, 0, off + bh / 2 + 2)
    ctx.restore()
  } else offerTag(ctx, lab, W - M, top + 4, 82, t.accent, ink(t.accent), 'right')
  // teksti
  let y = textTop
  y += seriesLine(ctx, d, M, y, { z: 24, maxW: mw })
  y += bigName(ctx, d, M, y, mw, nz)
  if (sp.length) {
    ctx.save(); ctx.font = font('Montserrat', 600, 26); ctx.letterSpacing = '3px'; ctx.textBaseline = 'middle'; softShadow(ctx, 0.5)
    const parts = sp.slice(0, 4).map((s) => s.toUpperCase()), dot = 30
    let tot = parts.reduce((a, s) => a + ctx.measureText(s).width, 0) + dot * (parts.length - 1); const k = Math.min(1, mw / tot)
    ctx.translate(M, y + 30); ctx.scale(k, k); let x = 0
    parts.forEach((s, i) => { ctx.fillStyle = 'rgba(255,255,255,.92)'; ctx.fillText(s, x, 0); x += ctx.measureText(s).width; if (i < parts.length - 1) { ctx.fillStyle = t.accent; ctx.beginPath(); ctx.arc(x + dot / 2 - 1, 0, 5, 0, Math.PI * 2); ctx.fill(); x += dot } })
    ctx.restore()
  }
  // brezi i pjerrët
  const pz = st ? 108 : 96, pm = priceText(ctx, d, 0, 0, pz, { measure: true, maxW: W * 0.62, oldSide: 'right' })
  const hasCta = (d.cta || '').trim()
  const cm = hasCta ? pillText(ctx, d.cta.trim().toUpperCase(), 0, 0, 24, { measure: true, track: 0.1, h: 64, padX: 1.1 }) : { w: 0 }
  const bandW = Math.min(W - (hasCta ? cm.w + M + 30 : M), Math.max(W * 0.5, M + pm.w + 70 + bandH * 0.24))
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 30; ctx.shadowOffsetY = 10
  slashPath(ctx, -bandH * 0.24 - 20, bandY, bandW + 20, bandH); const g = ctx.createLinearGradient(0, bandY, bandW, bandY + bandH); g.addColorStop(0, t.accent); g.addColorStop(1, shade(t.accent, -0.28)); ctx.fillStyle = g; ctx.fill(); ctx.restore()
  priceText(ctx, d, M, bandY + (bandH - pm.h) / 2 - 4, pz, { color: ink(t.accent), old: inkSoft(t.accent), maxW: W * 0.62, oldSide: 'right' })
  if (hasCta) { ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.3)'; ctx.shadowBlur = 18; pillText(ctx, d.cta.trim().toUpperCase(), W - M, bandY + (bandH - 64) / 2, 24, { bg: '#fff', fg: t.accent, align: 'right', track: 0.1, h: 64, padX: 1.1 }); ctx.restore() }
  if (info) { ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.9)'; softShadow(ctx, 0.5); fit(ctx, info, 'Montserrat', 600, 26, mw, 16); ctx.fillText(info, M, bandY + bandH + 40); ctx.restore() }
  footer(ctx, W, bottom, d, { color: '#fff', M })
}

// 5. XHAM: kartë xhami e turbullt poshtë me të gjitha detajet
export function ovGlass(ctx, W, H, d, t) {
  const { st, M, top, bottom } = safe(W, H)
  const logoY = st ? 150 : 54, fh = footH(d), cx = W / 2
  const PAD = 40, cw = W - 2 * M, iw = cw - PAD * 2, ix = M + PAD
  const nz = st ? 70 : 60
  const slog = (d.slogan || '').trim(), info = (d.info || '').trim(), rows = joinRows(ctx, metaRows(d), iw), cols = (d.colors || []).filter((c) => (c.name || '').trim() || c.hex)
  const sl = slog ? wrapFit(ctx, slog, 'Montserrat', 500, 26, iw, 2, 18) : null
  const parts = []
  const add = (h, fn, gap = 14) => parts.push({ h, fn, gap })
  if ((d.series || '').trim()) add(seriesLine(ctx, d, 0, 0, { z: 22, measure: true }), (y) => seriesLine(ctx, d, ix, y, { z: 22, color: shade(t.accent, 0.55), maxW: iw }), 0)
  add(bigName(ctx, d, ix, 0, iw, nz, { lines: 2, upper: false, w: 800, min: 34, measure: true }), (y) => bigName(ctx, d, ix, y, iw, nz, { lines: 2, upper: false, w: 800, min: 34 }), 6)
  if (sl) add(sl.size * 1.25 * sl.lines.length, (y) => { ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = font('Montserrat', 500, sl.size); sl.lines.forEach((l, i) => ctx.fillText(l, ix, y + sl.size * 0.95 + i * sl.size * 1.25)); ctx.restore() }, 8)
  rows.forEach((r) => add(20 * 1.9, (y) => metaRow(ctx, r, ix, y, 20, { color: '#fff', bg: 'rgba(255,255,255,.14)', accent: t.accent, maxW: iw }), 10))
  const chH = specChips(ctx, d, ix, 0, iw, 21, { measure: true })
  if (chH) add(chH, (y) => specChips(ctx, d, ix, y, iw, 21, { bg: 'rgba(0,0,0,.22)', icon: shade(t.accent, 0.45) }), 14)
  if (cols.length) add(26, (y) => colorsRow(ctx, d, ix, y, 21, { color: 'rgba(255,255,255,.92)', maxW: iw }), 14)
  if (info) add(34, (y) => { ctx.save(); ctx.fillStyle = 'rgba(255,255,255,.85)'; fit(ctx, info, 'Montserrat', 600, 23, iw, 14); ctx.fillText(info, ix, y + 26); ctx.restore() }, 10)
  const pz = st ? 88 : 80, hasCta = (d.cta || '').trim()
  const cm = hasCta ? pillText(ctx, d.cta.trim().toUpperCase(), 0, 0, 22, { measure: true, track: 0.1, h: 62, padX: 1.1 }) : { w: 0 }
  const of = offerOf(d), om = of ? pillText(ctx, of, 0, 0, 24, { measure: true, w: 900, h: 50 }) : { w: 0 }
  const pmW = iw - cm.w - (of ? om.w + 20 : 0) - 30
  const pm = priceText(ctx, d, 0, 0, pz, { measure: true, maxW: pmW, oldSide: 'right' })
  const prH = Math.max(pm.h, 62)
  add(prH + 30, (y) => {
    ctx.fillStyle = 'rgba(255,255,255,.18)'; ctx.fillRect(ix, y, iw, 2)
    const py = y + 30
    const r = priceText(ctx, d, ix, py + (prH - pm.h) / 2, pz, { color: '#fff', old: 'rgba(255,255,255,.65)', maxW: pmW, oldSide: 'right' })
    if (of) pillText(ctx, of, ix + r.w + 20, py + (prH - 50) / 2 - 4, 24, { bg: t.accent, fg: ink(t.accent), w: 900, h: 50 })
    if (hasCta) pillText(ctx, d.cta.trim().toUpperCase(), ix + iw, py + (prH - 62) / 2, 22, { bg: '#fff', fg: '#111', align: 'right', track: 0.1, h: 62, padX: 1.1 })
  }, 18)
  let ch = PAD * 2 + parts.reduce((a, p, i) => a + p.h + (i ? p.gap : 0), 0)
  const cardBot = bottom - fh - (fh ? 16 : 0), cardY = cardBot - ch
  const ttH = topTitle(ctx, d, cx, 0, { style: 'chip', z: st ? 22 : 20, measure: true, gap: 0 })
  const zoneTop = (st ? top : logoY + 70) + ttH
  const P = fullPhoto(ctx, W, H, d, t, { cx, cy: (zoneTop + cardY) / 2, w: W * 0.8, h: cardY - zoneTop - 40 })
  scrim(ctx, W, 0, st ? top + 160 : 260, 'top', 0.45, P.lum(0, 0, W, 240))
  scrim(ctx, W, cardY - 160, H, 'bottom', 0.42, P.lum(0, cardY, W, H))
  drawDeco(ctx, W, H, t, 'front', true)
  drawLogo(ctx, cx, logoY, st ? 50 : 44, 'white', d.logo, 'center')
  topTitle(ctx, d, cx, st ? top : logoY + 70, { style: 'chip', align: 'center', accent: t.accent, color: ink(t.accent), z: st ? 22 : 20, maxW: W - 2 * M })
  ctx.save(); ctx.shadowColor = 'rgba(0,0,0,.35)'; ctx.shadowBlur = 50; ctx.shadowOffsetY = 16; rr(ctx, M, cardY, cw, ch, 40); ctx.fillStyle = 'rgba(0,0,0,.2)'; ctx.fill(); ctx.restore()
  glass(ctx, W, H, P.img, M, cardY, cw, ch, 40, { tint: P.img ? 'rgba(14,14,18,.52)' : 'rgba(255,255,255,.08)' })
  let y = cardY + PAD
  parts.forEach((p, i) => { if (i) y += p.gap; p.fn(y); y += p.h })
  footer(ctx, W, bottom, d, { color: '#fff', M })
}

// Both chip rows on one line when they fit (keeps the glass card low, away from the product)
function joinRows(ctx, rows, w) {
  if (rows.length < 2) return rows
  const one = [...rows[0], ...rows[1]]
  return metaRow(ctx, one, 0, 0, 20, {}, true) <= w ? [one] : rows
}
