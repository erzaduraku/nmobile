import offer2 from './designs/offer2.js'
import stock from './designs/stock.js'
import diagonal from './designs/diagonal.js'
import detail from './designs/detail.js'
import duo from './designs/duo.js'
import pricehero from './designs/pricehero.js'
import specsheet from './designs/specsheet.js'
import cards from './designs/cards.js'
import hero from './designs/hero.js'
import red from './designs/red.js'
import studio from './designs/studio.js'
import catalog from './designs/catalog.js'
import bento from './designs/bento.js'
import { ovTitle, ovBar, ovMin, ovDeal, ovGlass } from './designs/mbifoto.js'
import { SIZES, smartCase, normOffer } from './shared/blocks.js'
export { REGIONS } from './shared/meta.js'
export { SIZES, fmtPrice, specParts, smartCase, normOffer } from './shared/blocks.js'

/* fields = optional inputs (Detajet step) that the design really draws; storyFields = drawn only in
   the Story format. Always drawn by every design (not listed): model, series, price, cta, contact.
   Keys: title, slogan, offer, oldPrice, badge (seriesBadge), meta (capacity, model code, region,
   No Active, condition, notes), spec, colors, info, photo2. Verified by rendering each field on/off. Keep in sync with designs/*.js. */
export const TEMPLATES = [
  { id: 'hero', name: 'Hero i kuq', draw: hero, fields: ['title', 'offer', 'oldPrice', 'slogan', 'meta', 'badge', 'spec', 'colors', 'info'] },
  { id: 'red', name: 'E kuqe e plotë', draw: red, fields: ['title', 'offer', 'oldPrice', 'slogan', 'meta', 'badge', 'spec', 'colors', 'info'] },
  { id: 'studio', name: 'Studio', draw: studio, fields: ['title', 'offer', 'oldPrice', 'slogan', 'meta', 'badge', 'spec', 'colors', 'info'] },
  { id: 'catalog', name: 'Katalog i bardhë', draw: catalog, fields: ['title', 'offer', 'oldPrice', 'slogan', 'meta', 'badge', 'spec', 'colors', 'info'] },
  { id: 'bento', name: 'Bento', draw: bento, fields: ['title', 'offer', 'oldPrice', 'slogan', 'meta', 'badge', 'spec', 'colors', 'info'] },
  { id: 'offer2', name: 'Ofertë', draw: offer2, fields: ['title', 'offer', 'oldPrice', 'spec'], storyFields: ['info'] },
  { id: 'stock', name: 'Sot në stok', draw: stock, fields: ['title', 'oldPrice'], storyFields: ['spec'] },
  { id: 'diagonal', name: 'Diagonale', draw: diagonal, fields: ['title', 'oldPrice', 'spec', 'info'] },
  { id: 'detail', name: 'Detaj', draw: detail, fields: ['title', 'oldPrice'] },
  { id: 'duo', name: 'Dy produkte', draw: duo, fields: ['title', 'oldPrice', 'photo2'] },
  { id: 'pricehero', name: 'Çmimi si hero', draw: pricehero, fields: ['title', 'offer', 'oldPrice', 'slogan', 'meta', 'badge', 'spec', 'colors', 'info'] },
  { id: 'specsheet', name: 'Specifikime', draw: specsheet, fields: ['title', 'oldPrice', 'badge', 'spec'], storyFields: ['meta'] },
  { id: 'cards', name: 'Karta', draw: cards, fields: ['title', 'offer', 'oldPrice', 'slogan', 'meta', 'badge', 'spec', 'colors', 'info'] },
  // "Mbi foto": the photo (as taken, e.g. in hand in the shop) fills the post and the text sits on top
  { id: 'ov-title', group: 'Mbi foto', name: 'Mbi foto · Titull', draw: ovTitle, fields: ['title', 'offer', 'oldPrice', 'meta', 'badge'] },
  { id: 'ov-bar', group: 'Mbi foto', name: 'Mbi foto · Shirit', draw: ovBar, fields: ['title', 'offer', 'oldPrice', 'meta', 'badge', 'spec'] },
  { id: 'ov-min', group: 'Mbi foto', name: 'Mbi foto · Minimal', draw: ovMin, fields: ['title', 'offer', 'oldPrice', 'meta', 'badge'] },
  { id: 'ov-deal', group: 'Mbi foto', name: 'Mbi foto · Ofertë', draw: ovDeal, fields: ['title', 'offer', 'oldPrice', 'spec'], storyFields: ['info'] },
  { id: 'ov-glass', group: 'Mbi foto', name: 'Mbi foto · Xham', draw: ovGlass, fields: ['title', 'offer', 'oldPrice', 'slogan', 'meta', 'badge', 'spec', 'colors', 'info'] },
]

export const ALWAYS_FIELDS = ['model', 'series', 'price', 'cta']
export function templateFields(tplId, type = 'post') {
  const t = TEMPLATES.find((x) => x.id === tplId) || TEMPLATES[0]
  return new Set([...ALWAYS_FIELDS, ...(t.fields || []), ...(type === 'story' ? t.storyFields || [] : [])])
}

export function renderTo(canvas, tplId, type, theme, data, scale = 1) {
  const { w, h } = SIZES[type]
  canvas.width = Math.round(w * scale); canvas.height = Math.round(h * scale)
  const ctx = canvas.getContext('2d')
  ctx.setTransform(scale, 0, 0, scale, 0, 0); ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'
  const tpl = TEMPLATES.find((x) => x.id === tplId) || TEMPLATES[0]
  const d = { ...data, model: smartCase(data.model), offer: normOffer(data.offer), spec: (data.spec || '').split(/\s*[|,;•]\s*/).map(smartCase).join(' | ') }
  ctx.save(); tpl.draw(ctx, w, h, d, theme); ctx.restore()
}

export async function fontsReady() {
  const list = ['400 20px "Montserrat"', '600 20px "Montserrat"', '700 20px "Montserrat"', '800 20px "Montserrat"', '900 20px "Montserrat"', '700 20px "Playfair Display"', 'italic 700 20px "Playfair Display"', '400 20px "Bebas Neue"', 'italic 800 20px "Barlow Condensed"', 'italic 700 20px "Barlow Condensed"', '600 20px "Barlow Condensed"', '500 20px "Inter"', '600 20px "Inter"']
  try { await Promise.all(list.map((f) => document.fonts.load(f, 'ABCëç€0'))); await document.fonts.ready } catch (e) {}
}
