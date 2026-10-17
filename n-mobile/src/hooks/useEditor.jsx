import { useEffect, useMemo, useRef, useState } from 'react'
import { renderTo, fontsReady } from '../features/templates/index.js'
import { themeById } from '../features/themes/themes.js'
import { makeCaption } from '../features/editor/caption.js'
import { loadSettings, saveSettings } from '../features/settings/settingsApi.js'
import { savePost, listPosts, deletePost, postStatus } from '../features/posts/postsApi.js'
import { finishInstagramLogin, getInstagramAccount, publishToInstagram, findPermalinks, igProfileUrl } from '../features/instagram/instagram.js'
import { LS, loadImg } from '../lib/storage.js'
import { floodRemove, aiRemove, canFlood } from '../lib/bgRemove.js'
import { idbPut, idbGet, idbDel, idbKeys, photoKey, blobToImg, blobToDataURL, dataURLToBlob, fetchBlob, prepPhoto } from '../lib/photoStore.js'
import { TABS } from '../app/tabs.js'
import { EMPTY_X, EMPTY_CONTACT } from '../features/editor/fields.js'
import { EMPTY_SPECS, composeSpec, parseSpec } from '../features/editor/specFields.js'

// All editor state + actions. Returned object `ed` is passed to every tab component.
export default function useEditor(user) {
  const [ready, setReady] = useState(false)
  const [tab, setTab] = useState('foto')
  const [img, setImg] = useState(null)
  const [type, setType] = useState('post')
  const [tpl, setTpl] = useState('hero')
  const [theme, setTheme] = useState(LS.get('theme', 'standard'))
  const [model, setModel] = useState('')
  const [price, setPrice] = useState('')
  const [offer, setOffer] = useState('')
  const [specF, setSpecF] = useState(EMPTY_SPECS)
  const spec = useMemo(() => composeSpec(specF), [specF])
  const setSpecField = (id, v) => setSpecF((f) => ({ ...f, [id]: v }))
  const setSpec = (t) => setSpecF(parseSpec(t))
  const [x, setXAll] = useState(EMPTY_X)
  const setX = (k, v) => setXAll((o) => ({ ...o, [k]: v }))
  const [img2, setImg2] = useState(null)
  useEffect(() => { if (x.photo2) loadImg(x.photo2).then(setImg2).catch(() => setImg2(null)); else setImg2(null) }, [x.photo2])
  const [contact, setContactAll] = useState(() => { try { return { ...EMPTY_CONTACT, ...JSON.parse(LS.get('contact', '{}')) } } catch { return EMPTY_CONTACT } })
  const setContact = (k, v) => setContactAll((o) => ({ ...o, [k]: v }))
  useEffect(() => { LS.set('contact', JSON.stringify(contact)) }, [contact])
  const [code, setCode] = useState('')
  const [region, setRegion] = useState('')
  const [noActive, setNoActive] = useState(false)
  const [draftId, setDraftId] = useState(null)
  // Draft/post identity and its product photos. Refs (not state) so queued/debounced saves
  // always see the latest values. id = client uuid of the row (server and device).
  const idRef = useRef(null)
  const pathsRef = useRef({})                                // { image_path, photo_path, photo2_path } on the server row
  // blob = photo the templates use (cut-out PNG after background removal), orig = the photo as uploaded
  // (only kept while the background is removed, so "Rikthe origjinalin" works after reload); dirty = not yet on server
  const photoRef = useRef({ blob: null, orig: null, dirty: false })
  const [bg, setBg] = useState({ removed: false, smooth: false, busy: '', progress: 0 }) // background-removal UI state
  const photo2Saved = useRef('')                             // x.photo2 value last uploaded to the server row
  const restoring = useRef(false), warned = useRef(false)
  const [photoMissing, setMissingState] = useState(false)   // reopened draft whose photo was never saved
  const missingRef = useRef(false)
  const setPhotoMissing = (v) => { missingRef.current = v; setMissingState(v) }
  const [opening, setOpening] = useState(null)               // id of the post being reopened
  const [draftState, setDraftState] = useState('') // '' | 'saving' | 'saved'
  const draftT = useRef(null), dirty = useRef(false)
  const [info, setInfo] = useState(LS.get('info'))
  const [cta, setCta] = useState(LS.get('cta', 'Bli Tani!'))
  const [logoUrl, setLogoUrl] = useState(LS.get('logo'))
  const [logoImg, setLogoImg] = useState(null)
  const [variant, setVariant] = useState(0)
  const [caption, setCaption] = useState('')
  const [captionEdited, setCaptionEdited] = useState(false)
  const [settings, setSettings] = useState(false)
  const [toast, setToast] = useState('')
  const [synced, setSynced] = useState(!user)
  const saveT = useRef(null)
  const [ig, setIg] = useState(null)
  const [igBusy, setIgBusy] = useState(false)
  const [igLink, setIgLink] = useState('')
  useEffect(() => {
    if (!user) return
    finishInstagramLogin().then((r) => { if (r) say('Instagrami u lidh: @' + r.username) }).catch((e) => say(e.message)).finally(() => getInstagramAccount().then(setIg).catch(() => {}))
  }, [user])
  async function publishDirect() {
    setIgBusy(true); setIgLink('')
    try {
      const c = document.createElement('canvas'); await fontsReady(); renderTo(c, tpl, type, th, data, 1)
      const jpg = c.toDataURL('image/jpeg', 0.92)
      const r = await publishToInstagram(jpg, caption, type)
      setIgLink(r.permalink || ''); say('U postua në Instagram'); c.toBlob((b) => b && remember(b, { ig_media_id: r.id || null, ig_permalink: r.permalink || null }), 'image/png')
    } catch (e) { say('Postimi dështoi: ' + e.message) }
    setIgBusy(false)
  }
  const [posts, setPosts] = useState([])
  const [postsBusy, setPostsBusy] = useState(false)
  const localPosts = () => { try { return JSON.parse(LS.get('posts', '[]')) } catch { return [] } }
  async function refreshPosts() {
    setPostsBusy(true)
    try {
      if (user) {
        // server rows + drafts that could only be saved on this device (synced on the next successful save)
        const server = await listPosts(), ids = new Set(server.map((p) => p.id))
        const pend = localPosts().filter((p) => p.pending === user.id && !ids.has(p.id))
        setPosts([...pend, ...server].sort((a, b) => String(b.updated_at || b.created_at).localeCompare(String(a.updated_at || a.created_at))))
      } else setPosts(localPosts().filter((p) => !p.pending))
    } catch { setPosts(localPosts()); say('Postimet nuk u ngarkuan nga serveri') }
    setPostsBusy(false)
  }
  useEffect(() => { refreshPosts() }, [user])
  // Linku i Instagramit për postimet e vjetra pa ig_permalink (kërkohet një herë për seancë)
  const linkTried = useRef(new Set())
  useEffect(() => {
    if (!user || !ig) return
    const need = posts.filter((p) => postStatus(p) === 'posted' && !p.ig_permalink && !linkTried.current.has(p.id))
    if (!need.length) return
    need.forEach((p) => linkTried.current.add(p.id))
    findPermalinks(need.map((p) => ({ id: p.id, media_id: p.ig_media_id || null, caption: p.caption || '', at: p.updated_at || p.created_at })))
      .then(({ links }) => {
        if (!links || !Object.keys(links).length) return
        setPosts((list) => list.map((p) => (links[p.id] ? { ...p, ig_permalink: links[p.id] } : p)))
        const loc = localPosts(); if (loc.some((p) => links[p.id])) LS.set('posts', JSON.stringify(loc.map((p) => (links[p.id] ? { ...p, ig_permalink: links[p.id] } : p))))
      }).catch(() => {})
  }, [posts, ig, user])
  // Ku të çojë "Hape në Instagram": postimi i saktë, ose profili nëse linku s'dihet
  // Only for rows published to Instagram (media id or permalink); null otherwise
  const igUrlFor = (p) => (postStatus(p) === 'posted' ? p.ig_permalink || igProfileUrl(ig?.username || contact.instagram) : null)
  // photo2 is kept out of `extra` (it is stored as a file, see persistNow)
  const metaNow = (status) => ({ model, price, offer, spec, info, cta, model_code: code, region, no_active: noActive, extra: { ...x, photo2: '' }, template: tpl, type, theme, caption, status })
  function thumb(q = 0.25) { const c = document.createElement('canvas'); renderTo(c, tpl, type, th, data, q); return c }
  const toBlob = (c, t, q) => new Promise((res, rej) => { try { c.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), t, q) } catch (e) { rej(e) } })
  const newId = () => (globalThis.crypto?.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => { const r = (Math.random() * 16) | 0; return (ch === 'x' ? r : (r & 3) | 8).toString(16) }))
  // Device list (localStorage): metadata + small thumbnail only; photos are in IndexedDB.
  function writeLocal(out) {
    try { localStorage.setItem('nm_posts', JSON.stringify(out)); return true } catch {}
    try { localStorage.setItem('nm_posts', JSON.stringify(out.map((p, i) => (i ? { ...p, url: undefined } : p)))); return true } catch { return false }
  }
  function saveLocalRow(row) {
    const all = [row, ...localPosts().filter((p) => p.id !== row.id)]
    const keep = new Set(all.filter((p) => p.status === 'draft').slice(0, 15).map((p) => p.id))
    const out = all.filter((p) => p.status !== 'draft' || keep.has(p.id)).slice(0, 40)
    const ok = writeLocal(out)
    const ids = new Set(out.map((p) => p.id))
    idbKeys().then((ks) => { const drop = ks.filter((k) => !ids.has(String(k).split(':')[0])); if (drop.length) idbDel(...drop) })
    return ok
  }
  function removeLocal(id) {
    const list = localPosts()
    if (list.some((p) => p.id === id)) writeLocal(list.filter((p) => p.id !== id))
    idbDel(photoKey(id), photoKey(id, 'photo2'), photoKey(id, 'orig'))
  }
  async function persistNow(status, blob, igExtra) {
    const meta = { ...metaNow(status), ...(igExtra || {}) }
    if (!idRef.current) idRef.current = newId()
    const id = idRef.current, p2 = x.photo2 || '', now = new Date().toISOString()
    let serverOk = false
    if (user) {
      try {
        const files = { preview: blob || await toBlob(thumb(0.4), 'image/jpeg', 0.8) }
        if (photoRef.current.dirty) { files.photo = photoRef.current.blob || null; files.photoOrig = photoRef.current.orig || null }
        if (p2 !== photo2Saved.current) files.photo2 = p2 ? await dataURLToBlob(p2) : null
        pathsRef.current = await savePost(user.id, id, meta, files, pathsRef.current)
        photoRef.current.dirty = false; photo2Saved.current = p2; serverOk = true; warned.current = false
        removeLocal(id) // an older device-only copy of this draft is now on the server
      } catch (e) {
        console.error('Saving the post to Supabase failed, keeping it on this device', e)
        if (!warned.current) { warned.current = true; say('Serveri nuk u arrit – u ruajt vetëm në pajisje') }
      }
    }
    if (!serverOk) {
      const prev = localPosts().find((r) => r.id === id)
      try {
        if (photoRef.current.blob) await idbPut(photoKey(id), photoRef.current.blob)
        if (photoRef.current.orig) await idbPut(photoKey(id, 'orig'), photoRef.current.orig); else await idbDel(photoKey(id, 'orig'))
        if (p2) await idbPut(photoKey(id, 'photo2'), await dataURLToBlob(p2)); else await idbDel(photoKey(id, 'photo2'))
      } catch (e) { console.error('IndexedDB', e) }
      let url = ''; try { url = thumb().toDataURL('image/jpeg', 0.75) } catch {}
      saveLocalRow({ id, created_at: prev?.created_at || now, updated_at: now, ...meta, url, hasPhoto: Boolean(photoRef.current.blob), pending: user ? user.id : undefined, image_path: undefined })
    }
    if (status !== 'posted') setDraftId(id) // draft / exported: later edits keep updating this row
    else { // rows published to Instagram are final: further edits become a new draft with its own photo copies
      idRef.current = null; pathsRef.current = {}; photoRef.current.dirty = Boolean(photoRef.current.blob); photo2Saved.current = ''; setDraftId(null)
    }
    return serverOk || !user
  }
  // One save at a time (autosave + manual save + export must not race)
  const saveQ = useRef(Promise.resolve())
  const persist = (...a) => (saveQ.current = saveQ.current.then(() => persistNow(...a)).catch((e) => { console.error(e); return false }))
  // Download/share -> 'exported'; only a successful direct Instagram publish (has a media id) -> 'posted'
  async function remember(blob, ig) { clearTimeout(draftT.current); dirty.current = false; await persist(ig?.ig_media_id ? 'posted' : 'exported', blob, ig); refreshPosts() }
  async function saveDraft(silent) {
    if (!img) return
    clearTimeout(draftT.current); dirty.current = false; setDraftState('saving')
    await persist('draft'); setDraftState('saved'); refreshPosts(); if (!silent) say('U ruajt si draft')
  }
  // Stored photo of a row: device copy (IndexedDB) first, then the server file, then legacy inline dataURLs.
  async function photoOf(p, which) {
    const local = await idbGet(photoKey(p.id, which))
    if (local) return local
    if (which === 'orig') return p.pending ? null : fetchBlob(p.photoOrigUrl)
    return which === 'photo' ? fetchBlob(p.photoUrl) : fetchBlob(p.photo2Url || p.extra?.photo2 || '')
  }
  async function reuse(p) {
    setOpening(p.id)
    try {
      await saveQ.current
      const [b1, b2, b0] = await Promise.all([photoOf(p, 'photo'), photoOf(p, 'photo2'), photoOf(p, 'orig')])
      let im = null; if (b1) { try { im = await blobToImg(b1) } catch {} }
      let p2 = ''; if (b2) { try { p2 = await blobToDataURL(b2) } catch {} }
      const pst = postStatus(p), isDraft = pst !== 'posted' // drafts and exported posts are edited in place
      clearTimeout(draftT.current); dirty.current = false
      restoring.current = true; setTimeout(() => { restoring.current = false }, 500)
      setModel(p.model || ''); setPrice(p.price || ''); setOffer(p.offer || ''); setSpec(p.spec || ''); setInfo(p.info || ''); setCta(p.cta || '')
      setXAll({ ...EMPTY_X, ...(p.extra || {}), photo2: p2 }); setCode(p.model_code || ''); setRegion(p.region || ''); setNoActive(Boolean(p.no_active))
      setTpl(p.template || 'hero'); setType(p.type || 'post'); setTheme(p.theme || 'standard')
      // Draft: keep editing the same row. Posted: edits become a new draft (new id, own copies).
      idRef.current = isDraft ? p.id : null
      pathsRef.current = isDraft && !p.pending ? { image_path: p.image_path || null, photo_path: p.photo_path || null, photo2_path: p.photo2_path || null, photo_orig_path: p.photo_orig_path || null } : {}
      photoRef.current = { blob: im ? b1 : null, orig: im ? b0 || null : null, dirty: im ? !(isDraft && p.photo_path) : false }
      // Older photos with a solid background (white box): offer the same "Hiq sfondin" toggle
      let smooth = false, cut = Boolean(b0)
      if (im && !b0) { try { const a = await canFlood(b1); smooth = a.smooth; cut = a.alpha } catch {} }
      setBg({ removed: cut, smooth, busy: '', progress: 0 })
      photo2Saved.current = isDraft && p.photo2_path ? p2 : ''
      setDraftId(isDraft ? p.id : null); setDraftState('')
      setImg(im); setPhotoMissing(!im)
      const offerBg = im && !cut && smooth
      setTab(im && !offerBg ? 'detajet' : 'foto')
      say(offerBg ? 'Mund ta heqësh sfondin e fotos me “Hiq sfondin”' : im ? (pst === 'draft' ? 'Drafti u hap' : pst === 'exported' ? 'Postimi u hap' : 'Të dhënat u ngarkuan') : 'Fotoja e produktit mungon – ngarkoje përsëri, të dhënat u ruajtën')
    } finally { setOpening(null) }
  }
  function newPost() {
    idRef.current = null; pathsRef.current = {}; photoRef.current = { blob: null, orig: null, dirty: false }; photo2Saved.current = ''
    setBg({ removed: false, smooth: false, busy: '', progress: 0 })
    setDraftId(null); setDraftState(''); setPhotoMissing(false); setModel(''); setPrice(''); setOffer(''); setSpec(''); setXAll(EMPTY_X); setCode(''); setRegion(''); setNoActive(false); setCaptionEdited(false); dirty.current = false
  }
  async function removePost(p) {
    if (user && !p.pending) { try { await deletePost(p) } catch { say('Fshirja dështoi'); return } }
    removeLocal(p.id)
    if (p.id === idRef.current) { idRef.current = null; pathsRef.current = {}; photoRef.current.dirty = Boolean(photoRef.current.blob); photo2Saved.current = ''; setDraftId(null) }
    refreshPosts()
  }
  // One-time move of photos that older versions kept as dataURLs inside localStorage into IndexedDB.
  useEffect(() => {
    (async () => {
      const moved = {}
      for (const p of localPosts()) {
        const m = {}
        if (typeof p.photoUrl === 'string' && p.photoUrl.startsWith('data:')) { try { await idbPut(photoKey(p.id), await dataURLToBlob(p.photoUrl)); m.photoUrl = undefined; m.hasPhoto = true } catch {} }
        if (typeof p.extra?.photo2 === 'string' && p.extra.photo2.startsWith('data:')) { try { await idbPut(photoKey(p.id, 'photo2'), await dataURLToBlob(p.extra.photo2)); m.extra = { ...p.extra, photo2: '' } } catch {} }
        if (Object.keys(m).length) moved[p.id] = m
      }
      if (Object.keys(moved).length) writeLocal(localPosts().map((p) => (moved[p.id] ? { ...p, ...moved[p.id] } : p)))
    })()
  }, [])

  useEffect(() => { fontsReady().then(() => setReady(true)) }, [])
  useEffect(() => { LS.set('theme', theme) }, [theme])
  useEffect(() => { LS.set('info', info); LS.set('cta', cta) }, [info, cta])
  useEffect(() => { if (logoUrl) loadImg(logoUrl).then(setLogoImg).catch(() => setLogoImg(null)); else setLogoImg(null) }, [logoUrl])

  // Ngarko cilësimet nga Supabase (localStorage mbetet si cache)
  useEffect(() => {
    if (!user) return
    loadSettings(user.id).then((s) => { if (s) { setLogoUrl(s.logo || ''); setContactAll((o) => ({ ...o, ...Object.fromEntries(['phone', 'whatsapp', 'address', 'instagram'].filter((k) => s[k]).map((k) => [k, s[k]])) })) } }).catch(() => say('Pa lidhje – po përdoren të dhënat e ruajtura në pajisje')).finally(() => setSynced(true))
  }, [user])
  useEffect(() => {
    LS.set('logo', logoUrl)
    if (!user || !synced) return
    clearTimeout(saveT.current)
    saveT.current = setTimeout(() => saveSettings(user.id, { logo: logoUrl, ...contact }).catch(() => saveSettings(user.id, { logo: logoUrl }).catch(() => {})), 800)
  }, [logoUrl, contact, user, synced])

  const th = themeById(theme)
  const data = useMemo(() => ({ img, model, price, offer, spec, info, cta, code, region, noActive, ...x, img2, contact, logo: logoImg }), [img, model, price, offer, spec, info, cta, code, region, noActive, x, img2, contact, logoImg])
  useEffect(() => { if (!captionEdited) setCaption(makeCaption({ model, price, offer, specF, info, code, region, noActive, ...x, contact }, theme, variant)) }, [model, price, offer, spec, info, code, region, noActive, x, contact, theme, variant, captionEdited])
  // Autoruajtje e draftit (pas 2.5 s pa ndryshime)
  const firstRun = useRef(true)
  useEffect(() => {
    if (firstRun.current) { firstRun.current = false; return }
    if (restoring.current) { restoring.current = false; return } // state just loaded from a saved draft
    if (!img) return
    dirty.current = true; setDraftState('')
    clearTimeout(draftT.current)
    draftT.current = setTimeout(() => { if (dirty.current) saveDraft(true) }, 2500)
  }, [img, model, price, offer, spec, info, cta, code, region, noActive, x, tpl, type, theme])

  function say(m) { setToast(m); setTimeout(() => setToast(''), 2600) }
  // Picked product photo: downscaled once (max 1600 px, PNG kept if transparent) and kept as a Blob,
  // so drafts store exactly what the editor shows.
  // Solid/gradient backgrounds (any colour) are removed automatically with the fast flood fill;
  // the Photo step then shows the result with "Hiq sfondin" / "Rikthe origjinalin" (and the AI for busy backgrounds).
  async function usePhoto(blob, orig) {
    const im = await blobToImg(blob)
    photoRef.current = { blob, orig: orig || null, dirty: true }; setImg(im)
  }
  async function onPhoto(e) {
    const f = e.target.files?.[0]; if (!f) return
    e.target.value = ''
    try {
      const b = await prepPhoto(f)
      setBg({ removed: false, smooth: false, busy: 'flood', progress: 0 })
      let cut = null, a = { smooth: false, alpha: false }
      try { a = await canFlood(b); if (a.smooth) cut = await floodRemove(b) } catch (err) { console.error(err) }
      await usePhoto(cut || b, cut ? b : null)
      setBg({ removed: Boolean(cut) || a.alpha, smooth: a.smooth, busy: '', progress: 0 })
      setTab('foto'); setPhotoMissing(false)
      if (cut) say('Sfondi u hoq automatikisht')
    } catch { setBg((s) => ({ ...s, busy: '' })); say('Fotoja nuk u lexua – provo një tjetër') }
  }
  // on = remove the background (fast flood fill, or the AI for busy backgrounds / when ai = true); off = original
  async function setBgRemoved(on, ai = false) {
    const cur = photoRef.current; if (!cur.blob || bg.busy) return
    if (!on) { if (cur.orig) { await usePhoto(cur.orig, null); setBg((s) => ({ ...s, removed: false })) } return }
    const src = cur.orig || cur.blob
    setBg((s) => ({ ...s, busy: ai ? 'ai' : 'flood', progress: 0 }))
    try {
      let out = null
      if (!ai) out = await floodRemove(src, { force: true })
      if (!out) { ai = true; setBg((s) => ({ ...s, busy: 'ai' })); out = await aiRemove(src, (v) => setBg((s) => ({ ...s, progress: v }))) }
      await usePhoto(out, src); setBg((s) => ({ ...s, removed: true, busy: '' }))
      say(ai ? 'Sfondi u hoq (AI)' : 'Sfondi u hoq')
    } catch (err) { console.error(err); setBg((s) => ({ ...s, busy: '' })); say('Heqja e sfondit dështoi – provo përsëri') }
  }

  async function makeBlob() { const c = document.createElement('canvas'); await fontsReady(); renderTo(c, tpl, type, th, data, 1); return new Promise((res) => c.toBlob(res, 'image/png')) }
  const fileName = () => `nmobile-${(model || 'postim').replace(/[^\w-]+/g, '-').toLowerCase()}-${type}.png`
  async function download() {
    const b = await makeBlob(); remember(b); const url = URL.createObjectURL(b)
    const a = document.createElement('a'); a.href = url; a.download = fileName(); document.body.appendChild(a); a.click(); a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 3000); say('Fotoja u shkarkua')
  }
  async function copyCaption(silent) { try { await navigator.clipboard.writeText(caption); if (!silent) say('Caption u kopjua') } catch { if (!silent) say('Mbaje gishtin mbi tekst dhe kopjo') } }
  async function share() {
    await copyCaption(true)
    const b = await makeBlob(); const file = new File([b], fileName(), { type: 'image/png' })
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try { await navigator.share({ files: [file], text: caption }); remember(b); say('Caption-i u kopjua – ngjite në Instagram') } catch (e) { if (e.name !== 'AbortError') say('Ndarja dështoi') }
    } else { await download(); say('Fotoja u shkarkua dhe caption-i u kopjua') }
  }

  const idx = TABS.findIndex((t) => t.id === tab)
  const next = TABS[idx + 1]
  const preview = img && !['foto', 'template'].includes(tab)

  return { bg, setBgRemoved, photoBlob: () => photoRef.current, photoMissing, opening, igUrlFor, x, setX, setXAll, img2, contact, setContact, specF, setSpecField, code, setCode, region, setRegion, noActive, setNoActive, draftId, draftState, saveDraft, newPost, caption, captionEdited, copyCaption, cta, data, download, fileName, idx, ig, igBusy, igLink, img, info, localPosts, logoImg, logoUrl, makeBlob, model, next, offer, onPhoto, posts, postsBusy, preview, price, publishDirect, ready, refreshPosts, remember, removePost, reuse, saveT, say, setCaption, setCaptionEdited, setCta, setIg, setIgBusy, setIgLink, setImg, setInfo, setLogoImg, setLogoUrl, setModel, setOffer, setPosts, setPostsBusy, setPrice, setReady, setSettings, setSpec, setSynced, setTab, setTheme, setToast, setTpl, setType, setVariant, settings, share, spec, synced, tab, th, theme, toast, tpl, type, user, variant }
}
