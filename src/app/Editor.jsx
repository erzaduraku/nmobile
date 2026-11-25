import { lazy, Suspense, useEffect, useState } from 'react'
import { ArrowLeft, ChevronRight, X, Maximize2 } from 'lucide-react'
import Logo from '../components/ui/Logo.jsx'
import PostCanvas from '../components/ui/PostCanvas.jsx'
import ImageLightbox from '../components/ui/ImageLightbox.jsx'
import { TEMPLATES } from '../features/templates/index.js'
import useEditor from '../hooks/useEditor.jsx'
import { TABS as STEPS, NAV } from './tabs.js'
import HomePage from '../features/posts/HomePage.jsx'
import Spinner from '../components/ui/Spinner.jsx'

// Screens and editor steps are split into their own chunks (loaded when first opened)
const PhotoTab = lazy(() => import('../features/editor/PhotoTab.jsx'))
const TemplateTab = lazy(() => import('../features/editor/TemplateTab.jsx'))
const ThemeTab = lazy(() => import('../features/themes/ThemeTab.jsx'))
const DetailsTab = lazy(() => import('../features/editor/DetailsTab.jsx'))
const PublishTab = lazy(() => import('../features/editor/PublishTab.jsx'))
const PostsTab = lazy(() => import('../features/posts/PostsTab.jsx'))
const SettingsPage = lazy(() => import('../features/settings/SettingsPage.jsx'))

// Round header button (back / close)
const ROUND_BTN = 'w-11 h-11 rounded-full bg-neutral-100 grid place-items-center'

const STEP_VIEW = { foto: PhotoTab, template: TemplateTab, tema: ThemeTab, detajet: DetailsTab, posto: PublishTab }

// App shell. Outside the editor: bottom nav (Kryefaqja / Postimet / Cilësime).
// Inside the editor: step header with back + progress, live preview, sticky "Vazhdo" action.
export default function Editor({ user }) {
  const base = useEditor(user)
  // back from the Instagram login (?code or ?error): open Settings, where the connection result is shown
  const [screen, setScreen] = useState(() => (/[?&](code|error)=/.test(location.search) ? 'settings' : 'home'))
  const [zoom, setZoom] = useState(null) // { src } kur pamja e madhe është hapur; src null = duke u gatuar
  const { tab, setTab, img, type, tpl, th, data, ready, preview, logoUrl, toast, onPhoto, reuse, refreshPosts, makeBlob } = base
  // Photos are loaded before the editor opens, so it never shows a half-restored draft
  const ed = { ...base, reuse: async (p) => { await reuse(p); setScreen('editor') } }
  useEffect(() => { if (screen !== 'editor') refreshPosts() }, [screen])

  const i = STEPS.findIndex((s) => s.id === tab), step = STEPS[i], next = STEPS[i + 1]
  // Pamja e madhe: render në madhësi të plotë (1080×1350 / 1080×1920) që teksti të jetë i qartë.
  const openZoom = async () => {
    setZoom({ src: null })
    const b = await makeBlob()
    const url = URL.createObjectURL(b)
    setZoom((z) => (z ? { src: url } : (URL.revokeObjectURL(url), z))) // u mbyll ndërkohë
  }
  const closeZoom = () => setZoom((z) => { if (z?.src) URL.revokeObjectURL(z.src); return null })
  const back = () => (i > 0 ? setTab(STEPS[i - 1].id) : setScreen('home'))
  const startNew = async (e) => { base.newPost(); await onPhoto(e); setScreen('editor') }
  const Toast = toast && <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-neutral-900 text-white px-5 py-3 rounded-full shadow-xl text-center max-w-[90vw] text-sm">{toast}</div>

  if (screen === 'editor') {
    const View = STEP_VIEW[tab] || PhotoTab
    return (
      <div className="min-h-full max-w-lg mx-auto flex flex-col">
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-neutral-100 px-3 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <button onClick={back} className={ROUND_BTN} aria-label="Kthehu"><ArrowLeft size={22} /></button>
            <div className="flex-1 text-center"><div className="text-xs text-neutral-500 font-semibold">Hapi {i + 1} nga {STEPS.length}</div><div className="font-extrabold text-lg leading-tight">{step.name}</div></div>
            <button onClick={() => setScreen('home')} className={ROUND_BTN} aria-label="Mbyll"><X size={22} /></button>
          </div>
          <div className="flex gap-1.5 mt-3">
            {STEPS.map((s, k) => <button key={s.id} disabled={!img} onClick={() => setTab(s.id)} className={`h-1.5 flex-1 rounded-full ${k <= i ? 'bg-brand' : 'bg-neutral-200'}`} aria-label={s.name} />)}
          </div>
        </header>
        {preview && (
          <div className="sticky top-[97px] z-10 bg-neutral-50 border-b border-neutral-100 py-3">
            <button type="button" onClick={openZoom} aria-label="Shiko të madhe" className="relative block mx-auto rounded-xl overflow-hidden shadow-lg" style={{ width: type === 'story' ? 'calc(30vh * 0.5625)' : 'calc(30vh * 0.8)', maxWidth: '80%' }}>
              <PostCanvas tpl={tpl} type={type} theme={th} data={data} scale={0.4} ready={ready} />
              <span className="absolute bottom-1.5 right-1.5 w-7 h-7 rounded-full bg-black/55 text-white grid place-items-center"><Maximize2 size={14} /></span>
            </button>
            <p className="text-center text-xs text-neutral-500 mt-2">{TEMPLATES.find((t) => t.id === tpl).name} · {th.name} · {type === 'post' ? 'Post' : 'Story'}</p>
          </div>
        )}
        <main className="flex-1 p-4 pb-28"><Suspense fallback={<Spinner />}><View ed={ed} /></Suspense></main>
        {next && img && (
          <div className="fixed bottom-0 inset-x-0 z-20 bg-white/95 backdrop-blur border-t border-neutral-100 p-3" style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}>
            <div className="max-w-lg mx-auto"><button className="btn-red flex items-center justify-center gap-2" onClick={() => setTab(next.id)}>Vazhdo: {next.name} <ChevronRight size={22} /></button></div>
          </div>
        )}
        {zoom && <ImageLightbox src={zoom.src} alt="Pamja e postimit" onClose={closeZoom} />}
        {Toast}
      </div>
    )
  }

  return (
    <div className="min-h-full max-w-lg mx-auto flex flex-col pb-24">
      <header className="sticky top-0 z-20 bg-white/95 backdrop-blur border-b border-neutral-100 px-4 py-3 flex justify-center"><Logo size={32} custom={logoUrl} /></header>
      <main className="flex-1 p-4">
        {screen === 'home' && <HomePage ed={ed} onPhoto={startNew} openPosts={() => setScreen('posts')} openEditor={() => setScreen('editor')} openSettings={() => setScreen('settings')} />}
        <Suspense fallback={<Spinner />}>
          {screen === 'posts' && <PostsTab ed={ed} />}
          {screen === 'settings' && <SettingsPage ed={ed} />}
        </Suspense>
      </main>
      <nav className="fixed bottom-0 inset-x-0 z-20 bg-white border-t border-neutral-200" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="max-w-lg mx-auto grid grid-cols-3">
          {NAV.map((n) => { const on = screen === n.id; return (
            <button key={n.id} onClick={() => setScreen(n.id)} className={`py-2.5 flex flex-col items-center gap-1 text-xs font-semibold ${on ? 'text-brand' : 'text-neutral-500'}`}>
              <span className={`rounded-full px-5 py-1 ${on ? 'bg-brand-soft' : ''}`}><n.icon size={22} /></span>{n.name}
            </button>) })}
        </div>
      </nav>
      {Toast}
    </div>
  )
}
