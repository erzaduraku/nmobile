import { useState } from 'react'
import { Check, Plus, X } from 'lucide-react'
import { optionKey, optionText, sameOption } from '../../features/editor/options.js'

// Reusable option picker: selectable chips plus an add field and a subtle delete control.
// `options` / selection cleanup are owned by the caller so every field has its own list.
export default function OptionChips({
  options = [], value, onPick, onAdd, onDelete, multiple = false, variant = 'regular',
  icons = false, label = 'fusha', placeholder = 'Shto opsion', renderOption,
}) {
  const [input, setInput] = useState('')
  const [message, setMessage] = useState('')
  const selected = (multiple ? (Array.isArray(value) ? value : []) : (value ? [value] : [])).map(optionText).filter(Boolean)
  const isSelected = (o) => selected.some((v) => sameOption(v, o))

  const pick = (o) => {
    const on = isSelected(o)
    const next = on ? selected.filter((v) => !sameOption(v, o)) : (multiple ? [...selected, optionText(o)] : optionText(o))
    onPick(multiple ? next : (on ? '' : optionText(o)), o)
  }

  const remove = (o) => {
    onDelete?.(o)
    if (isSelected(o)) onPick(multiple ? selected.filter((v) => !sameOption(v, o)) : '', o)
    setMessage('')
  }

  const submit = (e) => {
    e.preventDefault()
    const result = onAdd?.(input)
    if (result && result.ok === false) {
      setMessage(result.reason === 'duplicate' ? 'Ky opsion ekziston tashmë.' : 'Shkruaj një vlerë jo të zbrazët.')
      return
    }
    setInput('')
    setMessage('')
  }

  const compact = variant === 'compact'
  return (
    <div>
      <div className="flex flex-wrap gap-2 mb-2">
        {options.map((o) => {
          const on = isSelected(o)
          const tone = on ? 'bg-brand border-brand text-white' : 'border-neutral-200 text-neutral-700'
          return (
            <span key={optionKey(o)} className={`inline-flex items-center rounded-full border-2 ${compact ? '' : 'min-h-[40px]'} ${tone}`}>
              <button
                type="button"
                onClick={() => pick(o)}
                className={`flex items-center gap-1 text-sm font-bold ${compact ? 'px-3 py-1.5' : 'px-3'}`}
                aria-pressed={on}
              >
                {icons && (on ? <Check size={14} /> : <Plus size={14} />)}
                {renderOption ? renderOption(o) : optionText(o)}
              </button>
              <button
                type="button"
                onClick={() => remove(o)}
                className={`grid place-items-center ${compact ? 'pr-2 pl-0.5' : 'pr-2.5 pl-0.5'} ${on ? 'text-white/70 hover:text-white' : 'text-neutral-400 hover:text-brand'}`}
                aria-label={`Hiq opsionin ${optionText(o)}`}
                title={`Hiq opsionin ${optionText(o)}`}
              >
                <X size={compact ? 12 : 14} />
              </button>
            </span>
          )
        })}
      </div>
      <form onSubmit={submit} className="flex items-center gap-2">
        <input
          className="flex-1 rounded-full border-2 border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-brand"
          value={input}
          onChange={(e) => { setInput(e.target.value); setMessage('') }}
          placeholder={placeholder}
          aria-label={`Shto opsion te ${label}`}
        />
        <button type="submit" className="shrink-0 rounded-full bg-neutral-100 px-3 py-1.5 text-sm font-bold hover:bg-neutral-200">+ Add</button>
      </form>
      {message && <p role="status" className="mt-1 text-xs text-brand">{message}</p>}
    </div>
  )
}
