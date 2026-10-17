import { Camera, Eraser, Undo2, Sparkles, Loader2 } from 'lucide-react'

// Photo step: upload + background removal (fast automatic for solid/gradient backgrounds of any
// colour, AI for busy backgrounds) with undo to the original upload.
const CHECKER = { backgroundColor: '#fff', backgroundImage: 'linear-gradient(45deg,#e5e5e5 25%,transparent 25%),linear-gradient(-45deg,#e5e5e5 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#e5e5e5 75%),linear-gradient(-45deg,transparent 75%,#e5e5e5 75%)', backgroundSize: '20px 20px', backgroundPosition: '0 0,0 10px,10px -10px,-10px 0' }

export default function PhotoTab({ ed }) {
  const { img, onPhoto, photoMissing, bg, setBgRemoved, photoBlob } = ed
  const hasOrig = Boolean(photoBlob().orig)
  const busy = bg.busy
  return (
    <div className="pt-6 text-center">
      <h1 className="text-2xl font-extrabold font-display">Krijo një postim</h1>
      <p className="text-neutral-500 mt-2 mb-8">Bëj foto telefonit që po shet ose zgjidhe nga galeria.</p>
      {photoMissing && !img && <p className="-mt-4 mb-6 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm p-3">Fotoja e këtij drafti nuk ishte ruajtur. Ngarkoje përsëri – të dhënat e tjera janë ruajtur.</p>}
      {img && (
        <div className="mb-5 text-left">
          <div className="relative rounded-2xl overflow-hidden border-2 border-neutral-200 h-56 grid place-items-center" style={bg.removed ? CHECKER : { background: '#f5f5f5' }}>
            <img src={img.src} alt="Fotoja e produktit" className="max-h-52 max-w-full object-contain" />
            {busy && <div className="absolute inset-0 bg-white/70 grid place-items-center text-sm font-bold text-neutral-700"><span className="flex items-center gap-2"><Loader2 className="animate-spin text-brand" />{busy === 'ai' ? `Duke hequr sfondin (AI)${bg.progress > 0 && bg.progress < 1 ? ` ${Math.round(bg.progress * 100)}%` : '…'}` : 'Duke hequr sfondin…'}</span></div>}
          </div>
          <button type="button" disabled={Boolean(busy)} onClick={() => setBgRemoved(!bg.removed, !bg.smooth)} className={`mt-3 w-full flex items-center justify-between rounded-xl border-2 px-4 py-3 ${bg.removed ? 'border-brand bg-red-50' : 'border-neutral-200'}`}>
            <span className="flex items-center gap-3"><Eraser size={20} className="text-brand" /><span><span className="font-bold block">Hiq sfondin</span><span className="text-xs text-neutral-500">{bg.removed ? 'Duket vetëm telefoni' : bg.smooth ? 'Sfond me një ngjyrë – hiqet menjëherë' : 'Sfond i ndërlikuar – hiqet me AI'}</span></span></span>
            <span className={`w-12 h-7 rounded-full relative transition shrink-0 ${bg.removed ? 'bg-brand' : 'bg-neutral-300'}`}><span className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${bg.removed ? 'left-6' : 'left-1'}`} /></span>
          </button>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <button type="button" disabled={Boolean(busy)} onClick={() => setBgRemoved(true, true)} className="btn-light !py-2.5 text-sm flex items-center justify-center gap-1.5"><Sparkles size={16} /> Hiq sfondin (AI)</button>
            <button type="button" disabled={Boolean(busy) || !hasOrig} onClick={() => setBgRemoved(false)} className="btn-light !py-2.5 text-sm flex items-center justify-center gap-1.5 disabled:opacity-40"><Undo2 size={16} /> Rikthe origjinalin</button>
          </div>
        </div>
      )}
      <label className={`btn-red flex flex-col items-center gap-3 cursor-pointer ${img ? '!py-4 text-lg' : '!py-10 text-2xl'}`}>
        <Camera size={img ? 28 : 56} strokeWidth={1.8} /> {img ? 'Ndrysho foton' : 'Ngarko foto'}
        <input type="file" accept="image/*" className="hidden" onChange={onPhoto} />
      </label>
    </div>
  )
}
