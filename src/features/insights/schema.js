// Visual-feature contract shared by the client and the Groq response.
// Unknown or out-of-range values become null. Nothing is invented.

export const PROVIDER = 'groq'
export const DEFAULT_MODEL = 'qwen/qwen3.8-27b'
export const PROMPT_VERSION = '1'

export const ENUMS = {
  product_category: ['smartphone', 'iphone', 'samsung', 'accessory', 'other', 'unknown'],
  product_visibility: ['high', 'medium', 'low', 'unknown'],
  product_position: ['center', 'left', 'right', 'top', 'bottom', 'unknown'],
  contrast: ['strong', 'medium', 'weak', 'unknown'],
  background_type: ['plain', 'gradient', 'shop', 'lifestyle', 'photo', 'unknown'],
  composition: ['balanced', 'product-heavy', 'text-heavy', 'unknown'],
  whitespace: ['high', 'medium', 'low', 'unknown'],
  clarity: ['sharp', 'acceptable', 'poor', 'unknown'],
  text_density: ['low', 'medium', 'high', 'unknown'],
}

export const BOOLS = ['product_recognizable', 'multiple_products', 'price_visible', 'old_and_new_price', 'discount_badge', 'cta_visible', 'specs_visible', 'contact_visible', 'overcrowded', 'logo_visible']

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i

export function emptyVision() {
  const o = { dominant_colors: [], product_area_pct: null }
  for (const k of Object.keys(ENUMS)) o[k] = null
  for (const k of BOOLS) o[k] = null
  return o
}

export function normalizeHex(value) {
  const s = String(value || '').trim()
  if (!HEX.test(s)) return null
  const h = s.slice(1)
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return '#' + full.toUpperCase()
}

function enumOrNull(key, value) {
  if (value == null || value === '') return null
  const v = String(value).trim().toLowerCase()
  return ENUMS[key].includes(v) ? v : null
}

function boolOrNull(value) {
  return value === true || value === false ? value : null
}

/** Returns a clean feature object, or null when the payload is not an object. */
export function validateVision(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const out = emptyVision()
  for (const k of Object.keys(ENUMS)) out[k] = enumOrNull(k, raw[k])
  for (const k of BOOLS) out[k] = boolOrNull(raw[k])
  const area = raw.product_area_pct
  out.product_area_pct = typeof area === 'number' && Number.isFinite(area) && area >= 0 && area <= 100 ? Math.round(area) : null
  const colors = Array.isArray(raw.dominant_colors) ? raw.dominant_colors : []
  const seen = new Set()
  for (const c of colors) {
    const hex = normalizeHex(c)
    if (hex && !seen.has(hex) && seen.size < 5) seen.add(hex)
  }
  out.dominant_colors = [...seen]
  return out
}

/** Cached row for the same image bytes, provider, model and prompt. */
export function cacheHit(rows, key) {
  return (rows || []).find((r) => r
    && r.image_hash === key.hash
    && r.provider === key.provider
    && r.model === key.model
    && r.prompt_version === key.promptVersion
    && r.features
    && typeof r.features === 'object'
    && !Array.isArray(r.features)) || null
}

/** A provider response may be shown only when it carries a real feature object. */
export function visionOutcome(res) {
  if (!res || res.configured === false) return { claims: false, reason: 'unconfigured', features: null }
  if (res.code === 'rate_limit' || res.status === 429) return { claims: false, reason: 'rate_limit', features: null }
  if (res.code === 'failed' || res.error) return { claims: false, reason: 'failed', features: null }
  const features = validateVision(res.features ?? res.analysis?.features)
  if (!features) return { claims: false, reason: 'failed', features: null }
  return { claims: true, reason: 'ok', features }
}
