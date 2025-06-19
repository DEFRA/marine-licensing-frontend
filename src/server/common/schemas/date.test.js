import { activityDatesSchema } from '~/src/server/common/schemas/date.js'

describe('activityDatesSchema', () => {
  const currentYear = new Date().getFullYear()

  describe('Valid data', () => {
    test('should accept valid future dates', () => {
      const validData = {
        'activity-start-date-day': '1',
        'activity-start-date-month': '6',
        'activity-start-date-year': (currentYear + 1).toString(),
        'activity-end-date-day': '15',
        'activity-end-date-month': '6',
        'activity-end-date-year': (currentYear + 1).toString()
      }

      const result = activityDatesSchema.validate(validData)
      expect(result.error).toBeUndefined()
      expect(result.value).toEqual(validData)
    })

    test('should accept same start and end dates', () => {
      const validData = {
        'activity-start-date-day': '1',
        'activity-start-date-month': '6',
        'activity-start-date-year': (currentYear + 1).toString(),
        'activity-end-date-day': '1',
        'activity-end-date-month': '6',
        'activity-end-date-year': (currentYear + 1).toString()
      }

      const result = activityDatesSchema.validate(validData)
      expect(result.error).toBeUndefined()
    })
  })

  describe('Required field validation', () => {
    test('should require all start date fields', () => {
      const invalidData = {
        'activity-end-date-day': '1',
        'activity-end-date-month': '6',
        'activity-end-date-year': (currentYear + 1).toString()
      }

      const result = activityDatesSchema.validate(invalidData, {
        abortEarly: false
      })
      expect(result.error).toBeDefined()
      expect(result.error.details).toHaveLength(3)

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('any.required')
    })

    test('should require all end date fields', () => {
      const invalidData = {
        'activity-start-date-day': '1',
        'activity-start-date-month': '6',
        'activity-start-date-year': (currentYear + 1).toString()
      }

      const result = activityDatesSchema.validate(invalidData, {
        abortEarly: false
      })
      expect(result.error).toBeDefined()
      expect(result.error.details).toHaveLength(3)

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('any.required')
    })
  })

  describe('String pattern validation', () => {
    test('should reject non-numeric strings', () => {
      const invalidData = {
        'activity-start-date-day': 'abc',
        'activity-start-date-month': '6',
        'activity-start-date-year': (currentYear + 1).toString(),
        'activity-end-date-day': '1',
        'activity-end-date-month': '6',
        'activity-end-date-year': (currentYear + 1).toString()
      }

      const result = activityDatesSchema.validate(invalidData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('string.pattern.base')
    })

    test('should reject empty strings', () => {
      const invalidData = {
        'activity-start-date-day': '',
        'activity-start-date-month': '6',
        'activity-start-date-year': (currentYear + 1).toString(),
        'activity-end-date-day': '1',
        'activity-end-date-month': '6',
        'activity-end-date-year': (currentYear + 1).toString()
      }

      const result = activityDatesSchema.validate(invalidData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('string.empty')
    })
  })

  describe('Date range validation', () => {
    test('should reject invalid day (> 31)', () => {
      const invalidData = {
        'activity-start-date-day': '32',
        'activity-start-date-month': '6',
        'activity-start-date-year': (currentYear + 1).toString(),
        'activity-end-date-day': '1',
        'activity-end-date-month': '6',
        'activity-end-date-year': (currentYear + 1).toString()
      }

      const result = activityDatesSchema.validate(invalidData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('custom.startDate.invalid')
    })

    test('should reject invalid month (> 12)', () => {
      const invalidData = {
        'activity-start-date-day': '1',
        'activity-start-date-month': '6',
        'activity-start-date-year': (currentYear + 1).toString(),
        'activity-end-date-day': '1',
        'activity-end-date-month': '14',
        'activity-end-date-year': (currentYear + 1).toString()
      }

      const result = activityDatesSchema.validate(invalidData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('custom.endDate.invalid')
    })

    test('should reject invalid year (too far in future)', () => {
      const invalidData = {
        'activity-start-date-day': '1',
        'activity-start-date-month': '6',
        'activity-start-date-year': (currentYear + 100).toString(),
        'activity-end-date-day': '1',
        'activity-end-date-month': '6',
        'activity-end-date-year': (currentYear + 100).toString()
      }

      const result = activityDatesSchema.validate(invalidData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('custom.startDate.invalid')
    })
  })

  describe('Date validity validation', () => {
    test('should reject impossible dates (February 30th)', () => {
      const invalidData = {
        'activity-start-date-day': '30',
        'activity-start-date-month': '2',
        'activity-start-date-year': (currentYear + 1).toString(),
        'activity-end-date-day': '1',
        'activity-end-date-month': '3',
        'activity-end-date-year': (currentYear + 1).toString()
      }

      const result = activityDatesSchema.validate(invalidData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('custom.startDate.invalid')
    })

    test('should reject impossible dates (April 31st)', () => {
      const invalidData = {
        'activity-start-date-day': '1',
        'activity-start-date-month': '1',
        'activity-start-date-year': (currentYear + 1).toString(),
        'activity-end-date-day': '31',
        'activity-end-date-month': '4',
        'activity-end-date-year': (currentYear + 1).toString()
      }

      const result = activityDatesSchema.validate(invalidData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('custom.endDate.invalid')
    })
  })

  describe('Past date validation', () => {
    test('should reject past start dates', () => {
      const pastData = {
        'activity-start-date-day': '1',
        'activity-start-date-month': '1',
        'activity-start-date-year': '2020', // Past year
        'activity-end-date-day': '15',
        'activity-end-date-month': '1',
        'activity-end-date-year': (currentYear + 1).toString()
      }

      const result = activityDatesSchema.validate(pastData)
      expect(result.error).toBeDefined()
      const errorTypes = result.error.details.map((d) => d.type)
      // Past dates now get the more specific "today or future" error instead of "invalid"
      expect(errorTypes).toContain('custom.startDate.todayOrFuture')
    })

    test('should reject past end dates when start date is valid', () => {
      const pastEndData = {
        'activity-start-date-day': '1',
        'activity-start-date-month': '6',
        'activity-start-date-year': (currentYear + 1).toString(),
        'activity-end-date-day': '15',
        'activity-end-date-month': '1',
        'activity-end-date-year': '2020'
      }

      const result = activityDatesSchema.validate(pastEndData)
      expect(result.error).toBeDefined()
      const errorTypes = result.error.details.map((d) => d.type)
      // With the new validation order, date relationships are checked before "today or future"
      // So a past end date with a future start date gets the more specific "before start date" error
      expect(errorTypes).toContain('custom.endDate.before.startDate')
    })
  })

  describe('Date order validation', () => {
    test('should reject end date before start date (same year)', () => {
      const invalidData = {
        'activity-start-date-day': '15',
        'activity-start-date-month': '6',
        'activity-start-date-year': (currentYear + 1).toString(),
        'activity-end-date-day': '14',
        'activity-end-date-month': '6',
        'activity-end-date-year': (currentYear + 1).toString()
      }

      const result = activityDatesSchema.validate(invalidData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('custom.endDate.before.startDate')
    })

    test('should reject end date before start date (different months)', () => {
      const invalidData = {
        'activity-start-date-day': '1',
        'activity-start-date-month': '12',
        'activity-start-date-year': (currentYear + 1).toString(),
        'activity-end-date-day': '30',
        'activity-end-date-month': '11',
        'activity-end-date-year': (currentYear + 1).toString()
      }

      const result = activityDatesSchema.validate(invalidData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('custom.endDate.before.startDate')
    })

    test('should reject end date before start date (different years)', () => {
      const invalidData = {
        'activity-start-date-day': '15',
        'activity-start-date-month': '6',
        'activity-start-date-year': (currentYear + 2).toString(),
        'activity-end-date-day': '15',
        'activity-end-date-month': '6',
        'activity-end-date-year': (currentYear + 1).toString()
      }

      const result = activityDatesSchema.validate(invalidData)
      expect(result.error).toBeDefined()

      const errorTypes = result.error.details.map((d) => d.type)
      expect(errorTypes).toContain('custom.endDate.before.startDate')
    })
  })

  describe('Error message structure', () => {
    test('should provide correct error structure for custom validation', () => {
      const invalidData = {
        'activity-start-date-day': '1',
        'activity-start-date-month': '12',
        'activity-start-date-year': (currentYear + 1).toString(),
        'activity-end-date-day': '30',
        'activity-end-date-month': '11',
        'activity-end-date-year': (currentYear + 1).toString()
      }

      const result = activityDatesSchema.validate(invalidData)
      expect(result.error).toBeDefined()
      expect(result.error.details).toHaveLength(1)

      const errorDetail = result.error.details[0]
      expect(errorDetail.type).toBe('custom.endDate.before.startDate')
      expect(errorDetail.path).toEqual([])
      expect(errorDetail.context).toBeDefined()
    })
  })
})
