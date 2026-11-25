// Recommendations only when a measured pattern maps to something the editor can actually do.
import { TEMPLATES } from '../templates/index.js'
import { THEMES } from '../themes/themes.js'
import { FORMAT_LABEL } from './metrics.js'
import { categoryFromName } from './structured.js'
import { discountFromPrices } from './discount.js'

const templateName = (id) => TEMPLATES.find((t) => t.id === id)?.name || id

export const INSUFFICIENT = 'Nuk ka mjaft postime me statistika për një rekomandim. Duhet e njëjta formë (Postim, Reel ose Story) me të paktën 3 postime që e kanë tiparin dhe 3 që s’e kanë.'

function fromPatterns(bucket) {
  const items = []
  const where = FORMAT_LABEL[bucket.format] || bucket.format
  for (const p of bucket.patterns) {
    if (p.id === 'price_visible') {
      items.push({
        id: 'price',
        format: p.format,
        direction: p.better ? 'show' : 'hide',
        title: p.better ? 'Çmimi i dukshëm' : 'Çmimi në dizajn',
        detail: p.better ? 'Postimet me çmim të shkruar patën angazhim më të lartë.' : 'Postimet pa çmim të shkruar patën angazhim më të lartë.',
        reason: p.sentence,
        kind: p.better ? 'keep' : 'test',
        apply: null,
      })
    } else if (p.id === 'discount_badge' && p.better) {
      items.push({
        id: 'badge',
        format: p.format,
        title: 'Shenjë zbritjeje',
        detail: 'Kur ka ofertë reale, postimet me shenjë zbritjeje patën angazhim më të lartë.',
        reason: p.sentence,
        kind: 'keep',
        apply: null,
      })
    } else if (p.id === 'overcrowded' && !p.better) {
      items.push({
        id: 'clutter',
        format: p.format,
        title: 'Më pak ngarkesë',
        detail: 'Postimet që s’dukeshin të ngarkuara patën angazhim më të lartë.',
        reason: p.sentence,
        kind: 'change',
        apply: null,
      })
    } else if (p.id === 'simple_background' && p.better) {
      items.push({
        id: 'background',
        format: p.format,
        title: 'Sfond i thjeshtë',
        detail: 'Sfondi i thjeshtë u pa më shpesh te postimet me angazhim më të lartë.',
        reason: p.sentence,
        kind: 'keep',
        apply: null,
      })
    } else if (p.id === 'cta_visible' && p.better) {
      items.push({
        id: 'cta_presence',
        format: p.format,
        title: 'Thirrje për veprim',
        detail: 'Postimet me tekst veprimi patën angazhim më të lartë.',
        reason: p.sentence,
        kind: 'keep',
        apply: null,
      })
    } else if (p.id === 'specs_visible' && !p.better) {
      items.push({
        id: 'specs',
        format: p.format,
        title: 'Më pak tekst specifikimesh',
        detail: 'Postimet pa bllok specifikimesh patën angazhim më të lartë.',
        reason: p.sentence,
        kind: 'test',
        apply: null,
      })
    }
  }
  if (bucket.area?.higher) {
    items.push({
      id: 'area',
      format: bucket.format,
      title: 'Produkt i madh',
      detail: `Te postimet me angazhim më të lartë, produkti zinte rreth ${bucket.area.highArea}% të fotos.`,
      reason: bucket.area.sentence,
      kind: 'keep',
      apply: null,
    })
  }
  if (bucket.template) {
    const name = templateName(bucket.template.id)
    items.push({
      id: 'template',
      format: bucket.format,
      title: `Shablloni: ${name}`,
      detail: `${name} doli më shpesh te postimet mbi mesatare (${bucket.template.n} nga ${bucket.template.above}).`,
      reason: `Te ${where}, ky shabllon është më i shpeshtë te postimet mbi mesatare sesa te ato nën mesatare. Model i vërejtur, jo provë.`,
      kind: 'change',
      apply: { tpl: bucket.template.id },
    })
  }
  if (bucket.cta) {
    items.push({
      id: 'cta',
      format: bucket.format,
      title: `Teksti: ${bucket.cta.text}`,
      detail: `Ky tekst u përdor te ${bucket.cta.n} postime mbi mesataren.`,
      reason: `Te ${where}, «${bucket.cta.text}» është teksti që u përsërit te postimet mbi mesatare. Nuk është një frazë e sugjeruar jashtë të dhënave.`,
      kind: 'change',
      sampleSize: bucket.cta.above,
      apply: { cta: bucket.cta.text },
    })
  }
  if (bucket.theme && THEMES.some((t) => t.id === bucket.theme.id)) {
    items.push({
      id: 'theme',
      format: bucket.format,
      title: `Tema: ${bucket.theme.name}`,
      detail: `${bucket.theme.name} doli më shpesh te postimet mbi mesatare (${bucket.theme.n} nga ${bucket.theme.above}).`,
      reason: bucket.theme.sentence,
      kind: 'change',
      sampleSize: bucket.theme.above + bucket.theme.below,
      apply: { theme: bucket.theme.id },
    })
  }
  return items
}

export function adviceItems(report) {
  if (!report) return []
  return ['feed', 'reel', 'story'].flatMap((f) => fromPatterns({ format: f, ...(report.byFormat?.[f] || { patterns: [] }) }))
}

function tune(item, draft) {
  if (item.id === 'badge') {
    const calc = discountFromPrices(draft?.extra?.oldPrice ?? draft?.oldPrice, draft?.price, draft?.offer)
    if (String(draft?.offer || '').trim()) return item
    if (!calc.shown) return null
    return { ...item, kind: 'change', apply: { offer: `-${Math.round(calc.discount)}%` }, detail: `Zbritja e llogaritur nga çmimet është ${Math.round(calc.discount)}%. Nuk është një shifër e shpikur.` }
  }
  if (item.id === 'price' && item.direction === 'show') {
    if (String(draft?.price || '').trim()) return { ...item, kind: 'keep', detail: 'Çmimi është i shkruar. Mbaje të dukshëm.' }
    return { ...item, kind: 'change', detail: 'Shkruaj çmimin te Detajet. Nuk vendoset vetë.' }
  }
  if (item.id === 'template' && draft?.template === item.apply?.tpl) return { ...item, kind: 'keep', apply: null, detail: 'Ky shabllon është tashmë i zgjedhur.' }
  if (item.id === 'theme' && draft?.theme === item.apply?.theme) return { ...item, kind: 'keep', apply: null, detail: 'Kjo temë është tashmë e zgjedhur.' }
  if (item.id === 'cta' && String(draft?.cta || '').trim() === item.apply?.cta) return { ...item, kind: 'keep', apply: null, detail: 'Ky tekst është tashmë te butoni.' }
  if (item.id === 'cta' && !item.apply?.cta) return null
  return item
}

function bucketReady(bucket) {
  return Boolean(bucket && (bucket.patterns?.length || bucket.template || bucket.theme || bucket.cta || bucket.area))
}

export function designAdvice(draft, report) {
  const format = draft?.type === 'story' ? 'story' : 'feed'
  const category = categoryFromName(draft?.model)
  const exact = category ? report?.byCategory?.[format]?.[category] : null
  const exactReady = bucketReady(exact)
  const bucket = exactReady ? exact : (report?.byFormat?.[format] || { patterns: [] })
  const scope = exactReady ? 'category' : 'format'
  const items = fromPatterns({ format, ...bucket }).map((item) => tune({ ...item, scope, category: exactReady ? category : null, sampleSize: item.sampleSize ?? bucket.count ?? null }, draft)).filter(Boolean)
  const note = !exactReady && category
    ? `Nuk ka mjaft postime të kategorisë për një model të veçantë. Këto vijnë nga të gjitha postimet e këtij formati (${bucket.count || 0}).`
    : null
  if (!items.length) return { ready: false, message: INSUFFICIENT, items: [], scope, note }
  return { ready: true, message: null, items, scope, note }
}

/** Fields the editor may change. Anything not listed here stays as the user left it. */
export function advicePatch(item) {
  const apply = item?.apply
  if (!apply) return null
  const patch = {}
  if (apply.tpl) patch.tpl = apply.tpl
  if (apply.theme) patch.theme = apply.theme
  if (apply.cta) patch.cta = apply.cta
  if (apply.offer) patch.offer = apply.offer
  const keys = Object.keys(patch)
  return keys.length ? patch : null
}

export function withoutIgnored(items, ignored) {
  const hide = ignored || new Set()
  return (items || []).filter((item) => !hide.has(`${item.id}:${item.format}`))
}
