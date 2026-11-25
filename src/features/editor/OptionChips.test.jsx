// @vitest-environment jsdom
import { act } from 'react'
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import OptionChips from '../../components/ui/OptionChips.jsx'
import { addToOptions, loadOptionSets, removeFromOptions, saveOptionSets } from './options.js'

globalThis.IS_REACT_ACT_ENVIRONMENT = true

function mount(element) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(element))
  return {
    host,
    unmount() { act(() => root.unmount()); host.remove() },
  }
}

function click(el) {
  act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })) })
}

function type(el, value) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set
  act(() => {
    setter.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

const findButton = (host, text) => [...host.querySelectorAll('button')].find((b) => b.textContent.trim() === text)

function Harness({ field = 'capacity', initialValue = '', multiple = false, onValue, persistent = false }) {
  const [sets, setSets] = useState(() => (persistent ? loadOptionSets() : JSON.parse(JSON.stringify(loadOptionSets()))))
  const [value, setValue] = useState(initialValue)
  const commit = (next) => { setSets(next); if (persistent) saveOptionSets(next) }
  const add = (raw) => {
    const result = addToOptions(sets, field, raw)
    if (result.ok) commit(result.sets)
    return result
  }
  const remove = (o) => commit(removeFromOptions(sets, field, o))
  const pick = (next, o) => { setValue(next); onValue?.(next, o) }
  return <OptionChips label={field} options={sets[field]} value={value} multiple={multiple} onPick={pick} onAdd={add} onDelete={remove} />
}

beforeEach(() => { localStorage.clear(); document.body.innerHTML = '' })

describe('OptionChips', () => {
  test('selecting toggles a single value and deleting a selected option clears it', () => {
    const onValue = vi.fn()
    const view = mount(<Harness onValue={onValue} />)
    click(findButton(view.host, '128GB'))
    expect(onValue).toHaveBeenCalledWith('128GB', expect.anything())

    click(view.host.querySelector('[aria-label="Hiq opsionin 128GB"]'))
    expect(onValue).toHaveBeenLastCalledWith('', expect.anything())
    expect(findButton(view.host, '128GB')).toBeUndefined()
    view.unmount()
  })

  test('adds a value once and rejects empty or case/space duplicates', () => {
    const view = mount(<Harness />)
    const input = view.host.querySelector('input')
    const add = () => click(findButton(view.host, '+ Add'))

    type(input, '2TB'); add()
    expect(findButton(view.host, '2TB')).toBeTruthy()
    expect(input.value).toBe('')

    type(input, '256 gb'); add()
    expect(view.host.querySelector('[role="status"]').textContent).toMatch(/ekziston/)
    expect(findButton(view.host, '256 gb')).toBeUndefined()

    type(input, '   '); add()
    expect(view.host.querySelector('[role="status"]').textContent).toMatch(/zbrazët/)
    view.unmount()
  })

  test('multiple selection keeps independent values and delete cleans the selected list', () => {
    const onValue = vi.fn()
    const view = mount(<Harness field="notes" multiple onValue={onValue} />)
    click(findButton(view.host, 'Me faturë'))
    click(findButton(view.host, 'Dual SIM'))
    expect(onValue).toHaveBeenLastCalledWith(['Me faturë', 'Dual SIM'], expect.anything())

    click(view.host.querySelector('[aria-label="Hiq opsionin-Me faturë"]') || view.host.querySelector('[aria-label="Hiq opsionin Me faturë"]'))
    expect(onValue).toHaveBeenLastCalledWith(['Dual SIM'], expect.anything())
    view.unmount()
  })

  test('added and deleted options survive unmount/remount', () => {
    const view = mount(<Harness persistent />)
    type(view.host.querySelector('input'), '2TB')
    click(findButton(view.host, '+ Add'))
    view.unmount()

    const again = mount(<Harness persistent />)
    expect(findButton(again.host, '2TB')).toBeTruthy()
    click(again.host.querySelector('[aria-label="Hiq opsionin 128GB"]'))
    again.unmount()

    const final = mount(<Harness persistent />)
    expect(findButton(final.host, '128GB')).toBeUndefined()
    expect(findButton(final.host, '2TB')).toBeTruthy()
    final.unmount()
  })
})
