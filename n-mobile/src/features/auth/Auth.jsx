import { useState } from 'react'
import { LogIn, UserPlus, KeyRound, Loader2 } from 'lucide-react'
import Logo from '../../components/ui/Logo.jsx'
import { supabase } from '../../lib/supabase.js'

const TITLES = { in: 'Hyr', up: 'Regjistrohu', reset: 'Harrova fjalëkalimin' }

export default function Auth() {
  const [mode, setMode] = useState('in')
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState(null)

  async function submit(e) {
    e.preventDefault(); setBusy(true); setMsg(null)
    try {
      if (mode === 'in') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: pass })
        if (error) throw error
      } else if (mode === 'up') {
        const { data, error } = await supabase.auth.signUp({ email, password: pass, options: { emailRedirectTo: location.origin } })
        if (error) throw error
        if (!data.session) setMsg({ ok: true, t: 'Llogaria u krijua. Kontrollo emailin për ta konfirmuar, pastaj hyr.' })
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: location.origin })
        if (error) throw error
        setMsg({ ok: true, t: 'Të dërguam një email me linkun për fjalëkalim të ri.' })
      }
    } catch (err) {
      const m = err.message || ''
      setMsg({ ok: false, t: /invalid login/i.test(m) ? 'Email ose fjalëkalim i gabuar.' : /registered/i.test(m) ? 'Ky email është i regjistruar tashmë.' : /password/i.test(m) ? 'Fjalëkalimi duhet të ketë të paktën 6 shkronja.' : 'Diçka shkoi keq: ' + m })
    }
    setBusy(false)
  }

  const Icon = { in: LogIn, up: UserPlus, reset: KeyRound }[mode]
  return (
    <div className="min-h-full max-w-sm mx-auto flex flex-col justify-center p-6">
      <div className="flex justify-center mb-8"><Logo size={56} /></div>
      <h1 className="text-2xl font-extrabold text-center mb-6">{TITLES[mode]}</h1>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Email</label><input className="field" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
        {mode !== 'reset' && <div><label className="label">Fjalëkalimi</label><input className="field" type="password" required minLength={6} autoComplete={mode === 'up' ? 'new-password' : 'current-password'} value={pass} onChange={(e) => setPass(e.target.value)} /></div>}
        {msg && <p className={`text-sm rounded-xl p-3 ${msg.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'}`}>{msg.t}</p>}
        <button className="btn-red flex items-center justify-center gap-2" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Icon size={22} />}{mode === 'reset' ? 'Dërgo linkun' : TITLES[mode]}</button>
      </form>
      <div className="mt-6 space-y-2 text-center text-sm">
        {mode !== 'in' && <button className="text-brand font-semibold" onClick={() => setMode('in')}>Ke llogari? Hyr</button>}
        {mode === 'in' && <div><button className="text-brand font-semibold" onClick={() => setMode('up')}>Nuk ke llogari? Regjistrohu</button></div>}
        {mode === 'in' && <div><button className="text-neutral-500" onClick={() => setMode('reset')}>Harrova fjalëkalimin</button></div>}
      </div>
    </div>
  )
}
