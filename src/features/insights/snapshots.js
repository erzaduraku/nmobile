export const ALGORITHM_VERSION = '2'

export function recommendationRows(userId, postId, items) {
  return (items || []).filter((item) => item?.id && item?.format).map((item) => ({
    user_id: userId,
    post_id: postId || null,
    category: item.category || null,
    format: item.format,
    recommendation_type: item.id,
    template_id: item.apply?.tpl || null,
    theme_id: item.apply?.theme || null,
    score: null,
    evidence: { reason: item.reason || '', detail: item.detail || '', scope: item.scope || 'format' },
    sample_size: Number.isInteger(item.sampleSize) ? item.sampleSize : null,
    confidence: typeof item.confidence === 'number' ? item.confidence : null,
    algorithm_version: ALGORITHM_VERSION,
    dedupe_key: [item.format, item.id, item.scope || 'format', item.apply?.tpl || '', item.apply?.theme || '', item.apply?.cta || '', item.apply?.offer || ''].join('|'),
  }))
}
