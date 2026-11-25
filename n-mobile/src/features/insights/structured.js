// Facts the app already knows because it drew the post. Not a guess about the photo.
import { templateFields } from '../templates/index.js'

const filled = (v) => String(v || '').trim()

/** Category from the product name. Null when the name does not say. */
export function categoryFromName(model) {
  const s = filled(model).toLowerCase()
  if (!s) return null
  if (/iphone|ipad|\bapple\b/.test(s)) return 'iphone'
  if (/samsung|galaxy/.test(s)) return 'samsung'
  if (/airpods|këllëf|kellëf|mbrojt|karikues|charger|\bcase\b|aksesor/.test(s)) return 'accessory'
  if (/telefon|phone|redmi|xiaomi|pixel|huawei|oppo|poco/.test(s)) return 'smartphone'
  return null
}

function density(n) {
  if (n >= 7) return 'high'
  if (n >= 4) return 'medium'
  return 'low'
}

/**
 * Design facts for an app-created post. Instagram-only rows return null.
 * contact and logo are not stored on the post, so they stay null.
 */
export function structuredFeatures(post) {
  if (!post || post.igOnly || !post.template) return null
  const type = post.type === 'story' ? 'story' : 'post'
  const fields = templateFields(post.template, type)
  const extra = post.extra || {}
  const price = filled(post.price)
  const oldPrice = fields.has('oldPrice') ? filled(extra.oldPrice) : ''
  const offer = fields.has('offer') ? filled(post.offer) : ''
  const cta = filled(post.cta)
  const spec = fields.has('spec') ? filled(post.spec) : ''
  const priceVisible = Boolean(price)
  let text = 0
  if (filled(post.model)) text++
  if (price) text++
  if (cta) text++
  if (spec) text++
  if (fields.has('info') && filled(post.info)) text++
  if (offer) text++
  if (fields.has('title') && filled(extra.title)) text++
  if (fields.has('slogan') && filled(extra.slogan)) text++
  if (oldPrice) text++
  const second = fields.has('photo2') && Boolean(filled(post.photo2_path) || filled(extra.photo2))
  return {
    template: post.template,
    theme: post.theme || null,
    design_type: type,
    category_from_name: categoryFromName(post.model),
    price_visible: priceVisible,
    old_and_new_price: Boolean(priceVisible && oldPrice),
    discount_badge: Boolean(offer),
    cta_visible: Boolean(cta),
    cta_text: cta || null,
    specs_visible: Boolean(spec),
    multiple_products: second,
    text_density: density(text),
    contact_visible: null,
    logo_visible: null,
  }
}
