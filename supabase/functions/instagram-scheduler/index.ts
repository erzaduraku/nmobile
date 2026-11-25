// Publishes scheduled posts whose time has come. Called every 5 minutes by pg_cron (migration 015).
// Protected by the x-scheduler-secret header, checked against the Vault secret in the database.
import { admin, freshToken, json } from '../_shared/common.ts'
import { publishImage } from '../_shared/publish.ts'

const BATCH = 3 // each publish can take ~45 s; stay well inside the function time limit
const MAX_POSTED = 20 // same limit as src/features/posts/limits.js
const STUCK_MIN = 15 // a row left in 'publishing' this long was interrupted
const FILE_COLS = ['image_path', 'photo_path', 'photo2_path', 'photo_orig_path']
const nowIso = () => new Date().toISOString()

type Db = ReturnType<typeof admin>

// Keeps room for one more posted row: removes the oldest posted rows (files first, then rows).
async function prunePosted(db: Db, uid: string, keepId: string) {
  const { data } = await db.from('posts').select(['id', ...FILE_COLS].join(',')).eq('user_id', uid).eq('status', 'posted').neq('id', keepId).order('updated_at', { ascending: false })
  const old = (data || []).slice(MAX_POSTED - 1) as Record<string, string | null>[]
  if (!old.length) return
  const files = old.flatMap((r) => FILE_COLS.map((c) => r[c]).filter(Boolean)) as string[]
  if (files.length) await db.storage.from('posts').remove(files)
  await db.from('posts').delete().in('id', old.map((r) => r.id))
}

async function publishOne(db: Db, id: string) {
  // lock: only one run can move the row from 'scheduled' to 'publishing'
  const { data: row } = await db.from('posts').update({ status: 'publishing', updated_at: nowIso() }).eq('id', id).eq('status', 'scheduled').select('*').maybeSingle()
  if (!row) return { id, skipped: true }
  try {
    if (!row.image_path) throw new Error('Mungon fotoja e postimit')
    if (row.image_path.includes('..') || row.image_path.split('/')[0] !== row.user_id) throw new Error('Fotoja nuk i përket këtij postimi')
    if (row.ig_media_id) {
      await db.from('posts').update({ status: 'posted', schedule_error: null, updated_at: nowIso() }).eq('id', id)
      return { id, posted: row.ig_media_id, skipped: true }
    }
    const { data: acc } = await db.from('instagram_accounts').select('*').eq('user_id', row.user_id).maybeSingle()
    if (!acc) throw new Error('Instagrami nuk është i lidhur')
    const token = await freshToken(acc)
    const file = await db.storage.from('posts').download(row.image_path)
    if (file.error || !file.data) throw new Error('Fotoja nuk u gjet në server')
    const r = await publishImage(acc.ig_user_id, token, row.user_id, new Uint8Array(await file.data.arrayBuffer()), row.caption || '', row.type || 'post')
    const saved = await db.from('posts').update({ status: 'posted', ig_media_id: r.id, ig_permalink: r.permalink, schedule_error: null, updated_at: nowIso() }).eq('id', id)
    if (saved.error) throw saved.error
    await prunePosted(db, row.user_id, row.id)
    return { id, posted: r.id }
  } catch (e) {
    const { data: cur } = await db.from('posts').select('ig_media_id').eq('id', id).maybeSingle()
    if (cur?.ig_media_id) {
      await db.from('posts').update({ status: 'posted', schedule_error: null, updated_at: nowIso() }).eq('id', id)
      return { id, posted: cur.ig_media_id }
    }
    const error = String((e as Error)?.message || e).slice(0, 300)
    await db.from('posts').update({ status: 'failed', schedule_error: error, updated_at: nowIso() }).eq('id', id)
    return { id, error }
  }
}

Deno.serve(async (req) => {
  const db = admin()
  try {
    const { data: ok } = await db.rpc('check_scheduler_secret', { s: req.headers.get('x-scheduler-secret') || '' })
    if (ok !== true) return json({ error: 'Forbidden' }, 403)
    // A publish that already received a media id must not be marked failed and published again.
    await db.from('posts').update({ status: 'posted', schedule_error: null, updated_at: nowIso() })
      .eq('status', 'publishing').not('ig_media_id', 'is', null)
    await db.from('posts').update({ status: 'failed', schedule_error: 'Postimi u ndërpre. Kontrollo Instagramin para se ta planifikosh sërish.', updated_at: nowIso() })
      .eq('status', 'publishing').is('ig_media_id', null).lt('updated_at', new Date(Date.now() - STUCK_MIN * 60e3).toISOString())
    const { data: due, error } = await db.from('posts').select('id').eq('status', 'scheduled').lte('scheduled_at', nowIso()).order('scheduled_at').limit(BATCH)
    if (error) return json({ error: error.message }, 500)
    const results = []
    for (const { id } of due || []) results.push(await publishOne(db, id))
    return json({ processed: results.length, results })
  } catch (e) { return json({ error: String(e) }, 500) }
})
