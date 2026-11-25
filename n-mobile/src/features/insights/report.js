// Ties one post's Instagram stats to its design facts and any cached photo analysis.
import { latestPosted } from '../posts/limits.js'
import { pickPromote, MAX_AGE_D } from '../posts/promote.js'
import { TEMPLATES } from '../templates/index.js'
import { validateVision } from './schema.js'
import { structuredFeatures } from './structured.js'
import { mergeFeatures } from './merge.js'
import { mediaFormat, FORMAT_LABEL, comparable, accountAverage, scoreRate, bestAndWeakest, pct, saveShareRate } from './metrics.js'
import { booleanPatterns, areaPattern, colorPattern, templatePattern, ctaPattern } from './patterns.js'
import { adviceItems } from './recommend.js'

const POSTED_SKIP = new Set(['draft', 'exported', 'scheduled', 'publishing', 'failed'])

export function isPosted(post) {
  if (!post) return false
  if (post.igOnly) return true
  if (POSTED_SKIP.has(post.status)) return false
  if (!(post.ig_media_id || post.ig_permalink)) return false
  return post.status == null || post.status === 'posted'
}

export function matchAnalysis(post, analyses) {
  const list = analyses || []
  return list.find((a) => post?.id && a.post_id === post.id)
    || list.find((a) => post?.ig_media_id && a.media_id && String(a.media_id) === String(post.ig_media_id))
    || null
}

function featuresFor(post, analyses) {
  const analysis = matchAnalysis(post, analyses)
  const vision = analysis?.features ? validateVision(analysis.features) : null
  const structured = structuredFeatures(post)
  return { analysis, ...mergeFeatures(structured, vision) }
}

export function buildReport(posts, analyses = [], now = Date.now()) {
  const posted = latestPosted((posts || []).filter(isPosted))
  const rows = []
  for (const post of posted) {
    const base = comparable(post, now)
    if (!base) continue
    rows.push({ ...base, ...featuresFor(post, analyses) })
  }
  const byFormat = {}
  for (const format of ['feed', 'reel', 'story']) {
    const group = rows.filter((r) => r.format === format)
    const avg = accountAverage(group)
    const ranked = bestAndWeakest(group)
    byFormat[format] = {
      count: group.length,
      avg,
      patterns: booleanPatterns(group, format),
      area: areaPattern(group, format),
      colors: colorPattern(group, format),
      template: templatePattern(group, format),
      cta: ctaPattern(group, format),
      best: ranked.best,
      weakest: ranked.weakest,
    }
  }
  const report = { rows, byFormat, now }
  report.advice = adviceItems(report)
  report.thin = !report.advice.length
  return report
}

const LABELS = {
  product_category: 'Kategoria',
  product_visibility: 'Dukshmëria e produktit',
  product_position: 'Pozicioni',
  product_area_pct: 'Sa zë produkti',
  product_recognizable: 'Produkt i njohshëm',
  multiple_products: 'Më shumë se një produkt',
  dominant_colors: 'Ngjyrat kryesore',
  contrast: 'Kontrasti',
  background_type: 'Sfondi',
  composition: 'Kompozimi',
  whitespace: 'Hapësira bosh',
  clarity: 'Qartësia',
  overcrowded: 'I ngarkuar',
  price_visible: 'Çmim i dukshëm',
  old_and_new_price: 'Çmim i vjetër dhe i ri',
  discount_badge: 'Shenjë zbritjeje',
  cta_visible: 'Thirrje për veprim',
  specs_visible: 'Specifikime',
  contact_visible: 'Kontakt',
  text_density: 'Dendësia e tekstit',
  logo_visible: 'Logo',
  simple_background: 'Sfond i thjeshtë',
}

const SOURCE = { design: 'nga dizajni', vision: 'nga fotoja', name: 'nga emri i produktit' }

const VALUE = {
  high: 'e lartë', medium: 'mesatare', low: 'e ulët', unknown: 'e panjohur',
  center: 'në qendër', left: 'majtas', right: 'djathtas', top: 'lart', bottom: 'poshtë',
  strong: 'i fortë', weak: 'i dobët',
  plain: 'i thjeshtë', gradient: 'gradient', shop: 'dyqan', lifestyle: 'lifestyle', photo: 'foto',
  balanced: 'i balancuar', 'product-heavy': 'produkti dominon', 'text-heavy': 'teksti dominon',
  sharp: 'e mprehtë', acceptable: 'e pranueshme', poor: 'e dobët',
  smartphone: 'telefon', iphone: 'iPhone', samsung: 'Samsung', accessory: 'aksesor', other: 'tjetër',
}

function showValue(key, value) {
  if (typeof value === 'boolean') return value ? 'po' : 'jo'
  if (key === 'product_area_pct') return value + '%'
  if (key === 'dominant_colors') return value.join(', ')
  return VALUE[value] || String(value)
}

export function featureLines(features, sources) {
  if (!features) return []
  const lines = []
  for (const [key, label] of Object.entries(LABELS)) {
    const value = features[key]
    if (value == null || value === 'unknown' || (Array.isArray(value) && !value.length)) continue
    const src = sources?.[key] ? ` (${SOURCE[sources[key]] || sources[key]})` : ''
    lines.push({ key, text: `${label}: ${showValue(key, value)}${src}` })
  }
  if (features.template) {
    const name = TEMPLATES.find((t) => t.id === features.template)?.name || features.template
    lines.unshift({ key: 'template', text: `Shablloni: ${name} (nga dizajni)` })
  }
  if (features.cta_text) lines.push({ key: 'cta_text', text: `Teksti i butonit: ${features.cta_text} (nga dizajni)` })
  return lines
}

function limitsFor(post, comp, cohortSize) {
  const limits = []
  const stats = post?.ig_stats
  if (!stats) limits.push('Nuk ka statistika të Instagramit për këtë postim.')
  else if (comp == null && !(stats.reach > 0)) limits.push('Nuk ka arritje, ndaj angazhimi nuk llogaritet.')
  else if (comp == null && stats.reach < 50) limits.push('Arritja është nën 50, ndaj nuk futet në krahasim.')
  else if (comp == null) limits.push('Postimi është më i ri se 24 orë. Statistikat mund të ndryshojnë ende.')
  if (cohortSize < 3) limits.push('Duhen të paktën 3 postime të së njëjtës formë me statistika për një notë.')
  if (comp && comp.ageH > MAX_AGE_D * 24) limits.push('Postimi është më i vjetër se 30 ditë, ndaj nuk propozohet për promovim.')
  if (!post?.ig_stats?.fetched_at && post?.ig_media_id) limits.push('Statistikat nuk janë rifreskuar ende.')
  return limits
}

export function describePost(post, report, analyses = [], now = Date.now()) {
  const format = mediaFormat(post)
  const bucket = report?.byFormat?.[format]
  const { features, sources, analysis } = featuresFor(post, analyses)
  const comp = comparable(post, now)
  const cohort = report?.rows?.filter((r) => r.format === format) || []
  const score = comp ? scoreRate(comp.rate, cohort) : null
  const avg = bucket?.avg ?? null
  const observations = []
  if (comp && avg != null) {
    const rel = avg > 0 ? comp.rate / avg : null
    if (rel != null && rel >= 1.2) observations.push(`Angazhimi ${pct(comp.rate)} është ${rel.toFixed(1).replace('.', ',')}× mbi mesataren e formatit ${FORMAT_LABEL[format]} (${pct(avg)}).`)
    else if (comp.rate < avg) observations.push(`Angazhimi ${pct(comp.rate)} është nën mesataren e formatit ${FORMAT_LABEL[format]} (${pct(avg)}).`)
    else observations.push(`Angazhimi ${pct(comp.rate)} është afër mesatares së formatit ${FORMAT_LABEL[format]} (${pct(avg)}).`)
  }
  for (const p of bucket?.patterns || []) {
    const value = features[p.id]
    if (value == null) continue
    const side = value === true
    const aligned = side === p.better
    observations.push(aligned
      ? `Përputhet me një model të postimeve më të angazhuara: ${p.label}.`
      : `Nuk përputhet me modelin e postimeve më të angazhuara (${p.label}).`)
  }
  if (bucket?.area && typeof features.product_area_pct === 'number') {
    observations.push(`Produkti zë rreth ${features.product_area_pct}% të fotos. Te gjysma me angazhim më të lartë kjo ishte rreth ${bucket.area.highArea}%.`)
  }
  const label = score == null ? null : score >= 7 ? 'Performancë e mirë' : score >= 4 ? 'Performancë mesatare' : 'Performancë e dobët'
  return {
    format,
    formatLabel: FORMAT_LABEL[format],
    score,
    label,
    rate: comp?.rate ?? null,
    saveShare: comp?.saveShare ?? saveShareRate(post?.ig_stats, format),
    avg,
    features,
    sources,
    lines: featureLines(features, sources),
    observations,
    limits: limitsFor(post, comp, cohort.length),
    analysis,
    visionMissing: !analysis,
    best: bucket?.best?.post?.id === post.id,
    weakest: bucket?.weakest?.post?.id === post.id,
  }
}

/** Promotion block for one post, using pickPromote unchanged for the decision. */
export function promotionFor(post, posts, now = Date.now()) {
  const promo = pickPromote((posts || []).filter(isPosted), now)
  const comp = comparable(post, now)
  if (promo?.id === post.id) return { worth: true, reason: promo.reason, rate: promo.rate, avg: promo.avg }
  const limits = []
  if (!comp) limits.push('Nuk plotëson kushtet e krahasimit (të paktën 24 orë dhe arritje 50).')
  else if (comp.ageH > MAX_AGE_D * 24) limits.push('Është më i vjetër se 30 ditë.')
  else if (promo) limits.push('Një postim tjetër e kalon mesataren më shumë.')
  else limits.push('Nuk e kalon pragun: 20% mbi mesatare kur ka disa postime, ose 5% kur ka vetëm një.')
  return { worth: false, reason: limits[0], rate: comp?.rate ?? null, avg: promo?.avg ?? null, limits }
}
