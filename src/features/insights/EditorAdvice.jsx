import { Lightbulb } from 'lucide-react'
import { useMemo } from 'react'
import { buildReport } from './report.js'
import { designAdvice } from './recommend.js'

const KIND = { keep: 'Mbaje', change: 'Ndryshoje', test: 'Provoje' }

export default function EditorAdvice({ ed }) {
  const { model, price, offer, cta, spec, tpl, type, theme, x, postsView, analyses, setTpl, setCta } = ed
  const report = useMemo(() => buildReport(postsView || [], analyses || []), [postsView, analyses])
  const advice = useMemo(
    () => designAdvice({ model, price, offer, cta, spec, template: tpl, type, theme, extra: x }, report),
    [model, price, offer, cta, spec, tpl, type, theme, x, report],
  )
  return (
    <div className="rounded-2xl border-2 border-brand/30 bg-brand-soft p-3">
      <div className="flex items-start gap-2">
        <span className="w-9 h-9 rounded-xl bg-brand text-white grid place-items-center shrink-0"><Lightbulb size={18} /></span>
        <div className="min-w-0">
          <div className="font-extrabold text-sm">Dizajn i rekomanduar{model ? ` për ${model}` : ''}</div>
          <p className="text-xs text-neutral-600">Nga postimet e tua me statistika. Nuk ndryshon dizajnin vetë.</p>
        </div>
      </div>
      {!advice.ready && <p className="text-xs text-neutral-600 mt-2">{advice.message}</p>}
      {advice.ready && (
        <ul className="mt-2 space-y-2">
          {advice.items.map((item) => (
            <li key={item.id + item.format} className="rounded-xl bg-white/80 px-2.5 py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-bold">{item.title}</div>
                <span className="text-[11px] font-bold text-brand shrink-0">{KIND[item.kind] || 'Shënim'}</span>
              </div>
              <p className="text-xs text-neutral-700 mt-0.5">{item.detail}</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">{item.reason}</p>
              {item.apply?.tpl && <button type="button" className="mt-1.5 rounded-xl bg-brand text-white text-xs font-bold px-3 py-1.5" onClick={() => setTpl(item.apply.tpl)}>Përdor shabllonin</button>}
              {item.apply?.cta && <button type="button" className="mt-1.5 rounded-xl bg-brand text-white text-xs font-bold px-3 py-1.5" onClick={() => setCta(item.apply.cta)}>Vendos tekstin</button>}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
