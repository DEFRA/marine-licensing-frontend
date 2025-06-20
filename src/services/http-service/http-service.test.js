import Wreck from '@hapi/wreck'
import { HttpService } from './http-service.js'
import { HttpError, RetryableError } from './errors.js'

// Mock Wreck
jest.mock('@hapi/wreck')

describe('HttpService', () => {
  let httpService
  let mockRequest

  beforeEach(() => {
    mockRequest = jest.fn()
    Wreck.defaults = jest.fn().mockReturnValue({ request: mockRequest })

    httpService = new HttpService({
      timeout: 5000,
      retries: 2,
      retryDelay: 100
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('constructor', () => {
    it('should create instance with default config', () => {
      const service = new HttpService()
      const config = service.getConfig()

      expect(config.timeout).toBe(30000)
      expect(config.retries).toBe(3)
      expect(config.retryDelay).toBe(1000)
      expect(config.retryStrategy).toBe('exponential')
    })

    it('should create instance with custom config', () => {
      const customConfig = {
        timeout: 10000,
        retries: 5,
        retryDelay: 2000,
        retryStrategy: 'linear'
      }
      const service = new HttpService(customConfig)
      const config = service.getConfig()

      expect(config.timeout).toBe(10000)
      expect(config.retries).toBe(5)
      expect(config.retryDelay).toBe(2000)
      expect(config.retryStrategy).toBe('linear')
    })

    it('should handle custom headers and agent in config', () => {
      const customConfig = {
        headers: { 'X-Custom': 'value' },
        agent: { keepAlive: true }
      }
      const service = new HttpService(customConfig)
      const config = service.getConfig()

      expect(config.headers).toEqual({ 'X-Custom': 'value' })
      expect(config.agent).toEqual({ keepAlive: true })
    })
  })

  describe('GET requests', () => {
    it('should make successful GET request', async () => {
      const mockResponse = {
        res: { statusCode: 200, headers: {}, statusMessage: 'OK' },
        payload: { data: 'test' }
      }
      mockRequest.mockResolvedValue(mockResponse)

      const result = await httpService.get('http://example.com/api')

      expect(result.statusCode).toBe(200)
      expect(result.data).toEqual({ data: 'test' })
      expect(mockRequest).toHaveBeenCalledTimes(1)
    })

    it('should throw HttpError for 4xx responses', async () => {
      const mockResponse = {
        res: { statusCode: 404, headers: {}, statusMessage: 'Not Found' },
        payload: 'Not found'
      }
      mockRequest.mockResolvedValue(mockResponse)

      await expect(httpService.get('http://example.com/api')).rejects.toThrow(
        HttpError
      )
      await expect(httpService.get('http://example.com/api')).rejects.toThrow(
        'HTTP 404: Not Found'
      )
      expect(mockRequest).toHaveBeenCalledTimes(2)
    })

    it('should retry on 5xx errors', async () => {
      const mockError = {
        res: {
          statusCode: 500,
          headers: {},
          statusMessage: 'Internal Server Error'
        },
        payload: 'Server error'
      }
      const mockSuccess = {
        res: { statusCode: 200, headers: {}, statusMessage: 'OK' },
        payload: { data: 'success' }
      }

      mockRequest.mockResolvedValueOnce(mockError)
      mockRequest.mockResolvedValueOnce(mockSuccess)

      const result = await httpService.get('http://example.com/api')

      expect(result.statusCode).toBe(200)
      expect(mockRequest).toHaveBeenCalledTimes(2)
    })

    it('should retry on network errors', async () => {
      const networkError = new Error('ECONNRESET')
      networkError.code = 'ECONNRESET'
      const mockSuccess = {
        res: { statusCode: 200, headers: {}, statusMessage: 'OK' },
        payload: { data: 'success' }
      }

      mockRequest.mockRejectedValueOnce(networkError)
      mockRequest.mockResolvedValueOnce(mockSuccess)

      const result = await httpService.get('http://example.com/api')

      expect(result.statusCode).toBe(200)
      expect(mockRequest).toHaveBeenCalledTimes(2)
    })

    it('should fail after max retries', async () => {
      const networkError = new Error('ECONNRESET')
      networkError.code = 'ECONNRESET'

      mockRequest.mockRejectedValue(networkError)

      await expect(httpService.get('http://example.com/api')).rejects.toThrow(
        RetryableError
      )
      expect(mockRequest).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('should handle timeout errors by message', async () => {
      const timeoutError = new Error('Request timeout occurred')
      mockRequest.mockRejectedValue(timeoutError)

      await expect(httpService.get('http://example.com/api')).rejects.toThrow(
        RetryableError
      )
      expect(mockRequest).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('should handle ENOTFOUND errors', async () => {
      const notFoundError = new Error('ENOTFOUND')
      notFoundError.code = 'ENOTFOUND'
      mockRequest.mockRejectedValue(notFoundError)

      await expect(httpService.get('http://example.com/api')).rejects.toThrow(
        RetryableError
      )
      expect(mockRequest).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('should pass through custom headers in request', async () => {
      const mockResponse = {
        res: { statusCode: 200, headers: {}, statusMessage: 'OK' },
        payload: { data: 'test' }
      }
      mockRequest.mockResolvedValue(mockResponse)

      await httpService.get('http://example.com/api', {
        headers: { Authorization: 'Bearer token' }
      })

      const requestCall = mockRequest.mock.calls[0]
      expect(requestCall[2].headers).toEqual(
        expect.objectContaining({ Authorization: 'Bearer token' })
      )
    })
  })

  describe('POST requests', () => {
    it('should make successful POST request with payload', async () => {
      const mockResponse = {
        res: { statusCode: 201, headers: {}, statusMessage: 'Created' },
        payload: { id: 123 }
      }
      mockRequest.mockResolvedValue(mockResponse)

      const payload = { name: 'test' }
      const result = await httpService.post('http://example.com/api', payload)

      expect(result.statusCode).toBe(201)
      expect(result.data).toEqual({ id: 123 })
      expect(mockRequest).toHaveBeenCalledTimes(1)

      const [method, url, options] = mockRequest.mock.calls[0]
      expect(method).toBe('POST')
      expect(url).toBe('http://example.com/api')
      expect(options.payload).toEqual(payload)
    })
  })

  describe('PUT requests', () => {
    it('should make successful PUT request', async () => {
      const mockResponse = {
        res: { statusCode: 200, headers: {}, statusMessage: 'OK' },
        payload: { updated: true }
      }
      mockRequest.mockResolvedValue(mockResponse)

      const result = await httpService.put('http://example.com/api/123', {
        name: 'updated'
      })

      expect(result.statusCode).toBe(200)
      expect(mockRequest).toHaveBeenCalledTimes(1)
    })
  })

  describe('DELETE requests', () => {
    it('should make successful DELETE request', async () => {
      const mockResponse = {
        res: { statusCode: 204, headers: {}, statusMessage: 'No Content' },
        payload: null
      }
      mockRequest.mockResolvedValue(mockResponse)

      const result = await httpService.delete('http://example.com/api/123')

      expect(result.statusCode).toBe(204)
      expect(mockRequest).toHaveBeenCalledTimes(1)
    })
  })

  describe('PATCH requests', () => {
    it('should make successful PATCH request', async () => {
      const mockResponse = {
        res: { statusCode: 200, headers: {}, statusMessage: 'OK' },
        payload: { patched: true }
      }
      mockRequest.mockResolvedValue(mockResponse)

      const result = await httpService.patch('http://example.com/api/123', {
        field: 'value'
      })

      expect(result.statusCode).toBe(200)
      expect(mockRequest).toHaveBeenCalledTimes(1)
    })
  })

  describe('configuration updates', () => {
    it('should update configuration', () => {
      const newConfig = { timeout: 15000, retries: 5 }
      httpService.updateConfig(newConfig)

      const config = httpService.getConfig()
      expect(config.timeout).toBe(15000)
      expect(config.retries).toBe(5)
    })

    it('should preserve existing config when updating', () => {
      const originalRetryDelay = httpService.getConfig().retryDelay
      httpService.updateConfig({ timeout: 15000 })

      const config = httpService.getConfig()
      expect(config.timeout).toBe(15000)
      expect(config.retryDelay).toBe(originalRetryDelay)
    })

    it('should recreate retry strategy when strategy type changes', () => {
      const originalStrategy = httpService.retryStrategy
      httpService.updateConfig({ retryStrategy: 'linear' })

      expect(httpService.retryStrategy).not.toBe(originalStrategy)
      expect(httpService.getConfig().retryStrategy).toBe('linear')
    })
  })

  describe('error handling', () => {
    it('should not retry on 4xx errors', async () => {
      const mockResponse = {
        res: { statusCode: 400, headers: {}, statusMessage: 'Bad Request' },
        payload: 'Invalid request'
      }
      mockRequest.mockResolvedValue(mockResponse)

      await expect(httpService.get('http://example.com/api')).rejects.toThrow(
        HttpError
      )
      expect(mockRequest).toHaveBeenCalledTimes(1)
    })

    it('should handle timeout errors', async () => {
      const timeoutError = new Error('Request timeout')
      timeoutError.code = 'ETIMEDOUT'
      mockRequest.mockRejectedValue(timeoutError)

      await expect(httpService.get('http://example.com/api')).rejects.toThrow(
        RetryableError
      )
      expect(mockRequest).toHaveBeenCalledTimes(3) // Initial + 2 retries
    })

    it('should throw original error when max retries exceeded', async () => {
      // Create a service with 0 retries to test lastError throwing
      const noRetryService = new HttpService({ retries: 0 })
      const networkError = new Error('Connection failed')
      networkError.code = 'ECONNRESET'

      mockRequest.mockRejectedValue(networkError)

      await expect(
        noRetryService.get('http://example.com/api')
      ).rejects.toThrow(RetryableError)
      expect(mockRequest).toHaveBeenCalledTimes(1)
    })

    it('should handle non-retryable errors without retry', async () => {
      const customError = new Error('Custom non-retryable error')
      // No retryable properties set
      mockRequest.mockRejectedValue(customError)

      await expect(httpService.get('http://example.com/api')).rejects.toThrow(
        'Custom non-retryable error'
      )
      expect(mockRequest).toHaveBeenCalledTimes(1) // Should not retry
    })

    it('should detect retryable errors with explicit retryable flag', async () => {
      const retryableError = new Error('Custom retryable error')
      retryableError.retryable = true

      const mockSuccess = {
        res: { statusCode: 200, headers: {}, statusMessage: 'OK' },
        payload: { data: 'success' }
      }

      mockRequest.mockRejectedValueOnce(retryableError)
      mockRequest.mockResolvedValueOnce(mockSuccess)

      const result = await httpService.get('http://example.com/api')
      expect(result.statusCode).toBe(200)
      expect(mockRequest).toHaveBeenCalledTimes(2)
    })

    it('should detect RetryableError instances', async () => {
      const retryableError = new RetryableError(
        'Retryable error',
        'CUSTOM_CODE'
      )

      const mockSuccess = {
        res: { statusCode: 200, headers: {}, statusMessage: 'OK' },
        payload: { data: 'success' }
      }

      mockRequest.mockRejectedValueOnce(retryableError)
      mockRequest.mockResolvedValueOnce(mockSuccess)

      const result = await httpService.get('http://example.com/api')
      expect(result.statusCode).toBe(200)
      expect(mockRequest).toHaveBeenCalledTimes(2)
    })

    it('should detect HttpError with 5xx status as retryable', async () => {
      const httpError = new HttpError('Server Error', 502, 'Bad Gateway')

      const mockSuccess = {
        res: { statusCode: 200, headers: {}, statusMessage: 'OK' },
        payload: { data: 'success' }
      }

      mockRequest.mockRejectedValueOnce(httpError)
      mockRequest.mockResolvedValueOnce(mockSuccess)

      const result = await httpService.get('http://example.com/api')
      expect(result.statusCode).toBe(200)
      expect(mockRequest).toHaveBeenCalledTimes(2)
    })

    it('should detect ECONNREFUSED as retryable', async () => {
      const connectionError = new Error('Connection refused')
      connectionError.code = 'ECONNREFUSED'

      const mockSuccess = {
        res: { statusCode: 200, headers: {}, statusMessage: 'OK' },
        payload: { data: 'success' }
      }

      mockRequest.mockRejectedValueOnce(connectionError)
      mockRequest.mockResolvedValueOnce(mockSuccess)

      const result = await httpService.get('http://example.com/api')
      expect(result.statusCode).toBe(200)
      expect(mockRequest).toHaveBeenCalledTimes(2)
    })

    it('should return false for non-retryable error types', () => {
      const service = new HttpService()
      const nonRetryableError = new Error('Syntax error')
      // No retryable properties, not a known error type

      const isRetryable = service._isRetryableError(nonRetryableError)
      expect(isRetryable).toBe(false)
    })
  })

  describe('_delay method', () => {
    it('should delay execution for specified milliseconds', async () => {
      const startTime = Date.now()
      await httpService._delay(50)
      const endTime = Date.now()

      expect(endTime - startTime).toBeGreaterThanOrEqual(45) // Allow some variance
    })
  })

  describe('edge cases', () => {
    it('should handle 503 Service Unavailable with retry', async () => {
      const serviceUnavailable = {
        res: {
          statusCode: 503,
          headers: {},
          statusMessage: 'Service Unavailable'
        },
        payload: 'Service temporarily unavailable'
      }
      const mockSuccess = {
        res: { statusCode: 200, headers: {}, statusMessage: 'OK' },
        payload: { data: 'recovered' }
      }

      mockRequest.mockResolvedValueOnce(serviceUnavailable)
      mockRequest.mockResolvedValueOnce(mockSuccess)

      const result = await httpService.get('http://example.com/api')
      expect(result.statusCode).toBe(200)
      expect(mockRequest).toHaveBeenCalledTimes(2)
    })

    it('should merge request headers with service headers', async () => {
      const serviceWithHeaders = new HttpService({
        headers: { 'X-Service': 'test', 'Content-Type': 'application/json' }
      })

      const mockResponse = {
        res: { statusCode: 200, headers: {}, statusMessage: 'OK' },
        payload: { data: 'test' }
      }
      mockRequest.mockResolvedValue(mockResponse)

      await serviceWithHeaders.get('http://example.com/api', {
        headers: {
          Authorization: 'Bearer token',
          'Content-Type': 'application/xml'
        }
      })

      const requestCall = mockRequest.mock.calls[0]
      expect(requestCall[2].headers).toEqual({
        'X-Service': 'test',
        'Content-Type': 'application/xml', // Request headers should override service headers
        Authorization: 'Bearer token'
      })
    })

    it('should handle empty response payload', async () => {
      const mockResponse = {
        res: { statusCode: 204, headers: {}, statusMessage: 'No Content' },
        payload: null
      }
      mockRequest.mockResolvedValue(mockResponse)

      const result = await httpService.get('http://example.com/api')
      expect(result.statusCode).toBe(204)
      expect(result.data).toBeNull()
    })

    it('should throw lastError when loop completes without success', async () => {
      // Create a service with exactly 1 retry to test the final throw lastError path
      const limitedRetryService = new HttpService({ retries: 1 })

      const networkError = new Error('Network failure')
      networkError.code = 'ECONNRESET'

      // All attempts fail with retryable error
      mockRequest.mockRejectedValue(networkError)

      await expect(
        limitedRetryService.get('http://example.com/api')
      ).rejects.toThrow(RetryableError)
      expect(mockRequest).toHaveBeenCalledTimes(2) // Initial + 1 retry
    })

    it('should throw RetryableError directly from _makeRequest for timeout errors', async () => {
      // Test the specific path where a non-HTTP error that matches network patterns
      // gets converted to RetryableError in _makeRequest
      const timeoutError = new Error('Request timeout occurred')
      // This should trigger the timeout message check and create RetryableError

      mockRequest.mockRejectedValue(timeoutError)

      await expect(httpService.get('http://example.com/api')).rejects.toThrow(
        RetryableError
      )
      expect(mockRequest).toHaveBeenCalledTimes(3) // Will retry because it's converted to RetryableError
    })

    it('should handle unknown error in _makeRequest without converting to RetryableError', async () => {
      const unknownError = new Error('Unknown error type')
      // This error doesn't match any network error patterns, should be thrown as-is

      mockRequest.mockRejectedValue(unknownError)

      await expect(httpService.get('http://example.com/api')).rejects.toThrow(
        'Unknown error type'
      )
      expect(mockRequest).toHaveBeenCalledTimes(1) // Should not retry unknown errors
    })
  })
})
