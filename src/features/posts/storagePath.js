// A storage object belongs to a user only when it lives in that user's folder.
export function ownsStoragePath(userId, path) {
  if (!userId || typeof path !== 'string' || !path) return false
  if (path.includes('..') || path.includes('\\')) return false
  const folder = path.split('/')[0]
  return folder === String(userId) && path.length > folder.length + 1
}
