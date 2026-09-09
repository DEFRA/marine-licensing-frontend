import { londonToday } from './london-today.js'

describe('londonToday', () => {
  test('returns the current date at UTC midnight', () => {
    const result = londonToday(new Date('2026-08-25T12:00:00.000Z'))

    expect(result.toISOString()).toBe('2026-08-25T00:00:00.000Z')
  })

  test('uses the London day, not the UTC day, late in a summer evening', () => {
    // 00:30 on 26 August by the London clock, still 25 August by UTC.
    const result = londonToday(new Date('2026-08-25T23:30:00.000Z'))

    expect(result.toISOString()).toBe('2026-08-26T00:00:00.000Z')
  })

  test('leaves the day alone late in a winter evening, when London is UTC', () => {
    const result = londonToday(new Date('2026-01-15T23:30:00.000Z'))

    expect(result.toISOString()).toBe('2026-01-15T00:00:00.000Z')
  })

  test('defaults to the current time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-08-25T23:30:00.000Z'))

    expect(londonToday().toISOString()).toBe('2026-08-26T00:00:00.000Z')

    vi.useRealTimers()
  })
})
