import { describe, it, expect, beforeEach, vi } from 'vitest'
import { browserLogsController } from './controller.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import * as ecsTransformer from '#src/server/browser-logs/ecs-transformer.js'
import { config } from '#src/config/config.js'

vi.mock('#src/server/browser-logs/ecs-transformer.js')
vi.mock('#src/config/config.js', () => ({
  config: {
    get: vi.fn()
  }
}))

const createMockRequest = (overrides = {}) => ({
  payload: {},
  logger: {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  },
  auth: {
    isAuthenticated: true
  },
  ...overrides
})

const createMockH = () => ({
  response: vi.fn().mockReturnValue({
    code: vi.fn().mockReturnThis()
  })
})

const TEST_TIMESTAMP = 1705316400000

const browserEvents = {
  error: {
    timestamp: TEST_TIMESTAMP,
    message: 'Test error',
    level: 'error',
    type: 'error'
  },
  errorWithoutLevel: {
    timestamp: TEST_TIMESTAMP,
    message: 'Test error',
    type: 'error'
  },
  errorWithoutType: {
    timestamp: TEST_TIMESTAMP,
    message: 'Test error',
    level: 'error'
  },
  warn: {
    timestamp: TEST_TIMESTAMP,
    message: 'Warning message',
    level: 'warn',
    type: 'warning'
  },
  info: {
    timestamp: TEST_TIMESTAMP,
    message: 'Info message',
    level: 'info',
    type: 'info'
  },
  debug: {
    timestamp: TEST_TIMESTAMP,
    message: 'Debug message',
    level: 'debug',
    type: 'debug'
  },
  minimal: {
    timestamp: TEST_TIMESTAMP,
    message: 'Test error'
  },
  trace: {
    timestamp: TEST_TIMESTAMP,
    message: 'Test error',
    level: 'trace'
  },
  invalidTimestamp: {
    timestamp: 'invalid',
    message: 'Test error'
  }
}

const ecsLogs = {
  error: {
    '@timestamp': '2025-01-15T10:30:00.000Z',
    message: 'Test error',
    log: { level: 'error', logger: 'browser' }
  },
  warn: {
    '@timestamp': '2025-01-15T10:30:00.000Z',
    message: 'Warning message',
    log: { level: 'warn', logger: 'browser' }
  },
  info: {
    '@timestamp': '2025-01-15T10:30:00.000Z',
    message: 'Info message',
    log: { level: 'info', logger: 'browser' }
  },
  debug: {
    '@timestamp': '2025-01-15T10:30:00.000Z',
    message: 'Debug message',
    log: { level: 'debug', logger: 'browser' }
  },
  trace: {
    message: 'Test error',
    log: { level: 'trace', logger: 'browser' }
  },
  empty: {
    '@timestamp': '2025-01-15T10:30:00.000Z',
    message: undefined,
    log: { level: 'error', logger: 'browser' }
  }
}

describe('browserLogsController', () => {
  let mockRequest
  let mockH
  let mockResponse

  beforeEach(() => {
    mockRequest = createMockRequest()
    mockH = createMockH()
    mockResponse = mockH.response()

    // Enable browser logging by default for tests
    config.get.mockReturnValue(true)
  })

  describe('controller options', () => {
    it('should disable CSRF protection for sendBeacon requests', () => {
      expect(browserLogsController.options.plugins.crumb).toBe(false)
    })
  })

  describe('handler - successful log processing', () => {
    beforeEach(() => {
      ecsTransformer.toEcs.mockReturnValue({
        '@timestamp': '2025-01-15T10:30:00.000Z',
        message: 'Test error',
        log: { level: 'error', logger: 'browser' },
        event: { action: 'error' }
      })
    })

    it('should transform browser event to ECS format', () => {
      mockRequest.payload = browserEvents.error
      browserLogsController.handler(mockRequest, mockH)
      expect(ecsTransformer.toEcs).toHaveBeenCalledWith(browserEvents.error)
    })

    it('should log error level events using request logger', () => {
      mockRequest.payload = browserEvents.error
      ecsTransformer.toEcs.mockReturnValue(ecsLogs.error)
      browserLogsController.handler(mockRequest, mockH)
      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        ecsLogs.error,
        'Test error'
      )
    })

    it('should use default error level when level not provided', () => {
      mockRequest.payload = browserEvents.errorWithoutLevel
      ecsTransformer.toEcs.mockReturnValue(ecsLogs.error)
      browserLogsController.handler(mockRequest, mockH)
      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        ecsLogs.error,
        'Test error'
      )
    })

    it('should return 204 No Content response', () => {
      mockRequest.payload = browserEvents.errorWithoutType
      browserLogsController.handler(mockRequest, mockH)
      expect(mockH.response).toHaveBeenCalled()
      expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.noContent)
    })
  })

  describe('handler - different log levels', () => {
    it('should log warn level events', () => {
      mockRequest.payload = browserEvents.warn
      ecsTransformer.toEcs.mockReturnValue(ecsLogs.warn)
      browserLogsController.handler(mockRequest, mockH)
      expect(mockRequest.logger.warn).toHaveBeenCalledWith(
        ecsLogs.warn,
        'Warning message'
      )
      expect(mockRequest.logger.error).not.toHaveBeenCalled()
    })

    it('should log info level events', () => {
      mockRequest.payload = browserEvents.info
      ecsTransformer.toEcs.mockReturnValue(ecsLogs.info)
      browserLogsController.handler(mockRequest, mockH)
      expect(mockRequest.logger.info).toHaveBeenCalledWith(
        ecsLogs.info,
        'Info message'
      )
      expect(mockRequest.logger.error).not.toHaveBeenCalled()
    })

    it('should log debug level events', () => {
      mockRequest.payload = browserEvents.debug
      ecsTransformer.toEcs.mockReturnValue(ecsLogs.debug)
      browserLogsController.handler(mockRequest, mockH)
      expect(mockRequest.logger.debug).toHaveBeenCalledWith(
        ecsLogs.debug,
        'Debug message'
      )
      expect(mockRequest.logger.error).not.toHaveBeenCalled()
    })
  })

  describe('handler - error handling to prevent infinite loops', () => {
    it('should silently handle errors during ECS transformation', () => {
      mockRequest.payload = browserEvents.minimal
      ecsTransformer.toEcs.mockImplementation(() => {
        throw new Error('ECS transformation failed')
      })

      const result = browserLogsController.handler(mockRequest, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        { error: 'ECS transformation failed' },
        'Failed to process browser log'
      )
      expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.noContent)
      expect(result).toBe(mockResponse)
    })

    it('should silently handle errors during logging', () => {
      mockRequest.payload = browserEvents.errorWithoutType
      ecsTransformer.toEcs.mockReturnValue(ecsLogs.error)
      mockRequest.logger.error.mockImplementationOnce(() => {
        throw new Error('Logger failed')
      })

      browserLogsController.handler(mockRequest, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledTimes(2)
      expect(mockRequest.logger.error).toHaveBeenLastCalledWith(
        { error: 'Logger failed' },
        'Failed to process browser log'
      )
      expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.noContent)
    })

    it('should handle errors in catch block', () => {
      mockRequest.payload = browserEvents.errorWithoutType
      ecsTransformer.toEcs.mockImplementation(() => {
        throw new Error('Transformation failed')
      })

      browserLogsController.handler(mockRequest, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        { error: 'Transformation failed' },
        'Failed to process browser log'
      )
      expect(mockH.response).toHaveBeenCalled()
      expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.noContent)
    })

    it('should return 204 even when transformation fails', () => {
      mockRequest.payload = browserEvents.invalidTimestamp
      ecsTransformer.toEcs.mockImplementation(() => {
        throw new TypeError('Invalid timestamp')
      })

      const result = browserLogsController.handler(mockRequest, mockH)

      expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.noContent)
      expect(result).toBe(mockResponse)
    })
  })

  describe('handler - edge cases', () => {
    it('should handle empty browser event', () => {
      mockRequest.payload = {}
      ecsTransformer.toEcs.mockReturnValue(ecsLogs.empty)

      browserLogsController.handler(mockRequest, mockH)

      expect(ecsTransformer.toEcs).toHaveBeenCalledWith({})
      expect(mockRequest.logger.error).toHaveBeenCalled()
      expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.noContent)
    })

    it('should handle null payload', () => {
      mockRequest.payload = null
      ecsTransformer.toEcs.mockImplementation(() => {
        throw new TypeError('Cannot read properties of null')
      })

      browserLogsController.handler(mockRequest, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        { error: 'Cannot read properties of null' },
        'Failed to process browser log'
      )
      expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.noContent)
    })

    it('should catch errors from unsupported log levels', () => {
      mockRequest.payload = browserEvents.trace
      mockRequest.logger.trace = undefined
      ecsTransformer.toEcs.mockReturnValue(ecsLogs.trace)

      const result = browserLogsController.handler(mockRequest, mockH)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.any(String) }),
        'Failed to process browser log'
      )
      expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.noContent)
      expect(result).toBe(mockResponse)
    })
  })

  describe('handler - prevents infinite logging loops', () => {
    it('should not throw errors that could trigger another browser log', () => {
      mockRequest.payload = browserEvents.minimal
      ecsTransformer.toEcs.mockImplementation(() => {
        throw new Error('Critical failure')
      })

      expect(() => {
        browserLogsController.handler(mockRequest, mockH)
      }).not.toThrow()
    })

    it('should always return 204 to acknowledge receipt', () => {
      mockRequest.payload = browserEvents.minimal
      ecsTransformer.toEcs.mockImplementation(() => {
        throw new Error('Processing failed')
      })
      const result = browserLogsController.handler(mockRequest, mockH)
      expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.noContent)
      expect(result).toBe(mockResponse)
    })
  })

  describe('handler - browser logging disabled', () => {
    beforeEach(() => {
      config.get.mockReturnValue(false)
    })

    it('should return 404 when browser logging is disabled', () => {
      mockRequest.payload = browserEvents.error
      const result = browserLogsController.handler(mockRequest, mockH)

      expect(ecsTransformer.toEcs).not.toHaveBeenCalled()
      expect(mockRequest.logger.error).not.toHaveBeenCalled()
      expect(mockH.response).toHaveBeenCalled()
      expect(mockResponse.code).toHaveBeenCalledWith(statusCodes.notFound)
      expect(result).toBe(mockResponse)
    })
  })

  // Note: Authentication is handled by Hapi's auth strategy (auth: 'session')
  // The handler will only be called if the user is already authenticated
})
