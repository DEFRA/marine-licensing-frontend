import {
  createDateFieldNames,
  createDateFieldsFromValue,
  createErrorTypeMap,
  extractDateFieldsFromPayload,
  extractMultipleDateFields,
  getDateErrorMessage,
  isCompleteDateMissing,
  processDateValidationErrors
} from './date-form-utils.js'

describe('Date Form Utils', () => {
  describe('createDateFieldNames', () => {
    test('should create field names for a given prefix', () => {
      const result = createDateFieldNames('birth-date')
      expect(result).toEqual({
        DAY: 'birth-date-day',
        MONTH: 'birth-date-month',
        YEAR: 'birth-date-year'
      })
    })
  })

  describe('extractDateFieldsFromPayload', () => {
    test('should extract date fields for a given prefix', () => {
      const payload = {
        'birth-date-day': '15',
        'birth-date-month': '06',
        'birth-date-year': '1990'
      }

      const result = extractDateFieldsFromPayload(payload, 'birth-date')
      expect(result).toEqual({
        day: '15',
        month: '06',
        year: '1990'
      })
    })

    test('should return empty strings for missing fields', () => {
      const payload = {}

      const result = extractDateFieldsFromPayload(payload, 'birth-date')
      expect(result).toEqual({
        day: '',
        month: '',
        year: ''
      })
    })
  })

  describe('extractMultipleDateFields', () => {
    test('should extract multiple date fields', () => {
      const payload = {
        'start-date-day': '01',
        'start-date-month': '01',
        'start-date-year': '2025',
        'end-date-day': '31',
        'end-date-month': '12',
        'end-date-year': '2025'
      }

      const dateConfigs = [
        { key: 'startDate', prefix: 'start-date' },
        { key: 'endDate', prefix: 'end-date' }
      ]

      const result = extractMultipleDateFields(payload, dateConfigs)
      expect(result).toEqual({
        startDateDay: '01',
        startDateMonth: '01',
        startDateYear: '2025',
        endDateDay: '31',
        endDateMonth: '12',
        endDateYear: '2025'
      })
    })
  })

  describe('createDateFieldsFromValue', () => {
    test('should extract date components from ISO string', () => {
      const result = createDateFieldsFromValue('2025-06-15T00:00:00.000Z')
      expect(result).toEqual({
        day: '15',
        month: '6',
        year: '2025'
      })
    })

    test('should handle null date values', () => {
      const result = createDateFieldsFromValue(null)
      expect(result).toEqual({
        day: '',
        month: '',
        year: ''
      })
    })
  })

  describe('createErrorTypeMap', () => {
    test('should create error type mapping from details', () => {
      const errorDetails = [
        { type: 'number.max', path: ['test-field'], message: 'custom message' },
        { type: 'any.required', path: ['other-field'], message: 'any.required' }
      ]

      const result = createErrorTypeMap(errorDetails)
      expect(result).toEqual({
        'number.max': errorDetails[0],
        'test-field': errorDetails[0],
        'custom message': errorDetails[0],
        'any.required': errorDetails[1],
        'other-field': errorDetails[1]
      })
    })
  })

  describe('isCompleteDateMissing', () => {
    test('should return true when all date components are missing', () => {
      const errors = {
        'day-error': true,
        'month-error': true,
        'year-error': true
      }
      const fieldErrorKeys = {
        'test-date-day': 'day-error',
        'test-date-month': 'month-error',
        'test-date-year': 'year-error'
      }

      const result = isCompleteDateMissing(errors, 'test-date', fieldErrorKeys)
      expect(result).toBe(true)
    })

    test('should return false when some date components are present', () => {
      const errors = {
        'day-error': true,
        'month-error': false,
        'year-error': true
      }
      const fieldErrorKeys = {
        'test-date-day': 'day-error',
        'test-date-month': 'month-error',
        'test-date-year': 'year-error'
      }

      const result = isCompleteDateMissing(errors, 'test-date', fieldErrorKeys)
      expect(result).toBe(false)
    })
  })

  describe('getDateErrorMessage', () => {
    const mockErrorMessages = {
      missing: 'Date is missing',
      invalid: 'Date is invalid',
      future: 'Date must be in future',
      day: 'Day is required',
      month: 'Month is required'
    }

    test('should return missing error message with highest priority', () => {
      const config = {
        isDateMissing: true,
        errorTypeMap: {},
        errors: {},
        errorKeys: {
          MISSING: 'missing',
          INVALID: 'invalid'
        },
        errorMessages: mockErrorMessages
      }

      const result = getDateErrorMessage(config)
      expect(result).toEqual({ text: 'Date is missing' })
    })

    test('should return invalid error message when not missing but invalid', () => {
      const config = {
        isDateMissing: false,
        errorTypeMap: { invalid: true },
        errors: {},
        errorKeys: {
          MISSING: 'missing',
          INVALID: 'invalid'
        },
        errorMessages: mockErrorMessages
      }

      const result = getDateErrorMessage(config)
      expect(result).toEqual({ text: 'Date is invalid' })
    })

    test('should return null when no errors match', () => {
      const config = {
        isDateMissing: false,
        errorTypeMap: {},
        errors: {},
        errorKeys: {
          MISSING: 'missing'
        },
        errorMessages: mockErrorMessages
      }

      const result = getDateErrorMessage(config)
      expect(result).toBeNull()
    })
  })

  describe('processDateValidationErrors', () => {
    test('should return null when no error details', () => {
      const result = processDateValidationErrors({}, [], {})
      expect(result).toBeNull()
    })

    test('should process validation errors and return data object', () => {
      const mockErr = {
        details: [
          { type: 'any.required', path: ['test-field'], message: 'Required' }
        ]
      }
      const mockDateConfigs = []
      const mockErrorMessages = {}

      const result = processDateValidationErrors(
        mockErr,
        mockDateConfigs,
        mockErrorMessages
      )
      expect(result).toEqual(
        expect.objectContaining({
          errors: expect.any(Object),
          errorSummary: expect.any(Array)
        })
      )
    })
  })
})
