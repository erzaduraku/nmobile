import { useState } from 'react'
import { PenLine, Loader2, History, Trash2, ExternalLink, Maximize2, Download } from 'lucide-react'
import { postStatus } from './postsApi.js'
import ImageLightbox from '../../components/ui/ImageLightbox.jsx'

// Exported (downloaded/shared only) posts are listed under 'Të gjitha' only; 'Të postuara' = published to Instagram.
const SEG = [['all', 'Të gjitha'], ['draft', 'Draftet'], ['posted', 'Të postuara']]
const BADGE = { draft: ['Draft', 'bg-amber-400 text-neutral-900'], posted: ['Postuar', 'bg-green-600 text-white'], exported: ['Shkarkuar', 'bg-white/90 text-neutral-800'] }

export default function PostsTab({ ed }) {
  const { posts, postsBusy, removePost, reuse, user, igUrlFor, opening } = ed
  const [f, setF] = useState('all')
  const [del, setDel] = useState(null) // postimi që po fshihet (dritarja e konfirmimit)
  const [zoom, setZoom] = useState(null) // url e fotos së hapur të madhe
  const st = postStatus
  const count = { all: posts.length, draft: posts.filter((p) => st(p) === 'draft').length, posted: posts.filter((p) => st(p) === 'posted').length }
  const list = f === 'all' ? posts : posts.filter((p) => st(p) === f)
  return (
    <div>
      <h2 className="text-lg font-extrabold">Postimet e mia</h2>
      <p className="text-sm text-neutral-500 mb-3">{user ? 'Ruhen në llogarinë tënde.' : 'Ruhen vetëm në këtë pajisje.'} Draftet ruhen vetë gjatë punës.</p>
      <div className="grid grid-cols-3 gap-1 p-1 rounded-2xl bg-neutral-100 mb-4">
        {SEG.map(([id, l]) => (
          <button key={id} onClick={() => setF(id)} className={`rounded-xl py-2 text-sm font-bold flex items-center justify-center gap-1.5 ${f === id ? 'bg-white shadow text-neutral-900' : 'text-neutral-500'}`}>
            {l}<span className={`min-w-5 px-1.5 rounded-full text-xs ${f === id ? 'bg-brand text-white' : 'bg-neutral-200'}`}>{count[id]}</span>
          </button>
        ))}
      </div>
      {postsBusy && <div className="flex justify-center py-8"><Loader2 className="animate-spin text-brand" /></div>}
      {!postsBusy && !list.length && <div className="text-center text-neutral-400 py-12"><History size={40} className="mx-auto mb-2" />{f === 'draft' ? 'Nuk ke drafte.' : 'Ende nuk ke postime.'}</div>}
      <div className="grid grid-cols-2 gap-3">
        {list.map((p) => (
          <div key={p.id} className="rounded-2xl border-2 border-neutral-200 overflow-hidden">
            <div className="relative">
              {p.url
                ? <button type="button" onClick={() => setZoom(p.url)} aria-label="Shiko të madhe" className="block w-full"><img src={p.url} alt="" className="w-full block" /><span className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-black/55 text-white grid place-items-center"><Maximize2 size={14} /></span></button>
                : <div className="aspect-[4/5] bg-neutral-100" />}
              <span className={`absolute top-2 left-2 text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${BADGE[st(p)][1]}`}>{st(p) === 'exported' && <Download size={11} />}{BADGE[st(p)][0]}</span>
              {p.pending && <span className="absolute top-2 right-2 text-[11px] font-bold px-2 py-0.5 rounded-full bg-neutral-900/70 text-white">Në pajisje</span>}
            </div>
            <div className="p-2">
              <div className="font-semibold text-sm truncate">{p.model || 'Pa emër'}</div>
              <div className="text-xs text-neutral-500">{new Date(p.updated_at || p.created_at).toLocaleDateString('sq-AL')}</div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button className="rounded-xl bg-brand text-white text-sm font-bold py-2 flex items-center justify-center gap-1" disabled={Boolean(opening)} onClick={() => reuse(p)}>{opening === p.id ? <Loader2 size={15} className="animate-spin" /> : <PenLine size={15} />} {st(p) === 'draft' ? 'Vazhdo' : 'Edito'}</button>
                <button className="rounded-xl bg-neutral-100 text-sm font-bold py-2 flex items-center justify-center gap-1" onClick={() => setDel(p)} aria-label="Fshi"><Trash2 size={15} /> Fshi</button>
              </div>
              {st(p) === 'posted' && igUrlFor(p) && (
                <a href={igUrlFor(p)} target="_blank" rel="noopener noreferrer" className="mt-2 rounded-xl border-2 border-neutral-200 text-xs font-bold py-1.5 flex items-center justify-center gap-1 text-neutral-700"><ExternalLink size={14} /> Hape në Instagram</a>
              )}
            </div>
          </div>
        ))}
      </div>
      {zoom && <ImageLightbox src={zoom} alt="Postimi" onClose={() => setZoom(null)} />}
      {del && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => setDel(null)}>
          <div className="w-full max-w-sm rounded-2xl bg-white p-4" onClick={(e) => e.stopPropagation()}>
            <div className="font-extrabold">{st(del) === 'draft' ? 'Fshi draftin?' : 'Fshi postimin?'}</div>
            <p className="text-sm text-neutral-500 mt-1">{st(del) === 'posted' ? 'Fshihet vetëm nga aplikacioni. Në Instagram mbetet; hape në Instagram për ta fshirë atje.' : st(del) === 'exported' ? 'Fshihet nga aplikacioni. Fotoja e shkarkuar në pajisje mbetet.' : 'Drafti fshihet përgjithmonë.'}</p>
            <div className="grid gap-2 mt-4">
              {st(del) === 'posted' && igUrlFor(del) && (
                <a href={igUrlFor(del)} target="_blank" rel="noopener noreferrer" className="rounded-xl border-2 border-neutral-200 text-sm font-bold py-2 flex items-center justify-center gap-1"><ExternalLink size={15} /> Hape në Instagram</a>
              )}
              <button className="rounded-xl bg-red-600 text-white text-sm font-bold py-2 flex items-center justify-center gap-1" onClick={() => { removePost(del); setDel(null) }}><Trash2 size={15} /> {st(del) === 'posted' ? 'Fshi nga aplikacioni' : 'Fshi'}</button>
              <button className="rounded-xl bg-neutral-100 text-sm font-bold py-2" onClick={() => setDel(null)}>Anulo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
