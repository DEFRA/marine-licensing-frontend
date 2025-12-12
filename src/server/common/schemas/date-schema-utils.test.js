import { describe, expect, vi } from 'vitest'
import {
  validateDatesNotInPast,
  validateDateTooFarApart,
  validateDateTooFarInFuture,
  validateYearWithinAllowedRange
} from './date-schema-utils'
import { createDayjsDate } from '../helpers/dates/date-utils'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'

dayjs.extend(utc)
describe('#dateSchemaUtils', () => {
  const MOCK_DATE = new Date('2024-06-15T10:00:00.000Z') // June 15, 2024 at 10:00 AM UTC
  let helpersMock

  beforeAll(() => {
    vi.useFakeTimers()
    vi.setSystemTime(MOCK_DATE)
    helpersMock = { error: vi.fn(), prefs: { context: {} } }
  })

  afterAll(() => {
    vi.useRealTimers()
  })

  describe('validateYearWithinAllowedRange', () => {
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

    test('should allow past years for article 20', () => {
      const pastYear = MOCK_DATE.getFullYear() - 1

      helpersMock.prefs.context.articleCode = '20'

      const result = validateYearWithinAllowedRange(
        pastYear,
        helpersMock,
        'startDate'
      )

      expect(helpersMock.error).not.toHaveBeenCalled()
      expect(result).toBe(pastYear)
    })
  })

  describe('validateDateTooFarInFuture', () => {
    const validDate = createDayjsDate(
      MOCK_DATE.getFullYear(),
      MOCK_DATE.getMonth(),
      MOCK_DATE.getDate()
    )

    const outOfRangeDate = dayjs(MOCK_DATE).add(10, 'years').add(1, 'day')

    test('should return error when start date is too far in the future', () => {
      const result = validateDateTooFarInFuture(
        outOfRangeDate,
        validDate,
        helpersMock
      )

      expect(helpersMock.error).toHaveBeenCalledWith(
        'custom.startDate.tooFarFuture'
      )
      expect(result).toBe(helpersMock.error.mock.results[0].value)
    })

    test('should return error when end date is too far in the future', () => {
      const result = validateDateTooFarInFuture(
        validDate,
        outOfRangeDate,
        helpersMock
      )

      expect(helpersMock.error).toHaveBeenCalledWith(
        'custom.endDate.tooFarFuture'
      )
      expect(result).toBe(helpersMock.error.mock.results[0].value)
    })

    test('should return null when both dates are within range', () => {
      const withinRangeDate = dayjs(MOCK_DATE).add(5, 'years')

      const result = validateDateTooFarInFuture(
        withinRangeDate,
        validDate,
        helpersMock
      )

      expect(helpersMock.error).not.toHaveBeenCalled()
      expect(result).toBeNull()
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

  describe('validateDatesNotInPast', () => {
    const dayJsDate = createDayjsDate(
      MOCK_DATE.getFullYear(),
      MOCK_DATE.getMonth(),
      MOCK_DATE.getDay()
    )

    beforeAll(() => {
      vi.useFakeTimers()
      vi.setSystemTime(MOCK_DATE)
      helpersMock = { error: vi.fn(), prefs: { context: {} } }
    })

    test('should bypass validation when appropriate mcms context is set for section 20', () => {
      const futureDate = dayJsDate.add('1', 'year')

      helpersMock.prefs.context.articleCode = '20'

      const result = validateDatesNotInPast(
        dayJsDate,
        futureDate,
        new Date(),
        helpersMock
      )

      expect(helpersMock.error).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })

    test('should bypass validation when appropriate mcms context is set for article code 34', () => {
      const futureDate = dayJsDate.add('8', 'year')

      helpersMock.prefs.context.articleCode = '34'

      const result = validateDatesNotInPast(
        dayJsDate,
        futureDate,
        new Date(),
        helpersMock
      )

      expect(helpersMock.error).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })

    test('should return null for valid dates', () => {
      const futureDate = dayJsDate.add('1', 'day')

      const today = dayJsDate.subtract('1', 'day')

      helpersMock.prefs.context.articleCode = '1'

      const result = validateDatesNotInPast(
        dayJsDate,
        futureDate,
        today,
        helpersMock
      )

      expect(helpersMock.error).not.toHaveBeenCalled()
      expect(result).toBeNull()
    })

    test('should return error for invalid start dates', () => {
      const futureDate = dayJsDate.add('1', 'day')

      const today = dayJsDate.subtract('1', 'day')

      helpersMock.prefs.context.articleCode = '1'

      validateDatesNotInPast(
        dayJsDate.subtract('1', 'month'),
        futureDate,
        today,
        helpersMock
      )

      expect(helpersMock.error).toHaveBeenCalledWith(
        'custom.startDate.todayOrFuture'
      )
    })

    test('should return error for invalid end dates', () => {
      const futureDate = dayJsDate.add('1', 'day')

      const today = dayJsDate.subtract('1', 'day')

      helpersMock.prefs.context.articleCode = '1'

      validateDatesNotInPast(
        dayJsDate,
        futureDate.subtract('1', 'month'),
        today,
        helpersMock
      )

      expect(helpersMock.error).toHaveBeenCalledWith(
        'custom.endDate.todayOrFuture'
      )
    })
  })
})
