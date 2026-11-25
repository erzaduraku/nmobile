import { describe, expect, test } from 'vitest'
import { PLANNED, isPlanned, postStatus } from './postsApi.js'

describe('postStatus', () => {
  test('keeps draft, export and planned statuses as stored', () => {
    for (const status of ['draft', 'exported', ...PLANNED]) {
      expect(postStatus({ status })).toBe(status)
      expect(isPlanned({ status })).toBe(PLANNED.includes(status))
    }
  })

  test('a posted flag without an Instagram id is only an export', () => {
    expect(postStatus({ status: 'posted' })).toBe('exported')
    expect(postStatus({ status: 'posted', ig_permalink: '' })).toBe('exported')
  })

  test('an Instagram id or permalink means the post is published', () => {
    expect(postStatus({ status: 'posted', ig_media_id: '1789' })).toBe('posted')
    expect(postStatus({ status: '', ig_permalink: 'https://instagram.com/p/abc' })).toBe('posted')
    expect(isPlanned({ status: 'posted', ig_media_id: '1789' })).toBe(false)
  })
})
