import { vi } from 'vitest'
import {
  createDateISO,
  extractDateComponents,
  formatDate,
  isValidDateComponents,
  isTodayOrFuture,
  compareDates,
  isEndDateBeforeStartDate,
  createDayjsDate
} from './date-utils.js'

describe('date-utils', () => {
  describe('createDateISO', () => {
    test('creates ISO string from valid date components', () => {
      const result = createDateISO(2025, 6, 15)
      expect(result).toBe('2025-06-15T00:00:00.000Z')
    })

    test('handles string inputs', () => {
      const result = createDateISO('2025', '6', '15')
      expect(result).toBe('2025-06-15T00:00:00.000Z')
    })

    test('returns null for invalid year', () => {
      const result = createDateISO('invalid', 6, 15)
      expect(result).toBeNull()
    })

    test('returns null for invalid month', () => {
      const result = createDateISO(2025, 'invalid', 15)
      expect(result).toBeNull()
    })

    test('returns null for invalid day', () => {
      const result = createDateISO(2025, 6, 'invalid')
      expect(result).toBeNull()
    })

    test('returns null for impossible date (strict parsing) - not a leap year', () => {
      const result = createDateISO(2025, 2, 29)
      expect(result).toBeNull()
    })

    test('handles valid leap year date - a leap year', () => {
      const result = createDateISO(2024, 2, 29)
      expect(result).toBe('2024-02-29T00:00:00.000Z')
    })

    test('returns null for null values', () => {
      expect(createDateISO(null, 6, 15)).toBeNull()
      expect(createDateISO(2025, null, 15)).toBeNull()
      expect(createDateISO(2025, 6, null)).toBeNull()
    })

    test('returns null for undefined values', () => {
      expect(createDateISO(undefined, 6, 15)).toBeNull()
      expect(createDateISO(2025, undefined, 15)).toBeNull()
      expect(createDateISO(2025, 6, undefined)).toBeNull()
    })
  })

  describe('extractDateComponents', () => {
    test('extracts components from ISO date string', () => {
      const result = extractDateComponents('2025-06-15T00:00:00.000Z')
      expect(result).toEqual({
        day: '15',
        month: '6',
        year: '2025'
      })
    })

    test('returns empty strings for null input', () => {
      const result = extractDateComponents(null)
      expect(result).toEqual({
        day: '',
        month: '',
        year: ''
      })
    })

    test('returns empty strings for undefined input', () => {
      const result = extractDateComponents(undefined)
      expect(result).toEqual({
        day: '',
        month: '',
        year: ''
      })
    })

    test('returns empty strings for empty string input', () => {
      const result = extractDateComponents('')
      expect(result).toEqual({
        day: '',
        month: '',
        year: ''
      })
    })
  })

  describe('formatDate', () => {
    test('formats date object with default format', () => {
      const date = new Date('2025-06-15T00:00:00.000Z')
      const result = formatDate(date)
      expect(result).toBe('15 June 2025')
    })

    test('formats ISO string with default format', () => {
      const result = formatDate('2025-06-15T00:00:00.000Z')
      expect(result).toBe('15 June 2025')
    })

    test('formats date with custom Day.js format', () => {
      const date = new Date('2025-06-15T00:00:00.000Z')
      const result = formatDate(date, 'DD MMM YY')
      expect(result).toBe('15 Jun 25')
    })

    test('formats date with different Day.js format patterns', () => {
      const date = new Date('2025-06-15T00:00:00.000Z')
      expect(formatDate(date, 'YYYY-MM-DD')).toBe('2025-06-15')
      expect(formatDate(date, 'dddd, MMMM D, YYYY')).toBe(
        'Sunday, June 15, 2025'
      )
    })
  })

  describe('isValidDateComponents', () => {
    test('returns true for valid date components', () => {
      const result = isValidDateComponents(2025, 6, 15)
      expect(result).toBe(true)
    })

    test('returns false for invalid day (leap year)', () => {
      const result = isValidDateComponents(2024, 2, 30)
      expect(result).toBe(false)
    })

    test('returns false for invalid day (non-leap year)', () => {
      const result = isValidDateComponents(2025, 2, 29)
      expect(result).toBe(false)
    })

    test('returns false for invalid month', () => {
      const result = isValidDateComponents(2025, 13, 15)
      expect(result).toBe(false)
    })

    test('returns true for valid leap year date', () => {
      const result = isValidDateComponents(2024, 2, 29)
      expect(result).toBe(true)
    })
  })

  describe('isTodayOrFuture', () => {
    beforeEach(() => {
      vi.useFakeTimers()
      vi.setSystemTime(new Date('2025-06-15T12:00:00.000Z'))
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    test('returns true for future date', () => {
      const futureDate = new Date('2025-06-16T00:00:00.000Z')
      const result = isTodayOrFuture(futureDate)
      expect(result).toBe(true)
    })

    test('returns true for today', () => {
      const todayDate = new Date('2025-06-15T00:00:00.000Z')
      const result = isTodayOrFuture(todayDate)
      expect(result).toBe(true)
    })

    test('returns false for past date', () => {
      const pastDate = new Date('2025-06-14T00:00:00.000Z')
      const result = isTodayOrFuture(pastDate)
      expect(result).toBe(false)
    })

    test('handles ISO string input', () => {
      const result = isTodayOrFuture('2025-06-16T00:00:00.000Z')
      expect(result).toBe(true)
    })
  })

  describe('compareDates', () => {
    test('returns -1 when first date is earlier', () => {
      const date1 = new Date('2025-06-14T00:00:00.000Z')
      const date2 = new Date('2025-06-15T00:00:00.000Z')
      const result = compareDates(date1, date2)
      expect(result).toBe(-1)
    })

    test('returns 1 when first date is later', () => {
      const date1 = new Date('2025-06-16T00:00:00.000Z')
      const date2 = new Date('2025-06-15T00:00:00.000Z')
      const result = compareDates(date1, date2)
      expect(result).toBe(1)
    })

    test('returns 0 when dates are equal', () => {
      const date1 = new Date('2025-06-15T00:00:00.000Z')
      const date2 = new Date('2025-06-15T00:00:00.000Z')
      const result = compareDates(date1, date2)
      expect(result).toBe(0)
    })

    test('handles ISO string inputs', () => {
      const result = compareDates(
        '2025-06-14T00:00:00.000Z',
        '2025-06-15T00:00:00.000Z'
      )
      expect(result).toBe(-1)
    })

    test('handles mixed Date and string inputs', () => {
      const date1 = new Date('2025-06-14T00:00:00.000Z')
      const result = compareDates(date1, '2025-06-15T00:00:00.000Z')
      expect(result).toBe(-1)
    })
  })

  describe('isEndDateBeforeStartDate', () => {
    test('returns true when end date is before start date', () => {
      const startDate = '2025-06-15T00:00:00.000Z'
      const endDate = '2025-06-14T00:00:00.000Z'
      const result = isEndDateBeforeStartDate(startDate, endDate)
      expect(result).toBe(true)
    })

    test('returns false when end date is after start date', () => {
      const startDate = '2025-06-15T00:00:00.000Z'
      const endDate = '2025-06-16T00:00:00.000Z'
      const result = isEndDateBeforeStartDate(startDate, endDate)
      expect(result).toBe(false)
    })

    test('returns false when dates are the same', () => {
      const startDate = '2025-06-15T00:00:00.000Z'
      const endDate = '2025-06-15T00:00:00.000Z'
      const result = isEndDateBeforeStartDate(startDate, endDate)
      expect(result).toBe(false)
    })
  })

  describe('createDayjsDate', () => {
    test('creates valid Day.js date from components', () => {
      const result = createDayjsDate(2025, 6, 15)
      expect(result).not.toBeNull()
      expect(result.isValid()).toBe(true)
      expect(result.year()).toBe(2025)
      expect(result.month() + 1).toBe(6) // dayjs months are 0-indexed
      expect(result.date()).toBe(15)
    })

    test('returns null for invalid date components', () => {
      const result = createDayjsDate(2025, 13, 15)
      expect(result).toBeNull()
    })

    test('returns null for invalid leap year date', () => {
      const result = createDayjsDate(2025, 2, 29)
      expect(result).toBeNull()
    })

    test('creates valid date for leap year', () => {
      const result = createDayjsDate(2024, 2, 29)
      expect(result).not.toBeNull()
      expect(result.isValid()).toBe(true)
    })
  })
})
