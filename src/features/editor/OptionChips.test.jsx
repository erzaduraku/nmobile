// @vitest-environment jsdom
import { act } from 'react'
import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import OptionChips from '../../components/ui/OptionChips.jsx'
import { loadOptionSets, saveOptionSets } from './options.js'

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
const dialog = (host, title) => [...host.querySelectorAll('div')].find((el) => el.classList.contains('font-extrabold') && el.textContent === title)?.parentElement

function Harness({ field = 'capacity', initialValue = '', multiple = false, onValue, persistent = false }) {
  const [sets, setSets] = useState(() => (persistent ? loadOptionSets() : JSON.parse(JSON.stringify(loadOptionSets()))))
  const [value, setValue] = useState(initialValue)
  const save = (list) => {
    setSets((current) => {
      const next = { ...current, [field]: list }
      if (persistent) saveOptionSets(next)
      return next
    })
  }
  const pick = (next, o) => { setValue(next); onValue?.(next, o) }
  return <OptionChips label={field} options={sets[field]} value={value} multiple={multiple} onPick={pick} onSave={save} />
}

function openManager(host) {
  click(findButton(host, 'Add'))
}

beforeEach(() => { localStorage.clear(); document.body.innerHTML = '' })

describe('OptionChips', () => {
  test('chips select a value and have no delete control', () => {
    const onValue = vi.fn()
    const view = mount(<Harness onValue={onValue} />)
    expect(view.host.querySelector('[aria-label="Hiq opsionin 128GB"]')).toBeNull()
    expect(view.host.querySelector('input')).toBeNull()
    click(findButton(view.host, '128GB'))
    expect(onValue).toHaveBeenCalledWith('128GB', expect.anything())
    view.unmount()
  })

  test('deleting a selected option clears it only after the list is saved', () => {
    const onValue = vi.fn()
    const view = mount(<Harness initialValue="128GB" onValue={onValue} />)
    openManager(view.host)
    click(view.host.querySelector('[aria-label="Fshi 128GB"]'))
    click(findButton(view.host, 'Fshi'))
    expect(onValue).not.toHaveBeenCalled()
    expect(findButton(view.host, '128GB')).toBeTruthy()

    click(findButton(view.host, 'Ruaj ndryshimet'))
    expect(onValue).toHaveBeenCalledWith('', expect.anything())
    expect(findButton(view.host, '128GB')).toBeUndefined()
    view.unmount()
  })

  test('adds a value once, rejects empty or duplicate text, and drops it on cancel', () => {
    const view = mount(<Harness />)
    openManager(view.host)
    const input = view.host.querySelector('input')
    const add = () => click(findButton(view.host, 'Shto'))

    type(input, '2TB'); add()
    expect(findButton(view.host, '2TB')).toBeUndefined()
    expect(input.value).toBe('')

    type(input, '256 gb'); add()
    expect(view.host.querySelector('[role="status"]').textContent).toMatch(/ekziston/)

    type(input, '   '); add()
    expect(view.host.querySelector('[role="status"]').textContent).toMatch(/zbrazët/)

    click(findButton(view.host, 'Anulo'))
    expect(view.host.textContent).not.toContain('2TB')

    openManager(view.host)
    type(view.host.querySelector('input'), '2TB')
    click(findButton(view.host, 'Shto'))
    click(findButton(view.host, 'Ruaj ndryshimet'))
    expect(findButton(view.host, '2TB')).toBeTruthy()
    view.unmount()
  })

  test('multiple selection stays until a saved delete removes that value', () => {
    const onValue = vi.fn()
    const view = mount(<Harness field="notes" multiple onValue={onValue} />)
    click(findButton(view.host, 'Me faturë'))
    click(findButton(view.host, 'Dual SIM'))
    expect(onValue).toHaveBeenLastCalledWith(['Me faturë', 'Dual SIM'], expect.anything())

    openManager(view.host)
    click(view.host.querySelector('[aria-label="Fshi Me faturë"]'))
    click(findButton(view.host, 'Fshi'))
    expect(onValue).toHaveBeenLastCalledWith(['Me faturë', 'Dual SIM'], expect.anything())
    click(findButton(view.host, 'Ruaj ndryshimet'))
    expect(onValue).toHaveBeenLastCalledWith(['Dual SIM'], expect.anything())
    view.unmount()
  })

  test('saved options survive unmount and a cancelled delete does not', () => {
    const view = mount(<Harness persistent />)
    openManager(view.host)
    type(view.host.querySelector('input'), '2TB')
    click(findButton(view.host, 'Shto'))
    click(findButton(view.host, 'Ruaj ndryshimet'))
    view.unmount()

    const again = mount(<Harness persistent />)
    expect(findButton(again.host, '2TB')).toBeTruthy()
    openManager(again.host)
    click(again.host.querySelector('[aria-label="Fshi 128GB"]'))
    click(findButton(dialog(again.host, 'Ta fshish këtë opsion'), 'Anulo'))
    click(findButton(again.host, 'Ruaj ndryshimet'))
    again.unmount()

    const kept = mount(<Harness persistent />)
    expect(findButton(kept.host, '128GB')).toBeTruthy()
    openManager(kept.host)
    click(kept.host.querySelector('[aria-label="Fshi 128GB"]'))
    click(findButton(kept.host, 'Fshi'))
    click(findButton(kept.host, 'Ruaj ndryshimet'))
    kept.unmount()

    const final = mount(<Harness persistent />)
    expect(findButton(final.host, '128GB')).toBeUndefined()
    expect(findButton(final.host, '2TB')).toBeTruthy()
    final.unmount()
  })
})
