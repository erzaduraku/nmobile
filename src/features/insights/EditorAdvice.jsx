import { Lightbulb } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { buildReport } from './report.js'
import { advicePatch, designAdvice, withoutIgnored } from './recommend.js'
import { saveRecommendationSnapshots } from './api.js'

const KIND = { keep: 'Mbaje', change: 'Ndryshoje', test: 'Provoje' }
const SCOPE = { category: 'nga kjo kategori', format: 'nga ky format' }

export default function EditorAdvice({ ed }) {
  const { model, price, offer, cta, spec, tpl, type, theme, x, postsView, analyses, setTpl, setTheme, setCta, setOffer, say, user, draftId } = ed
  const [ignored, setIgnored] = useState(() => new Set())
  const report = useMemo(() => buildReport(postsView || [], analyses || []), [postsView, analyses])
  const advice = useMemo(
    () => designAdvice({ model, price, offer, cta, spec, template: tpl, type, theme, extra: x }, report),
    [model, price, offer, cta, spec, tpl, type, theme, x, report],
  )
  const items = withoutIgnored(advice.items, ignored)
  useEffect(() => {
    if (!user?.id || !advice.ready) return
    saveRecommendationSnapshots(user.id, draftId, advice.items).catch(() => {})
  }, [user?.id, draftId, advice])
  function apply(item) {
    const patch = advicePatch(item)
    if (!patch) return
    if (patch.tpl) setTpl(patch.tpl)
    if (patch.theme) setTheme(patch.theme)
    if (patch.cta) setCta(patch.cta)
    if (patch.offer) setOffer(patch.offer)
    say('Rekomandimi u vendos')
  }
  return (
    <div className="rounded-2xl border-2 border-brand/30 bg-brand-soft p-3">
      <div className="flex items-start gap-2">
        <span className="w-9 h-9 rounded-xl bg-brand text-white grid place-items-center shrink-0"><Lightbulb size={18} /></span>
        <div className="min-w-0">
          <div className="font-extrabold text-sm">Dizajn i rekomanduar{model ? ` për ${model}` : ''}</div>
          <p className="text-xs text-neutral-600">Nga postimet e tua me statistika. Nuk ndryshon dizajnin vetë.</p>
        </div>
      </div>
      {advice.note && <p className="text-xs text-neutral-600 mt-2">{advice.note}</p>}
      {!advice.ready && <p className="text-xs text-neutral-600 mt-2">{advice.message}</p>}
      {advice.ready && (
        <ul className="mt-2 space-y-2">
          {items.map((item) => (
            <li key={item.id + item.format} className="rounded-xl bg-white/80 px-2.5 py-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-bold">{item.title}</div>
                <span className="text-[11px] font-bold text-brand shrink-0">{KIND[item.kind] || 'Shënim'}</span>
              </div>
              <p className="text-xs text-neutral-700 mt-0.5">{item.detail}</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">{item.reason}</p>
              <p className="text-[11px] text-neutral-500">{SCOPE[item.scope] || 'nga të dhënat'}{item.sampleSize ? ` · ${item.sampleSize} postime` : ''}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {advicePatch(item) && <button type="button" className="rounded-xl bg-brand text-white text-xs font-bold px-3 py-1.5" onClick={() => apply(item)}>Vendose</button>}
                <button type="button" className="rounded-xl border border-neutral-300 text-xs font-bold px-3 py-1.5" onClick={() => setIgnored((prev) => new Set(prev).add(`${item.id}:${item.format}`))}>Injoro</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
