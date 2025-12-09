// @vitest-environment jsdom
import { vi } from 'vitest'
import { ErrorTracking } from './error-tracking.js'

describe('ErrorTracking', () => {
  let mockNavigator
  let mockLocation
  let mockConsole
  let mockDate
  let mockBlob
  let errorTracking

  beforeEach(() => {
    mockNavigator = {
      sendBeacon: vi.fn().mockReturnValue(true),
      userAgent: 'Mozilla/5.0 (Test Browser)'
    }

    mockLocation = {
      pathname: '/test/path'
    }

    mockConsole = {
      error: vi.fn(),
      warn: vi.fn()
    }

    mockDate = {
      now: vi.fn().mockReturnValue(1234567890)
    }

    mockBlob = vi.fn(function (content, options) {
      this.content = content
      this.options = options
    })

    errorTracking = new ErrorTracking({
      navigator: mockNavigator,
      location: mockLocation,
      console: mockConsole,
      Date: mockDate,
      Blob: mockBlob
    })
  })

  describe('constructor', () => {
    test('should initialize with default configuration', () => {
      const tracker = new ErrorTracking()

      expect(tracker.config.endpoint).toBe('/api/browser-logs')
      expect(tracker.config.maxSameError).toBe(3)
      expect(tracker.config.burstWindow).toBe(10000)
      expect(tracker.config.maxBurst).toBe(10)
    })

    test('should accept custom endpoint configuration', () => {
      const customEndpoint = '/custom/logs'
      const tracker = new ErrorTracking({ endpoint: customEndpoint })

      expect(tracker.config.endpoint).toBe(customEndpoint)
    })

    test('should accept custom maxSameError configuration', () => {
      const tracker = new ErrorTracking({ maxSameError: 5 })

      expect(tracker.config.maxSameError).toBe(5)
    })

    test('should accept custom burstWindow configuration', () => {
      const tracker = new ErrorTracking({ burstWindow: 20000 })

      expect(tracker.config.burstWindow).toBe(20000)
    })

    test('should accept custom maxBurst configuration', () => {
      const tracker = new ErrorTracking({ maxBurst: 20 })

      expect(tracker.config.maxBurst).toBe(20)
    })

    test('should initialize error tracking state', () => {
      expect(errorTracking.errorCounts).toBeInstanceOf(Map)
      expect(errorTracking.errorCounts.size).toBe(0)
      expect(errorTracking.recentLogs).toEqual([])
      expect(errorTracking.burstActive).toBe(false)
    })

    test('should store original console.error reference', () => {
      expect(errorTracking.origConsoleError).toBe(mockConsole.error)
    })

    test('should use global objects when dependencies not provided', () => {
      const tracker = new ErrorTracking()

      expect(tracker.config.navigator).toBe(globalThis.navigator)
      expect(tracker.config.location).toBe(globalThis.location)
      expect(tracker.config.console).toBe(globalThis.console)
      expect(tracker.config.Date).toBe(Date)
      expect(tracker.config.Blob).toBe(Blob)
    })
  })

  describe('init', () => {
    let originalOnerror
    let rejectionHandler

    beforeEach(() => {
      originalOnerror = globalThis.onerror
      globalThis.onerror = null
      rejectionHandler = null
    })

    afterEach(() => {
      globalThis.onerror = originalOnerror
      if (rejectionHandler) {
        globalThis.removeEventListener('unhandledrejection', rejectionHandler)
      }
    })

    test('should attach global error handler', () => {
      errorTracking.init()

      expect(typeof globalThis.onerror).toBe('function')
      expect(globalThis.onerror.name).toBe('bound handleError')
    })

    test('should attach unhandled rejection handler', () => {
      const addEventListenerSpy = vi.spyOn(globalThis, 'addEventListener')

      errorTracking.init()

      expect(addEventListenerSpy).toHaveBeenCalledWith(
        'unhandledrejection',
        expect.any(Function)
      )

      // Capture the handler for cleanup
      rejectionHandler = addEventListenerSpy.mock.calls[0][1]
    })

    test('should wrap console.error', () => {
      const originalError = mockConsole.error

      errorTracking.init()

      expect(mockConsole.error).not.toBe(originalError)
    })

    test('should call original console.error when wrapped', () => {
      const originalError = vi.fn()
      mockConsole.error = originalError
      errorTracking = new ErrorTracking({ console: mockConsole })

      errorTracking.init()
      mockConsole.error('test message', 'arg2')

      expect(originalError).toHaveBeenCalledWith('test message', 'arg2')
    })

    test('should call handleConsoleError when console.error is invoked', () => {
      const handleSpy = vi.spyOn(errorTracking, 'handleConsoleError')

      errorTracking.init()
      mockConsole.error('test error')

      expect(handleSpy).toHaveBeenCalledWith(['test error'])
    })
  })

  describe('handleError', () => {
    beforeEach(() => {
      vi.spyOn(errorTracking, 'sendLog')
    })

    test('should send log with error details', () => {
      const message = 'Test error message'
      const source = 'https://example.com/script.js'
      const line = 42
      const col = 10
      const error = new Error('Test error')

      errorTracking.handleError(message, source, line, col, error)

      expect(errorTracking.sendLog).toHaveBeenCalledWith({
        type: 'js_error',
        message,
        source,
        line,
        col,
        stack: error.stack,
        errorType: 'Error'
      })
    })

    test('should handle missing error object', () => {
      const message = 'Error without object'
      const source = 'script.js'
      const line = 1
      const col = 1

      errorTracking.handleError(message, source, line, col, null)

      expect(errorTracking.sendLog).toHaveBeenCalledWith({
        type: 'js_error',
        message,
        source,
        line,
        col,
        stack: null,
        errorType: 'Error'
      })
    })

    test('should extract error name when available', () => {
      const error = new TypeError('Type error')
      errorTracking.handleError('message', 'source', 1, 1, error)

      expect(errorTracking.sendLog).toHaveBeenCalledWith(
        expect.objectContaining({
          errorType: 'TypeError'
        })
      )
    })

    test('should handle error without stack', () => {
      const error = { name: 'CustomError', message: 'Custom' }

      errorTracking.handleError('message', 'source', 1, 1, error)

      expect(errorTracking.sendLog).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: null,
          errorType: 'CustomError'
        })
      )
    })
  })

  describe('serializeValue', () => {
    test('should return strings as-is', () => {
      expect(errorTracking.serializeValue('test string')).toBe('test string')
    })

    test('should serialize objects to JSON', () => {
      expect(errorTracking.serializeValue({ key: 'value' })).toBe(
        '{"key":"value"}'
      )
    })

    test('should serialize arrays to JSON', () => {
      expect(errorTracking.serializeValue([1, 2, 3])).toBe('[1,2,3]')
    })

    test('should serialize null to string', () => {
      expect(errorTracking.serializeValue(null)).toBe('null')
    })

    test('should handle circular references', () => {
      const circular = { a: 1 }
      circular.self = circular

      expect(errorTracking.serializeValue(circular)).toBe('[object Object]')
    })

    test('should convert numbers to strings', () => {
      expect(errorTracking.serializeValue(42)).toBe('42')
    })

    test('should convert booleans to strings', () => {
      expect(errorTracking.serializeValue(true)).toBe('true')
      expect(errorTracking.serializeValue(false)).toBe('false')
    })

    test('should convert undefined to string', () => {
      expect(errorTracking.serializeValue(undefined)).toBe('undefined')
    })

    test('should serialize nested objects', () => {
      expect(errorTracking.serializeValue({ a: { b: { c: 1 } } })).toBe(
        '{"a":{"b":{"c":1}}}'
      )
    })
  })

  describe('handleRejection', () => {
    beforeEach(() => {
      vi.spyOn(errorTracking, 'sendLog')
    })

    test('should send log with error message when reason has message property', () => {
      const error = new Error('Promise rejection')
      const event = { reason: error }

      errorTracking.handleRejection(event)

      expect(errorTracking.sendLog).toHaveBeenCalledWith({
        type: 'unhandled_promise',
        message: error.message,
        stack: error.stack,
        errorType: 'Error'
      })
    })

    test('should serialize reason when no message property', () => {
      const event = { reason: { code: 500 } }

      errorTracking.handleRejection(event)

      expect(errorTracking.sendLog).toHaveBeenCalledWith({
        type: 'unhandled_promise',
        message: '{"code":500}',
        stack: null,
        errorType: 'Error'
      })
    })

    test('should extract error type from reason', () => {
      const error = new TypeError('Type mismatch')
      const event = { reason: error }

      errorTracking.handleRejection(event)

      expect(errorTracking.sendLog).toHaveBeenCalledWith(
        expect.objectContaining({
          errorType: 'TypeError'
        })
      )
    })

    test('should include stack when available', () => {
      const error = new Error('Test')
      const event = { reason: error }

      errorTracking.handleRejection(event)

      expect(errorTracking.sendLog).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: error.stack
        })
      )
    })
  })

  describe('handleConsoleError', () => {
    beforeEach(() => {
      vi.spyOn(errorTracking, 'sendLog')
    })

    test('should send log with single argument', () => {
      errorTracking.handleConsoleError(['Error message'])

      expect(errorTracking.sendLog).toHaveBeenCalledWith({
        type: 'console_error',
        message: 'Error message'
      })
    })

    test('should join multiple arguments with spaces', () => {
      errorTracking.handleConsoleError(['Error:', 'code', 500])

      expect(errorTracking.sendLog).toHaveBeenCalledWith({
        type: 'console_error',
        message: 'Error: code 500'
      })
    })

    test('should serialize each argument using serializeValue', () => {
      vi.spyOn(errorTracking, 'serializeValue')

      errorTracking.handleConsoleError(['Error:', { key: 'value' }, 123])

      expect(errorTracking.serializeValue).toHaveBeenCalledWith('Error:')
      expect(errorTracking.serializeValue).toHaveBeenCalledWith({
        key: 'value'
      })
      expect(errorTracking.serializeValue).toHaveBeenCalledWith(123)
    })

    test('should handle empty arguments array', () => {
      errorTracking.handleConsoleError([])

      expect(errorTracking.sendLog).toHaveBeenCalledWith({
        type: 'console_error',
        message: ''
      })
    })
  })

  describe('getErrorFingerprint', () => {
    test('should create unique fingerprint from error details', () => {
      const event = {
        type: 'js_error',
        message: 'Test error',
        source: 'script.js',
        line: 42
      }

      const fingerprint = errorTracking.getErrorFingerprint(event)

      expect(fingerprint).toBe('js_error:Test error:script.js:42')
    })

    test('should handle missing type', () => {
      const event = {
        message: 'Test error',
        source: 'script.js',
        line: 42
      }

      const fingerprint = errorTracking.getErrorFingerprint(event)

      expect(fingerprint).toBe('unknown:Test error:script.js:42')
    })

    test('should handle missing message', () => {
      const event = {
        type: 'js_error',
        source: 'script.js',
        line: 42
      }

      const fingerprint = errorTracking.getErrorFingerprint(event)

      expect(fingerprint).toBe('js_error::script.js:42')
    })

    test('should use filename as fallback for source', () => {
      const event = {
        type: 'js_error',
        message: 'Error',
        filename: 'fallback.js',
        line: 10
      }

      const fingerprint = errorTracking.getErrorFingerprint(event)

      expect(fingerprint).toBe('js_error:Error:fallback.js:10')
    })

    test('should use lineno as fallback for line', () => {
      const event = {
        type: 'js_error',
        message: 'Error',
        source: 'script.js',
        lineno: 99
      }

      const fingerprint = errorTracking.getErrorFingerprint(event)

      expect(fingerprint).toBe('js_error:Error:script.js:99')
    })

    test('should create consistent fingerprints for identical errors', () => {
      const event1 = {
        type: 'js_error',
        message: 'Same',
        source: 'a.js',
        line: 1
      }
      const event2 = {
        type: 'js_error',
        message: 'Same',
        source: 'a.js',
        line: 1
      }

      expect(errorTracking.getErrorFingerprint(event1)).toBe(
        errorTracking.getErrorFingerprint(event2)
      )
    })

    test('should create different fingerprints for different errors', () => {
      const event1 = {
        type: 'js_error',
        message: 'Error 1',
        source: 'a.js',
        line: 1
      }
      const event2 = {
        type: 'js_error',
        message: 'Error 2',
        source: 'a.js',
        line: 1
      }

      expect(errorTracking.getErrorFingerprint(event1)).not.toBe(
        errorTracking.getErrorFingerprint(event2)
      )
    })
  })

  describe('shouldSendLog', () => {
    describe('deduplication', () => {
      test('should allow first occurrence of error', () => {
        const event = {
          type: 'js_error',
          message: 'Test',
          source: 'a.js',
          line: 1
        }

        expect(errorTracking.shouldSendLog(event)).toBe(true)
      })

      test('should allow second occurrence of same error', () => {
        const event = {
          type: 'js_error',
          message: 'Test',
          source: 'a.js',
          line: 1
        }

        errorTracking.shouldSendLog(event)
        expect(errorTracking.shouldSendLog(event)).toBe(true)
      })

      test('should allow third occurrence of same error', () => {
        const event = {
          type: 'js_error',
          message: 'Test',
          source: 'a.js',
          line: 1
        }

        errorTracking.shouldSendLog(event)
        errorTracking.shouldSendLog(event)
        expect(errorTracking.shouldSendLog(event)).toBe(true)
      })

      test('should block fourth occurrence of same error', () => {
        const event = {
          type: 'js_error',
          message: 'Test',
          source: 'a.js',
          line: 1
        }

        errorTracking.shouldSendLog(event)
        errorTracking.shouldSendLog(event)
        errorTracking.shouldSendLog(event)
        expect(errorTracking.shouldSendLog(event)).toBe(false)
      })

      test('should respect custom maxSameError configuration', () => {
        const tracker = new ErrorTracking({ maxSameError: 1, Date: mockDate })
        const event = {
          type: 'js_error',
          message: 'Test',
          source: 'a.js',
          line: 1
        }

        expect(tracker.shouldSendLog(event)).toBe(true)
        expect(tracker.shouldSendLog(event)).toBe(false)
      })

      test('should track different error types independently', () => {
        const event1 = {
          type: 'js_error',
          message: 'Error A',
          source: 'a.js',
          line: 1
        }
        const event2 = {
          type: 'js_error',
          message: 'Error B',
          source: 'a.js',
          line: 1
        }

        errorTracking.shouldSendLog(event1)
        errorTracking.shouldSendLog(event1)
        errorTracking.shouldSendLog(event1)

        expect(errorTracking.shouldSendLog(event2)).toBe(true)
      })
    })

    describe('burst protection', () => {
      test('should track timestamps in recentLogs', () => {
        const event = {
          type: 'js_error',
          message: 'Test',
          source: 'a.js',
          line: 1
        }
        mockDate.now.mockReturnValue(1000)

        errorTracking.shouldSendLog(event)

        expect(errorTracking.recentLogs).toContain(1000)
      })

      test('should remove old timestamps outside burst window', () => {
        const event = {
          type: 'js_error',
          message: 'Test',
          source: 'a.js',
          line: 1
        }
        mockDate.now.mockReturnValue(1000)
        errorTracking.shouldSendLog(event)

        mockDate.now.mockReturnValue(12000)
        errorTracking.shouldSendLog(event)

        expect(errorTracking.recentLogs).toEqual([12000])
      })

      test('should allow errors up to maxBurst limit', () => {
        const events = Array.from({ length: 10 }, (_, i) => ({
          type: 'js_error',
          message: `Error ${i}`,
          source: 'a.js',
          line: i
        }))

        events.forEach((event) => {
          expect(errorTracking.shouldSendLog(event)).toBe(true)
        })
      })

      test('should block errors exceeding maxBurst limit', () => {
        const events = Array.from({ length: 11 }, (_, i) => ({
          type: 'js_error',
          message: `Error ${i}`,
          source: 'a.js',
          line: i
        }))

        events.slice(0, 10).forEach((event) => {
          errorTracking.shouldSendLog(event)
        })

        expect(errorTracking.shouldSendLog(events[10])).toBe(false)
      })

      test('should show warning on first burst activation', () => {
        const events = Array.from({ length: 11 }, (_, i) => ({
          type: 'js_error',
          message: `Error ${i}`,
          source: 'a.js',
          line: i
        }))

        events.forEach((event) => errorTracking.shouldSendLog(event))

        expect(mockConsole.warn).toHaveBeenCalledWith(
          'Browser error logging paused: too many errors detected'
        )
      })

      test('should only show warning once during burst', () => {
        const events = Array.from({ length: 15 }, (_, i) => ({
          type: 'js_error',
          message: `Error ${i}`,
          source: 'a.js',
          line: i
        }))

        events.forEach((event) => errorTracking.shouldSendLog(event))

        expect(mockConsole.warn).toHaveBeenCalledTimes(1)
      })

      test('should set burstActive flag when burst limit exceeded', () => {
        const events = Array.from({ length: 11 }, (_, i) => ({
          type: 'js_error',
          message: `Error ${i}`,
          source: 'a.js',
          line: i
        }))

        events.forEach((event) => errorTracking.shouldSendLog(event))

        expect(errorTracking.burstActive).toBe(true)
      })

      test('should reset burstActive when under burst limit', () => {
        const event = {
          type: 'js_error',
          message: 'Test',
          source: 'a.js',
          line: 1
        }
        errorTracking.burstActive = true

        errorTracking.shouldSendLog(event)

        expect(errorTracking.burstActive).toBe(false)
      })

      test('should allow errors after burst window expires', () => {
        const events = Array.from({ length: 11 }, (_, i) => ({
          type: 'js_error',
          message: `Error ${i}`,
          source: 'a.js',
          line: i
        }))

        mockDate.now.mockReturnValue(1000)
        events.forEach((event) => errorTracking.shouldSendLog(event))

        mockDate.now.mockReturnValue(12000)
        const newEvent = {
          type: 'js_error',
          message: 'After window',
          source: 'a.js',
          line: 1
        }

        expect(errorTracking.shouldSendLog(newEvent)).toBe(true)
      })
    })

    describe('error count tracking', () => {
      test('should increment error count on each occurrence', () => {
        const event = {
          type: 'js_error',
          message: 'Test',
          source: 'a.js',
          line: 1
        }
        const fingerprint = errorTracking.getErrorFingerprint(event)

        errorTracking.shouldSendLog(event)
        expect(errorTracking.errorCounts.get(fingerprint)).toBe(1)

        errorTracking.shouldSendLog(event)
        expect(errorTracking.errorCounts.get(fingerprint)).toBe(2)

        errorTracking.shouldSendLog(event)
        expect(errorTracking.errorCounts.get(fingerprint)).toBe(3)
      })

      test('should not increment count when error is blocked', () => {
        const event = {
          type: 'js_error',
          message: 'Test',
          source: 'a.js',
          line: 1
        }
        const fingerprint = errorTracking.getErrorFingerprint(event)

        errorTracking.shouldSendLog(event)
        errorTracking.shouldSendLog(event)
        errorTracking.shouldSendLog(event)
        errorTracking.shouldSendLog(event)

        expect(errorTracking.errorCounts.get(fingerprint)).toBe(3)
      })
    })
  })

  describe('sendLog', () => {
    beforeEach(() => {
      vi.spyOn(errorTracking, 'shouldSendLog').mockImplementation(function () {
        return true
      })
    })

    test('should not send when shouldSendLog returns false', () => {
      errorTracking.shouldSendLog.mockImplementation(function () {
        return false
      })
      const event = {
        type: 'js_error',
        message: 'Test',
        source: 'a.js',
        line: 1
      }

      errorTracking.sendLog(event)

      expect(mockNavigator.sendBeacon).not.toHaveBeenCalled()
    })

    test('should send beacon with correct endpoint', () => {
      const event = { type: 'js_error', message: 'Test' }

      errorTracking.sendLog(event)

      expect(mockNavigator.sendBeacon).toHaveBeenCalledWith(
        '/api/browser-logs',
        expect.anything()
      )
    })

    test('should include event details in payload', () => {
      const event = {
        type: 'js_error',
        message: 'Test error',
        source: 'script.js',
        line: 42
      }

      errorTracking.sendLog(event)

      const [[, blob]] = mockNavigator.sendBeacon.mock.calls
      const payload = JSON.parse(blob.content[0])

      expect(payload).toMatchObject({
        type: 'js_error',
        message: 'Test error',
        source: 'script.js',
        line: 42
      })
    })

    test('should include current URL pathname', () => {
      const event = { type: 'js_error', message: 'Test' }

      errorTracking.sendLog(event)

      const [[, blob]] = mockNavigator.sendBeacon.mock.calls
      const payload = JSON.parse(blob.content[0])

      expect(payload.url).toBe('/test/path')
    })

    test('should include user agent', () => {
      const event = { type: 'js_error', message: 'Test' }

      errorTracking.sendLog(event)

      const [[, blob]] = mockNavigator.sendBeacon.mock.calls
      const payload = JSON.parse(blob.content[0])

      expect(payload.userAgent).toBe('Mozilla/5.0 (Test Browser)')
    })

    test('should include timestamp', () => {
      const event = { type: 'js_error', message: 'Test' }
      mockDate.now.mockReturnValue(9876543210)

      errorTracking.sendLog(event)

      const [[, blob]] = mockNavigator.sendBeacon.mock.calls
      const payload = JSON.parse(blob.content[0])

      expect(payload.timestamp).toBe(9876543210)
    })

    test('should include occurrence count', () => {
      const event = {
        type: 'js_error',
        message: 'Test',
        source: 'a.js',
        line: 1
      }
      const tracker = new ErrorTracking({
        navigator: mockNavigator,
        location: mockLocation,
        console: mockConsole,
        Date: mockDate,
        Blob: mockBlob
      })

      tracker.sendLog(event)
      const [[, blob1]] = mockNavigator.sendBeacon.mock.calls
      const payload1 = JSON.parse(blob1.content[0])
      expect(payload1.occurrenceCount).toBe(1)

      tracker.sendLog(event)
      const [[, blob2]] = mockNavigator.sendBeacon.mock.calls.slice(-1)
      const payload2 = JSON.parse(blob2.content[0])
      expect(payload2.occurrenceCount).toBe(2)
    })

    test('should create blob with application/json type', () => {
      const event = { type: 'js_error', message: 'Test' }

      errorTracking.sendLog(event)

      expect(mockBlob).toHaveBeenCalledWith([expect.any(String)], {
        type: 'application/json'
      })
    })

    test('should fail silently when JSON.stringify throws', () => {
      const event = { type: 'js_error', message: 'Test' }
      const circularRef = {}
      circularRef.self = circularRef
      event.circular = circularRef

      expect(() => errorTracking.sendLog(event)).not.toThrow()
    })

    test('should fail silently when sendBeacon throws', () => {
      mockNavigator.sendBeacon.mockImplementation(() => {
        throw new Error('Beacon failed')
      })
      const event = { type: 'js_error', message: 'Test' }

      expect(() => errorTracking.sendLog(event)).not.toThrow()
    })

    test('should fail silently when Blob constructor throws', () => {
      mockBlob.mockImplementation(() => {
        throw new Error('Blob creation failed')
      })
      const event = { type: 'js_error', message: 'Test' }

      expect(() => errorTracking.sendLog(event)).not.toThrow()
    })
  })

  describe('reset', () => {
    test('should clear error counts', () => {
      const event = {
        type: 'js_error',
        message: 'Test',
        source: 'a.js',
        line: 1
      }
      errorTracking.shouldSendLog(event)
      expect(errorTracking.errorCounts.size).toBeGreaterThan(0)

      errorTracking.reset()

      expect(errorTracking.errorCounts.size).toBe(0)
    })

    test('should clear recent logs', () => {
      const event = {
        type: 'js_error',
        message: 'Test',
        source: 'a.js',
        line: 1
      }
      errorTracking.shouldSendLog(event)
      expect(errorTracking.recentLogs.length).toBeGreaterThan(0)

      errorTracking.reset()

      expect(errorTracking.recentLogs).toEqual([])
    })

    test('should reset burst active flag', () => {
      errorTracking.burstActive = true

      errorTracking.reset()

      expect(errorTracking.burstActive).toBe(false)
    })

    test('should allow fresh error tracking after reset', () => {
      const event = {
        type: 'js_error',
        message: 'Test',
        source: 'a.js',
        line: 1
      }

      errorTracking.shouldSendLog(event)
      errorTracking.shouldSendLog(event)
      errorTracking.shouldSendLog(event)
      expect(errorTracking.shouldSendLog(event)).toBe(false)

      errorTracking.reset()

      expect(errorTracking.shouldSendLog(event)).toBe(true)
    })
  })

  describe('integration scenarios', () => {
    test('should track multiple different errors independently', () => {
      vi.spyOn(errorTracking, 'sendLog').mockImplementation(() => {})
      errorTracking.init()

      mockConsole.error('Error A')
      mockConsole.error('Error B')
      mockConsole.error('Error A')

      expect(errorTracking.sendLog).toHaveBeenCalledTimes(3)
    })

    test('should respect deduplication across error types', () => {
      const tracker = new ErrorTracking({
        maxSameError: 2,
        maxBurst: 100,
        Date: mockDate,
        navigator: mockNavigator,
        location: mockLocation,
        console: mockConsole,
        Blob: mockBlob
      })

      const jsError = {
        type: 'js_error',
        message: 'Duplicate',
        source: 'a.js',
        line: 1
      }
      const consoleError = {
        type: 'console_error',
        message: 'Different Error',
        source: '',
        line: ''
      }

      expect(tracker.shouldSendLog(jsError)).toBe(true)
      expect(tracker.shouldSendLog(jsError)).toBe(true)
      expect(tracker.shouldSendLog(jsError)).toBe(false)

      expect(tracker.shouldSendLog(consoleError)).toBe(true)
      expect(tracker.shouldSendLog(consoleError)).toBe(true)
      expect(tracker.shouldSendLog(consoleError)).toBe(false)
    })

    test('should handle rapid error bursts correctly', () => {
      const events = Array.from({ length: 15 }, (_, i) => ({
        type: 'js_error',
        message: `Error ${i}`,
        source: 'a.js',
        line: i
      }))

      const allowed = events.filter((event) =>
        errorTracking.shouldSendLog(event)
      )

      expect(allowed.length).toBe(10)
      expect(errorTracking.burstActive).toBe(true)
    })

    test('should handle mixed error scenarios', () => {
      errorTracking.init()
      vi.spyOn(errorTracking, 'sendLog').mockImplementation(() => {})

      mockConsole.error('Console error 1')
      errorTracking.handleError('JS error 1', 'script.js', 1, 1, new Error())
      errorTracking.handleRejection({ reason: new Error('Promise error 1') })
      mockConsole.error('Console error 1')

      expect(errorTracking.sendLog).toHaveBeenCalledTimes(4)
    })
  })
})
