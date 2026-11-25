import { describe, expect, test } from 'vitest'
import { MIN_AHEAD_MIN, TZ, earliest, fmtWhen, fromLocalInput, toLocalInput } from './schedule.js'

describe('schedule', () => {
  test('uses the shop time zone', () => {
    expect(TZ).toBe('Europe/Budapest')
    expect(MIN_AHEAD_MIN).toBe(10)
  })

  test('round-trips a winter shop time through the datetime-local value', () => {
    const iso = '2026-01-15T10:30:00.000Z'
    expect(toLocalInput(Date.parse(iso))).toBe('2026-01-15T11:30')
    expect(fromLocalInput('2026-01-15T11:30')).toBe(iso)
  })

  test('applies summer time', () => {
    const iso = '2026-07-15T10:30:00.000Z'
    expect(toLocalInput(Date.parse(iso))).toBe('2026-07-15T12:30')
    expect(fromLocalInput('2026-07-15T12:30')).toBe(iso)
  })

  test('the earliest slot is ten minutes from now', () => {
    const before = Date.now()
    const at = earliest()
    const after = Date.now()
    expect(at).toBeGreaterThanOrEqual(before + MIN_AHEAD_MIN * 60e3)
    expect(at).toBeLessThanOrEqual(after + MIN_AHEAD_MIN * 60e3)
  })

  test('formats the planned time for display', () => {
    const label = fmtWhen('2026-03-10T09:05:00.000Z')
    expect(label).toMatch(/10/)
    expect(label).toMatch(/10:05/)
  })
})
