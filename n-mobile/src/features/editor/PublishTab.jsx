import { Send, Download, Copy, RefreshCw, Loader2, Zap as Instagram, ExternalLink } from 'lucide-react'

export default function PublishTab({ ed }) {
  const { caption, copyCaption, download, ig, igBusy, igLink, publishDirect, setCaption, setCaptionEdited, setVariant, share } = ed
  return (
          <div className="space-y-3">
            {ig && <button className="btn-red text-xl flex items-center justify-center gap-2" disabled={igBusy} onClick={publishDirect}>{igBusy ? <Loader2 className="animate-spin" /> : <Instagram size={22} />} {igBusy ? 'Duke postuar…' : `Posto direkt (@${ig.username})`}</button>}
            {igLink && <a href={igLink} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 text-brand font-bold"><ExternalLink size={18} /> Shiko postimin</a>}
            <button className={`${ig ? 'btn-light' : 'btn-red text-xl'} flex items-center justify-center gap-2`} onClick={share}><Send size={22} /> {ig ? 'Shpërndaj (menyja e telefonit)' : 'Posto në Instagram'}</button>
            <div className="grid grid-cols-2 gap-3">
              <button className="btn-light flex items-center justify-center gap-2" onClick={download}><Download size={20} /> Shkarko</button>
              <button className="btn-light flex items-center justify-center gap-2" onClick={() => copyCaption()}><Copy size={20} /> Kopjo caption</button>
            </div>
            <div className="flex items-center justify-between pt-2"><span className="label !mb-0">Caption</span>
              <button className="text-brand font-bold text-sm py-1 flex items-center gap-1" onClick={() => { setCaptionEdited(false); setVariant((v) => v + 1) }}><RefreshCw size={16} /> Gjenero përsëri</button></div>
            <textarea className="field text-base min-h-[220px]" value={caption} onChange={(e) => { setCaption(e.target.value); setCaptionEdited(true) }} />
          </div>
  )
}
