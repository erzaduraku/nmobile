import { describe, expect, test } from 'vitest'
import { MAX_DRAFTS } from './limits.js'
import { LOCAL_LIST_CAP, nextLocalPosts, postsForView, restoreTarget } from './devicePosts.js'

const uid = 'user-1'
const row = (id, extra) => ({ id, status: 'draft', model: id, updated_at: '2026-05-01T00:00:00Z', created_at: '2026-05-01T00:00:00Z', ...extra })

describe('local drafts', () => {
  test('a new draft is stored first and the oldest draft past the cap is dropped', () => {
    const existing = Array.from({ length: MAX_DRAFTS }, (_, i) => row('d' + i, { updated_at: `2026-05-0${i + 1}T00:00:00Z` }))
    const saved = row('fresh', { model: 'iPhone 13', updated_at: '2026-06-01T00:00:00Z' })
    const next = nextLocalPosts(existing, saved)
    expect(next[0]).toMatchObject({ id: 'fresh', model: 'iPhone 13', status: 'draft' })
    expect(next.filter((p) => p.status === 'draft')).toHaveLength(MAX_DRAFTS)
    expect(next.find((p) => p.id === 'd4')).toBeUndefined()
    expect(next.find((p) => p.id === 'd0')).toBeTruthy()
  })

  test('saving the same draft again replaces it instead of duplicating it', () => {
    const first = nextLocalPosts([], row('same', { model: 'A' }))
    const second = nextLocalPosts(first, row('same', { model: 'B' }))
    expect(second).toHaveLength(1)
    expect(second[0].model).toBe('B')
  })

  test('published rows stay when drafts are trimmed, and the list stays capped', () => {
    const posted = Array.from({ length: 10 }, (_, i) => row('p' + i, { status: 'posted' }))
    const drafts = Array.from({ length: 8 }, (_, i) => row('d' + i))
    const next = nextLocalPosts([...posted, ...drafts], row('new'))
    expect(next.filter((p) => p.status === 'posted')).toHaveLength(10)
    expect(next.filter((p) => p.status === 'draft')).toHaveLength(MAX_DRAFTS)
    const many = Array.from({ length: LOCAL_LIST_CAP + 5 }, (_, i) => row('x' + i, { status: 'exported' }))
    expect(nextLocalPosts(many, row('y', { status: 'exported' }))).toHaveLength(LOCAL_LIST_CAP)
  })
})

describe('local and remote sync', () => {
  test('pending device drafts are shown until the server has that id', () => {
    const local = [row('pending', { pending: uid, model: 'Vetëm këtu' }), row('other', { pending: 'someone-else' })]
    const server = [row('remote', { status: 'posted', model: 'Në server', updated_at: '2026-06-02T00:00:00Z' })]
    const view = postsForView({ userId: uid, server, local })
    expect(view.map((p) => p.id)).toEqual(['remote', 'pending'])
  })

  test('a pending draft disappears from the device queue once the server returns it', () => {
    const local = [row('same', { pending: uid, model: 'Lokal' })]
    const server = [row('same', { model: 'Server' })]
    const view = postsForView({ userId: uid, server, local })
    expect(view).toHaveLength(1)
    expect(view[0].model).toBe('Server')
  })

  test('offline mode hides rows that belong to an account, and a failed load keeps the device copy', () => {
    const local = [row('mine'), row('queued', { pending: uid }), row('gone', { ig_deleted_at: '2026-06-01T00:00:00Z' })]
    expect(postsForView({ local }).map((p) => p.id)).toEqual(['mine'])
    expect(postsForView({ failed: true, local }).map((p) => p.id).sort()).toEqual(['mine', 'queued'])
  })

  test('instagram-deleted rows stay hidden when they come from the server', () => {
    const server = [row('live'), row('deleted', { ig_deleted_at: '2026-06-01T00:00:00Z' })]
    expect(postsForView({ userId: uid, server, local: [] }).map((p) => p.id)).toEqual(['live'])
  })
})

describe('restoreTarget', () => {
  test('a draft reopens on the same id and storage paths', () => {
    const target = restoreTarget({
      id: 'draft-1', status: 'draft', image_path: 'u/a.jpg', photo_path: 'u/p.jpg', photo2_path: null,
    })
    expect(target).toMatchObject({
      status: 'draft',
      editInPlace: true,
      id: 'draft-1',
      paths: { image_path: 'u/a.jpg', photo_path: 'u/p.jpg', photo2_path: null, photo_orig_path: null },
    })
  })

  test('a published post is restored as new work, and a pending draft uploads again', () => {
    const posted = restoreTarget({ id: 'pub', status: 'posted', ig_media_id: 'm1', image_path: 'u/a.jpg', photo_path: 'u/p.jpg' })
    expect(posted.editInPlace).toBe(false)
    expect(posted.id).toBeNull()
    expect(posted.paths).toEqual({})

    const pending = restoreTarget({ id: 'local', status: 'draft', pending: uid, image_path: 'old' })
    expect(pending.editInPlace).toBe(true)
    expect(pending.id).toBe('local')
    expect(pending.paths).toEqual({})

    expect(restoreTarget({ id: 'exp', status: 'exported', image_path: 'u/e.jpg' }).editInPlace).toBe(true)
  })
})
