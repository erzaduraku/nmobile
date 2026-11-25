import { useState } from 'react'
import { Check, Plus, Trash2 } from 'lucide-react'
import Modal from './Modal.jsx'
import { addToOptions, optionKey, optionText, removeFromOptions, sameOption } from '../../features/editor/options.js'

const FIELD = 'list'

// Selectable chips. Adding and deleting options happens in a modal and is kept
// until the user saves, so each field still owns its own list.
export default function OptionChips({
  options = [], value, onPick, onSave, makeOption, multiple = false, variant = 'regular',
  icons = false, label = 'fusha', placeholder = 'Shto opsion', renderOption,
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(options)
  const [input, setInput] = useState('')
  const [message, setMessage] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null)
  const selected = (multiple ? (Array.isArray(value) ? value : []) : (value ? [value] : [])).map(optionText).filter(Boolean)
  const isSelected = (o) => selected.some((v) => sameOption(v, o))

  const pick = (o) => {
    const on = isSelected(o)
    const next = on ? selected.filter((v) => !sameOption(v, o)) : (multiple ? [...selected, optionText(o)] : optionText(o))
    onPick(multiple ? next : (on ? '' : optionText(o)), o)
  }

  const openManager = () => {
    setDraft(options)
    setInput('')
    setMessage('')
    setPendingDelete(null)
    setOpen(true)
  }
  const close = () => { setPendingDelete(null); setOpen(false) }

  const submit = (e) => {
    e.preventDefault()
    const result = addToOptions({ [FIELD]: draft }, FIELD, input, makeOption || ((v) => v))
    if (result.ok === false) {
      setMessage(result.reason === 'duplicate' ? 'Ky opsion ekziston tashmë.' : 'Shkruaj një vlerë jo të zbrazët.')
      return
    }
    setDraft(result.sets[FIELD])
    setInput('')
    setMessage('')
  }

  const confirmDelete = () => {
    setDraft(removeFromOptions({ [FIELD]: draft }, FIELD, pendingDelete)[FIELD])
    setPendingDelete(null)
  }

  const save = () => {
    const removed = options.filter((o) => !draft.some((d) => sameOption(d, o)))
    onSave?.(draft)
    const kept = selected.filter((v) => !removed.some((o) => sameOption(v, o)))
    if (kept.length !== selected.length) onPick(multiple ? kept : '', removed.find((o) => selected.some((v) => sameOption(v, o))))
    close()
  }

  const compact = variant === 'compact'
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {options.map((o) => {
          const on = isSelected(o)
          return (
            <button
              key={optionKey(o)}
              type="button"
              onClick={() => pick(o)}
              aria-pressed={on}
              className={`inline-flex items-center gap-1 rounded-full border-2 text-sm font-bold ${compact ? 'px-3 py-1.5' : 'min-h-[40px] px-3'} ${on ? 'bg-brand border-brand text-white' : 'border-neutral-200 text-neutral-700'}`}
            >
              {icons && (on ? <Check size={14} /> : <Plus size={14} />)}
              {renderOption ? renderOption(o) : optionText(o)}
            </button>
          )
        })}
      </div>
      <button type="button" onClick={openManager} className="text-sm font-semibold text-neutral-500 hover:text-neutral-800">Menaxho opsionet</button>
      {open && (
        <Modal title={label} onClose={close} className="max-h-[85vh] overflow-y-auto">
          <ul className="max-h-52 overflow-y-auto rounded-xl border border-neutral-200 divide-y divide-neutral-100">
            {draft.map((o) => (
              <li key={optionKey(o)} className="flex items-center gap-2 px-2.5 py-1.5">
                <span className="flex flex-1 min-w-0 items-center gap-2 text-sm font-semibold">{renderOption ? renderOption(o) : optionText(o)}</span>
                <button type="button" onClick={() => setPendingDelete(o)} className="w-8 h-8 grid place-items-center rounded-lg text-neutral-400 hover:text-red-600" aria-label={`Fshi ${optionText(o)}`}><Trash2 size={16} /></button>
              </li>
            ))}
            {!draft.length && <li className="px-3 py-3 text-sm text-neutral-400">Nuk ka opsione.</li>}
          </ul>
          <form onSubmit={submit} className="flex items-center gap-2">
            <input
              className="flex-1 min-w-0 rounded-xl border-2 border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-brand"
              value={input}
              onChange={(e) => { setInput(e.target.value); setMessage('') }}
              placeholder={placeholder}
              aria-label={`Shto opsion te ${label}`}
            />
            <button type="submit" className="shrink-0 rounded-xl bg-neutral-100 px-3 py-1.5 text-sm font-bold hover:bg-neutral-200">Shto</button>
          </form>
          {message && <p role="status" className="text-xs text-brand">{message}</p>}
          <button type="button" onClick={save} className="rounded-xl bg-brand text-white text-sm font-bold py-2">Ruaj ndryshimet</button>
          <button type="button" onClick={close} className="rounded-xl bg-neutral-100 text-sm font-bold py-2">Anulo</button>
        </Modal>
      )}
      {pendingDelete && (
        <Modal title="Ta fshish këtë opsion?" text={`“${optionText(pendingDelete)}” hiqet nga lista.`} onClose={() => setPendingDelete(null)}>
          <button type="button" onClick={confirmDelete} className="rounded-xl bg-red-600 text-white text-sm font-bold py-2 flex items-center justify-center gap-1"><Trash2 size={15} /> Fshi</button>
          <button type="button" onClick={() => setPendingDelete(null)} className="rounded-xl bg-neutral-100 text-sm font-bold py-2">Anulo</button>
        </Modal>
      )}
    </div>
  )
}
