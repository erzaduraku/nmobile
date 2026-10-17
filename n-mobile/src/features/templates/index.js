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
import { SIZES, smartCase, normOffer } from './shared/blocks.js'
export { REGIONS } from './shared/meta.js'
export { SIZES, fmtPrice, specParts, smartCase, normOffer } from './shared/blocks.js'

export const TEMPLATES = [
  { id: 'hero', name: 'Hero i kuq', draw: hero },
  { id: 'red', name: 'E kuqe e plotë', draw: red },
  { id: 'studio', name: 'Studio', draw: studio },
  { id: 'catalog', name: 'Katalog i bardhë', draw: catalog },
  { id: 'bento', name: 'Bento', draw: bento },
  { id: 'offer2', name: 'Ofertë', draw: offer2 },
  { id: 'stock', name: 'Sot në stok', draw: stock },
  { id: 'diagonal', name: 'Diagonale', draw: diagonal },
  { id: 'detail', name: 'Detaj', draw: detail },
  { id: 'duo', name: 'Dy produkte', draw: duo },
  { id: 'pricehero', name: 'Çmimi si hero', draw: pricehero },
  { id: 'specsheet', name: 'Specifikime', draw: specsheet },
  { id: 'cards', name: 'Karta', draw: cards },
]

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
