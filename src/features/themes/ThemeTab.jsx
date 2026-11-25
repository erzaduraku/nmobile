import { Check, Lightbulb } from 'lucide-react'
import { THEMES, GROUPS, suggestTheme } from '../themes/themes.js'
import { THEME_ICON } from '../themes/themeIcons.js'

function Card({ t, on, onPick }) {
  const I = THEME_ICON[t.id] || Sparkles0
  return (
    <button onClick={onPick} className={`relative rounded-2xl border-2 overflow-hidden text-left ${on ? 'border-brand ring-4 ring-red-100' : 'border-neutral-200'}`}>
      <div className="h-16 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${t.accent} 0%, ${t.accent} 45%, ${t.dark} 45%, ${t.dark} 75%, ${t.accent2} 75%)` }}>
        <span className="bg-white rounded-full p-2 shadow"><I size={22} color={t.accent} /></span>
      </div>
      <div className="p-3"><div className="font-bold">{t.name}</div><div className="text-xs text-neutral-500 leading-snug">{t.desc}</div></div>
      {on && <span className="absolute top-2 right-2 bg-brand text-white rounded-full p-1"><Check size={16} /></span>}
    </button>
  )
}
const Sparkles0 = () => null

export default function ThemeTab({ ed }) {
  const { setTheme, theme } = ed
  const sug = suggestTheme()
  return (
    <div>
      <h2 className="text-lg font-extrabold">Zgjidh temën</h2>
      <p className="text-sm text-neutral-500 mb-3">Tema ndryshon ngjyrat dhe dekorimin e postimit.</p>
      <button onClick={() => setTheme(sug.theme.id)} className="w-full min-h-[56px] mb-4 flex items-center gap-3 rounded-2xl bg-brand-soft border-2 border-brand/30 p-3 text-left">
        <span className="w-11 h-11 rounded-xl bg-brand text-white grid place-items-center shrink-0"><Lightbulb size={22} /></span>
        <span className="flex-1"><span className="block font-bold">Sugjerim për sot: {sug.theme.name}</span><span className="block text-xs text-neutral-600">{sug.reason}{sug.upcoming ? ` · Së shpejti: ${sug.upcoming.t.name} (${sug.fmt(sug.upcoming.d)})` : ''}</span></span>
        {theme === sug.theme.id ? <Check className="text-brand" /> : <span className="text-brand font-bold text-sm">Përdore</span>}
      </button>
      {GROUPS.map(([g, label]) => (
        <section key={g} className="mb-5">
          <h3 className="font-extrabold mb-2">{label}</h3>
          <div className="grid grid-cols-2 gap-3">{THEMES.filter((t) => t.group === g).map((t) => <Card key={t.id} t={t} on={theme === t.id} onPick={() => setTheme(t.id)} />)}</div>
        </section>
      ))}
    </div>
  )
}
