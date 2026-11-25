// Structured design facts override the model for elements the template actually draws.
import { emptyVision } from './schema.js'

const OVERRIDE = ['price_visible', 'old_and_new_price', 'discount_badge', 'cta_visible', 'specs_visible', 'multiple_products']

const SIMPLE = new Set(['plain', 'gradient'])
const COMPLEX = new Set(['shop', 'lifestyle', 'photo'])

export function mergeFeatures(structured, vision) {
  const features = emptyVision()
  const sources = {}
  if (vision) {
    for (const k of Object.keys(features)) {
      const v = vision[k]
      const emptyList = k === 'dominant_colors' && Array.isArray(v) && !v.length
      if (v == null || emptyList) continue
      features[k] = v
      sources[k] = 'vision'
    }
  }
  if (structured) {
    for (const k of OVERRIDE) {
      if (structured[k] != null) {
        features[k] = structured[k]
        sources[k] = 'design'
      }
    }
    if (structured.text_density && sources.text_density !== 'vision') {
      features.text_density = structured.text_density
      sources.text_density = 'design'
    }
    if (structured.category_from_name) {
      features.product_category = structured.category_from_name
      sources.product_category = 'name'
    }
    features.template = structured.template
    features.theme = structured.theme
    features.cta_text = structured.cta_text
    features.design_type = structured.design_type
  }
  const bg = features.background_type
  features.simple_background = SIMPLE.has(bg) ? true : COMPLEX.has(bg) ? false : null
  if (features.simple_background != null) sources.simple_background = sources.background_type || 'vision'
  return { features, sources }
}
