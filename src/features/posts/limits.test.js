import { describe, expect, test } from 'vitest'
import { MAX_DRAFTS, MAX_POSTED, latestPosted, postedAt } from './limits.js'

describe('post limits', () => {
  test('keeps the published caps used by the database migrations', () => {
    expect(MAX_DRAFTS).toBe(5)
    expect(MAX_POSTED).toBe(20)
  })

  test('posted time prefers the Instagram timestamp', () => {
    expect(postedAt({ ig_stats: { timestamp: '2026-02-01T00:00:00Z' }, updated_at: '2026-03-01T00:00:00Z' })).toBe('2026-02-01T00:00:00Z')
    expect(postedAt({ updated_at: '2026-03-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z' })).toBe('2026-03-01T00:00:00Z')
  })

  test('latestPosted keeps the twenty newest', () => {
    const rows = Array.from({ length: 25 }, (_, i) => ({
      id: 'p' + i,
      updated_at: `2026-01-${String(i + 1).padStart(2, '0')}T00:00:00Z`,
    }))
    const latest = latestPosted(rows)
    expect(latest).toHaveLength(MAX_POSTED)
    expect(latest[0].id).toBe('p24')
    expect(latest.at(-1).id).toBe('p5')
    expect(latestPosted(null)).toEqual([])
  })
})
