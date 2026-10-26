// Instagram caption generator.
// makeCaption(fields, themeId, variant, opts) -> text
//   opts.style: 'short' | 'detailed' | 'offer' | 'question' | 'pro' | 'bullets'
//   opts.price / opts.contact: include price / shop contact (phone, WhatsApp, address from shop_settings)
//   opts.tags: 'none' | 'basic' | 'extended'
//   variant: "Gjenero tjetër" – picks other phrase variants within the same style.
// Text is plain and professional (no emoji). Instagram limits are respected: <= 2200 characters, <= 30 hashtags.
import { themeById } from '../themes/themes.js'
import { normField } from './specFields.js'

export const CAPTION_STYLES = [
  { id: 'short', name: 'I shkurtër' },
  { id: 'detailed', name: 'I detajuar' },
  { id: 'offer', name: 'Ofertë' },
  { id: 'question', name: 'Pyetje' },
  { id: 'pro', name: 'Profesional' },
  { id: 'bullets', name: 'Me pika' },
]
export const HASHTAG_SETS = [['none', 'Pa'], ['basic', 'Bazë'], ['extended', 'Të shumta']]
export const DEFAULT_CAPTION_OPTS = { style: 'detailed', price: true, contact: true, tags: 'basic' }
export const IG_MAX_CHARS = 2200, IG_MAX_TAGS = 30
export const countTags = (t) => (String(t || '').match(/(^|\s)#[\p{L}\p{N}_]+/gu) || []).length

// ---- small helpers (kept local so this file does not depend on template internals)
const priceNum = (p) => { const s = String(p || '').replace(/[^\d.,]/g, '').replace(/\.(?=\d{3}\b)/g, '').replace(',', '.'); const n = parseFloat(s); return Number.isFinite(n) ? n : null }
const money = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace('.', ',')) + '€'
const fmt = (p) => { const n = priceNum(p); return n == null ? String(p || '').trim() : money(n) }
const t = (s) => String(s || '').trim()
const list = (a) => (a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' dhe ' + a[a.length - 1])
const tagify = (s) => '#' + String(s).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '')

const BRANDS = [
  [/iphone|apple|ipad/i, ['#iphone', '#apple', '#ios']],
  [/samsung|galaxy/i, ['#samsung', '#galaxy', '#android']],
  [/xiaomi|redmi|poco/i, ['#xiaomi', '#redmi', '#android']],
  [/huawei|honor/i, ['#huawei', '#android']],
  [/pixel|google/i, ['#googlepixel', '#pixel', '#android']],
  [/oneplus/i, ['#oneplus', '#android']],
  [/oppo|realme|vivo|motorola|nokia/i, ['#android']],
]
const COND = { 'I ri në pako': ['#telefonairi', '#ripako'], 'I ri pa pako': ['#telefonairi'], 'I përdorur': ['#teperdorur', '#telefonaiperdorur'], 'Si i ri': ['#siiri', '#teperdorur'] }

// ---- phrase banks (natural Kosovar Albanian, several variants each)
const OPEN = {
  short: [(m) => `${m}, tani në N Mobile.`, (m) => `Sapo erdhi: ${m}.`, (m) => `${m} të pret në N Mobile.`, (m) => `${m}, gati për ty.`],
  detailed: [(m) => `${m} tani në N Mobile.`, (m) => `Po kërkon ${m}? E ke te ne.`, (m) => `Njihu me ${m}.`, (m) => `${m} është në stok në N Mobile.`],
  offer: [(m) => `Ofertë speciale: ${m}`, (m) => `Çmim special për ${m}`, (m) => `${m} me çmim oferte`, (m) => `Mos e humb ofertën për ${m}`],
  question: [(m) => `A je gati për ${m}?`, (m) => `Kush e do ${m}?`, (m) => `${m} apo diçka tjetër? Na trego në komente.`, (m) => `Çka të pëlqen më shumë te ${m}?`],
  pro: [(m) => `Ju prezantojmë ${m}.`, (m) => `${m} tani është në dispozicion në N Mobile.`, (m) => `N Mobile ju ofron ${m}.`],
  bullets: [(m) => `${m}`, (m) => `${m} – në N Mobile`, (m) => `Në stok: ${m}`],
}
const PRICE = {
  short: [(p) => `Çmimi: ${p}`, (p) => `Vetëm ${p}.`, (p) => `${p} – merre sot.`],
  detailed: [(p) => `Çmimi: ${p}`, (p) => `Çmimi është vetëm ${p}.`, (p) => `E gjithë kjo për ${p}.`],
  question: [(p) => `Çmimi: ${p}`, (p) => `Dhe çmimi? Vetëm ${p}.`, (p) => `Sa mendon se kushton? Vetëm ${p}.`],
  pro: [(p) => `Çmimi: ${p}.`, (p) => `Çmimi i shitjes: ${p}.`],
}
const NO_PRICE = ['Për çmimin, na shkruani në DM.', 'Na shkruani në DM për çmimin.', 'Çmimin ta tregojmë në mesazh.']
const URGENCY = ['Oferta vlen deri sa të zgjasë stoku.', 'Sasia është e kufizuar, mos e lër për nesër.', 'Rezervoje sot, para se të mbarojë.', 'Kush vjen i pari, e merr.']
const CTA = {
  short: ['Na shkruani në DM.', 'Porosit me një mesazh.', 'Eja në dyqan.'],
  detailed: ['Na shkruani në DM ose ejani në dyqan.', 'Për porosi, na shkruani në DM.', 'Rezervoje me një mesazh.'],
  offer: ['Na shkruani në DM për ta rezervuar.', 'Porosit tani me një mesazh.', 'Eja në dyqan ose na shkruaj në DM.'],
  question: ['Shkruaj “INFO” në komente dhe të kontaktojmë.', 'Tago dikë që e meriton këtë telefon.', 'Na trego në komente çka mendon.'],
  pro: ['Për informata dhe porosi, na kontaktoni.', 'Jemi në dispozicion për çdo pyetje.', 'Për informata shtesë, na shkruani në DM.'],
  bullets: ['Porosi në DM', 'Na shkruani në DM', 'Rezervo me një mesazh'],
}

export function makeCaption(f = {}, themeId = 'standard', v = 0, opts = {}) {
  const o = { ...DEFAULT_CAPTION_OPTS, ...opts }
  const style = OPEN[o.style] ? o.style : 'detailed'
  const th = themeById(themeId) || themeById('standard')
  const pick = (a, k = 0) => a[(((v + k) % a.length) + a.length) % a.length]
  const specF = f.specF || {}, contact = f.contact || {}
  const m = [f.series, f.model].map(t).filter(Boolean).join(' ') || 'Telefoni'
  const storage = normField('storage', specF.storage) || t(f.capacity)
  const name = storage && !m.toLowerCase().includes(storage.toLowerCase()) ? `${m} ${storage}` : m
  const cond = t(f.condition)
  const showPrice = o.price && Boolean(t(f.price))
  const p = showPrice ? fmt(f.price) : ''
  const np = priceNum(f.price), nop = priceNum(f.oldPrice)
  const old = showPrice && t(f.oldPrice) && nop != null && np != null && nop > np ? fmt(f.oldPrice) : ''
  const save = old ? money(Math.round((nop - np) * 100) / 100) : ''
  const offer = t(f.offer)
  const specs = [
    ['RAM', normField('ram', specF.ram), (x) => `${x} RAM`],
    ['Memoria', storage, (x) => `${x} memorie`],
    ['Kamera', normField('camera', specF.camera), (x) => `kamerë ${x}`],
    ['Bateria', normField('battery', specF.battery), (x) => `bateri ${x}`],
    ['Ekrani', normField('screen', specF.screen), (x) => `ekran ${x}`],
  ].filter(([, x]) => x)
  const specExtra = t(specF.extra)
  const colors = (f.colors || []).map((c) => t(c?.name) + (t(c?.delta) ? ` (${t(c.delta)})` : '')).filter(Boolean)
  const lc = (x) => (/^[A-ZÇË]([a-zçë]|\s)/.test(x) ? x[0].toLowerCase() + x.slice(1) : x) // colour names inside a sentence
  const notes = (f.notes || []).map(t).filter(Boolean)
  const dev = [t(f.region) && 'Versioni: ' + t(f.region), t(f.code) && 'Kodi: ' + t(f.code), f.noActive && 'No Active (i paaktivizuar)'].filter(Boolean)
  const info = t(f.info), slogan = t(f.slogan), title = t(f.title)
  const seasonal = th.id !== 'standard' ? pick(th.titles || []) : ''
  const headline = title || seasonal

  const L = []
  const blank = () => { if (L.length && L[L.length - 1] !== '') L.push('') }
  const priceLine = (bank) => (showPrice ? pick(bank || PRICE.detailed, 1)(p) : pick(NO_PRICE, 1))

  if (style === 'short') {
    if (headline) L.push(headline)
    L.push(pick(OPEN.short)(name) + (cond ? ` ${cond}.` : ''))
    L.push(old ? `Nga ${old}, tani ${p}.` : priceLine(PRICE.short))
    L.push(pick(CTA.short, 2))
  } else if (style === 'detailed') {
    if (headline) L.push(headline, '')
    L.push(pick(OPEN.detailed)(name))
    if (slogan) L.push(slogan)
    if (specs.length || specExtra) { L.push('', 'Specifikat:'); for (const [l, x] of specs) L.push(`– ${l}: ${x}`); if (specExtra) L.push(`– ${specExtra}`) }
    const st = [cond && `Gjendja: ${cond}`, colors.length && `Ngjyrat: ${colors.join(', ')}`, notes.length && notes.join(', '), ...dev].filter(Boolean)
    if (st.length) { blank(); L.push(...st) }
    if (info) { blank(); L.push(info) }
    blank(); L.push(old ? `Çmimi: ${p} (më parë ${old})` : priceLine())
    if (offer) L.push(`Ofertë: ${offer} zbritje.`)
    L.push(pick(CTA.detailed, 2))
  } else if (style === 'offer') {
    L.push((headline ? headline + '\n' : '') + pick(OPEN.offer)(name))
    blank()
    if (showPrice) {
      if (old) L.push(`Më parë: ${old}`, `Tani: ${p}`, `Kurseni ${save}.`)
      else L.push(`Çmimi i ofertës: ${p}`)
    } else L.push(pick(NO_PRICE, 1))
    if (offer) L.push(`Zbritje: ${offer}`)
    if (cond || specs.length) L.push([cond, specs.slice(0, 3).map(([, x, fn]) => fn(x)).join(', ')].filter(Boolean).join(' · '))
    blank(); L.push(pick(URGENCY, 1), pick(CTA.offer, 2))
  } else if (style === 'question') {
    if (headline) L.push(headline, '')
    L.push(pick(OPEN.question)(name))
    const sp = specs.slice(0, 3).map(([, x, fn]) => fn(x))
    if (sp.length || cond) L.push([sp.length && `${sp.length > 1 ? 'Vjen me' : 'Ka'} ${list(sp)}.`, cond && `Gjendja: ${cond}.`].filter(Boolean).join(' '))
    if (colors.length > 1) L.push(`Në ngjyrat ${list(colors.map(lc))}. Cilën do ta zgjidhje?`)
    L.push(old ? `Nga ${old}, tani vetëm ${p}.` : priceLine(PRICE.question))
    blank(); L.push(pick(CTA.question, 2))
  } else if (style === 'pro') {
    if (headline) L.push(headline, '')
    L.push(pick(OPEN.pro)(name) + (slogan ? ' ' + slogan : ''))
    const sp = specs.map(([, x, fn]) => fn(x))
    if (sp.length) L.push(`Vjen me ${list(sp)}${specExtra ? ', ' + specExtra : ''}.`)
    const st = [cond && `Gjendja: ${cond}.`, colors.length && `Ngjyrat në dispozicion: ${list(colors.map(lc))}.`, notes.length && `${list(notes)}.`].filter(Boolean)
    if (st.length) L.push(st.join(' '))
    if (dev.length) L.push(dev.join(' · '))
    if (info) L.push(info)
    blank(); L.push(old ? `Çmimi: ${p} (më parë ${old}).` : priceLine(PRICE.pro))
    if (offer) L.push(`Zbritje: ${offer}.`)
    L.push(pick(CTA.pro, 2))
  } else { // bullets
    if (headline) L.push(headline, '')
    L.push(pick(OPEN.bullets)(name), '')
    const b = [
      cond && `Gjendja: ${cond}`,
      ...specs.map(([l, x]) => `${l}: ${x}`), specExtra,
      colors.length && `Ngjyrat: ${colors.join(', ')}`,
      notes.length && notes.join(', '), ...dev, info,
      showPrice ? (old ? `Çmimi: ${p} (më parë ${old})` : `Çmimi: ${p}`) : 'Çmimi: në DM',
      offer && `Zbritje: ${offer}`,
      pick(CTA.bullets, 2),
    ].filter(Boolean)
    for (const x of b) L.push('• ' + x)
  }

  // contact block (shop settings)
  if (o.contact) {
    const ph = t(contact.phone), wa = t(contact.whatsapp), ad = t(contact.address)
    const c = []
    if (wa && wa === ph) c.push(`Tel / WhatsApp: ${wa}`)
    else { if (wa) c.push(`WhatsApp: ${wa}`); if (ph) c.push(`Tel: ${ph}`) }
    if (ad) c.push(`Adresa: ${ad}`)
    if (c.length) {
      blank()
      if (style === 'short') L.push(['N Mobile', ...c].join(' · '))
      else if (style === 'bullets') { L.push('N Mobile'); for (const x of c) L.push('• ' + x) }
      else L.push('N Mobile', ...c)
    }
  }

  // hashtags
  let tags = []
  if (o.tags !== 'none') {
    const brand = BRANDS.filter(([r]) => r.test(m)).flatMap(([, x]) => x)
    const modelTag = tagify(m).length > 3 ? tagify(m) : ''
    tags = ['#nmobile', brand[0], modelTag, '#telefona', '#prizren', '#kosova']
    if (style === 'offer' || old || offer) tags.push('#oferta', '#zbritje')
    if (o.tags === 'extended') {
      tags.push(...brand.slice(1), ...(COND[cond] || []), ...(th.tags || []), storage && tagify(storage),
        '#smartphone', '#telefonaprizren', '#mobileshop', '#teknologji', '#prizreni', '#kosovo', '#shqiperi', '#albania')
    }
    tags = [...new Set(tags.filter((x) => x && x.length > 2))].slice(0, IG_MAX_TAGS)
  }
  let body = L.join('\n').replace(/\n{3,}/g, '\n\n').trim()
  let out = tags.length ? body + '\n\n' + tags.join(' ') : body
  while (out.length > IG_MAX_CHARS && tags.length) { tags.pop(); out = tags.length ? body + '\n\n' + tags.join(' ') : body }
  if (out.length > IG_MAX_CHARS) out = out.slice(0, IG_MAX_CHARS - 1).trimEnd() + '…'
  return out
}
