import { beforeEach, describe, expect, test } from 'vitest'
import { addToOptions, loadOptionSets, optionKey, optionText, removeFromOptions, sameOption, saveOptionSets } from './options.js'

class MemoryStorage {
  constructor() { this.map = new Map() }
  getItem(k) { return this.map.has(k) ? this.map.get(k) : null }
  setItem(k, v) { this.map.set(k, String(v)) }
  removeItem(k) { this.map.delete(k) }
  clear() { this.map.clear() }
}
globalThis.localStorage = new MemoryStorage()

beforeEach(() => { localStorage.clear() })

describe('option helpers', () => {
  test('option keys ignore case and all spaces', () => {
    expect(optionText('  256   GB  ')).toBe('256 GB')
    expect(optionKey('256 GB')).toBe(optionKey('256gb'))
    expect(optionKey('Bli tani!')).toBe(optionKey('BLI TANI!'))
    expect(sameOption('Dual SIM', 'dualsim')).toBe(true)
    expect(sameOption('', 'x')).toBe(false)
  })

  test('rejects empty and duplicate values without changing the list', () => {
    const sets = loadOptionSets()
    const empty = addToOptions(sets, 'capacity', '   ')
    expect(empty.ok).toBe(false)
    expect(empty.reason).toBe('empty')
    expect(empty.sets).toBe(sets)

    const duplicate = addToOptions(sets, 'capacity', ' 256 gb ')
    expect(duplicate.ok).toBe(false)
    expect(duplicate.reason).toBe('duplicate')
    expect(duplicate.sets).toBe(sets)

    const added = addToOptions(sets, 'capacity', '2TB')
    expect(added.ok).toBe(true)
    expect(added.sets.capacity.map(optionText)).toContain('2TB')
    expect(sets.capacity.map(optionText)).not.toContain('2TB')
  })

  test('applies an input transform before validating', () => {
    const sets = loadOptionSets()
    const added = addToOptions(sets, 'spec.ram', ' 18 gb ', (s) => s.toUpperCase().replace(' GB', 'GB'))
    expect(added.ok).toBe(true)
    expect(added.sets['spec.ram'].at(-1)).toBe('18GB')

    const duplicate = addToOptions(sets, 'spec.ram', '12', (s) => s + 'GB')
    expect(duplicate.ok).toBe(false)
    expect(duplicate.reason).toBe('duplicate')
  })

  test('field lists are independent', () => {
    const sets = loadOptionSets()
    const capacity = addToOptions(sets, 'capacity', '2TB').sets
    expect(capacity.cta).toEqual(sets.cta)
    expect(capacity.notes).toEqual(sets.notes)

    const cta = addToOptions(sets, 'cta', 'Thirre tani').sets
    expect(cta.capacity).toEqual(sets.capacity)
    expect(cta.notes).toEqual(sets.notes)
  })

  test('additions and deletions survive a reload, including an empty list', () => {
    const added = addToOptions(loadOptionSets(), 'capacity', '2TB').sets
    saveOptionSets(added)
    expect(loadOptionSets().capacity.map(optionText)).toContain('2TB')

    const removed = removeFromOptions(loadOptionSets(), 'capacity', '128GB')
    saveOptionSets(removed)
    expect(loadOptionSets().capacity.map(optionText)).not.toContain('128GB')

    saveOptionSets({ ...loadOptionSets(), capacity: [] })
    expect(loadOptionSets().capacity).toEqual([])
  })

  test('legacy selected values are included only for fields without a saved list', () => {
    const sets = loadOptionSets({
      capacity: '2TB',
      cta: 'Bli Tani!',
      notes: ['Dual SIM', 'I ri në pako'],
      colors: [{ name: 'Rozë e re' }],
      'spec.ram': '18GB',
    })
    expect(sets.capacity.map(optionText)).toContain('2TB')
    expect(sets.cta).toHaveLength(3) // "Bli Tani!" duplicates the default "Bli tani!"
    expect(sets.notes.map(optionText)).toContain('I ri në pako')
    expect(sets.colors.map(optionText)).toContain('Rozë e re')
    expect(sets['spec.ram']).toContain('18GB')

    saveOptionSets({ ...sets, capacity: [] })
    const reloaded = loadOptionSets({ capacity: '2TB' })
    expect(reloaded.capacity).toEqual([]) // a deleted option is not resurrected by stale state
  })
})
