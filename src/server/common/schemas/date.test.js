import joi from 'joi'
import { individualDate, activityStartEndDateSchema } from './date.js'
import { JOI_ERRORS } from '../constants/joi.js'

describe('Date Validator', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(new Date('2025-01-01'))
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Individual Date', () => {
    test('should validate a complete date', () => {
      const result = joi
        .object({
          ...individualDate({
            prefix: 'start-date',
            minYear: 2020,
            maxYear: 2030,
            minYearError: JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE
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

    test('should validate a complete date with all fields', () => {
      const result = joi
        .object({
          ...individualDate({
            prefix: 'start-date',
            minYear: 2020,
            maxYear: 2030,
            minYearError: JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE
          })
        })
        .validate({
          'start-date-day': '01',
          'start-date-month': '01',
          'start-date-year': '2025'
        })
      expect(result.error).toBeUndefined()
    })

    test('should return error for empty field', () => {
      const result = joi
        .object({
          ...individualDate({
            prefix: 'start-date',
            minYear: 2020,
            maxYear: 2030,
            minYearError: JOI_ERRORS.CUSTOM_START_DATE_TODAY_OR_FUTURE
          })
        })
        .validate({
          'start-date-day': '01',
          'start-date-month': '',
          'start-date-year': '2025'
        })
      expect(result.error.message).toBe('start-date-month')
    })
  })

  describe('activityStartEndDateSchema', () => {
    test('should fail with required error if start date is empty', () => {
      const testPayload = {
        'activity-start-date-day': '',
        'activity-start-date-month': '',
        'activity-start-date-year': '',
        'activity-end-date-day': '10',
        'activity-end-date-month': '10',
        'activity-end-date-year': '2025'
      }

      const result = activityStartEndDateSchema.validate(testPayload)
      expect(result.error.details[0].message).toBe('activity-start-date-day')
    })

    test('should pass validation with valid start and end dates', () => {
      const testPayload = {
        'activity-start-date-day': '10',
        'activity-start-date-month': '10',
        'activity-start-date-year': '2025',
        'activity-end-date-day': '11',
        'activity-end-date-month': '10',
        'activity-end-date-year': '2025'
      }

      const { error } = activityStartEndDateSchema.validate(testPayload)
      expect(error).toBeUndefined()
    })

    test('should fail if start date is invalid', () => {
      const testPayload = {
        'activity-start-date-day': '31',
        'activity-start-date-month': '02',
        'activity-start-date-year': '2025',
        'activity-end-date-day': '01',
        'activity-end-date-month': '03',
        'activity-end-date-year': '2025'
      }

      const { error } = activityStartEndDateSchema.validate(testPayload)
      expect(error.details[0].message).toBe('custom.startDate.invalid')
    })

    test('should fail if end date is invalid', () => {
      const testPayload = {
        'activity-start-date-day': '01',
        'activity-start-date-month': '03',
        'activity-start-date-year': '2025',
        'activity-end-date-day': '31',
        'activity-end-date-month': '02',
        'activity-end-date-year': '2025'
      }

      const { error } = activityStartEndDateSchema.validate(testPayload)
      expect(error.details[0].message).toBe('custom.endDate.invalid')
    })

    test('should fail if end date is before start date', () => {
      const testPayload = {
        'activity-start-date-day': '02',
        'activity-start-date-month': '03',
        'activity-start-date-year': '2025',
        'activity-end-date-day': '01',
        'activity-end-date-month': '03',
        'activity-end-date-year': '2025'
      }

      const { error } = activityStartEndDateSchema.validate(testPayload)
      expect(error.details[0].message).toBe('custom.endDate.before.startDate')
    })

    test('should fail if start date is in the past', () => {
      const testPayload = {
        'activity-start-date-day': '01',
        'activity-start-date-month': '01',
        'activity-start-date-year': '2024',
        'activity-end-date-day': '15',
        'activity-end-date-month': '01',
        'activity-end-date-year': '2024'
      }

      const { error } = activityStartEndDateSchema.validate(testPayload)
      expect(error.details[0].message).toBe('custom.startDate.todayOrFuture')
    })
  })
})
