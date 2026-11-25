import { describe, expect, test } from 'vitest'
import { MIN_GAP, MIN_SIDE, areaPattern, booleanPatterns, colorPattern, ctaPattern } from './patterns.js'

function row(rate, features, reach = 1000) {
  return {
    rate,
    stats: { reach, total_interactions: Math.round(rate * reach) },
    features,
  }
}

describe('patterns', () => {
  test('reports a boolean gap only when both sides have enough posts', () => {
    const yes = Array.from({ length: MIN_SIDE }, () => row(0.12, { price_visible: true }))
    const no = Array.from({ length: MIN_SIDE }, () => row(0.05, { price_visible: false }))
    const found = booleanPatterns([...yes, ...no], 'feed')
    const price = found.find((p) => p.id === 'price_visible')
    expect(price.better).toBe(true)
    expect(price.yes).toBe(MIN_SIDE)
    expect(price.no).toBe(MIN_SIDE)
    expect(price.sentence).toContain('çmim të dukshëm')

    const close = booleanPatterns([
      ...Array.from({ length: MIN_SIDE }, () => row(0.1, { price_visible: true })),
      ...Array.from({ length: MIN_SIDE }, () => row(0.1 * (1 - MIN_GAP / 2), { price_visible: false })),
    ], 'feed')
    expect(close.find((p) => p.id === 'price_visible')).toBeUndefined()

    const short = booleanPatterns([
      row(0.2, { price_visible: true }),
      row(0.2, { price_visible: true }),
      ...no,
    ], 'feed')
    expect(short).toEqual([])
  })

  test('area pattern compares the product size of the stronger and weaker halves', () => {
    const rows = [0.02, 0.03, 0.04, 0.1, 0.12, 0.14].map((rate, i) => row(rate, { product_area_pct: i < 3 ? 20 : 70 }))
    const pattern = areaPattern(rows, 'reel')
    expect(pattern.higher).toBe(true)
    expect(pattern.highArea).toBeGreaterThan(pattern.lowArea)
    expect(pattern.sentence).toContain('Reel')

    const flat = [0.02, 0.03, 0.04, 0.1, 0.12, 0.14].map((rate) => row(rate, { product_area_pct: 40 }))
    expect(areaPattern(flat, 'feed')).toBeNull()
    expect(areaPattern(rows.slice(0, 4), 'feed')).toBeNull()
  })

  test('colors and calls to action are frequencies, not causes', () => {
    const above = [
      row(0.1, { dominant_colors: ['#112233', '#AABBCC'] }),
      row(0.11, { dominant_colors: ['#112233'] }),
      row(0.12, { dominant_colors: ['#FFFFFF'] }),
    ]
    const below = [row(0.02, { dominant_colors: ['#000000'] }), row(0.03, {})]
    const colors = colorPattern([...above, ...below], 'feed')
    expect(colors.colors.map((c) => c.hex)).toContain('#112233')
    expect(colors.sentence).toContain('shpeshti')

    const ctas = [
      row(0.1, { cta_text: 'Na shkruani' }),
      row(0.11, { cta_text: 'Na shkruani' }),
      row(0.02, { cta_text: 'Bli tani' }),
    ]
    expect(ctaPattern(ctas, 'feed').text).toBe('Na shkruani')
    expect(ctaPattern([row(0.1, { cta_text: 'Vetëm një' }), row(0.02, { cta_text: 'Tjetër' })], 'feed')).toBeNull()
  })
})
