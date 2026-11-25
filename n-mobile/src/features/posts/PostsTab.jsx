import { useMemo, useState } from 'react'
import { PenLine, Loader2, History, Trash2, ExternalLink, Maximize2, Download, RefreshCw, Eye, Users, Heart, MessageCircle, Bookmark, Send, Megaphone, AlertTriangle, Link2, CalendarClock, XCircle } from 'lucide-react'
import { pickPromote } from './promote.js'
import { buildReport } from '../insights/report.js'
import InsightsPanel, { AccountInsights } from '../insights/InsightsPanel.jsx'
import { startInstagramLogin } from '../instagram/instagram.js'
import { postStatus, isPlanned } from './postsApi.js'
import { fmtWhen } from './schedule.js'
import ScheduleModal from './ScheduleModal.jsx'
import ImageLightbox from '../../components/ui/ImageLightbox.jsx'
import Modal from '../../components/ui/Modal.jsx'

// Exported (downloaded/shared only) posts are listed under 'Të gjitha' only; 'Të postuara' = published to Instagram.
const SEG = [['all', 'Të gjitha'], ['draft', 'Draftet'], ['scheduled', 'Të planifikuara'], ['posted', 'Të postuara']]
// Compact numbers: 1250 -> 1,3K
const n = (v) => (typeof v !== 'number' ? '–' : v >= 1e6 ? (v / 1e6).toFixed(1).replace('.', ',') + 'M' : v >= 1e4 ? Math.round(v / 1e3) + 'K' : v >= 1e3 ? (v / 1e3).toFixed(1).replace('.', ',') + 'K' : String(v))
const STATS = [['views', Eye, 'Shikime'], ['reach', Users, 'Arritje'], ['likes', Heart, 'Pëlqime'], ['comments', MessageCircle, 'Komente'], ['saved', Bookmark, 'Ruajtje'], ['shares', Send, 'Ndarje']]
function StatsGrid({ s }) {
  const rows = STATS.filter(([k]) => !(s.media_product_type === 'STORY' && ['likes', 'comments', 'saved'].includes(k)))
  return (
    <div className="grid grid-cols-3 gap-x-1 gap-y-1 mt-2 rounded-xl bg-neutral-50 p-1.5">
      {rows.map(([k, I, l]) => <div key={k} title={l} className="flex items-center gap-1 text-xs text-neutral-700 min-w-0"><I size={12} className="text-neutral-400 shrink-0" aria-label={l} /><span className="font-bold truncate">{n(s[k])}</span></div>)}
    </div>
  )
}
const KIND = (p) => (p.ig?.media_product_type === 'STORY' ? 'Story' : p.ig?.media_product_type === 'REELS' || p.ig?.media_type === 'VIDEO' ? 'Reel' : p.ig?.media_type === 'CAROUSEL_ALBUM' ? 'Album' : 'Postim')
const BADGE = { draft: ['Draft', 'bg-amber-400 text-neutral-900'], posted: ['Postuar', 'bg-green-600 text-white'], exported: ['Shkarkuar', 'bg-white/90 text-neutral-800'], scheduled: ['Planifikuar', 'bg-neutral-900 text-white'], publishing: ['Duke u postuar', 'bg-neutral-900 text-white'], failed: ['Dështoi', 'bg-red-600 text-white'] }

// Amber "reconnect Instagram" notice (expired link or missing statistics permission)
function ReconnectNotice({ title, text }) {
  return (
    <div className="mb-4 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3 flex items-start gap-2">
      <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-bold">{title}</div>
        <p className="text-xs text-neutral-600 mt-0.5">{text}</p>
        <button onClick={startInstagramLogin} className="mt-2 rounded-xl bg-brand text-white text-xs font-bold px-3 py-1.5 flex items-center gap-1"><Link2 size={14} /> Lidhe sërish</button>
      </div>
    </div>
  )
}

export default function PostsTab({ ed }) {
  const { postsView: posts, postsBusy, removePost, reuse, user, igUrlFor, opening, ig, stats, statsNeedReconnect, igFeed, refreshInstagram, reschedule, unschedule, analyses, runAnalysis } = ed
  const [f, setF] = useState('all')
  const [del, setDel] = useState(null) // postimi që po fshihet (dritarja e konfirmimit)
  const [zoom, setZoom] = useState(null) // url e fotos së hapur të madhe
  const [move, setMove] = useState(null) // postimi i planifikuar që po i ndryshohet ora
  const [insight, setInsight] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState('')
  const [unconfigured, setUnconfigured] = useState(false)
  const st = postStatus
  const inF = (p, id) => (id === 'all' ? true : id === 'scheduled' ? isPlanned(p) : st(p) === id)
  const count = Object.fromEntries(SEG.map(([id]) => [id, posts.filter((p) => inF(p, id)).length]))
  const segs = SEG.filter(([id]) => id !== 'scheduled' || count.scheduled || f === 'scheduled') // planned tab only when used
  const list = posts.filter((p) => inF(p, f)).sort((a, b) => (f === 'scheduled' ? Date.parse(a.scheduled_at || 0) - Date.parse(b.scheduled_at || 0) : 0))
  const promo = useMemo(() => pickPromote(posts.filter((p) => st(p) === 'posted')), [posts])
  const promoPost = promo && posts.find((p) => p.id === promo.id)
  const report = useMemo(() => buildReport(posts, analyses || []), [posts, analyses])
  const analyze = async (p) => {
    if (!user || !runAnalysis) return
    setAnalyzing(true); setAnalyzeError(''); setUnconfigured(false)
    try {
      const r = await runAnalysis(p)
      if (r && r.configured === false) setUnconfigured(true)
    } catch (e) { setAnalyzeError(e.message || 'Analiza dështoi.') }
    setAnalyzing(false)
  }
  const canStats = Boolean(user && ig)
  const busy = stats.busy || igFeed.busy
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-extrabold">Postimet e mia</h2>
        {canStats && <button onClick={() => refreshInstagram()} disabled={busy} className="rounded-xl border-2 border-neutral-200 text-xs font-bold px-2.5 py-1.5 flex items-center gap-1 text-neutral-700 disabled:opacity-60"><RefreshCw size={14} className={busy ? 'animate-spin' : ''} /> Rifresko statistikat</button>}
      </div>
      <p className="text-sm text-neutral-500 mb-3">{user ? 'Ruhen në llogarinë tënde.' : 'Ruhen vetëm në këtë pajisje.'} Draftet ruhen vetë gjatë punës (deri 5; kur shtohet i ri, fshihet më i vjetri). Ruhen 20 postimet e fundit.</p>
      <div className={`grid ${segs.length > 3 ? 'grid-cols-4 text-xs' : 'grid-cols-3'} gap-1 p-1 rounded-2xl bg-neutral-100 mb-4`}>
        {segs.map(([id, l]) => (
          <button key={id} onClick={() => setF(id)} className={`rounded-xl py-2 text-sm font-bold flex items-center justify-center gap-1.5 ${f === id ? 'bg-white shadow text-neutral-900' : 'text-neutral-500'}`}>
            {l}<span className={`min-w-5 px-1.5 rounded-full text-xs ${f === id ? 'bg-brand text-white' : 'bg-neutral-200'}`}>{count[id]}</span>
          </button>
        ))}
      </div>
      {user && !ig && f !== 'draft' && (
        <div className="mb-4 rounded-2xl border-2 border-neutral-200 bg-neutral-50 p-3 flex items-start gap-2 text-sm">
          <Link2 size={18} className="text-neutral-500 shrink-0 mt-0.5" />
          <div><div className="font-bold">Instagrami nuk është i lidhur</div><p className="text-xs text-neutral-600 mt-0.5">Lidhe te Cilësimet që të shohësh këtu gjithçka që është postuar në llogarinë tënde të Instagramit.</p></div>
        </div>
      )}
      {canStats && igFeed.code === 'reconnect' && (
        <ReconnectNotice title="Lidhja me Instagramin ka skaduar" text="Lidhe sërish që të shfaqen postimet nga Instagrami." />
      )}
      {canStats && igFeed.error && igFeed.code !== 'reconnect' && (
        <div className="mb-4 rounded-2xl border-2 border-neutral-200 bg-neutral-50 p-3 flex items-center gap-2 text-sm">
          <AlertTriangle size={18} className="text-neutral-500 shrink-0" />
          <div className="flex-1 font-bold">Postimet e Instagramit nuk u ngarkuan.</div>
          <button onClick={() => refreshInstagram()} disabled={busy} className="rounded-xl bg-neutral-200 text-xs font-bold px-3 py-1.5">Provo sërish</button>
        </div>
      )}
      {canStats && igFeed.busy && !igFeed.media.length && f !== 'draft' && <div className="mb-3 text-xs text-neutral-500 flex items-center gap-1.5"><Loader2 size={14} className="animate-spin text-brand" /> Po ngarkohen postimet nga Instagrami…</div>}
      {canStats && statsNeedReconnect && igFeed.code !== 'reconnect' && (
        <ReconnectNotice title="Lidhe sërish Instagramin për statistikat" text="Për shikimet, arritjen, ruajtjet dhe ndarjet duhet leje e re nga Instagrami." />
      )}
      {f !== 'draft' && posts.some((p) => st(p) === 'posted') && <AccountInsights report={report} />}
      {promoPost && f !== 'draft' && (
        <div className="mb-4 rounded-2xl border-2 border-brand bg-brand-soft p-3 flex gap-3 items-center">
          {promoPost.url ? <img src={promoPost.url} alt="" className="w-14 h-14 rounded-xl object-cover shrink-0" /> : <div className="w-14 h-14 rounded-xl bg-neutral-100 shrink-0" />}
          <div className="flex-1 min-w-0">
            <div className="text-xs font-extrabold text-brand flex items-center gap-1"><Megaphone size={14} /> Ia vlen me u promovu</div>
            <div className="text-sm font-bold truncate">{promoPost.model || 'Postim në Instagram'}</div>
            <p className="text-xs text-neutral-600">{promo.reason}</p>
            {igUrlFor(promoPost) && <a href={igUrlFor(promoPost)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex rounded-xl bg-brand text-white text-xs font-bold px-3 py-1.5 items-center gap-1"><Megaphone size={14} /> Promovoje në Instagram</a>}
          </div>
        </div>
      )}
      {postsBusy && <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brand" /></div>}
      {!postsBusy && !list.length && <div className="text-center text-neutral-400 py-12"><History size={40} className="mx-auto mb-2" />{f === 'draft' ? 'Nuk ke drafte.' : 'Ende nuk ke postime.'}</div>}
      <div className="grid grid-cols-2 gap-3">
        {list.map((p) => (
          <div key={p.id} className={`rounded-2xl border-2 overflow-hidden ${promo?.id === p.id ? 'border-brand' : 'border-neutral-200'}`}>
            <div className="relative">
              {p.url
                ? <button type="button" onClick={() => setZoom(p.url)} aria-label="Shiko të madhe" className="block w-full"><img src={p.url} alt="" referrerPolicy="no-referrer" className={`w-full block ${p.igOnly ? 'aspect-[4/5] object-cover bg-neutral-100' : ''}`} /><span className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/55 text-white grid place-items-center"><Maximize2 size={14} /></span></button>
                : <div className="aspect-[4/5] bg-neutral-100" />}
              <span className={`absolute top-2 left-2 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${BADGE[st(p)][1]}`}>{st(p) === 'exported' && <Download size={11} />}{BADGE[st(p)][0]}</span>
              {p.pending && <span className="absolute top-2 right-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-neutral-900/70 text-white">Në pajisje</span>}
            </div>
            {promo?.id === p.id && <div className="bg-brand text-white text-[11px] font-bold px-2 py-1 flex items-center gap-1"><Megaphone size={12} /> Ia vlen me u promovu</div>}
            <div className="p-2">
              {p.igOnly
                ? <><div className="text-[11px] font-bold text-neutral-400 flex items-center gap-1">{KIND(p)} · nga Instagrami</div><div className="text-sm line-clamp-2 leading-snug min-h-[2.5em]">{p.caption ? p.caption.trim() : <span className="text-neutral-400">Pa përshkrim</span>}</div></>
                : <div className="font-semibold text-sm truncate">{p.model || 'Pa emër'}</div>}
              <div className="text-xs text-neutral-500">{new Date(p.updated_at || p.created_at).toLocaleDateString('sq-AL')}</div>
              {st(p) === 'posted' && p.ig_stats && <StatsGrid s={p.ig_stats} />}
              {st(p) === 'posted' && !p.ig_stats && p.ig_media_id && canStats && <div className="mt-2 text-[11px] text-neutral-400">{busy ? 'Po ngarkohen statistikat…' : 'Pa statistika ende'}</div>}
              {isPlanned(p) && <>
                <div className="mt-1 text-xs font-bold text-neutral-800 flex items-center gap-1"><CalendarClock size={13} /> {p.scheduled_at ? fmtWhen(p.scheduled_at) : '–'}</div>
                {st(p) === 'failed' && p.schedule_error && <p className="text-[11px] text-red-600 mt-0.5 line-clamp-3">{p.schedule_error}</p>}
                {st(p) === 'publishing'
                  ? <div className="mt-2 text-xs text-neutral-500 flex items-center gap-1"><Loader2 size={13} className="animate-spin" /> Po postohet tani…</div>
                  : <div className="grid grid-cols-2 gap-2 mt-2">
                    <button className="rounded-xl bg-brand text-white text-xs font-bold py-2 flex items-center justify-center gap-1" onClick={() => setMove(p)}><CalendarClock size={14} /> Ndrysho orën</button>
                    <button className="rounded-xl bg-neutral-100 text-xs font-bold py-2 flex items-center justify-center gap-1" onClick={() => unschedule(p)}><XCircle size={14} /> Anulo</button>
                  </div>}
              </>}
              {!p.igOnly && !isPlanned(p) && <div className="grid grid-cols-2 gap-2 mt-2">
                <button className="rounded-xl bg-brand text-white text-sm font-bold py-2 flex items-center justify-center gap-1" disabled={Boolean(opening)} onClick={() => reuse(p)}>{opening === p.id ? <Loader2 size={15} className="animate-spin" /> : <PenLine size={15} />} {st(p) === 'draft' ? 'Vazhdo' : 'Edito'}</button>
                <button className="rounded-xl bg-neutral-100 text-sm font-bold py-2 flex items-center justify-center gap-1" onClick={() => setDel(p)} aria-label="Fshi"><Trash2 size={15} /> Fshi</button>
              </div>}
              {st(p) === 'posted' && igUrlFor(p) && (
                <a href={igUrlFor(p)} target="_blank" rel="noopener noreferrer" className="mt-2 rounded-xl border-2 border-neutral-200 text-xs font-bold py-1.5 flex items-center justify-center gap-1 text-neutral-700"><ExternalLink size={14} /> Hape në Instagram</a>
              )}
              {st(p) === 'posted' && <button type="button" className="mt-2 w-full rounded-xl border-2 border-brand/30 text-brand text-xs font-bold py-1.5" onClick={() => { setAnalyzeError(''); setUnconfigured(false); setInsight(p) }}>Analiza</button>}
            </div>
          </div>
        ))}
      </div>
      {insight && <InsightsPanel post={insight} report={report} posts={posts} analyses={analyses || []} onClose={() => setInsight(null)} onAnalyze={analyze} busy={analyzing} error={analyzeError} unconfigured={unconfigured} canAnalyze={Boolean(user)} />}
      {move && <ScheduleModal title="Ndrysho orën" initial={move.scheduled_at} onClose={() => setMove(null)} onSave={async (at) => { await reschedule(move, at); setMove(null) }} />}
      {zoom && <ImageLightbox src={zoom} alt="Postimi" onClose={() => setZoom(null)} />}
      {del && (
        <Modal title={st(del) === 'draft' ? 'Fshi draftin?' : 'Fshi postimin?'} text={st(del) === 'posted' ? 'Fshihet vetëm nga aplikacioni. Në Instagram mbetet; hape në Instagram për ta fshirë atje.' : st(del) === 'exported' ? 'Fshihet nga aplikacioni. Fotoja e shkarkuar në pajisje mbetet.' : 'Drafti fshihet përgjithmonë.'} onClose={() => setDel(null)}>
          {st(del) === 'posted' && igUrlFor(del) && (
            <a href={igUrlFor(del)} target="_blank" rel="noopener noreferrer" className="rounded-xl border-2 border-neutral-200 text-sm font-bold py-2 flex items-center justify-center gap-1"><ExternalLink size={15} /> Hape në Instagram</a>
          )}
          <button className="rounded-xl bg-red-600 text-white text-sm font-bold py-2 flex items-center justify-center gap-1" onClick={() => { removePost(del); setDel(null) }}><Trash2 size={15} /> {st(del) === 'posted' ? 'Fshi nga aplikacioni' : 'Fshi'}</button>
          <button className="rounded-xl bg-neutral-100 text-sm font-bold py-2" onClick={() => setDel(null)}>Anulo</button>
        </Modal>
      )}
    </div>
  )
}
