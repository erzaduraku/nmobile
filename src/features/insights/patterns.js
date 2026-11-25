// Observed gaps only. A pattern is reported when each side has 3 posts and the rates differ by at least 15%.
import { accountAverage, pct, FORMAT_LABEL } from './metrics.js'
import { interactions } from '../posts/promote.js'
import { THEMES } from '../themes/themes.js'

export const MIN_SIDE = 3
export const MIN_GAP = 0.15
export const MIN_AREA = 6

const BOOLS = [
  ['price_visible', 'çmim të dukshëm'],
  ['old_and_new_price', 'çmim të vjetër dhe të ri'],
  ['discount_badge', 'shenjë zbritjeje'],
  ['cta_visible', 'thirrje për veprim'],
  ['specs_visible', 'specifikime të shkruara'],
  ['contact_visible', 'kontakt të dukshëm'],
  ['logo_visible', 'logo të dukshme'],
  ['product_recognizable', 'produkt të njohshëm'],
  ['multiple_products', 'më shumë se një produkt'],
  ['overcrowded', 'dizajn të ngarkuar'],
  ['simple_background', 'sfond të thjeshtë'],
]

function weighted(rows) {
  let reach = 0
  let sum = 0
  for (const r of rows) {
    const n = interactions(r.stats)
    if (n == null || !(r.stats?.reach > 0)) continue
    reach += r.stats.reach
    sum += n
  }
  if (!(reach > 0)) return null
  return sum / reach
}

function sentence(label, format, yes, no, rateYes, rateNo) {
  const where = FORMAT_LABEL[format] || format
  return `Te ${where}: në ${yes} postime me ${label}, angazhimi ishte ${pct(rateYes)} kundrejt ${pct(rateNo)} te ${no} postime pa të. Ky është një model i vërejtur, jo provë që e shkaktoi rezultatin.`
}

export function booleanPatterns(rows, format) {
  const out = []
  for (const [key, label] of BOOLS) {
    const yes = rows.filter((r) => r.features?.[key] === true)
    const no = rows.filter((r) => r.features?.[key] === false)
    if (yes.length < MIN_SIDE || no.length < MIN_SIDE) continue
    const rateYes = weighted(yes)
    const rateNo = weighted(no)
    if (rateYes == null || rateNo == null) continue
    const base = Math.max(rateYes, rateNo, 0.0001)
    if (Math.abs(rateYes - rateNo) / base < MIN_GAP) continue
    out.push({
      id: key,
      format,
      label,
      yes: yes.length,
      no: no.length,
      rateYes,
      rateNo,
      better: rateYes > rateNo,
      sentence: sentence(label, format, yes.length, no.length, rateYes, rateNo),
    })
  }
  return out
}

function median(list) {
  const a = [...list].sort((x, y) => x - y)
  return a[Math.floor((a.length - 1) / 2)]
}

export function areaPattern(rows, format) {
  const ready = rows.filter((r) => typeof r.features?.product_area_pct === 'number')
  if (ready.length < MIN_AREA) return null
  const sorted = [...ready].sort((a, b) => a.rate - b.rate)
  const mid = Math.floor(sorted.length / 2)
  const low = sorted.slice(0, mid)
  const high = sorted.slice(mid)
  const lowArea = median(low.map((r) => r.features.product_area_pct))
  const highArea = median(high.map((r) => r.features.product_area_pct))
  const base = Math.max(lowArea, highArea, 1)
  if (Math.abs(highArea - lowArea) / base < MIN_GAP) return null
  const where = FORMAT_LABEL[format] || format
  const higher = highArea > lowArea
  return {
    id: 'product_area',
    format,
    higher,
    highArea,
    lowArea,
    n: ready.length,
    sentence: higher
      ? `Te ${where}: te ${ready.length} postime, gjysma me angazhim më të lartë e ka produktin rreth ${highArea}% të fotos, kundrejt ${lowArea}% te gjysma tjetër. Model i vërejtur, jo shkak i provuar.`
      : `Te ${where}: te ${ready.length} postime, gjysma me angazhim më të lartë e ka produktin rreth ${highArea}% të fotos, më pak se gjysma tjetër (${lowArea}%). Model i vërejtur, jo shkak i provuar.`,
  }
}

export function colorPattern(rows, format) {
  const avg = accountAverage(rows)
  if (avg == null) return null
  const above = rows.filter((r) => r.rate >= avg && r.features?.dominant_colors?.length)
  if (above.length < MIN_SIDE) return null
  const counts = new Map()
  for (const r of above) {
    for (const hex of new Set(r.features.dominant_colors)) counts.set(hex, (counts.get(hex) || 0) + 1)
  }
  const colors = [...counts.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).slice(0, 4)
    .map(([hex, n]) => ({ hex, n }))
  if (!colors.length) return null
  const where = FORMAT_LABEL[format] || format
  const list = colors.map((c) => `${c.hex} (${c.n})`).join(', ')
  return {
    id: 'colors',
    format,
    colors,
    sentence: `Te ${where}, ngjyrat që shfaqen më shpesh te postimet mbi mesatare: ${list}. Kjo është shpeshti, jo provë që ngjyra solli më shumë pëlqime.`,
  }
}

export function templatePattern(rows, format) {
  const avg = accountAverage(rows)
  if (avg == null) return null
  const above = rows.filter((r) => r.features?.template && r.rate >= avg)
  const below = rows.filter((r) => r.features?.template && r.rate < avg)
  if (above.length < MIN_SIDE || below.length < MIN_SIDE) return null
  let best = null
  for (const id of new Set(above.map((r) => r.features.template))) {
    const n = above.filter((r) => r.features.template === id).length
    if (n < 2) continue
    const gap = n / above.length - below.filter((r) => r.features.template === id).length / below.length
    if (gap >= MIN_GAP && (!best || gap > best.gap)) best = { id, n, gap, above: above.length, below: below.length }
  }
  return best ? { ...best, format } : null
}

const THEME_IDS = new Set(THEMES.map((t) => t.id))

export function categoryOf(row) {
  const c = row?.features?.product_category
  if (c === 'iphone' || c === 'samsung' || c === 'smartphone' || c === 'accessory') return c
  return null
}

export function themePattern(rows, format) {
  const avg = accountAverage(rows)
  if (avg == null) return null
  const themed = (r) => r.features?.theme && THEME_IDS.has(r.features.theme)
  const above = rows.filter((r) => themed(r) && r.rate >= avg)
  const below = rows.filter((r) => themed(r) && r.rate < avg)
  if (above.length < MIN_SIDE || below.length < MIN_SIDE) return null
  let best = null
  for (const id of new Set(above.map((r) => r.features.theme))) {
    const yes = above.filter((r) => r.features.theme === id)
    if (yes.length < 2) continue
    const gap = yes.length / above.length - below.filter((r) => r.features.theme === id).length / below.length
    if (gap >= MIN_GAP && (!best || gap > best.gap)) {
      const others = rows.filter((r) => themed(r) && r.features.theme !== id)
      best = { id, n: yes.length, gap, above: above.length, below: below.length, rateYes: accountAverage(yes), rateNo: accountAverage(others) }
    }
  }
  if (!best || best.rateYes == null || best.rateNo == null) return null
  const name = THEMES.find((t) => t.id === best.id)?.name || best.id
  const where = FORMAT_LABEL[format] || format
  return {
    ...best,
    format,
    name,
    sentence: `Te ${where}, tema «${name}» u pa te ${best.n} nga ${best.above} postime mbi mesatare. Angazhimi i tyre ishte ${pct(best.rateYes)} kundrejt ${pct(best.rateNo)} te postimet me temë tjetër. Ky është një model i vërejtur, jo provë që tema e shkaktoi rezultatin.`,
  }
}

export function ctaPattern(rows, format) {
  const avg = accountAverage(rows)
  if (avg == null) return null
  const above = rows.filter((r) => r.rate >= avg && r.features?.cta_text)
  if (above.length < 2) return null
  const counts = new Map()
  for (const r of above) {
    const t = String(r.features.cta_text).trim()
    if (t) counts.set(t, (counts.get(t) || 0) + 1)
  }
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]
  if (!top || top[1] < 2) return null
  return { text: top[0], n: top[1], above: above.length, format }
}
