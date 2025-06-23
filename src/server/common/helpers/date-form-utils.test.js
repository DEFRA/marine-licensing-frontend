import {
  createDateFieldNames,
  extractDateFieldsFromPayload,
  extractMultipleDateFields,
  createDateFieldsFromValue,
  createErrorTypeMap,
  isCompleteDateMissing,
  hasNumberMaxErrorsForDate,
  getDateErrorMessage,
  addCustomValidationErrors,
  handleMissingDateErrors,
  handleDateValidationErrors
} from '~/src/server/common/helpers/date-form-utils.js'

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

  describe('hasNumberMaxErrorsForDate', () => {
    test('should return true when there are number.max errors for date fields', () => {
      const errorTypeMap = {
        'test-date-day': { type: 'number.max' },
        'test-date-month': { type: 'any.required' }
      }

      const result = hasNumberMaxErrorsForDate('test-date', errorTypeMap)
      expect(result).toBe(true)
    })

    test('should return false when there are no number.max errors', () => {
      const errorTypeMap = {
        'test-date-day': { type: 'any.required' },
        'test-date-month': { type: 'any.required' }
      }

      const result = hasNumberMaxErrorsForDate('test-date', errorTypeMap)
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
        prefix: 'test-date',
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
        prefix: 'test-date',
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
        prefix: 'test-date',
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

  describe('addCustomValidationErrors', () => {
    test('should add custom validation errors to error summary', () => {
      const errorSummary = []
      const errorTypeMap = {
        'invalid-error': true,
        'future-error': true
      }
      const dateConfigs = [
        {
          prefix: 'test-date',
          fieldNames: { DAY: 'test-date-day' },
          errorKeys: {
            INVALID: 'invalid-error',
            TODAY_OR_FUTURE: 'future-error'
          },
          errorMessages: {
            'invalid-error': 'Date is invalid',
            'future-error': 'Date must be future'
          }
        }
      ]

      addCustomValidationErrors(errorSummary, errorTypeMap, dateConfigs)

      expect(errorSummary).toHaveLength(1)
      expect(errorSummary[0]).toEqual({
        href: '#test-date-day',
        text: 'Date must be future'
      })
    })
  })

  describe('handleMissingDateErrors', () => {
    test('should handle missing date errors in summary', () => {
      const errorSummary = [{ href: '#other-field', text: 'Other error' }]
      const missingDates = [
        {
          prefix: 'test-date',
          errorKey: 'MISSING_START',
          errorMessage: 'Start date is missing',
          fieldNames: { DAY: 'test-date-day' }
        }
      ]

      const result = handleMissingDateErrors(errorSummary, missingDates)

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual({
        href: '#test-date-day',
        text: 'Start date is missing'
      })
    })
  })

  describe('handleDateValidationErrors', () => {
    test('should handle validation errors with no details', () => {
      const mockRequest = { payload: {} }
      const mockH = {
        view: jest.fn().mockReturnValue({ takeover: jest.fn() })
      }
      const mockErr = {}
      const mockCreateTemplateData = jest.fn().mockReturnValue({ test: 'data' })

      const config = {
        request: mockRequest,
        h: mockH,
        err: mockErr,
        dateConfigs: [],
        errorMessages: {},
        createTemplateData: mockCreateTemplateData,
        viewRoute: 'test/view'
      }

      handleDateValidationErrors(config)

      expect(mockH.view).toHaveBeenCalledWith('test/view', { test: 'data' })
    })
  })
})
