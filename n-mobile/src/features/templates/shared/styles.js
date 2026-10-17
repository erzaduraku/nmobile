import { shade } from './blocks.js'
// Stile të gatshme për stack() te template-t e reja
export const onDark = (t, o = {}) => ({
  skip: { model: true, ...(o.skip || {}) }, align: o.align || 'left', model: { size: 10, color: '#fff' },
  slogan: { size: 28, color: 'rgba(255,255,255,.85)' }, meta: { size: 22 },
  spec: { mode: 'icons', size: o.specSize || 23, color: '#fff', icon: o.icon || shade(t.accent, 0.4), tile: 'rgba(255,255,255,.08)', gap: 0 },
  colors: { size: 22, color: 'rgba(255,255,255,.9)' },
  price: { size: o.price || 96, color: '#fff', f: 'Montserrat', strike: o.strike || t.accent }, info: { color: 'rgba(255,255,255,.85)', size: 25, icon: o.icon }, cta: { bg: o.ctaBg || t.accent, color: o.ctaFg || '#fff', size: 29 },
  kicker: o.kicker, kickerText: '#fff',
})
export const onLight = (t, o = {}) => ({
  skip: { model: true, ...(o.skip || {}) }, align: o.align || 'left', model: { size: 10, color: '#111' },
  slogan: { size: 28, color: '#555' }, meta: { size: 22 },
  spec: { mode: 'icons', size: o.specSize || 23, color: '#222', icon: t.accent, tile: o.tile || '#F2F2F2', gap: 0 },
  colors: { size: 22, color: '#333' },
  price: { size: o.price || 96, color: o.priceColor || '#111', f: 'Montserrat' }, info: { color: '#555', size: 25 }, cta: { bg: o.ctaBg || '#111', color: '#fff', size: 29 },
  kicker: o.kicker, kickerText: '#111',
})
