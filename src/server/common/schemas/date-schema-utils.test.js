import { describe, expect, vi } from 'vitest'
import {
  validateDateTooFarApart,
  validateYearWithinAllowedRange
} from './date-schema-utils'
import { createDayjsDate } from '../helpers/dates/date-utils'

describe('#dateSchemaUtils', () => {
  const MOCK_DATE = new Date('2024-06-15T10:00:00.000Z') // June 15, 2024 at 10:00 AM UTC
  let helpersMock

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(MOCK_DATE)
    helpersMock = { error: vi.fn() }
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  describe('validateYearWithinAllowedRange', () => {
    const helpersMock = { error: vi.fn() }

    test('Should validate minimum date', () => {
      validateYearWithinAllowedRange(0, helpersMock, 'startDate')

      expect(helpersMock.error).toHaveBeenCalledWith('number.min')
    })

    test('Should validate maximum date', () => {
      const futureDate = new Date(MOCK_DATE)
      futureDate.setFullYear(futureDate.getFullYear() + 11)

      validateYearWithinAllowedRange(
        futureDate.getFullYear(),
        helpersMock,
        'startDate'
      )

      expect(helpersMock.error).toHaveBeenCalledWith(
        'custom.startDate.tooFarFuture'
      )
    })

    test('Should return value if all dates are valid', () => {
      const currentYear = MOCK_DATE.getFullYear()
      const result = validateYearWithinAllowedRange(
        currentYear,
        helpersMock,
        'startDate'
      )

      expect(helpersMock.error).not.toHaveBeenCalled()
      expect(result).toBe(currentYear)
    })
  })

  describe('validateDateTooFarApart', () => {
    test('should return correct response when dates are too far apart', () => {
      const dayJsDate = createDayjsDate(
        MOCK_DATE.getFullYear(),
        MOCK_DATE.getMonth(),
        MOCK_DATE.getDay()
      )

      const futureDate = dayJsDate.add('8', 'year')
      validateDateTooFarApart(dayJsDate, futureDate, helpersMock)

      expect(helpersMock.error).toHaveBeenCalledWith(
        'custom.endDate.tooFarApart'
      )
    })

    test('should return null when valid', () => {
      const dayJsDate = createDayjsDate(
        MOCK_DATE.getFullYear(),
        MOCK_DATE.getMonth(),
        MOCK_DATE.getDay()
      )

      const futureDate = dayJsDate.add('6', 'month')
      const result = validateDateTooFarApart(dayJsDate, futureDate, helpersMock)

      expect(helpersMock.error).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })
  })
})
