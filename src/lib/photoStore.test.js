import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { fetchBlob, idbDel, idbGet, idbKeys, idbPut, photoKey } from './photoStore.js'

describe('photoKey', () => {
  test('names the product photo, the second photo and the original', () => {
    expect(photoKey('abc')).toBe('abc:photo')
    expect(photoKey('abc', 'photo2')).toBe('abc:photo2')
    expect(photoKey('abc', 'orig')).toBe('abc:orig')
  })
})

describe('IndexedDB photo blobs', () => {
  beforeEach(async () => {
    const keys = await idbKeys()
    if (keys.length) await idbDel(...keys)
  })

  test('stores, reads and deletes a photo blob', async () => {
    const blob = new Blob(['phone-bytes'], { type: 'image/jpeg' })
    await idbPut(photoKey('draft-1'), blob)
    await idbPut(photoKey('draft-1', 'orig'), new Blob(['orig'], { type: 'image/jpeg' }))
    const stored = await idbGet(photoKey('draft-1'))
    expect(stored).toBeInstanceOf(Blob)
    expect(await stored.text()).toBe('phone-bytes')
    expect(await idbKeys()).toEqual(expect.arrayContaining([photoKey('draft-1'), photoKey('draft-1', 'orig')]))
    await idbDel(photoKey('draft-1'), photoKey('draft-1', 'orig'))
    expect(await idbGet(photoKey('draft-1'))).toBeUndefined()
    expect(await idbKeys()).toEqual([])
  })
})

describe('fetchBlob', () => {
  test('returns an image blob and rejects an empty or failed response', async () => {
    expect(await fetchBlob('')).toBeNull()
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })))
    expect(await fetchBlob('https://cdn.example/missing.jpg')).toBeNull()

    const image = new Blob(['img'], { type: 'image/png' })
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, blob: async () => image })))
    expect(await fetchBlob('https://cdn.example/a.png')).toBe(image)

    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, blob: async () => new Blob([], { type: 'image/png' }) })))
    expect(await fetchBlob('https://cdn.example/empty.png')).toBeNull()

    const odd = new Blob(['raw'], { type: 'application/octet-stream' })
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, blob: async () => odd })))
    const coerced = await fetchBlob('https://cdn.example/no-type')
    expect(coerced.type).toBe('image/jpeg')
    expect(coerced.size).toBe(odd.size)

    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('offline') }))
    expect(await fetchBlob('https://cdn.example/down.jpg')).toBeNull()
    vi.unstubAllGlobals()
  })
})
