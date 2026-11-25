import test from 'node:test'
import assert from 'node:assert/strict'
import { validateVision, cacheHit, visionOutcome, PROVIDER, DEFAULT_MODEL, PROMPT_VERSION } from './schema.js'
import { structuredFeatures, categoryFromName } from './structured.js'
import { mergeFeatures } from './merge.js'
import { engagement, saveShareRate, mediaFormat, scoreRate, comparable } from './metrics.js'
import { buildReport, describePost, promotionFor } from './report.js'
import { designAdvice } from './recommend.js'
import { pickPromote } from '../posts/promote.js'

const NOW = Date.parse('2026-06-15T00:00:00Z')
const AT = '2026-05-20T00:00:00Z'

function row(id, opt = {}) {
  const reach = opt.reach ?? 1000
  const total = opt.interactions ?? Math.round((opt.rate ?? 0.05) * reach)
  return {
    id,
    status: 'posted',
    ig_media_id: 'm-' + id,
    template: opt.template ?? 'hero',
    type: opt.type ?? 'post',
    theme: 'standard',
    model: opt.model ?? 'iPhone 13',
    price: opt.price ?? '',
    offer: opt.offer ?? '',
    cta: opt.cta ?? '',
    spec: opt.spec ?? '',
    extra: opt.extra ?? {},
    ig: opt.ig,
    ig_stats: {
      reach,
      total_interactions: total,
      likes: opt.likes ?? total,
      comments: 0,
      saved: opt.saved ?? 0,
      shares: opt.shares ?? 0,
      media_product_type: opt.format ?? 'FEED',
      timestamp: opt.timestamp ?? AT,
      fetched_at: AT,
    },
    created_at: AT,
  }
}

test('vision schema drops unknown, invalid and out-of-range values', () => {
  const clean = validateVision({
    product_category: 'spaceship',
    product_area_pct: 140,
    price_visible: 'yes',
    contrast: 'strong',
    dominant_colors: ['#abc', 'nope', '#112233', '#abc'],
    made_up: true,
  })
  assert.equal(clean.product_category, null)
  assert.equal(clean.product_area_pct, null)
  assert.equal(clean.price_visible, null)
  assert.equal(clean.contrast, 'strong')
  assert.deepEqual(clean.dominant_colors, ['#AABBCC', '#112233'])
  assert.equal(clean.made_up, undefined)
  assert.equal(validateVision(null), null)
  assert.equal(validateVision('photo'), null)
  assert.equal(validateVision({ product_visibility: null }).product_visibility, null)
})

test('category comes from the product name only when the name says so', () => {
  assert.equal(categoryFromName('iPhone 15'), 'iphone')
  assert.equal(categoryFromName('Galaxy S24'), 'samsung')
  assert.equal(categoryFromName('Këllëf silikoni'), 'accessory')
  assert.equal(categoryFromName('Ofertë e javës'), null)
})

test('structured facts follow what the template draws', () => {
  const withPrice = structuredFeatures(row('a', { price: '899', offer: '-20%', cta: 'Na kontakto', spec: '256GB' }))
  assert.equal(withPrice.price_visible, true)
  assert.equal(withPrice.discount_badge, true)
  assert.equal(withPrice.cta_visible, true)
  assert.equal(withPrice.cta_text, 'Na kontakto')
  assert.equal(withPrice.specs_visible, true)
  assert.equal(withPrice.category_from_name, 'iphone')
  const bare = structuredFeatures(row('b', { price: '', template: 'detail' }))
  assert.equal(bare.price_visible, false)
  assert.equal(bare.discount_badge, false)
  assert.equal(structuredFeatures({ igOnly: true, template: 'hero' }), null)
})

test('design facts override the model for drawn elements', () => {
  const structured = structuredFeatures(row('a', { price: '' }))
  const vision = validateVision({ price_visible: true, background_type: 'plain', product_area_pct: 62 })
  const { features, sources } = mergeFeatures(structured, vision)
  assert.equal(features.price_visible, false)
  assert.equal(sources.price_visible, 'design')
  assert.equal(features.background_type, 'plain')
  assert.equal(features.simple_background, true)
  assert.equal(sources.background_type, 'vision')
  assert.equal(features.product_category, 'iphone')
  assert.equal(sources.product_category, 'name')
})

test('engagement needs reach and does not treat more likes as better', () => {
  assert.equal(engagement({ likes: 10, comments: 1 }), null)
  assert.equal(engagement({ reach: 0, total_interactions: 5 }), null)
  const wide = { reach: 20000, likes: 800, total_interactions: 800 }
  const tight = { reach: 1000, likes: 200, total_interactions: 200 }
  assert.ok(engagement(tight) > engagement(wide))
  const posts = [
    row('wide', { reach: 20000, likes: 800, interactions: 800 }),
    row('tight', { reach: 1000, likes: 200, interactions: 200 }),
    row('mid', { reach: 1000, interactions: 50 }),
  ]
  const report = buildReport(posts, [], NOW)
  assert.equal(report.byFormat.feed.best.post.id, 'tight')
  assert.equal(report.byFormat.feed.weakest.post.id, 'wide')
})

test('stories ignore saves and formats are not mixed', () => {
  assert.equal(saveShareRate({ reach: 100, saved: 50, shares: 10 }, 'story'), 0.1)
  assert.equal(saveShareRate({ reach: 100, saved: 50, shares: 10 }, 'feed'), 0.6)
  assert.equal(saveShareRate({ likes: 5 }, 'feed'), null)
  const posts = [
    row('reel', { format: 'REELS', interactions: 900, reach: 1000 }),
    row('f1', { interactions: 40 }),
    row('f2', { interactions: 80 }),
    row('f3', { interactions: 120 }),
  ]
  assert.equal(mediaFormat(posts[0]), 'reel')
  assert.equal(mediaFormat(row('s', { format: 'STORY' })), 'story')
  const report = buildReport(posts, [], NOW)
  assert.equal(report.byFormat.reel.count, 1)
  assert.equal(report.byFormat.feed.count, 3)
  assert.equal(report.byFormat.feed.best.post.id, 'f3')
  const story = row('st', { format: 'STORY', interactions: 10, saved: 80, shares: 5 })
  assert.equal(comparable(story, NOW).saveShare, 0.005)
})

test('score is withheld until three posts of the same format exist', () => {
  const two = [row('a', { interactions: 200 }), row('b', { interactions: 40 })]
  const report = buildReport(two, [], NOW)
  assert.equal(describePost(two[0], report, [], NOW).score, null)
  assert.equal(describePost(two[0], report, [], NOW).label, null)
  const three = [...two, row('c', { interactions: 100 })]
  const full = buildReport(three, [], NOW)
  const scored = describePost(three[0], full, [], NOW)
  assert.equal(scored.score, 10)
  assert.equal(scored.label, 'Performancë e mirë')
  assert.equal(scoreRate(0.2, full.rows.slice(0, 2)), null)
})

test('a price pattern needs three posts on each side and a 15% gap', () => {
  const posts = [
    row('y1', { price: '899', interactions: 200 }),
    row('y2', { price: '799', interactions: 180 }),
    row('y3', { price: '699', interactions: 220 }),
    row('n1', { price: '', interactions: 40 }),
    row('n2', { price: '', interactions: 30 }),
    row('n3', { price: '', interactions: 50 }),
  ]
  const report = buildReport(posts, [], NOW)
  const price = report.byFormat.feed.patterns.find((p) => p.id === 'price_visible')
  assert.ok(price)
  assert.equal(price.better, true)
  assert.match(price.sentence, /model i vërejtur/i)
  const close = buildReport([
    row('a', { price: '1', interactions: 100 }),
    row('b', { price: '1', interactions: 100 }),
    row('c', { price: '1', interactions: 100 }),
    row('d', { price: '', interactions: 98 }),
    row('e', { price: '', interactions: 98 }),
    row('f', { price: '', interactions: 98 }),
  ], [], NOW)
  assert.equal(close.byFormat.feed.patterns.find((p) => p.id === 'price_visible'), undefined)
})

test('recommendations use measured text and skip a badge when there is no offer', () => {
  const posts = [
    row('y1', { price: '899', offer: '-10%', cta: 'Na kontakto', interactions: 200 }),
    row('y2', { price: '899', offer: '-10%', cta: 'Na kontakto', interactions: 180 }),
    row('y3', { price: '899', offer: '-10%', cta: 'Na kontakto', interactions: 210 }),
    row('n1', { price: '', offer: '', cta: '', interactions: 40 }),
    row('n2', { price: '', offer: '', cta: '', interactions: 30 }),
    row('n3', { price: '', offer: '', cta: '', interactions: 20 }),
  ]
  const report = buildReport(posts, [], NOW)
  const advice = designAdvice({ template: 'detail', price: '', offer: '', cta: '' }, report)
  assert.equal(advice.ready, true)
  assert.equal(advice.items.some((i) => i.id === 'badge'), false)
  const cta = advice.items.find((i) => i.id === 'cta')
  assert.equal(cta.apply.cta, 'Na kontakto')
  assert.equal(JSON.stringify(advice.items).includes('Bli Tani'), false)
  const withOffer = designAdvice({ template: 'hero', price: '899', offer: '-10%', cta: 'Na kontakto' }, report)
  assert.ok(withOffer.items.some((i) => i.id === 'badge'))
  const thin = designAdvice({ offer: '-10%' }, buildReport([row('only', { offer: '-10%', cta: 'Na kontakto' })], [], NOW))
  assert.equal(thin.ready, false)
  assert.match(thin.message, /nuk ka mjaft/i)
})

test('missing stats, young posts and failed analysis create no visual claims', () => {
  const young = row('new', { timestamp: '2026-06-15T00:00:00Z', interactions: 500 })
  assert.equal(comparable(young, NOW), null)
  const quiet = row('quiet', { reach: 10, interactions: 9 })
  assert.equal(comparable(quiet, NOW), null)
  const report = buildReport([
    row('a', { interactions: 200 }),
    row('b', { interactions: 40 }),
    row('c', { interactions: 100 }),
  ], [], NOW)
  const view = describePost(young, report, [], NOW)
  assert.ok(view.limits.length)
  assert.equal(view.score, null)
  assert.equal(visionOutcome({ configured: false }).claims, false)
  assert.equal(visionOutcome({ code: 'rate_limit', status: 429 }).claims, false)
  assert.equal(visionOutcome({ code: 'failed', error: 'down' }).claims, false)
  assert.equal(visionOutcome({ features: 'not-json' }).claims, false)
})

test('the same image hash, provider, model and prompt is a cache hit', () => {
  const key = { hash: 'abc', provider: PROVIDER, model: DEFAULT_MODEL, promptVersion: PROMPT_VERSION }
  const row = { image_hash: 'abc', provider: PROVIDER, model: DEFAULT_MODEL, prompt_version: PROMPT_VERSION, features: { contrast: 'strong' } }
  assert.equal(cacheHit([row], key), row)
  assert.equal(cacheHit([row], { ...key, hash: 'other' }), null)
  assert.equal(cacheHit([row], { ...key, model: 'other' }), null)
  assert.equal(cacheHit([{ ...row, prompt_version: '2' }], key), null)
})

test('pickPromote still requires a lift over the account average', () => {
  const posts = [
    row('high', { interactions: 200 }),
    row('low', { interactions: 40 }),
  ]
  const hit = pickPromote(posts, NOW)
  assert.equal(hit.id, 'high')
  assert.match(hit.reason, /Angazhim/)
  const flat = pickPromote([
    row('a', { interactions: 100 }),
    row('b', { interactions: 100 }),
  ], NOW)
  assert.equal(flat, null)
})

test('promotion follows pickPromote and explains when a post is not chosen', () => {
  const posts = [row('high', { interactions: 200 }), row('low', { interactions: 40 })]
  assert.equal(promotionFor(posts[0], posts, NOW).worth, true)
  const other = promotionFor(posts[1], posts, NOW)
  assert.equal(other.worth, false)
  assert.ok(other.reason)
})
