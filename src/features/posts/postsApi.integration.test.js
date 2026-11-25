import { beforeEach, describe, expect, test, vi } from 'vitest'
import { MAX_DRAFTS } from './limits.js'

const store = vi.hoisted(() => ({ posts: [], files: new Map(), failUpsert: false }))

function matches(row, filters) {
  return filters.every(([op, col, val]) => {
    if (op === 'neq') return row[col] !== val
    if (op === 'in') return val.includes(row[col])
    return row[col] === val
  })
}

function execute(q) {
  if (q.op === 'upsert') {
    if (store.failUpsert) return { data: null, error: new Error('upsert failed') }
    const i = store.posts.findIndex((r) => r.id === q.row.id)
    if (i >= 0) store.posts[i] = { ...store.posts[i], ...q.row }
    else store.posts.push({ ...q.row })
    return { data: null, error: null }
  }
  let rows = store.posts.filter((r) => matches(r, q.filters))
  if (q.op === 'update') {
    for (const row of rows) Object.assign(row, q.patch)
    return { data: null, error: null }
  }
  if (q.op === 'delete') {
    const ids = new Set(rows.map((r) => r.id))
    store.posts = store.posts.filter((r) => !ids.has(r.id))
    return { data: null, error: null }
  }
  if (q.order) {
    const { col, ascending } = q.order
    rows = [...rows].sort((a, b) => String(a[col] ?? '').localeCompare(String(b[col] ?? '')) * (ascending ? 1 : -1))
  }
  if (q.limit) rows = rows.slice(0, q.limit)
  return { data: rows.map((r) => ({ ...r })), error: null }
}

function query() {
  const q = { op: 'select', filters: [], order: null, limit: null, patch: null, row: null }
  const api = {
    select() { q.op = 'select'; return api },
    update(patch) { q.op = 'update'; q.patch = patch; return api },
    upsert(row) { q.op = 'upsert'; q.row = row; return api },
    delete() { q.op = 'delete'; return api },
    eq(col, val) { q.filters.push(['eq', col, val]); return api },
    neq(col, val) { q.filters.push(['neq', col, val]); return api },
    in(col, vals) { q.filters.push(['in', col, vals]); return api },
    order(col, opt = {}) { q.order = { col, ascending: opt.ascending !== false }; return api },
    limit(n) { q.limit = n; return api },
    then(onOk, onErr) { return Promise.resolve(execute(q)).then(onOk, onErr) },
  }
  return api
}

const supabase = vi.hoisted(() => ({
  from() { return query() },
  storage: {
    from() {
      return {
        async upload(path, blob) { store.files.set(path, blob); return { error: null } },
        async remove(paths) { for (const p of paths || []) store.files.delete(p); return { error: null } },
        async createSignedUrls(paths) {
          return { data: paths.map((path) => ({ path, signedUrl: `https://files.test/${path}` })) }
        },
      }
    },
  },
}))

vi.mock('../../lib/supabase.js', () => ({ supabase, supabaseReady: true }))

import { cancelSchedule, deletePost, listPosts, reschedulePost, savePost } from './postsApi.js'

const uid = '11111111-1111-4111-8111-111111111111'

beforeEach(() => {
  store.posts = []
  store.files = new Map()
  store.failUpsert = false
})

describe('savePost', () => {
  test('creates a draft, then updates the same row and replaces the file', async () => {
    const id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
    const first = await savePost(uid, id, { status: 'draft', model: 'iPhone 13' }, { preview: new Blob(['one'], { type: 'image/jpeg' }) })
    expect(first.image_path.startsWith(`${uid}/${id}-draft-`)).toBe(true)
    expect(store.posts).toHaveLength(1)
    expect(store.files.has(first.image_path)).toBe(true)

    const second = await savePost(uid, id, { status: 'draft', model: 'iPhone 13 Pro' }, { preview: new Blob(['two'], { type: 'image/jpeg' }) }, first)
    expect(store.posts).toHaveLength(1)
    expect(store.posts[0].model).toBe('iPhone 13 Pro')
    expect(second.image_path).not.toBe(first.image_path)
    expect(store.files.has(first.image_path)).toBe(false)
    expect(store.files.has(second.image_path)).toBe(true)
  })

  test('stores the product photo and removes it when the next save clears it', async () => {
    const id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
    const photo = new Blob(['photo'], { type: 'image/png' })
    const paths = await savePost(uid, id, { status: 'draft', model: 'A' }, { preview: new Blob(['p'], { type: 'image/jpeg' }), photo })
    expect(paths.photo_path.endsWith('.png')).toBe(true)
    const cleared = await savePost(uid, id, { status: 'draft', model: 'A' }, { photo: null }, paths)
    expect(cleared.photo_path).toBeNull()
    expect(store.files.has(paths.photo_path)).toBe(false)
  })

  test('drops the oldest drafts beyond the cap before a new draft is saved', async () => {
    const existing = Array.from({ length: MAX_DRAFTS }, (_, i) => ({
      id: `old-${i}`,
      user_id: uid,
      status: 'draft',
      created_at: `2026-01-0${i + 1}T00:00:00Z`,
      image_path: `${uid}/old-${i}.jpg`,
    }))
    for (const row of existing) store.files.set(row.image_path, new Blob(['x']))
    store.posts = existing
    const id = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    await savePost(uid, id, { status: 'draft', model: 'New' }, { preview: new Blob(['n'], { type: 'image/jpeg' }) })
    const drafts = store.posts.filter((p) => p.status === 'draft')
    expect(drafts).toHaveLength(MAX_DRAFTS)
    expect(drafts.find((p) => p.id === 'old-0')).toBeUndefined()
    expect(drafts.find((p) => p.id === id)).toBeTruthy()
    expect(store.files.has(`${uid}/old-0.jpg`)).toBe(false)
  })

  test('a failed save removes the file it just uploaded', async () => {
    store.failUpsert = true
    const id = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
    await expect(savePost(uid, id, { status: 'draft', model: 'X' }, { preview: new Blob(['z'], { type: 'image/jpeg' }) })).rejects.toThrow('upsert failed')
    expect(store.posts).toHaveLength(0)
    expect(store.files.size).toBe(0)
  })
})

describe('listPosts and deletePost', () => {
  test('returns signed file urls and delete removes the row and its files', async () => {
    const id = 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee'
    const paths = await savePost(uid, id, { status: 'exported', model: 'Listed' }, { preview: new Blob(['l'], { type: 'image/jpeg' }) })
    const list = await listPosts()
    expect(list).toHaveLength(1)
    expect(list[0].url).toBe(`https://files.test/${paths.image_path}`)
    await deletePost(list[0])
    expect(store.posts).toHaveLength(0)
    expect(store.files.size).toBe(0)
  })
})

describe('planned post transitions', () => {
  test('reschedule moves a failed post back to scheduled, and cancel returns it to a draft', async () => {
    const id = 'ffffffff-ffff-4fff-8fff-ffffffffffff'
    store.posts.push({ id, user_id: uid, status: 'failed', scheduled_at: '2026-06-01T10:00:00Z', schedule_error: 'nuk u arrit', model: 'Plan' })
    const at = '2026-06-20T09:00:00.000Z'
    await reschedulePost(id, at)
    expect(store.posts[0]).toMatchObject({ status: 'scheduled', scheduled_at: at, schedule_error: null })

    await cancelSchedule(uid, id)
    expect(store.posts[0]).toMatchObject({ status: 'draft', scheduled_at: null, schedule_error: null })
  })

  test('a post that is already publishing is not rescheduled or cancelled', async () => {
    const id = '12121212-1212-4121-8121-121212121212'
    store.posts.push({ id, user_id: uid, status: 'publishing', scheduled_at: '2026-06-01T10:00:00Z', model: 'Busy' })
    await reschedulePost(id, '2026-07-01T10:00:00.000Z')
    await cancelSchedule(uid, id)
    expect(store.posts[0].status).toBe('publishing')
    expect(store.posts[0].scheduled_at).toBe('2026-06-01T10:00:00Z')
  })
})
