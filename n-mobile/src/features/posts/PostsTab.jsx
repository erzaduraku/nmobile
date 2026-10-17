import { useState } from 'react'
import { PenLine, Loader2, History, Trash2 } from 'lucide-react'

const SEG = [['all', 'Të gjitha'], ['draft', 'Draftet'], ['posted', 'Të postuara']]

export default function PostsTab({ ed }) {
  const { posts, postsBusy, removePost, reuse, user } = ed
  const [f, setF] = useState('all')
  const st = (p) => p.status || 'posted'
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
              {p.url ? <img src={p.url} alt="" className="w-full block" /> : <div className="aspect-[4/5] bg-neutral-100" />}
              <span className={`absolute top-2 left-2 text-[11px] font-bold px-2 py-0.5 rounded-full ${st(p) === 'draft' ? 'bg-amber-400 text-neutral-900' : 'bg-green-600 text-white'}`}>{st(p) === 'draft' ? 'Draft' : 'Postuar'}</span>
            </div>
            <div className="p-2">
              <div className="font-semibold text-sm truncate">{p.model || 'Pa emër'}</div>
              <div className="text-xs text-neutral-500">{new Date(p.updated_at || p.created_at).toLocaleDateString('sq-AL')}</div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button className="rounded-xl bg-brand text-white text-sm font-bold py-2 flex items-center justify-center gap-1" onClick={() => reuse(p)}><PenLine size={15} /> {st(p) === 'draft' ? 'Vazhdo' : 'Edito'}</button>
                <button className="rounded-xl bg-neutral-100 text-sm font-bold py-2 flex items-center justify-center gap-1" onClick={() => removePost(p)} aria-label="Fshi"><Trash2 size={15} /> Fshi</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
