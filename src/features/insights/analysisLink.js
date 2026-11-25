// The feature row is shared by image hash. The link row is what ties it to one post or media id.
// A cache hit must not copy another post's id onto this request.

export function analysisLink(userId, analysisId, target) {
  if (!userId || !analysisId) return null
  const postId = target?.postId || null
  const mediaId = target?.mediaId ? String(target.mediaId).slice(0, 64) : null
  if (!postId && !mediaId) return null
  return { user_id: userId, analysis_id: analysisId, post_id: postId, media_id: mediaId }
}

/** Two requests may share features. They do not share a post id. */
export function keepsSeparatePosts(existingPostId, requestPostId) {
  if (!existingPostId || !requestPostId) return true
  return existingPostId !== requestPostId
}
