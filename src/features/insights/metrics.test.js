import { describe, expect, test } from 'vitest'
import { MIN_AGE_H, MIN_REACH } from '../posts/promote.js'
import { accountAverage, bestAndWeakest, comparable, pct, saveShareRate, scoreRate } from './metrics.js'

const NOW = Date.parse('2026-06-15T12:00:00Z')

function statPost(id, rate, extra = {}) {
  const reach = extra.reach ?? 1000
  const timestamp = new Date(NOW - (extra.hoursAgo ?? 48) * 36e5).toISOString()
  const stats = {
    reach,
    total_interactions: Math.round(rate * reach),
    saved: extra.saved,
    shares: extra.shares,
    media_product_type: extra.format ?? 'FEED',
    timestamp,
  }
  return { id, ig_stats: stats, created_at: timestamp }
}

describe('metrics', () => {
  test('formats a rate and leaves a missing rate blank', () => {
    expect(pct(0.05)).toBe('5,0%')
    expect(pct(0.2)).toBe('20%')
    expect(pct(null)).toBeNull()
  })

  test('save and share rate ignores a missing save, including every story', () => {
    expect(saveShareRate({ reach: 100, shares: 4 }, 'feed')).toBe(0.04)
    expect(saveShareRate({ reach: 100, saved: 6, shares: 4 }, 'feed')).toBe(0.1)
    expect(saveShareRate({ reach: 100, saved: 50, shares: 4 }, 'story')).toBe(0.04)
    expect(saveShareRate({ reach: 100 }, 'feed')).toBeNull()
    expect(saveShareRate({ reach: 0, shares: 4 }, 'feed')).toBeNull()
  })

  test('comparable posts need enough reach and age', () => {
    const ready = comparable(statPost('ok', 0.08), NOW)
    expect(ready.rate).toBeCloseTo(0.08)
    expect(ready.format).toBe('feed')
    expect(comparable(statPost('young', 0.2, { hoursAgo: MIN_AGE_H - 1 }), NOW)).toBeNull()
    expect(comparable(statPost('small', 0.2, { reach: MIN_REACH - 1 }), NOW)).toBeNull()
    expect(comparable({ id: 'none' }, NOW)).toBeNull()
  })

  test('account average is weighted by reach', () => {
    const rows = [
      comparable(statPost('big', 0.1, { reach: 3000 }), NOW),
      comparable(statPost('small', 0.01, { reach: 1000 }), NOW),
    ]
    expect(accountAverage(rows)).toBeCloseTo(310 / 4000)
    expect(accountAverage([])).toBeNull()
  })

  test('score needs three posts and best/weakest stay distinct', () => {
    const rows = [0.02, 0.05, 0.09].map((rate, i) => comparable(statPost('s' + i, rate), NOW))
    expect(scoreRate(rows[2].rate, rows.slice(0, 2))).toBeNull()
    expect(scoreRate(rows[2].rate, rows)).toBe(10)
    expect(scoreRate(rows[0].rate, rows)).toBe(0)
    const pair = bestAndWeakest(rows)
    expect(pair.best.post.id).toBe('s2')
    expect(pair.weakest.post.id).toBe('s0')
    expect(bestAndWeakest([rows[0]]).weakest).toBeNull()
    expect(bestAndWeakest([]).best).toBeNull()
  })
})
