// Recommendations only when a measured pattern maps to something the editor can actually do.
import { TEMPLATES } from '../templates/index.js'
import { FORMAT_LABEL } from './metrics.js'

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
      apply: { cta: bucket.cta.text },
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
    if (!String(draft?.offer || '').trim()) return null
    return item
  }
  if (item.id === 'price' && item.direction === 'show') {
    if (String(draft?.price || '').trim()) return { ...item, kind: 'keep', detail: 'Çmimi është i shkruar. Mbaje të dukshëm.' }
    return { ...item, kind: 'change', detail: 'Shkruaj çmimin te Detajet. Nuk vendoset vetë.' }
  }
  if (item.id === 'template' && draft?.template === item.apply?.tpl) return { ...item, kind: 'keep', apply: null, detail: 'Ky shabllon është tashmë i zgjedhur.' }
  if (item.id === 'cta' && String(draft?.cta || '').trim() === item.apply?.cta) return { ...item, kind: 'keep', apply: null, detail: 'Ky tekst është tashmë te butoni.' }
  if (item.id === 'cta' && !item.apply?.cta) return null
  return item
}

export function designAdvice(draft, report) {
  const format = draft?.type === 'story' ? 'story' : 'feed'
  const items = adviceItems(report).filter((item) => item.format === format).map((item) => tune(item, draft)).filter(Boolean)
  if (!items.length) return { ready: false, message: INSUFFICIENT, items: [] }
  return { ready: true, message: null, items }
}
