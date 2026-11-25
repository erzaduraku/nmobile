// A planned post that already has an Instagram media id must not be published again.
export function needsInstagramPublish(row) {
  return !row?.ig_media_id
}
