import { Loader2, ScanSearch, X } from 'lucide-react'
import { describePost, promotionFor } from './report.js'
import { pct } from './metrics.js'
import { INSUFFICIENT } from './recommend.js'

const n = (v) => (typeof v !== 'number' ? '–' : v >= 1e6 ? (v / 1e6).toFixed(1).replace('.', ',') + 'M' : v >= 1e3 ? (v / 1e3).toFixed(1).replace('.', ',') + 'K' : String(v))
const scoreText = (v) => (v == null ? null : (Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',')) + '/10')
const SETUP = 'Analiza e fotos kërkon çelësin GROQ_API_KEY te funksioni analyze-post-image (supabase secrets set GROQ_API_KEY). Çelësi merret falas te console.groq.com/keys. Pa të, këtu shfaqen vetëm faktet e dizajnit dhe statistikat.'

const STATS = [['views', 'Shikime'], ['reach', 'Arritje'], ['likes', 'Pëlqime'], ['comments', 'Komente'], ['saved', 'Ruajtje'], ['shares', 'Ndarje']]

function Section({ title, children }) {
  return (
    <section className="mt-3">
      <h3 className="text-xs font-extrabold uppercase tracking-wide text-neutral-400">{title}</h3>
      <div className="mt-1 text-sm text-neutral-800 space-y-1">{children}</div>
    </section>
  )
}

export function AccountInsights({ report }) {
  const patterns = ['feed', 'reel', 'story'].flatMap((f) => {
    const b = report?.byFormat?.[f]
    if (!b) return []
    return [...(b.patterns || []), ...(b.area ? [b.area] : []), ...(b.colors ? [b.colors] : [])]
  })
  const advice = report?.advice || []
  return (
    <div className="mb-4 rounded-2xl border-2 border-neutral-200 p-3">
      <div className="text-sm font-extrabold flex items-center gap-1"><ScanSearch size={16} className="text-brand" /> Smart Post Insights</div>
      {!patterns.length && !advice.length && <p className="text-xs text-neutral-600 mt-1">{INSUFFICIENT}</p>}
      {patterns.length > 0 && (
        <Section title="Modele te postimet me angazhim më të lartë">
          {patterns.slice(0, 6).map((p) => <p key={p.id + (p.format || '')} className="text-xs text-neutral-700">{p.sentence}</p>)}
        </Section>
      )}
      {advice.length > 0 && (
        <Section title="Për postimin e radhës">
          {advice.slice(0, 6).map((item) => <p key={item.id + item.format} className="text-xs text-neutral-700"><span className="font-bold">{item.title}.</span> {item.detail}</p>)}
        </Section>
      )}
    </div>
  )
}

export default function InsightsPanel({ post, report, posts, analyses, onClose, onAnalyze, busy, error, unconfigured, canAnalyze }) {
  const view = describePost(post, report, analyses, report?.now)
  const promo = promotionFor(post, posts, report?.now)
  const stats = post.ig_stats
  const hidden = stats?.media_product_type === 'STORY' ? new Set(['likes', 'comments', 'saved']) : new Set()
  const shown = scoreText(view.score)
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-3" onClick={onClose}>
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs font-extrabold text-brand">Smart Post Insights</div>
            <h2 className="font-extrabold truncate">{post.model || 'Postim në Instagram'}</h2>
            {view.label && <div className="text-sm text-neutral-600">{view.label}{shown ? ` · ${shown}` : ''}</div>}
            {!view.label && <div className="text-sm text-neutral-500">Pa notë — ende s’ka mjaft postime të kësaj forme.</div>}
          </div>
          <button type="button" className="w-9 h-9 rounded-full bg-neutral-100 grid place-items-center shrink-0" onClick={onClose} aria-label="Mbyll"><X size={18} /></button>
        </div>

        <Section title="Performanca">
          {!stats && <p className="text-xs text-neutral-500">Nuk ka statistika ende.</p>}
          {stats && (
            <div className="grid grid-cols-3 gap-1.5">
              {STATS.filter(([k]) => !hidden.has(k)).map(([k, label]) => (
                <div key={k} className="rounded-xl bg-neutral-50 px-2 py-1.5"><div className="text-[11px] text-neutral-500">{label}</div><div className="font-bold">{n(stats[k])}</div></div>
              ))}
              <div className="rounded-xl bg-neutral-50 px-2 py-1.5"><div className="text-[11px] text-neutral-500">Angazhimi</div><div className="font-bold">{pct(view.rate) || '–'}</div></div>
            </div>
          )}
        </Section>

        <Section title="Analiza vizuale">
          {view.lines.length === 0 && <p className="text-xs text-neutral-500">Nuk u nxorën tipare të sigurta.</p>}
          {view.lines.map((line) => <p key={line.key} className="text-xs">{line.text}</p>)}
          {view.visionMissing && <p className="text-xs text-neutral-500">Fotoja nuk është analizuar ende. Faktet e shënuara «nga dizajni» vijnë nga shablloni, jo nga një model.</p>}
          {unconfigured && <p className="text-xs text-neutral-600">{SETUP}</p>}
          {error && <p className="text-xs text-red-600">{error}</p>}
          {canAnalyze && (post.image_path || post.url) && (
            <button type="button" className="mt-1 rounded-xl border-2 border-brand text-brand text-xs font-bold px-3 py-1.5 inline-flex items-center gap-1" disabled={busy} onClick={() => onAnalyze(post)}>
              {busy ? <Loader2 size={14} className="animate-spin" /> : <ScanSearch size={14} />} {view.analysis ? 'Analizoje prapë' : 'Analizo foton'}
            </button>
          )}
          {view.analysis && <p className="text-[11px] text-neutral-400">{view.analysis.provider} · {view.analysis.model}</p>}
        </Section>

        <Section title={view.best ? 'Pse ky postim qëndron lart' : view.weakest ? 'Pse ky postim qëndron poshtë' : 'Krahasimi me mesataren'}>
          {view.observations.length === 0 && <p className="text-xs text-neutral-500">Nuk ka ende një krahasim të mjaftueshëm.</p>}
          {view.observations.map((text, i) => <p key={i} className="text-xs">{text}</p>)}
          {(report?.byFormat?.[view.format]?.patterns || []).slice(0, 4).map((p) => <p key={p.id} className="text-xs text-neutral-600">{p.sentence}</p>)}
        </Section>

        <Section title="Për postimet e ardhshme">
          {(report?.advice || []).filter((item) => item.format === view.format).length === 0 && <p className="text-xs text-neutral-500">{INSUFFICIENT}</p>}
          {(report?.advice || []).filter((item) => item.format === view.format).map((item) => (
            <p key={item.id} className="text-xs"><span className="font-bold">{item.title}.</span> {item.detail}</p>
          ))}
        </Section>

        <Section title="Promovimi">
          <p className="text-xs font-bold">{promo.worth ? 'Ia vlen me u promovu.' : 'Nuk propozohet për promovim.'}</p>
          {promo.reason && <p className="text-xs text-neutral-700">{promo.reason}</p>}
          {view.limits.map((text, i) => <p key={i} className="text-xs text-neutral-500">{text}</p>)}
        </Section>
      </div>
    </div>
  )
}
