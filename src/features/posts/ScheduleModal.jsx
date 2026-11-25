import { useMemo, useState } from 'react'
import { CalendarClock, CalendarDays, ChevronLeft, ChevronRight, Minus, Plus, X } from 'lucide-react'
import { earliest, fromLocalInput, toLocalInput, MIN_AHEAD_MIN } from './schedule.js'

const WD = ['e diel', 'e hënë', 'e martë', 'e mërkurë', 'e enjte', 'e premte', 'e shtunë']
const WD_SHORT = ['Die', 'Hën', 'Mar', 'Mër', 'Enj', 'Pre', 'Sht']
const MONTHS = ['janar', 'shkurt', 'mars', 'prill', 'maj', 'qershor', 'korrik', 'gusht', 'shtator', 'tetor', 'nëntor', 'dhjetor']
const cap = (s) => s[0].toUpperCase() + s.slice(1)
const QUICK_TIMES = ['09:00', '12:00', '15:00', '18:00', '20:00', '21:00']
const pad = (n) => String(n).padStart(2, '0')

// Calendar days are "YYYY-MM-DD" strings in the shop's time zone (see schedule.js)
const parts = (d) => { const [y, m, dd] = d.split('-').map(Number); return { y, m: m - 1, d: dd, wd: new Date(Date.UTC(y, m - 1, dd)).getUTCDay() } }
const addDays = (d, n) => { const p = parts(d); return new Date(Date.UTC(p.y, p.m, p.d + n)).toISOString().slice(0, 10) }
const isoAt = (day, h, m) => fromLocalInput(`${day}T${pad(h)}:${pad(m)}`)
const okAt = (day, h, m) => Date.parse(isoAt(day, h, m)) >= earliest()
const dayOk = (day) => okAt(day, 23, 55)
const Chip = ({ on, disabled, onClick, children, className = '' }) => (
  <button type="button" disabled={disabled} onClick={onClick} className={`rounded-2xl border-2 font-bold disabled:opacity-30 ${on ? 'border-brand bg-brand text-white' : 'border-neutral-200 text-neutral-700'} ${className}`}>{children}</button>
)
const Stepper = ({ label, value, onDec, onInc }) => (
  <div className="flex items-center gap-1 rounded-2xl bg-neutral-100 p-1" aria-label={label}>
    <button type="button" onClick={onDec} className="w-9 h-9 rounded-xl bg-white shadow grid place-items-center" aria-label={`${label} më pak`}><Minus size={16} /></button>
    <span className="w-10 text-center text-2xl font-extrabold tabular-nums">{pad(value)}</span>
    <button type="button" onClick={onInc} className="w-9 h-9 rounded-xl bg-white shadow grid place-items-center" aria-label={`${label} më shumë`}><Plus size={16} /></button>
  </div>
)

// Compact month grid, Monday first
function MonthGrid({ day, today, onPick }) {
  const [view, setView] = useState(day.slice(0, 7) + '-01')
  const p = parts(view), lead = (p.wd + 6) % 7
  const len = new Date(Date.UTC(p.y, p.m + 1, 0)).getUTCDate()
  const cells = [...Array(lead).fill(null), ...Array.from({ length: len }, (_, i) => `${view.slice(0, 8)}${pad(i + 1)}`)]
  const shift = (n) => setView(new Date(Date.UTC(p.y, p.m + n, 1)).toISOString().slice(0, 10))
  return (
    <div className="rounded-2xl border-2 border-neutral-200 p-2">
      <div className="flex items-center justify-between mb-1">
        <button type="button" disabled={view <= today.slice(0, 7) + '-01'} onClick={() => shift(-1)} className="w-8 h-8 grid place-items-center rounded-xl disabled:opacity-30" aria-label="Muaji i kaluar"><ChevronLeft size={18} /></button>
        <span className="font-extrabold text-sm">{cap(MONTHS[p.m])} {p.y}</span>
        <button type="button" onClick={() => shift(1)} className="w-8 h-8 grid place-items-center rounded-xl" aria-label="Muaji tjetër"><ChevronRight size={18} /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 text-center">
        {[1, 2, 3, 4, 5, 6, 0].map((w) => <span key={w} className="text-[10px] font-bold text-neutral-400 py-1">{WD_SHORT[w]}</span>)}
        {cells.map((c, i) => c
          ? <button key={c} type="button" disabled={!dayOk(c)} onClick={() => onPick(c)} className={`h-8 rounded-xl text-sm font-bold disabled:text-neutral-300 ${c === day ? 'bg-brand text-white' : c === today ? 'text-brand' : 'text-neutral-700'}`}>{parts(c).d}</button>
          : <span key={'e' + i} />)}
      </div>
    </div>
  )
}

// Albanian date + time picker (Europe/Budapest) for a planned post. onSave(isoTime) may return a promise.
export default function ScheduleModal({ title = 'Planifiko postimin', initial, onSave, onClose }) {
  const start = useMemo(() => {
    const ms = initial && Date.parse(initial) > earliest() ? Date.parse(initial) : earliest() + 50 * 60e3
    const v = toLocalInput(Math.ceil(ms / 300e3) * 300e3)
    return { day: v.slice(0, 10), h: Number(v.slice(11, 13)), m: Number(v.slice(14, 16)) }
  }, [initial])
  const today = toLocalInput(Date.now()).slice(0, 10)
  const [day, setDay] = useState(start.day)
  const [h, setH] = useState(start.h)
  const [m, setM] = useState(start.m)
  const [cal, setCal] = useState(false)
  const [busy, setBusy] = useState(false)
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i))
  const ok = okAt(day, h, m), dp = parts(day)
  const save = async () => { setBusy(true); try { await onSave(isoAt(day, h, m)) } finally { setBusy(false) } }
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-3" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-white p-4 space-y-4 max-h-[92vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <div className="font-extrabold text-lg flex items-center gap-2"><CalendarClock size={20} className="text-brand" /> {title}</div>
          <button type="button" onClick={onClose} className="w-8 h-8 grid place-items-center rounded-xl bg-neutral-100" aria-label="Mbyll"><X size={16} /></button>
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-neutral-600">Dita</span>
            <button type="button" onClick={() => setCal((c) => !c)} className={`text-xs font-bold flex items-center gap-1 rounded-xl px-2 py-1 ${cal ? 'bg-brand-soft text-brand' : 'text-neutral-500'}`}><CalendarDays size={14} /> Kalendar</button>
          </div>
          {cal
            ? <MonthGrid day={day} today={today} onPick={(d) => { setDay(d); setCal(false) }} />
            : <div className="flex gap-2 overflow-x-auto -mx-4 px-4 pb-1 snap-x">
              {days.map((d, i) => { const p = parts(d); return (
                <Chip key={d} on={d === day} disabled={!dayOk(d)} onClick={() => setDay(d)} className="snap-start shrink-0 min-w-[64px] px-3 py-2 flex flex-col items-center leading-tight">
                  <span className="text-xs">{i === 0 ? 'Sot' : i === 1 ? 'Nesër' : WD_SHORT[p.wd]}</span>
                  <span className="text-lg">{p.d}</span>
                  <span className="text-[11px] font-semibold opacity-80">{cap(MONTHS[p.m].slice(0, 3))}</span>
                </Chip>) })}
            </div>}
        </div>
        <div>
          <span className="block text-sm font-bold text-neutral-600 mb-2">Ora</span>
          <div className="grid grid-cols-3 gap-2">
            {QUICK_TIMES.map((t) => { const [th, tm] = t.split(':').map(Number); return (
              <Chip key={t} on={th === h && tm === m} disabled={!okAt(day, th, tm)} onClick={() => { setH(th); setM(tm) }} className="py-2 text-sm tabular-nums">{t}</Chip>) })}
          </div>
          <div className="flex items-center justify-center gap-2 mt-3">
            <Stepper label="Ora" value={h} onDec={() => setH((v) => (v + 23) % 24)} onInc={() => setH((v) => (v + 1) % 24)} />
            <span className="text-2xl font-extrabold">:</span>
            <Stepper label="Minutat" value={m} onDec={() => setM((v) => (v + 55) % 60)} onInc={() => setM((v) => (v + 5) % 60)} />
          </div>
        </div>
        <div className={`rounded-2xl p-3 text-sm ${ok ? 'bg-brand-soft text-neutral-900' : 'bg-red-50 text-red-700'}`}>
          {ok
            ? <>Do të postohet: <b>{WD[dp.wd]}, {dp.d} {MONTHS[dp.m]}, {pad(h)}:{pad(m)}</b></>
            : <b>Zgjidh një orë të paktën {MIN_AHEAD_MIN} minuta nga tani.</b>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" className="rounded-2xl bg-neutral-100 font-bold py-3" onClick={onClose}>Anulo</button>
          <button type="button" className="rounded-2xl bg-brand text-white font-bold py-3 flex items-center justify-center gap-1.5 disabled:opacity-40" disabled={!ok || busy} onClick={save}><CalendarClock size={18} /> {title === 'Ndrysho orën' ? 'Ruaj' : 'Planifiko'}</button>
        </div>
      </div>
    </div>
  )
}
