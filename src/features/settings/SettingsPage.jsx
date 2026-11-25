import { LogOut, Upload, RotateCcw, Zap, Unlink, CheckCircle2, CircleAlert } from 'lucide-react'
import Logo from '../../components/ui/Logo.jsx'
import { igReady, startInstagramLogin, disconnectInstagram } from '../instagram/instagram.js'
import { supabase, supabaseReady } from '../../lib/supabase.js'
import { readFile, shrink } from '../../lib/storage.js'

// Settings page: Instagram connection card, logo, account.
export default function SettingsSheet({ ed }) {
  const { ig, logoUrl, setIg, setLogoUrl, user, contact, setContact } = ed
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-extrabold">Cilësime</h1>

      <section className={`rounded-3xl p-5 border-2 ${ig ? 'border-green-200 bg-green-50' : 'border-brand/30 bg-brand-soft'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-2xl grid place-items-center ${ig ? 'bg-green-600' : 'bg-brand'} text-white`}><Zap /></div>
          <div className="flex-1">
            <div className="font-extrabold text-lg">Instagram</div>
            <div className="text-sm flex items-center gap-1">{ig ? <><CheckCircle2 size={15} className="text-green-700" /> I lidhur si <b>@{ig.username}</b></> : <><CircleAlert size={15} className="text-brand" /> Jo i lidhur</>}</div>
          </div>
        </div>
        <p className="text-sm text-neutral-600 mt-3">{ig ? 'Postimet publikohen direkt në këtë llogari me butonin “Posto direkt”.' : 'Lidhe llogarinë profesionale të Instagramit për të postuar direkt nga aplikacioni.'}</p>
        <div className="mt-4">
          {!user ? <p className="text-sm text-neutral-500">Hyr në llogari për të lidhur Instagramin.</p>
            : ig ? <button className="btn-light flex items-center justify-center gap-2" onClick={async () => { await disconnectInstagram(user.id); setIg(null) }}><Unlink size={18} /> Shkëput</button>
            : <button className="btn-red flex items-center justify-center gap-2" disabled={!igReady} onClick={startInstagramLogin}><Zap size={20} /> Lidhe Instagramin</button>}
          {user && !ig && !igReady && <p className="text-xs text-neutral-500 mt-2">Mungon VITE_INSTAGRAM_APP_ID – shiko docs/INSTAGRAM_SETUP.md.</p>}
        </div>
      </section>

      <section>
        <div className="label">Logoja</div>
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-neutral-50"><Logo size={40} custom={logoUrl} /></div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <label className="btn-light text-base cursor-pointer flex items-center justify-center gap-2"><Upload size={18} /> Ngarko logon<input type="file" accept="image/*" className="hidden" onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; setLogoUrl(await shrink(await readFile(f))) }} /></label>
          <button className="btn-light text-base flex items-center justify-center gap-2" disabled={!logoUrl} onClick={() => setLogoUrl('')}><RotateCcw size={18} /> Standarde</button>
        </div>
        <p className="text-xs text-neutral-500 mt-2">Këshillë: përdor PNG me sfond transparent. Ruhet automatikisht.</p>
      </section>

      <section>
        <div className="label">Kontakti i dyqanit (opsional)</div>
        <p className="text-xs text-neutral-500 mb-2">Shfaqet poshtë në template-t e reja dhe në fund të caption-it. Bosh = nuk shfaqet.</p>
        <div className="space-y-2">
          {[['phone', 'Telefoni', 'p.sh. 044 123 456', 'tel'], ['whatsapp', 'WhatsApp', 'p.sh. 044 123 456', 'tel'], ['address', 'Adresa', 'p.sh. Rr. Nëna Terezë, Prishtinë', 'text'], ['instagram', 'Instagram', 'p.sh. nmobile', 'text']].map(([k, l, ph, t]) => (
            <div key={k}><label className="label">{l}</label><input className="field" type={t} value={contact[k]} onChange={(e) => setContact(k, k === 'instagram' ? e.target.value.replace(/^@/, '') : e.target.value)} placeholder={ph} /></div>))}
        </div>
      </section>

      <section>
        <div className="label">Llogaria</div>
        {user ? <>
          <p className="text-sm text-neutral-600 mb-3">I kyçur si <b>{user.email}</b></p>
          <button className="btn-light flex items-center justify-center gap-2 text-brand" onClick={() => supabase.auth.signOut()}><LogOut size={20} /> Dil nga llogaria</button>
        </> : <p className="text-sm text-neutral-500">{supabaseReady ? '' : 'Je në modalitetin pa llogari. Të dhënat ruhen vetëm në këtë pajisje.'}</p>}
      </section>
    </div>
  )
}
