import { describe, expect, test } from 'vitest'
import { IG_MAX_CHARS, IG_MAX_TAGS, countTags, makeCaption } from './caption.js'

const quiet = { price: false, contact: false, tags: 'none' }

describe('makeCaption', () => {
  test('names the phone, formats the price, and adds basic tags', () => {
    const text = makeCaption({ model: 'iPhone 13', price: '899' }, 'standard', 0, { style: 'short', price: true, contact: false, tags: 'basic' })
    expect(text).toContain('iPhone 13')
    expect(text).toContain('899€')
    expect(text).toContain('#nmobile')
    expect(text).toContain('#iphone')
    expect(countTags(text)).toBeLessThanOrEqual(IG_MAX_TAGS)
    expect(text.length).toBeLessThanOrEqual(IG_MAX_CHARS)
  })

  test('hides the price and hashtags when those options are off', () => {
    const text = makeCaption({ model: 'iPhone 13', price: '899' }, 'standard', 0, { style: 'short', ...quiet, price: false })
    expect(text).not.toContain('899')
    expect(text).not.toContain('#')
    expect(countTags(text)).toBe(0)
  })

  test('a different variant uses another phrase in the same style', () => {
    const a = makeCaption({ model: 'Pixel 8' }, 'standard', 0, { style: 'short', ...quiet })
    const b = makeCaption({ model: 'Pixel 8' }, 'standard', 1, { style: 'short', ...quiet })
    expect(a).toContain('Pixel 8')
    expect(b).toContain('Pixel 8')
    expect(a).not.toBe(b)
  })

  test('an unknown style falls back to the detailed caption', () => {
    const text = makeCaption({ model: 'Galaxy S24', specF: { storage: '256GB' } }, 'standard', 0, { style: 'nope', ...quiet })
    expect(text).toContain('Galaxy S24')
    expect(text).toContain('Specifikat:')
    expect(text).toContain('256GB')
  })

  test('offer captions show the old price and the amount saved', () => {
    const text = makeCaption({ model: 'Redmi Note', price: '200', oldPrice: '250' }, 'standard', 0, { style: 'offer', price: true, contact: false, tags: 'basic' })
    expect(text).toContain('250€')
    expect(text).toContain('200€')
    expect(text).toContain('Kurseni 50€')
    expect(text).toContain('#oferta')
  })

  test('shop contact is written once when phone and WhatsApp match', () => {
    const text = makeCaption(
      { model: 'A', contact: { phone: '044111222', whatsapp: '044111222', address: 'Prizren' } },
      'standard', 0,
      { style: 'detailed', ...quiet, contact: true },
    )
    expect(text).toContain('Tel / WhatsApp: 044111222')
    expect(text).toContain('Adresa: Prizren')
    expect(text.match(/044111222/g)).toHaveLength(1)
  })

  test('stays inside Instagram limits when the notes are very long', () => {
    const notes = Array.from({ length: 40 }, (_, i) => `Shënim i gjatë numër ${i} `.repeat(30))
    const fields = { model: 'Telefon', notes, info: 'x'.repeat(5000), contact: { phone: '1', whatsapp: '2', address: 'Rruga e gjatë '.repeat(20) } }
    const detailed = makeCaption(fields, 'standard', 0, { style: 'detailed', price: false, contact: true, tags: 'extended' })
    const bullets = makeCaption(fields, 'standard', 0, { style: 'bullets', price: false, contact: true, tags: 'extended' })
    expect(detailed.length).toBeLessThanOrEqual(IG_MAX_CHARS)
    expect(bullets.length).toBeLessThanOrEqual(IG_MAX_CHARS)
    expect(countTags(detailed)).toBeLessThanOrEqual(IG_MAX_TAGS)
    expect(countTags(bullets)).toBeLessThanOrEqual(IG_MAX_TAGS)
  })
})

describe('countTags', () => {
  test('counts hashtags and ignores a hash glued to a word', () => {
    expect(countTags('Çmimi #nmobile dhe #prizren')).toBe(2)
    expect(countTags('jo#etikete')).toBe(0)
    expect(countTags('')).toBe(0)
  })
})
