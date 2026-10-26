// How many posts are kept per user (first in, first out), so the database and storage don't keep growing.
// The same limits are enforced in the database by migrations 013 (drafts) and 014 (posted).
export const MAX_DRAFTS = 5
export const MAX_POSTED = 20

// When a published post went live: Instagram's timestamp if known, else the row's last change.
export const postedAt = (p) => String(p.ig_stats?.timestamp || p.ig?.timestamp || p.updated_at || p.created_at || '')
// The MAX_POSTED newest of the given (already published) posts, newest first.
// Promote suggestion and statistics only look at these.
export const latestPosted = (rows) => [...(rows || [])].sort((a, b) => postedAt(b).localeCompare(postedAt(a))).slice(0, MAX_POSTED)
