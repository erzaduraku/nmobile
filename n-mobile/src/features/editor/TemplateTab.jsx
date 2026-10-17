import { Image as ImageIcon, RectangleVertical, Check } from 'lucide-react'
import PostCanvas from '../../components/ui/PostCanvas.jsx'
import { TEMPLATES } from '../templates/index.js'

export default function TemplateTab({ ed }) {
  const { data, ready, setTpl, setType, th, theme, tpl, type } = ed
  return (
          <div>
            <div className="grid grid-cols-2 gap-2 p-1 bg-neutral-100 rounded-2xl mb-4">
              {[['post', 'Post', ImageIcon], ['story', 'Story', RectangleVertical]].map(([id, n, I]) => (
                <button key={id} onClick={() => setType(id)} className={`rounded-xl py-3 font-bold flex items-center justify-center gap-2 ${type === id ? 'bg-white shadow text-brand' : 'text-neutral-500'}`}><I size={20} /> {n}</button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {TEMPLATES.map((t) => (
                <button key={t.id} onClick={() => setTpl(t.id)} className={`relative rounded-2xl overflow-hidden border-2 text-left ${tpl === t.id ? 'border-brand ring-4 ring-red-100' : 'border-neutral-200'}`}>
                  <PostCanvas tpl={t.id} type={type} theme={th} data={data} scale={0.3} ready={ready} />
                  {tpl === t.id && <span className="absolute top-2 right-2 bg-brand text-white rounded-full p-1"><Check size={16} /></span>}
                  <div className="px-3 py-2 font-semibold text-sm">{t.name}</div>
                </button>
              ))}
            </div>

          </div>
  )
}
