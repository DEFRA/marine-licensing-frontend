import { HttpError, RetryableError, TimeoutError } from './errors.js'

describe('Error Classes', () => {
  describe('HttpError', () => {
    it('should create HttpError with message and status code', () => {
      const error = new HttpError('Not Found', 404)

      expect(error.name).toBe('HttpError')
      expect(error.message).toBe('Not Found')
      expect(error.statusCode).toBe(404)
      expect(error.retryable).toBe(false)
      expect(error.responseData).toBeNull()
    })

    it('should create HttpError with response data', () => {
      const responseData = { error: 'Resource not found' }
      const error = new HttpError('Not Found', 404, responseData)

      expect(error.responseData).toEqual(responseData)
    })

    it('should create HttpError with different response data types', () => {
      const error1 = new HttpError('Server Error', 500, undefined)
      const error2 = new HttpError('Server Error', 500, {})
      const error3 = new HttpError('Server Error', 500, '')

      // When undefined is passed, the default value (null) is used
      expect(error1.responseData).toBeNull()
      expect(error2.responseData).toEqual({})
      expect(error3.responseData).toBe('')
    })

    it('should serialize to JSON correctly', () => {
      const error = new HttpError('Server Error', 500, {
        details: 'Internal error'
      })
      const json = error.toJSON()

      expect(json).toEqual({
        name: 'HttpError',
        message: 'Server Error',
        statusCode: 500,
        responseData: { details: 'Internal error' },
        retryable: false
      })
    })

    it('should maintain proper stack trace', () => {
      const error = new HttpError('Test error', 500)
      expect(error.stack).toBeDefined()
      expect(error.stack).toContain('HttpError')
    })

    it('should handle case when Error.captureStackTrace is not available', () => {
      // Mock the absence of Error.captureStackTrace
      const originalCaptureStackTrace = Error.captureStackTrace?.bind(Error)
      delete Error.captureStackTrace

      const error = new HttpError('Test error', 500)
      expect(error.name).toBe('HttpError')
      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(500)

      // Restore the original method
      if (originalCaptureStackTrace) {
        Error.captureStackTrace = originalCaptureStackTrace
      }
    })
  })

  describe('RetryableError', () => {
    it('should create RetryableError with message', () => {
      const error = new RetryableError('Connection failed')

      expect(error.name).toBe('RetryableError')
      expect(error.message).toBe('Connection failed')
      expect(error.retryable).toBe(true)
      expect(error.code).toBeNull()
    })

    it('should create RetryableError with error code', () => {
      const error = new RetryableError('Connection reset', 'ECONNRESET')

      expect(error.code).toBe('ECONNRESET')
    })

    it('should create RetryableError with different code types', () => {
      const error1 = new RetryableError('Network error', undefined)
      const error2 = new RetryableError('Network error', '')
      const error3 = new RetryableError('Network error', 0)

      // When undefined is passed, the default value (null) is used
      expect(error1.code).toBeNull()
      expect(error2.code).toBe('')
      expect(error3.code).toBe(0)
    })

    it('should serialize to JSON correctly', () => {
      const error = new RetryableError('Network error', 'ETIMEDOUT')
      const json = error.toJSON()

      expect(json).toEqual({
        name: 'RetryableError',
        message: 'Network error',
        code: 'ETIMEDOUT',
        retryable: true
      })
    })

    it('should handle case when Error.captureStackTrace is not available', () => {
      // Mock the absence of Error.captureStackTrace
      const originalCaptureStackTrace = Error.captureStackTrace?.bind(Error)
      delete Error.captureStackTrace

      const error = new RetryableError('Network error')
      expect(error.name).toBe('RetryableError')
      expect(error.message).toBe('Network error')
      expect(error.retryable).toBe(true)

      // Restore the original method
      if (originalCaptureStackTrace) {
        Error.captureStackTrace = originalCaptureStackTrace
      }
    })
  })

  describe('TimeoutError', () => {
    it('should create TimeoutError with timeout value', () => {
      const error = new TimeoutError('Request timed out', 5000)

      expect(error.name).toBe('TimeoutError')
      expect(error.message).toBe('Request timed out')
      expect(error.timeout).toBe(5000)
      expect(error.retryable).toBe(true)
    })

    it('should inherit from RetryableError', () => {
      const error = new TimeoutError('Timeout', 1000)
      expect(error).toBeInstanceOf(RetryableError)
    })

    it('should serialize to JSON correctly with timeout property', () => {
      const error = new TimeoutError('Request timed out', 3000)
      const json = error.toJSON()

      expect(json).toEqual({
        name: 'TimeoutError',
        message: 'Request timed out',
        code: null,
        retryable: true
      })
      // Note: timeout property is not included in JSON serialization
      // as TimeoutError doesn't override toJSON method
      expect(json.timeout).toBeUndefined()
    })

    it('should maintain timeout property separate from inherited properties', () => {
      const error = new TimeoutError('Slow response', 10000)

      expect(error.timeout).toBe(10000)
      expect(error.retryable).toBe(true)
      expect(error.code).toBeNull()
    })

    it('should create TimeoutError with zero timeout', () => {
      const error = new TimeoutError('Immediate timeout', 0)

      expect(error.timeout).toBe(0)
      expect(error.name).toBe('TimeoutError')
    })
  })
})
