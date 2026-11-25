import { describe, expect, test } from 'vitest'
import { GOOD_RATE, LIFT, MIN_REACH, engagement, interactions, mediaFormat, metricsPartial, pickPromote, presentMetrics } from './promote.js'

const NOW = Date.parse('2026-06-15T12:00:00Z')

function post(id, { reach = 1000, total = 80, hoursAgo = 48, format = 'FEED', type = 'post', stats } = {}) {
  const timestamp = new Date(NOW - hoursAgo * 36e5).toISOString()
  return {
    id,
    status: 'posted',
    type,
    created_at: timestamp,
    ig_stats: stats || {
      reach,
      total_interactions: total,
      likes: total,
      comments: 0,
      saved: 0,
      shares: 0,
      media_product_type: format,
      timestamp,
    },
  }
}

describe('engagement', () => {
  test('needs a real reach and does not turn a missing field into zero', () => {
    expect(engagement({ likes: 10 })).toBeNull()
    expect(engagement({ reach: 0, total_interactions: 5 })).toBeNull()
    expect(presentMetrics({ comments: 4, likes: undefined, saved: null })).toEqual(['comments'])
    expect(interactions({ comments: 4, saved: null })).toBe(4)
    expect(engagement({ reach: 100, comments: 4 })).toBe(0.04)
  })

  test('a story does not count a missing save', () => {
    const stats = { media_product_type: 'STORY', reach: 200, likes: 10, comments: 0, shares: 5 }
    expect(presentMetrics(stats)).toEqual(['likes', 'comments', 'shares'])
    expect(engagement(stats)).toBe(15 / 200)
    expect(metricsPartial(stats)).toBe(false)
  })

  test('partial feed metrics are marked when a field is absent', () => {
    expect(metricsPartial({ reach: 100, likes: 10, comments: 1, shares: 1 })).toBe(true)
    expect(metricsPartial({ total_interactions: 12, reach: 100 })).toBe(false)
  })
})

describe('mediaFormat', () => {
  test('keeps feed, reel and story apart', () => {
    expect(mediaFormat(post('a'))).toBe('feed')
    expect(mediaFormat(post('b', { format: 'REELS' }))).toBe('reel')
    expect(mediaFormat(post('c', { format: 'STORY' }))).toBe('story')
    expect(mediaFormat({ type: 'story' })).toBe('story')
    expect(mediaFormat({ ig: { media_type: 'VIDEO' } })).toBe('reel')
  })
})

describe('pickPromote', () => {
  test('promotes one strong post that clears the absolute rate', () => {
    const picked = pickPromote([post('only', { total: 80 })], NOW)
    expect(picked.id).toBe('only')
    expect(picked.format).toBe('feed')
    expect(picked.insufficient).toBe(false)
    expect(picked.rate).toBeGreaterThanOrEqual(GOOD_RATE)
  })

  test('with two posts the winner must beat that format average', () => {
    const high = post('high', { total: 100 })
    const low = post('low', { total: 40 })
    const picked = pickPromote([low, high], NOW)
    expect(picked.id).toBe('high')
    expect(picked.rate).toBeGreaterThan(picked.avg * LIFT - 1e-9)
  })

  test('returns nothing when neither post beats the format average', () => {
    const posts = [post('a', { total: 50 }), post('b', { total: 50 })]
    expect(pickPromote(posts, NOW)).toBeNull()
  })

  test('does not borrow another format average for a single weak post', () => {
    const story = post('story', { format: 'STORY', total: 20 })
    const feeds = [post('f1', { total: 200 }), post('f2', { total: 40 })]
    const picked = pickPromote([story, ...feeds], NOW)
    expect(picked.id).toBe('f1')
    expect(picked.format).toBe('feed')
    const alone = pickPromote([post('weak', { total: 20 })], NOW)
    expect(alone.id).toBeNull()
    expect(alone.insufficient).toBe(true)
    expect(alone.format).toBe('feed')
  })

  test('skips posts that are too new or were barely seen', () => {
    expect(pickPromote([post('new', { hoursAgo: 1, total: 200 })], NOW)).toBeNull()
    expect(pickPromote([post('tiny', { reach: MIN_REACH - 1, total: 40 })], NOW)).toBeNull()
  })
})
