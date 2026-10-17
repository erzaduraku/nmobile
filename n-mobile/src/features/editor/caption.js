const BRANDS = [
  [/iphone|apple|ipad/i, ['#iphone', '#apple', '#ios']],
  [/samsung|galaxy/i, ['#samsung', '#galaxy']],
  [/xiaomi|redmi|poco/i, ['#xiaomi', '#redmi']],
  [/huawei|honor/i, ['#huawei']],
  [/pixel|google/i, ['#googlepixel', '#pixel']],
  [/oneplus/i, ['#oneplus']],
  [/oppo|realme|vivo|motorola|nokia/i, ['#android']],
]
import { themeById } from '../themes/themes.js'
const MID = [
  (m, p) => `${m} tani me vetëm ${p}!`,
  (m, p) => `Merre ${m} me çmimin ${p}.`,
  (m, p) => `${m} – cilësi, stil dhe performancë për vetëm ${p}.`,
  (m, p) => `Çmimi për ${m}: ${p}`,
]
const NOPRICE = [
  (m) => `${m} – tani në N Mobile!`,
  (m) => `${m} është gati për ty. Na shkruani për çmimin!`,
  (m) => `${m} – cilësi, stil dhe performancë.`,
]
const CTA = ['Na shkruaj në DM!', 'Eja në dyqan, sasia është e kufizuar!', 'Garanci dhe shërbim i besueshëm.', 'Rezervoje sot, para se të mbarojë!']

import { captionSpecs } from './specFields.js'
import { fmtPrice } from '../templates/shared/blocks.js'
export function makeCaption({ model, price, offer, specF = {}, info, code, region, noActive, series, capacity, oldPrice, colors = [], condition, notes = [], slogan, contact = {} }, themeId = 'standard', v = 0) {
  const th = themeById(themeId), T = { open: th.titles, tags: th.tags }
  const pick = (a, k = 0) => a[(v + k) % a.length]
  const m = [series, model, capacity].map((x) => (x || '').trim()).filter(Boolean).join(' ') || 'Telefoni'
  const hasPrice = Boolean((price || '').trim())
  const p = hasPrice ? fmtPrice(price) : ''
  const lines = [pick(T.open), '', hasPrice ? pick(MID, 2)(m, p) : pick(NOPRICE, 2)(m)]
  if ((slogan || '').trim()) lines.push(slogan.trim())
  if (hasPrice && (oldPrice || '').trim()) lines.push(`💥 Nga ${fmtPrice(oldPrice)} vetëm ${p}`)
  const sp = captionSpecs(specF)
  if (sp.length) lines.push('', '📱 ' + sp.join(' | '))
  const cs = colors.filter((c) => (c.name || '').trim())
  if (cs.length) lines.push('🎨 Ngjyrat: ' + cs.map((c) => c.name.trim() + ((c.delta || '').trim() ? ` (${c.delta.trim()})` : '')).join(', '))
  const st = [(condition || '').trim(), ...notes.filter(Boolean)].filter(Boolean)
  if (st.length) lines.push('✅ ' + st.join(' · '))
  const dev = [(code || '').trim() && 'Kodi: ' + code.trim(), (region || '').trim() && 'Versioni: ' + region.trim(), noActive && 'No Active (i paaktivizuar)'].filter(Boolean)
  if (dev.length) lines.push(dev.join(' | '))
  if (info && info.trim()) lines.push(info.trim())
  if (offer && offer.trim()) lines.push(`Ofertë: ${offer.trim()} zbritje!`)
  lines.push(hasPrice ? pick(CTA, 1) : 'Na shkruani në DM për çmimin!', '')
  lines.push('N Mobile')
  if ((contact.phone || '').trim()) lines.push('📞 ' + contact.phone.trim())
  if ((contact.whatsapp || '').trim()) lines.push('💬 WhatsApp: ' + contact.whatsapp.trim())
  if ((contact.address || '').trim()) lines.push('📍 ' + contact.address.trim())
  if ((contact.instagram || '').trim()) lines.push('@' + contact.instagram.trim().replace(/^@/, ''))
  const brand = BRANDS.filter(([r]) => r.test(m)).flatMap(([, t]) => t)
  const tags = [...new Set(['#nmobile', '#telefona', ...brand, ...T.tags, '#smartphone', '#kosova', '#shqiperi'])]
  lines.push('', tags.join(' '))
  return lines.join('\n')
}
