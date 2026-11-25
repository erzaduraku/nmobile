// Device copy of the post list (localStorage metadata) and how it lines up with the server.
// Photos themselves stay in IndexedDB; this only decides which rows are shown and reopened.
import { postStatus } from './postsApi.js'
import { MAX_DRAFTS } from './limits.js'

export const LOCAL_LIST_CAP = 40

/** Puts `row` first, keeps at most MAX_DRAFTS drafts, and caps the whole list. */
export function nextLocalPosts(existing, row, maxDrafts = MAX_DRAFTS) {
  const all = [row, ...(existing || []).filter((p) => p.id !== row.id)]
  const keep = new Set(all.filter((p) => p.status === 'draft').slice(0, maxDrafts).map((p) => p.id))
  return all.filter((p) => p.status !== 'draft' || keep.has(p.id)).slice(0, LOCAL_LIST_CAP)
}

/**
 * Rows the app should show.
 * Logged in: server rows, plus this device's pending drafts the server does not have yet.
 * Logged out: device rows that were never queued for a user.
 * When the server request failed: whatever is on the device, including pending rows.
 * Posts deleted on Instagram stay stored but are hidden.
 */
export function postsForView({ userId, server, local, failed }) {
  const visible = (rows) => (rows || []).filter((p) => !p.ig_deleted_at)
  if (failed) return visible(local)
  if (userId) {
    const ids = new Set((server || []).map((p) => p.id))
    const pend = (local || []).filter((p) => p.pending === userId && !ids.has(p.id))
    return [...pend, ...(server || [])].filter((p) => !p.ig_deleted_at).sort((a, b) => String(b.updated_at || b.created_at).localeCompare(String(a.updated_at || a.created_at)))
  }
  return (local || []).filter((p) => !p.pending && !p.ig_deleted_at)
}

/** Drafts and downloaded posts keep their id. A published post is copied into a new draft. */
export function restoreTarget(p) {
  const status = postStatus(p)
  const editInPlace = status !== 'posted'
  const paths = editInPlace && !p.pending
    ? {
      image_path: p.image_path || null,
      photo_path: p.photo_path || null,
      photo2_path: p.photo2_path || null,
      photo_orig_path: p.photo_orig_path || null,
    }
    : {}
  return { status, editInPlace, id: editInPlace ? p.id : null, paths }
}
