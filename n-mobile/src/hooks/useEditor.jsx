import { useEffect, useMemo, useRef, useState } from 'react'
import { renderTo, fontsReady } from '../features/templates/index.js'
import { themeById } from '../features/themes/themes.js'
import { makeCaption } from '../features/editor/caption.js'
import { loadSettings, saveSettings } from '../features/settings/settingsApi.js'
import { savePost, listPosts, deletePost } from '../features/posts/postsApi.js'
import { finishInstagramLogin, getInstagramAccount, publishToInstagram } from '../features/instagram/instagram.js'
import { LS, loadImg, readFile } from '../lib/storage.js'
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
  const [photoPath, setPhotoPath] = useState(null)
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
      setIgLink(r.permalink || ''); say('U postua në Instagram'); c.toBlob((b) => b && remember(b), 'image/png')
    } catch (e) { say('Postimi dështoi: ' + e.message) }
    setIgBusy(false)
  }
  const [posts, setPosts] = useState([])
  const [postsBusy, setPostsBusy] = useState(false)
  const localPosts = () => { try { return JSON.parse(LS.get('posts', '[]')) } catch { return [] } }
  async function refreshPosts() {
    setPostsBusy(true)
    try { setPosts(user ? await listPosts() : localPosts()) } catch { setPosts(localPosts()); say('Postimet nuk u ngarkuan nga serveri') }
    setPostsBusy(false)
  }
  useEffect(() => { refreshPosts() }, [user])
  const metaNow = (status) => ({ model, price, offer, spec, info, cta, model_code: code, region, no_active: noActive, extra: x, template: tpl, type, theme, caption, status })
  async function photoJpeg() { if (!img) return null; const c = document.createElement('canvas'); const k = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight)); c.width = img.naturalWidth * k; c.height = img.naturalHeight * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); return new Promise((r) => c.toBlob(r, 'image/jpeg', 0.85)) }
  function thumb(q = 0.25) { const c = document.createElement('canvas'); renderTo(c, tpl, type, th, data, q); return c }
  // Lokal: lista me postime/drafte (drafti ruan edhe foton e zvogëluar)
  function saveLocal(row) {
    const list = localPosts().filter((x) => x.id !== row.id)
    const drafts = [row, ...list].filter((x) => x.status === 'draft')
    const keep = new Set(drafts.slice(0, 10).map((x) => x.id))
    const out = [row, ...list].filter((x) => x.status !== 'draft' || keep.has(x.id)).slice(0, 40)
    try { LS.set('posts', JSON.stringify(out)) } catch { try { LS.set('posts', JSON.stringify(out.map((x) => (x.id === row.id ? x : { ...x, photoUrl: undefined })))) } catch {} }
  }
  async function persist(status, blob) {
    const meta = metaNow(status)
    if (user) {
      try {
        const preview = blob || await new Promise((r) => thumb(0.4).toBlob(r, 'image/jpeg', 0.8))
        const photo = status === 'draft' && !photoPath ? await photoJpeg() : null
        const r = await savePost(user.id, meta, { id: draftId, preview, photo, photoPath })
        if (status === 'draft') { setDraftId(r.id); setPhotoPath(r.photo_path) } else { setDraftId(null); setPhotoPath(null) }
        return true
      } catch (e) { /* bie te ruajtja lokale */ }
    }
    const id = draftId || String(Date.now())
    const prev = localPosts().find((x) => x.id === id)
    let photoUrl = prev?.photoUrl
    if (status === 'draft' && !photoUrl && img) { const c = document.createElement('canvas'); const k = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight)); c.width = img.naturalWidth * k; c.height = img.naturalHeight * k; c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); photoUrl = c.toDataURL('image/jpeg', 0.8) }
    saveLocal({ id, created_at: prev?.created_at || new Date().toISOString(), updated_at: new Date().toISOString(), ...meta, url: thumb().toDataURL('image/jpeg', 0.75), photoUrl: status === 'draft' ? photoUrl : undefined })
    setDraftId(status === 'draft' ? id : null)
    return true
  }
  // Eksporti / postimi: drafti bëhet "posted"
  async function remember(blob) { clearTimeout(draftT.current); dirty.current = false; await persist('posted', blob); refreshPosts() }
  async function saveDraft(silent) {
    if (!img) return
    clearTimeout(draftT.current); dirty.current = false; setDraftState('saving')
    await persist('draft'); setDraftState('saved'); refreshPosts(); if (!silent) say('U ruajt si draft')
  }
  async function reuse(p) {
    setModel(p.model || ''); setPrice(p.price || ''); setOffer(p.offer || ''); setSpec(p.spec || ''); setInfo(p.info || ''); setCta(p.cta || '')
    setXAll({ ...EMPTY_X, ...(p.extra || {}) }); setCode(p.model_code || ''); setRegion(p.region || ''); setNoActive(Boolean(p.no_active))
    setTpl(p.template); setType(p.type); setTheme(p.theme)
    const isDraft = p.status === 'draft'
    setDraftId(isDraft ? p.id : null); setPhotoPath(isDraft ? p.photo_path || null : null)
    let ok = false
    if (p.photoUrl) { try { setImg(await loadImg(p.photoUrl)); ok = true } catch {} }
    dirty.current = false
    setTab(ok || img ? 'detajet' : 'foto'); say(ok ? (isDraft ? 'Drafti u hap' : 'Të dhënat u ngarkuan') : img ? 'Të dhënat u ngarkuan' : 'Ngarko foton, të dhënat u ngarkuan')
  }
  function newPost() { setDraftId(null); setPhotoPath(null); setModel(''); setPrice(''); setOffer(''); setSpec(''); setXAll(EMPTY_X); setCode(''); setRegion(''); setNoActive(false); setCaptionEdited(false); dirty.current = false }
  async function removePost(p) {
    if (user && p.image_path) { try { await deletePost(p) } catch { say('Fshirja dështoi'); return } }
    else LS.set('posts', JSON.stringify(localPosts().filter((x) => x.id !== p.id)))
    if (p.id === draftId) { setDraftId(null); setPhotoPath(null) }
    refreshPosts()
  }

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
    if (!img) return
    dirty.current = true; setDraftState('')
    clearTimeout(draftT.current)
    draftT.current = setTimeout(() => { if (dirty.current) saveDraft(true) }, 2500)
  }, [img, model, price, offer, spec, info, cta, code, region, noActive, x, tpl, type, theme])

  function say(m) { setToast(m); setTimeout(() => setToast(''), 2600) }
  async function onPhoto(e) { const f = e.target.files?.[0]; if (!f) return; setImg(await loadImg(await readFile(f))); setPhotoPath(null); setTab('template'); e.target.value = '' }

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

  return { x, setX, setXAll, img2, contact, setContact, specF, setSpecField, code, setCode, region, setRegion, noActive, setNoActive, draftId, draftState, saveDraft, newPost, caption, captionEdited, copyCaption, cta, data, download, fileName, idx, ig, igBusy, igLink, img, info, localPosts, logoImg, logoUrl, makeBlob, model, next, offer, onPhoto, posts, postsBusy, preview, price, publishDirect, ready, refreshPosts, remember, removePost, reuse, saveT, say, setCaption, setCaptionEdited, setCta, setIg, setIgBusy, setIgLink, setImg, setInfo, setLogoImg, setLogoUrl, setModel, setOffer, setPosts, setPostsBusy, setPrice, setReady, setSettings, setSpec, setSynced, setTab, setTheme, setToast, setTpl, setType, setVariant, settings, share, spec, synced, tab, th, theme, toast, tpl, type, user, variant }
}
