import { describe, expect, test } from 'vitest'
import { formatPreferredDates, buildSummaryData } from './summary-data.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'

describe('formatPreferredDates', () => {
  test('returns formatted range when both start and end are present', () => {
    expect(
      formatPreferredDates({
        start: { month: '07', year: '2026' },
        end: { month: '08', year: '2027' }
      })
    ).toBe('July 2026 to August 2027')
  })

  test('returns null when either start and end are absent', () => {
    expect(
      formatPreferredDates({ end: { month: '12', year: '2025' } })
    ).toBeNull()
    expect(
      formatPreferredDates({ start: { month: '12', year: '2025' } })
    ).toBeNull()
  })

  test('returns null when input is null', () => {
    expect(formatPreferredDates(null)).toBeNull()
  })

  test('returns null when month is missing', () => {
    expect(formatPreferredDates({ start: { year: '2025' } })).toBeNull()
  })

  test('returns null when year is missing', () => {
    expect(formatPreferredDates({ start: { month: '06' } })).toBeNull()
  })
})

describe('buildSummaryData', () => {
  test('formats preferredDates and spreads remaining marine licence fields', () => {
    const result = buildSummaryData(mockMarineLicenceApplication)

    expect(result).toMatchObject({
      ...mockMarineLicenceApplication,
      preferredDates: 'July 2026 to August 2027'
    })
  })
})
