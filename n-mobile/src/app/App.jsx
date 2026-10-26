import { lazy, Suspense, useEffect, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import Logo from '../components/ui/Logo.jsx'
import Auth from '../features/auth/Auth.jsx'
import NewPassword from '../features/auth/NewPassword.jsx'
import { supabase, supabaseReady } from '../lib/supabase.js'
import { LS } from '../lib/storage.js'
import Spinner from '../components/ui/Spinner.jsx'

// The editor (templates, canvas, Instagram) is downloaded only after login
const Editor = lazy(() => import('./Editor.jsx'))

// Entry gate: splash -> (missing config notice | login | editor)
export default function App() {
  const [splash, setSplash] = useState(true)
  const [session, setSession] = useState(undefined)
  const [recovery, setRecovery] = useState(false)
  const [localMode, setLocalMode] = useState(LS.get('local') === '1')
  useEffect(() => { const t = setTimeout(() => setSplash(false), 1100); return () => clearTimeout(t) }, [])
  useEffect(() => {
    if (!supabaseReady) { setSession(null); return }
    supabase.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = supabase.auth.onAuthStateChange((ev, s) => { setSession(s); if (ev === 'PASSWORD_RECOVERY') setRecovery(true) })
    return () => data.subscription.unsubscribe()
  }, [])

  if (splash || session === undefined) return (
    <div className="h-full grid place-items-center bg-white"><div className="pop text-center"><Logo size={72} custom={LS.get('logo')} /><p className="mt-4 text-neutral-500 font-medium">Postime për Instagram</p></div></div>
  )
  if (!supabaseReady && !localMode) return (
    <div className="min-h-full max-w-sm mx-auto flex flex-col justify-center p-6 text-center">
      <div className="flex justify-center mb-6"><Logo size={56} /></div>
      <div className="rounded-2xl bg-amber-50 text-amber-900 p-4 text-left text-sm space-y-2">
        <div className="flex items-center gap-2 font-bold"><AlertTriangle size={20} /> Hyrja nuk është konfiguruar</div>
        <p>Mungojnë <code>VITE_SUPABASE_URL</code> dhe <code>VITE_SUPABASE_ANON_KEY</code> në skedarin <code>.env.local</code>. Shiko README për hapat.</p>
      </div>
      <button className="btn-light mt-4" onClick={() => { LS.set('local', '1'); setLocalMode(true) }}>Vazhdo pa llogari (vetëm në këtë pajisje)</button>
    </div>
  )
  if (supabaseReady && !session) return <Auth />
  return <>{recovery && <NewPassword done={() => setRecovery(false)} />}<Suspense fallback={<Spinner full />}><Editor user={session?.user || null} /></Suspense></>
}

// ---------- Redaktori me tabs ----------
