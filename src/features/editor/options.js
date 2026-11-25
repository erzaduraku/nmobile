import { LS } from '../../lib/storage.js'
import { CONDITIONS, NOTES, CTAS, TITLES, BADGES, SWATCHES } from './fields.js'
import { SPEC_FIELDS } from './specFields.js'

// User-editable option lists. The key of an option ignores case and all spaces,
// so "256GB", "256 GB" and "256gb" are the same value.
export const OPTION_DEFAULTS = {
  capacity: ['128GB', '256GB', '512GB', '1TB'],
  cta: CTAS,
  title: TITLES,
  badge: BADGES,
  condition: CONDITIONS,
  notes: NOTES,
  colors: SWATCHES.map(([name, hex]) => ({ name, hex })),
  ...Object.fromEntries(SPEC_FIELDS.map((f) => ['spec.' + f.id, f.picks])),
}

const optionSource = (v) => (typeof v === 'string' ? v : String(v?.name ?? v?.label ?? v?.value ?? ''))

export const optionText = (v) => optionSource(v).replace(/\s+/g, ' ').trim()
export const optionKey = (v) => optionSource(v).replace(/\s+/g, '').toLocaleLowerCase()
export const sameOption = (a, b) => Boolean(optionKey(a)) && optionKey(a) === optionKey(b)

export function cleanOptions(list) {
  if (!Array.isArray(list)) return []
  const out = []
  for (const item of list) {
    const text = optionText(item)
    if (!text) continue
    const option = typeof item === 'string' ? text : { ...item, name: text }
    if (!out.some((o) => sameOption(o, option))) out.push(option)
  }
  return out
}

export function loadOptionSets(selected = {}) {
  let saved = {}
  try { saved = JSON.parse(LS.get('options', '{}')) || {} } catch { saved = {} }
  const sets = {}
  for (const [key, defaults] of Object.entries(OPTION_DEFAULTS)) {
    // An existing key (including []) is authoritative: deleted defaults must stay deleted.
    const hasSaved = Object.prototype.hasOwnProperty.call(saved, key) && Array.isArray(saved[key])
    const extra = selected[key] == null || selected[key] === '' ? [] : (Array.isArray(selected[key]) ? selected[key] : [selected[key]])
    const list = hasSaved ? saved[key] : [...defaults, ...extra]
    sets[key] = cleanOptions(list)
  }
  return sets
}

export function saveOptionSets(sets) {
  LS.set('options', JSON.stringify(sets))
}

export function addToOptions(sets, key, raw, makeOption = (v) => v) {
  const current = sets[key] || OPTION_DEFAULTS[key] || []
  const made = makeOption(optionText(raw))
  const option = typeof made === 'string' ? optionText(made) : made
  if (!option || !optionText(option)) return { ok: false, reason: 'empty', sets }
  if (current.some((o) => sameOption(o, option))) return { ok: false, reason: 'duplicate', sets }
  const next = { ...sets, [key]: cleanOptions([...current, option]) }
  return { ok: true, sets: next }
}

export function removeFromOptions(sets, key, raw) {
  const current = sets[key] || OPTION_DEFAULTS[key] || []
  return { ...sets, [key]: current.filter((o) => !sameOption(o, raw)) }
}
