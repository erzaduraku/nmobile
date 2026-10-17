import { Plus, History, ChevronRight, Zap } from 'lucide-react'

// Home: one big primary action + recent posts.
export default function HomePage({ ed, onPhoto, openPosts, openEditor, openSettings }) {
  const { posts, img, ig, user } = ed
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold font-display">Mirë se erdhe</h1>
        <p className="text-neutral-500">Krijo një postim për Instagram në pak sekonda.</p>
      </div>
      <label className="block rounded-3xl bg-brand text-white p-6 shadow-xl shadow-red-200 active:scale-[.98] transition cursor-pointer">
        <div className="w-14 h-14 rounded-2xl bg-white/20 grid place-items-center mb-4"><Plus size={32} /></div>
        <div className="text-2xl font-extrabold">Krijo postim të ri</div>
        <div className="text-white/85 text-sm mt-1">Ngarko foton e telefonit nga galeria ose kamera</div>
        <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
      </label>
      {img && <button className="btn-light flex items-center justify-center gap-2" onClick={openEditor}>Vazhdo postimin e fundit <ChevronRight size={20} /></button>}
      {user && !ig && (
        <button onClick={openSettings} className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-dashed border-brand/40 text-left">
          <Zap className="text-brand shrink-0" /><div className="flex-1"><div className="font-bold">Lidhe Instagramin</div><div className="text-sm text-neutral-500">Posto direkt nga aplikacioni</div></div><ChevronRight className="text-neutral-400" />
        </button>
      )}
      <div>
        <div className="flex items-center justify-between mb-2"><h2 className="font-extrabold text-lg">Postimet e fundit</h2>{posts.length > 0 && <button className="text-brand font-bold text-sm" onClick={openPosts}>Shiko të gjitha</button>}</div>
        {!posts.length ? <div className="text-center text-neutral-400 py-8 rounded-2xl bg-neutral-50"><History size={32} className="mx-auto mb-1" />Ende nuk ke postime.</div>
          : <div className="grid grid-cols-3 gap-2">{posts.slice(0, 6).map((p) => <button key={p.id} onClick={openPosts} className="rounded-xl overflow-hidden bg-neutral-100 aspect-[4/5]">{p.url && <img src={p.url} alt="" className="w-full h-full object-cover" />}</button>)}</div>}
      </div>
    </div>
  )
}
