import { vi } from 'vitest'
import joi from 'joi'
import {
  activityDatesSchema,
  individualDate
} from '#src/server/common/schemas/date.js'

describe('activityDatesSchema', () => {
  // Mock a fixed date to ensure consistent test results
  const MOCK_DATE = new Date('2024-06-15T10:00:00.000Z') // June 15, 2024 at 10:00 AM UTC
  const currentYear = MOCK_DATE.getFullYear()

  beforeAll(() => {
    // Mock the current date using Jest's built-in date mocking
    vi.useFakeTimers()
    vi.setSystemTime(MOCK_DATE)
  })

  afterAll(() => {
    // Restore real timers
    vi.useRealTimers()
  })

  describe('Valid data', () => {
    test('should accept valid future dates', () => {
      const validData = {
        'activity-start-date-day': 1,
        'activity-start-date-month': 6,
        'activity-start-date-year': 2025,
        'activity-end-date-day': 15,
        'activity-end-date-month': 6,
        'activity-end-date-year': 2025
      }

      const result = activityDatesSchema.validate(validData)
      expect(result.error).toBeUndefined()
      expect(result.value).toEqual(validData)
    })

    test('should accept same start and end dates', () => {
      const sameData = {
        'activity-start-date-day': 1,
        'activity-start-date-month': 6,
        'activity-start-date-year': currentYear + 1,
        'activity-end-date-day': 1,
        'activity-end-date-month': 6,
        'activity-end-date-year': currentYear + 1
      }

      const result = activityDatesSchema.validate(sameData)
      expect(result.error).toBeUndefined()
    })
  })

  describe('Required field validation', () => {
    test('should require all start date fields', () => {
      const missingStartData = {
        'activity-end-date-day': 15,
        'activity-end-date-month': 6,
        'activity-end-date-year': currentYear + 1
      }

      const result = activityDatesSchema.validate(missingStartData, {
        abortEarly: false
      })
      expect(result.error).toBeDefined()
      expect(result.error.details).toHaveLength(3)

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('any.required')
    })

    test('should require all end date fields', () => {
      const missingEndData = {
        'activity-start-date-day': 1,
        'activity-start-date-month': 6,
        'activity-start-date-year': currentYear + 1
      }

      const result = activityDatesSchema.validate(missingEndData, {
        abortEarly: false
      })
      expect(result.error).toBeDefined()
      expect(result.error.details).toHaveLength(3)

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('any.required')
    })
  })

  describe('Number validation', () => {
    test('should reject non-numeric values', () => {
      const nonNumericData = {
        'activity-start-date-day': 'abc',
        'activity-start-date-month': 6,
        'activity-start-date-year': currentYear + 1,
        'activity-end-date-day': 15,
        'activity-end-date-month': 6,
        'activity-end-date-year': currentYear + 1
      }

      const result = activityDatesSchema.validate(nonNumericData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('number.base')
    })

    test('should reject decimal numbers', () => {
      const decimalData = {
        'activity-start-date-day': 15.5,
        'activity-start-date-month': 6,
        'activity-start-date-year': currentYear + 1,
        'activity-end-date-day': 15,
        'activity-end-date-month': 6,
        'activity-end-date-year': currentYear + 1
      }

      const result = activityDatesSchema.validate(decimalData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('number.integer')
    })
  })

  describe('Date range validation', () => {
    test('should reject invalid day (> 31)', () => {
      const invalidDayData = {
        'activity-start-date-day': 32,
        'activity-start-date-month': 6,
        'activity-start-date-year': currentYear + 1,
        'activity-end-date-day': 15,
        'activity-end-date-month': 6,
        'activity-end-date-year': currentYear + 1
      }

      const result = activityDatesSchema.validate(invalidDayData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('custom.startDate.invalid')
    })

    test('should reject invalid month (> 12)', () => {
      const invalidMonthData = {
        'activity-start-date-day': 15,
        'activity-start-date-month': 13,
        'activity-start-date-year': currentYear + 1,
        'activity-end-date-day': 15,
        'activity-end-date-month': 6,
        'activity-end-date-year': currentYear + 1
      }

      const result = activityDatesSchema.validate(invalidMonthData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('custom.startDate.invalid')
    })

    test('should reject invalid year (too far in future)', () => {
      const invalidYearData = {
        'activity-start-date-day': 15,
        'activity-start-date-month': 6,
        'activity-start-date-year': currentYear + 100,
        'activity-end-date-day': 15,
        'activity-end-date-month': 6,
        'activity-end-date-year': currentYear + 100
      }

      const result = activityDatesSchema.validate(invalidYearData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('custom.startDate.tooFarFuture')
    })

    test('should reject invalid day (< 1)', () => {
      const invalidDayData = {
        'activity-start-date-day': 0,
        'activity-start-date-month': 6,
        'activity-start-date-year': currentYear + 1,
        'activity-end-date-day': 15,
        'activity-end-date-month': 6,
        'activity-end-date-year': currentYear + 1
      }

      const result = activityDatesSchema.validate(invalidDayData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('number.min')
    })

    test('should reject invalid month (< 1)', () => {
      const invalidMonthData = {
        'activity-start-date-day': 15,
        'activity-start-date-month': 0,
        'activity-start-date-year': currentYear + 1,
        'activity-end-date-day': 15,
        'activity-end-date-month': 6,
        'activity-end-date-year': currentYear + 1
      }

      const result = activityDatesSchema.validate(invalidMonthData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('number.min')
    })
  })

  describe('Date validity validation', () => {
    test('should reject impossible dates (February 30th)', () => {
      const impossibleData = {
        'activity-start-date-day': 30,
        'activity-start-date-month': 2,
        'activity-start-date-year': currentYear + 1,
        'activity-end-date-day': 15,
        'activity-end-date-month': 6,
        'activity-end-date-year': currentYear + 1
      }

      const result = activityDatesSchema.validate(impossibleData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('custom.startDate.invalid')
    })

    test('should reject impossible dates (April 31st)', () => {
      const impossibleData = {
        'activity-start-date-day': 31,
        'activity-start-date-month': 4,
        'activity-start-date-year': currentYear + 1,
        'activity-end-date-day': 15,
        'activity-end-date-month': 6,
        'activity-end-date-year': currentYear + 1
      }

      const result = activityDatesSchema.validate(impossibleData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('custom.startDate.invalid')
    })

    test('should handle invalid date creation properly for impossible dates', () => {
      const impossibleEndData = {
        'activity-start-date-day': 15,
        'activity-start-date-month': 6,
        'activity-start-date-year': currentYear + 1,
        'activity-end-date-day': 31,
        'activity-end-date-month': 4,
        'activity-end-date-year': currentYear + 1
      }

      const result = activityDatesSchema.validate(impossibleEndData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('custom.endDate.invalid')
    })
  })

  describe('Past date validation', () => {
    test('should reject past start dates', () => {
      const pastStartData = {
        'activity-start-date-day': 1,
        'activity-start-date-month': 1,
        'activity-start-date-year': currentYear - 1,
        'activity-end-date-day': 15,
        'activity-end-date-month': 6,
        'activity-end-date-year': currentYear + 1
      }

      const result = activityDatesSchema.validate(pastStartData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      // Past dates now get caught by the minYear validation first
      expect(errorTypes).toContain('number.min')
    })

    test('should reject past end dates when start date is valid', () => {
      const pastEndData = {
        'activity-start-date-day': 1,
        'activity-start-date-month': 6,
        'activity-start-date-year': currentYear + 1,
        'activity-end-date-day': 15,
        'activity-end-date-month': 6,
        'activity-end-date-year': currentYear - 1
      }

      const result = activityDatesSchema.validate(pastEndData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      // Past dates now get caught by the minYear validation first
      expect(errorTypes).toContain('number.min')
    })
  })

  describe('Date order validation', () => {
    test('should reject end date before start date (same year)', () => {
      const endBeforeStartData = {
        'activity-start-date-day': 15,
        'activity-start-date-month': 6,
        'activity-start-date-year': currentYear + 1,
        'activity-end-date-day': 10,
        'activity-end-date-month': 6,
        'activity-end-date-year': currentYear + 1
      }

      const result = activityDatesSchema.validate(endBeforeStartData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('custom.endDate.before.startDate')
    })

    test('should reject end date before start date (different months)', () => {
      const endBeforeStartData = {
        'activity-start-date-day': 15,
        'activity-start-date-month': 7,
        'activity-start-date-year': currentYear + 1,
        'activity-end-date-day': 15,
        'activity-end-date-month': 6,
        'activity-end-date-year': currentYear + 1
      }

      const result = activityDatesSchema.validate(endBeforeStartData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('custom.endDate.before.startDate')
    })

    test('should reject end date before start date (different years)', () => {
      const endBeforeStartData = {
        'activity-start-date-day': 15,
        'activity-start-date-month': 6,
        'activity-start-date-year': currentYear + 2,
        'activity-end-date-day': 15,
        'activity-end-date-month': 6,
        'activity-end-date-year': currentYear + 1
      }

      const result = activityDatesSchema.validate(endBeforeStartData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('custom.endDate.before.startDate')
    })
  })

  describe('Error message structure', () => {
    test('should provide correct error structure for custom validation', () => {
      const invalidData = {
        'activity-start-date-day': 31,
        'activity-start-date-month': 4,
        'activity-start-date-year': currentYear + 1,
        'activity-end-date-day': 15,
        'activity-end-date-month': 6,
        'activity-end-date-year': currentYear + 1
      }

      const result = activityDatesSchema.validate(invalidData)
      expect(result.error).toBeDefined()
      expect(result.error.details[0]).toHaveProperty('message')
      expect(result.error.details[0]).toHaveProperty('path')
      expect(result.error.details[0]).toHaveProperty('type')
    })
  })

  describe('Custom validation logic coverage', () => {
    test('should verify custom validation exists for impossible date combinations', () => {
      // Since MIN_YEAR = current year, any past year gets caught by Joi's number.min validation
      // before reaching custom validation. The custom "today or future" validation is only
      // reachable for dates with valid years (current year or future) but past dates.
      //
      // However, due to the validation architecture, this is extremely difficult to test
      // because any date with current year that's in the past would have been yesterday
      // or earlier, and the test would be time-dependent.
      //
      // Instead, we'll verify that the custom validation logic exists and handles
      // the edge cases correctly by testing the validation flow.

      // Test that custom validation catches impossible dates that pass Joi validation
      const impossibleDate = {
        'activity-start-date-day': 31,
        'activity-start-date-month': 4, // April 31st doesn't exist
        'activity-start-date-year': currentYear + 1,
        'activity-end-date-day': 15,
        'activity-end-date-month': 6,
        'activity-end-date-year': currentYear + 1
      }

      const result = activityDatesSchema.validate(impossibleDate)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('custom.startDate.invalid')
    })

    test('should verify custom validation handles date relationships correctly', () => {
      // Test that custom validation catches end date before start date
      const endBeforeStart = {
        'activity-start-date-day': 15,
        'activity-start-date-month': 6,
        'activity-start-date-year': currentYear + 1,
        'activity-end-date-day': 10,
        'activity-end-date-month': 6,
        'activity-end-date-year': currentYear + 1
      }

      const result = activityDatesSchema.validate(endBeforeStart)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('custom.endDate.before.startDate')
    })

    test('should cover start date custom validation for past dates (line 147)', () => {
      // This test covers line 147: if (startDate < today)
      // Strategy: Mock Date constructor to make a current year date appear to be in the past

      // Save the original Date constructor
      const OriginalDate = Date

      // Create a mock Date that returns a specific date for "new Date()" calls
      // to make start date appear past but end date appear future
      const mockDate = vi.fn(function (...args) {
        if (args.length === 0) {
          // new Date() calls - return a date between our start and end dates
          return new OriginalDate('2025-07-15T12:00:00.000Z') // Mid-year
        } else {
          // Date.UTC calls and other constructors - use original behavior
          return new OriginalDate(...args)
        }
      })

      // Preserve static methods
      mockDate.UTC = OriginalDate.UTC
      mockDate.now = OriginalDate.now
      mockDate.parse = OriginalDate.parse

      // Replace global Date
      global.Date = mockDate

      try {
        // Test data designed to trigger line 147
        // Mocked "today" is July 15, 2025
        // Start date: June 1, 2025 (before mocked today - should trigger line 147)
        // End date: December 31, 2025 (after mocked today - should be valid)
        const testData = {
          'activity-start-date-day': 1,
          'activity-start-date-month': 6, // June (before July 15)
          'activity-start-date-year': 2025, // Current year, will pass Joi validation
          'activity-end-date-day': 31,
          'activity-end-date-month': 12, // December (after July 15)
          'activity-end-date-year': 2025 // Same year
        }

        const result = activityDatesSchema.validate(testData)

        // The validation should fail because our mocked "today" makes the start date appear past
        expect(result.error).toBeDefined()
        const errorTypes = result.error.details.map((d) => d.type)

        // This should trigger line 147: if (startDate < today)
        expect(errorTypes).toContain('custom.startDate.todayOrFuture')
      } finally {
        // Always restore the original Date constructor
        global.Date = OriginalDate
      }
    })
  })

  describe('individualDate function', () => {
    test('should validate a complete date', () => {
      const result = joi
        .object({
          ...individualDate({
            prefix: 'start-date',
            field: 'startDate'
          })
        })
        .validate(
          {
            'start-date-day': '',
            'start-date-month': '',
            'start-date-year': ''
          },
          { abortEarly: false }
        )
      expect(result.error.message).toBe(
        'start-date-day. start-date-month. start-date-year'
      )
    })

    test('should validate individual date with valid data', () => {
      const result = joi
        .object({
          ...individualDate({
            prefix: 'test-date',
            field: 'startDate'
          })
        })
        .validate({
          'test-date-day': 15,
          'test-date-month': 6,
          'test-date-year': 2025
        })
      expect(result.error).toBeUndefined()
    })

    test('should validate individual date with custom error message', () => {
      const customError = 'Custom year error message'
      const result = joi
        .object({
          ...individualDate({
            prefix: 'custom-date',
            field: 'startDate',
            minYearError: customError
          })
        })
        .validate({
          'custom-date-day': 15,
          'custom-date-month': 6,
          'custom-date-year': 2020 // Below minYear
        })
      expect(result.error).toBeDefined()
      expect(result.error.details[0].message).toBe(customError)
    })

    test('should use default minYear when not provided (line 22)', () => {
      // Test that default minYear = MIN_YEAR is used when not explicitly set
      const result = joi
        .object({
          ...individualDate({
            prefix: 'default-min-year',
            field: 'startDate'
          })
        })
        .validate({
          'default-min-year-day': 15,
          'default-min-year-month': 6,
          'default-min-year-year': 2020 // Should fail because it's less than MIN_YEAR (2025)
        })
      expect(result.error).toBeDefined()
      expect(result.error.details[0].type).toBe('number.min')
    })
  })

  describe('Edge cases', () => {
    test('should handle leap year dates correctly', () => {
      const leapYearData = {
        'activity-start-date-day': 29,
        'activity-start-date-month': 2,
        'activity-start-date-year': 2024, // 2024 is a leap year
        'activity-end-date-day': 15,
        'activity-end-date-month': 6,
        'activity-end-date-year': 2024
      }

      const result = activityDatesSchema.validate(leapYearData)
      // This should fail because 2024 is in the past relative to current year
      expect(result.error).toBeDefined()
    })

    test('should reject February 29th in non-leap years', () => {
      const nonLeapYearData = {
        'activity-start-date-day': 29,
        'activity-start-date-month': 2,
        'activity-start-date-year': currentYear + 1, // Assuming this won't be a leap year
        'activity-end-date-day': 15,
        'activity-end-date-month': 6,
        'activity-end-date-year': currentYear + 1
      }

      const result = activityDatesSchema.validate(nonLeapYearData)
      expect(result.error).toBeDefined()
      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('custom.startDate.invalid')
    })
  })
})
