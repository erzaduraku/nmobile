import { useState } from 'react'
import { supabase } from '../../lib/supabase.js'
export default function NewPassword({ done }) {
  const [p, setP] = useState(''); const [err, setErr] = useState('')
  return (
    <div className="fixed inset-0 z-50 bg-white grid place-items-center p-6">
      <form className="w-full max-w-sm space-y-4" onSubmit={async (e) => { e.preventDefault(); const { error } = await supabase.auth.updateUser({ password: p }); error ? setErr(error.message) : done() }}>
        <h1 className="text-2xl font-extrabold text-center">Fjalëkalim i ri</h1>
        <input className="field" type="password" minLength={6} required value={p} onChange={(e) => setP(e.target.value)} placeholder="Të paktën 6 shkronja" />
        {err && <p className="text-sm text-red-700">{err}</p>}
        <button className="btn-red">Ruaj fjalëkalimin</button>
      </form>
    </div>
  )
}
