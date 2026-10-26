import { useState } from 'react'
import { Send, Download, Copy, Shuffle, Loader2, Zap as Instagram, ExternalLink, CheckCircle2, Repeat, Undo2, AlignLeft, ListChecks, CalendarClock, BadgePercent, MessageCircleQuestion, Briefcase, List, Tag, Phone, Hash } from 'lucide-react'
import Modal from '../../components/ui/Modal.jsx'
import ScheduleModal from '../posts/ScheduleModal.jsx'
import { CAPTION_STYLES, HASHTAG_SETS, IG_MAX_CHARS, IG_MAX_TAGS, countTags } from './caption.js'

const STYLE_ICON = { short: AlignLeft, detailed: ListChecks, offer: BadgePercent, question: MessageCircleQuestion, pro: Briefcase, bullets: List }
const Switch = ({ on, onClick, icon: I, label, disabled }) => (
  <button type="button" role="switch" aria-checked={on} disabled={disabled} onClick={onClick} className={`flex items-center gap-1.5 rounded-xl border-2 px-3 py-2 text-sm font-bold disabled:opacity-40 ${on ? 'border-brand bg-brand-soft text-brand' : 'border-neutral-200 text-neutral-500'}`}>
    <I size={15} /> {label}<span className={`ml-1 w-7 h-4 rounded-full relative transition ${on ? 'bg-brand' : 'bg-neutral-300'}`}><span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${on ? 'left-3.5' : 'left-0.5'}`} /></span>
  </button>
)

export default function PublishTab({ ed }) {
  const { caption, copyCaption, download, ig, igBusy, igLink, publishDirect, setCaption, setCaptionEdited, setVariant, share, published, igUrlFor, capOpts, setCapOpts, captionEdited, contact = {}, schedulePost, user } = ed
  const [mine, setMine] = useState('') // the user's own edited text, kept when a new caption is generated
  // regenerate with new options / phrasing; an edited text can be brought back with "Rikthe tekstin tënd"
  const regen = (patch, shuffle) => { if (captionEdited) setMine(caption); if (patch) setCapOpts(patch); if (shuffle) setVariant((v) => v + 1); setCaptionEdited(false) }
  const hasContact = ['phone', 'whatsapp', 'address'].some((k) => (contact[k] || '').trim())
  const len = caption.length, tags = countTags(caption), over = len > IG_MAX_CHARS || tags > IG_MAX_TAGS
  const [again, setAgain] = useState(false) // confirm dialog for "Posto prapë"
  const [plan, setPlan] = useState(false) // date/time picker for "Planifiko"
  const link = published ? published.permalink || igLink || (igUrlFor && igUrlFor({ status: 'posted', ig_media_id: published.ig_media_id })) || '' : igLink
  return (
          <div className="space-y-3">
            {published
              ? <div role="status" className="w-full rounded-2xl border-2 border-green-600 bg-green-50 text-green-700 text-xl font-bold py-4 flex items-center justify-center gap-2"><CheckCircle2 size={24} /> Postuar në Instagram</div>
              : ig && (
                <div className="flex gap-2">
                  <button className="btn-red text-xl flex-1 flex items-center justify-center gap-2" disabled={igBusy} onClick={() => publishDirect()}>{igBusy ? <Loader2 className="animate-spin" /> : <Instagram size={22} />} {igBusy ? 'Duke postuar…' : `Posto direkt (@${ig.username})`}</button>
                  {user && <button className="btn-light !w-auto shrink-0 px-4 flex flex-col items-center justify-center text-xs font-bold" disabled={igBusy} onClick={() => setPlan(true)} aria-label="Planifiko postimin"><CalendarClock size={22} /> Planifiko</button>}
                </div>
              )}
            {(link || (published && ig)) && (
              <div className="flex items-center justify-center gap-5">
                {link && <a href={link} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-brand font-bold"><ExternalLink size={18} /> Shiko postimin</a>}
                {published && ig && <button className="flex items-center gap-1.5 text-sm font-semibold text-neutral-500 py-1" disabled={igBusy} onClick={() => setAgain(true)}>{igBusy ? <Loader2 size={15} className="animate-spin" /> : <Repeat size={15} />} Posto prapë</button>}
              </div>
            )}
            <button className={`${ig ? 'btn-light' : 'btn-red text-xl'} flex items-center justify-center gap-2`} onClick={share}><Send size={22} /> {ig ? 'Shpërndaj (menyja e telefonit)' : 'Posto në Instagram'}</button>
            <div className="grid grid-cols-2 gap-3">
              <button className="btn-light flex items-center justify-center gap-2" onClick={download}><Download size={20} /> Shkarko</button>
              <button className="btn-light flex items-center justify-center gap-2" onClick={() => copyCaption()}><Copy size={20} /> Kopjo caption</button>
            </div>
            <div className="pt-3 space-y-3">
              <span className="label !mb-0">Caption</span>
              <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Stili i caption-it">
                {CAPTION_STYLES.map((st) => { const I = STYLE_ICON[st.id], on = capOpts.style === st.id; return (
                  <button key={st.id} role="radio" aria-checked={on} onClick={() => regen({ style: st.id })} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold border-2 ${on ? 'bg-brand border-brand text-white' : 'border-neutral-200 text-neutral-700'}`}><I size={15} /> {st.name}</button>) })}
              </div>
              <div className="flex flex-wrap gap-2">
                <Switch on={capOpts.price} onClick={() => regen({ price: !capOpts.price })} icon={Tag} label="Çmimi" />
                <Switch on={capOpts.contact && hasContact} disabled={!hasContact} onClick={() => regen({ contact: !capOpts.contact })} icon={Phone} label="Kontakti" />
              </div>
              {!hasContact && <p className="text-xs text-neutral-500 -mt-1">Shto telefonin, WhatsApp-in ose adresën te Cilësimet që të dalin në caption.</p>}
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-neutral-600 flex items-center gap-1"><Hash size={15} /> Hashtag</span>
                <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-neutral-100 flex-1">
                  {HASHTAG_SETS.map(([id, l]) => <button key={id} onClick={() => regen({ tags: id })} className={`rounded-lg py-1.5 text-sm font-bold ${capOpts.tags === id ? 'bg-white shadow text-neutral-900' : 'text-neutral-500'}`}>{l}</button>)}
                </div>
              </div>
              <div className="flex justify-end -mb-2"><button className="text-brand font-bold text-sm py-1 flex items-center gap-1" onClick={() => regen(null, true)}><Shuffle size={16} /> Gjenero tjetër</button></div>
              <textarea className="field text-base leading-snug" rows={Math.min(26, Math.max(8, caption.split("\n").length + 5))} value={caption} onChange={(e) => { setCaption(e.target.value); setCaptionEdited(true) }} aria-label="Caption" />
              <div className="flex items-center justify-between text-xs -mt-1">
                <span className={over ? 'text-red-600 font-bold' : 'text-neutral-500'}>{len}/{IG_MAX_CHARS} shkronja · {tags}/{IG_MAX_TAGS} hashtag</span>
                {mine && !captionEdited && <button className="font-bold text-neutral-600 flex items-center gap-1" onClick={() => { setCaption(mine); setCaptionEdited(true); setMine('') }}><Undo2 size={14} /> Rikthe tekstin tënd</button>}
                {captionEdited && <span className="text-neutral-500">Ndryshuar nga ti</span>}
              </div>
              <p className="text-xs text-neutral-500 -mt-2">{over ? 'Instagrami lejon deri në 2200 shkronja dhe 30 hashtag. Shkurtoje tekstin.' : 'Mund ta ndryshosh tekstin. Ky tekst kopjohet, postohet dhe ruhet me postimin.'}</p>
            </div>
            {plan && <ScheduleModal onClose={() => setPlan(false)} onSave={async (at) => { if (await schedulePost(at)) setPlan(false) }} />}
            {again && (
              <Modal title="Ta postosh prapë?" text="Ky postim është tashmë në Instagram. Nëse vazhdon, do të dalë edhe një herë si postim i ri." onClose={() => setAgain(false)}>
                <button className="rounded-xl bg-brand text-white text-sm font-bold py-2 flex items-center justify-center gap-1" onClick={() => { setAgain(false); publishDirect(true) }}><Repeat size={15} /> Po, posto prapë</button>
                <button className="rounded-xl bg-neutral-100 text-sm font-bold py-2" onClick={() => setAgain(false)}>Anulo</button>
              </Modal>
            )}
          </div>
  )
}
