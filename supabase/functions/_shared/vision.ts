// Groq free-plan vision. No SDK. The key stays in GROQ_API_KEY on the Edge Function.
// Model qwen/qwen3.8-27b is the vision model on Groq's free-plan limits (Llama 4 Scout is shut down).
// Free plan, per organization: 30 requests/minute, 1,000/day, 8,000 tokens/minute, 200,000 tokens/day.
// Each image counts as 2,048 input tokens, so about three new analyses per minute and about 90 per day.
// Cost is $0 inside those limits. If the account leaves the free plan, Groq lists $0.80 / 1M input
// tokens and $4 / 1M output tokens (about $0.002 per image). This function never upgrades the plan.
// HTTP 429 is returned to the client once. It is not retried and no features are invented.
// Override the model only with IMAGE_ANALYSIS_MODEL if Groq renames the free vision model.

export const PROVIDER = 'groq'
export const DEFAULT_MODEL = 'qwen/qwen3.8-27b'
export const PROMPT_VERSION = '1'

const ENUMS: Record<string, string[]> = {
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
const BOOLS = ['product_recognizable', 'multiple_products', 'price_visible', 'old_and_new_price', 'discount_badge', 'cta_visible', 'specs_visible', 'contact_visible', 'overcrowded', 'logo_visible']

const SYSTEM = `You extract visual facts from one promotional image for a phone shop.
Return only JSON. Use null for anything you cannot see reliably. Do not guess a price, discount, brand or call to action.
product_area_pct is an integer 0-100 or null. dominant_colors is up to 5 hex colors like #RRGGBB, or [].
Enums: product_category smartphone|iphone|samsung|accessory|other|unknown|null; product_visibility high|medium|low|unknown|null; product_position center|left|right|top|bottom|unknown|null; contrast strong|medium|weak|unknown|null; background_type plain|gradient|shop|lifestyle|photo|unknown|null; composition balanced|product-heavy|text-heavy|unknown|null; whitespace high|medium|low|unknown|null; clarity sharp|acceptable|poor|unknown|null; text_density low|medium|high|unknown|null.
Booleans are true, false or null: product_recognizable, multiple_products, price_visible, old_and_new_price, discount_badge, cta_visible, specs_visible, contact_visible, overcrowded, logo_visible.`

function nullableEnum(values: string[]) {
  return { anyOf: [{ type: 'string', enum: values }, { type: 'null' }] }
}

function responseSchema() {
  const properties: Record<string, unknown> = {
    product_area_pct: { anyOf: [{ type: 'integer' }, { type: 'null' }] },
    dominant_colors: { type: 'array', items: { type: 'string' } },
  }
  for (const [key, values] of Object.entries(ENUMS)) properties[key] = nullableEnum(values)
  for (const key of BOOLS) properties[key] = { anyOf: [{ type: 'boolean' }, { type: 'null' }] }
  return { type: 'object', additionalProperties: false, properties, required: Object.keys(properties) }
}

export function mimeOf(bytes: Uint8Array) {
  if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png'
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8) return 'image/jpeg'
  if (bytes.length >= 12 && bytes[0] === 0x52 && bytes[1] === 0x49) return 'image/webp'
  return 'image/jpeg'
}

export function toBase64(bytes: Uint8Array) {
  let s = ''
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(s)
}

export async function sha256(bytes: Uint8Array) {
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i
function normalizeHex(value: unknown) {
  const s = String(value || '').trim()
  if (!HEX.test(s)) return null
  const h = s.slice(1)
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h
  return '#' + full.toUpperCase()
}

/** Same rules as src/features/insights/schema.js. Invalid values become null. */
export function validateVision(raw: unknown) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null
  const src = raw as Record<string, unknown>
  const out: Record<string, unknown> = { dominant_colors: [], product_area_pct: null }
  for (const key of Object.keys(ENUMS)) {
    const v = src[key]
    const norm = v == null || v === '' ? null : String(v).trim().toLowerCase()
    out[key] = norm && ENUMS[key].includes(norm) ? norm : null
  }
  for (const key of BOOLS) out[key] = src[key] === true || src[key] === false ? src[key] : null
  const area = src.product_area_pct
  out.product_area_pct = typeof area === 'number' && Number.isFinite(area) && area >= 0 && area <= 100 ? Math.round(area) : null
  const colors = Array.isArray(src.dominant_colors) ? src.dominant_colors : []
  const seen = new Set<string>()
  for (const c of colors) {
    const hex = normalizeHex(c)
    if (hex && !seen.has(hex) && seen.size < 5) seen.add(hex)
  }
  out.dominant_colors = [...seen]
  return out
}

function messageText(content: unknown) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content.map((part) => (typeof part === 'string' ? part : (part && typeof part === 'object' && 'text' in part ? String((part as { text?: string }).text || '') : ''))).join('')
}

function parseJson(text: string) {
  const trimmed = text.trim().replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
  const start = trimmed.indexOf('{')
  const end = trimmed.lastIndexOf('}')
  if (start < 0 || end < start) return null
  try { return JSON.parse(trimmed.slice(start, end + 1)) } catch { return null }
}

async function complete(apiKey: string, model: string, bytes: Uint8Array, mime: string, format: 'json_schema' | 'json_object', reasoning: boolean) {
  const response_format = format === 'json_schema'
    ? { type: 'json_schema', json_schema: { name: 'visual_features', strict: true, schema: responseSchema() } }
    : { type: 'json_object' }
  const payload: Record<string, unknown> = {
    model,
    temperature: 0,
    max_completion_tokens: 800,
    response_format,
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: [
        { type: 'text', text: 'Analyze this shop post. Unknown facts must be null.' },
        { type: 'image_url', image_url: { url: `data:${mime};base64,${toBase64(bytes)}` } },
      ] },
    ],
  }
  if (reasoning) payload.reasoning_effort = 'none'
  return await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

export async function analyzeWithGroq(apiKey: string, bytes: Uint8Array, model: string) {
  const mime = mimeOf(bytes)
  let res = await complete(apiKey, model, bytes, mime, 'json_schema', true)
  if (res.status === 400) res = await complete(apiKey, model, bytes, mime, 'json_object', false)
  if (res.status === 429) return { rateLimit: true as const }
  const body = await res.json().catch(() => ({}))
  if (!res.ok) return { error: body?.error?.message || 'Groq request failed' }
  const msg = body?.choices?.[0]?.message || {}
  const parsed = parseJson(messageText(msg.content) || messageText(msg.reasoning))
  if (!parsed) return { error: 'Groq did not return features' }
  return { features: parsed }
}
