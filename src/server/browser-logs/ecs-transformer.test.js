import { describe, it, expect } from 'vitest'
import { toEcs } from './ecs-transformer.js'

describe('toEcs', () => {
  describe('timestamp transformation', () => {
    it('should convert numeric timestamp to ISO 8601 format', () => {
      const event = {
        timestamp: 1736937000000,
        message: 'Test error'
      }

      const result = toEcs(event)

      expect(result['@timestamp']).toBe('2025-01-15T10:30:00.000Z')
    })

    it('should handle epoch timestamp 0', () => {
      const event = {
        timestamp: 0,
        message: 'Test error'
      }

      const result = toEcs(event)

      expect(result['@timestamp']).toBe('1970-01-01T00:00:00.000Z')
    })

    it('should handle string timestamp', () => {
      const event = {
        timestamp: '1736937000000',
        message: 'Test error'
      }

      const result = toEcs(event)

      expect(result['@timestamp']).toBe('2025-01-15T10:30:00.000Z')
    })
  })

  describe('message field', () => {
    it('should preserve error message', () => {
      const event = {
        timestamp: 1736937000000,
        message: 'TypeError: Cannot read property'
      }

      const result = toEcs(event)

      expect(result.message).toBe('TypeError: Cannot read property')
    })

    it('should handle empty message', () => {
      const event = {
        timestamp: 1736937000000,
        message: ''
      }

      const result = toEcs(event)

      expect(result.message).toBe('')
    })

    it('should handle undefined message', () => {
      const event = {
        timestamp: 1736937000000
      }

      const result = toEcs(event)

      expect(result.message).toBeUndefined()
    })
  })

  describe('log level field', () => {
    it('should default to error level when level not provided', () => {
      const event = {
        timestamp: 1736937000000,
        message: 'Test error'
      }

      const result = toEcs(event)

      expect(result.log.level).toBe('error')
      expect(result.log.logger).toBe('browser')
    })

    it('should handle null level', () => {
      const event = {
        timestamp: 1736937000000,
        message: 'Test error',
        level: null
      }

      const result = toEcs(event)

      expect(result.log.level).toBe('error')
      expect(result.log.logger).toBe('browser')
    })
  })

  describe('event action field', () => {
    it('should map event type to action', () => {
      const event = {
        timestamp: 1736937000000,
        message: 'Test error',
        type: 'error'
      }

      const result = toEcs(event)

      expect(result.event.action).toBe('error')
    })

    it('should handle undefined type', () => {
      const event = {
        timestamp: 1736937000000,
        message: 'Test error'
      }

      const result = toEcs(event)

      expect(result.event.action).toBeUndefined()
    })
  })

  describe('error object field', () => {
    it('should include error object when stack trace is provided', () => {
      const event = {
        timestamp: 1736937000000,
        message: 'TypeError: Cannot read property',
        stack: 'TypeError: Cannot read property\n    at app.js:42:15',
        errorType: 'TypeError'
      }

      const result = toEcs(event)

      expect(result.error).toBeDefined()
      expect(result.error.message).toBe('TypeError: Cannot read property')
      expect(result.error.stack_trace).toBe(
        'TypeError: Cannot read property\n    at app.js:42:15'
      )
      expect(result.error.type).toBe('TypeError')
    })

    it('should include error object with default Error type when errorType not provided', () => {
      const event = {
        timestamp: 1736937000000,
        message: 'Generic error',
        stack: 'Error: Generic error\n    at app.js:10:5'
      }

      const result = toEcs(event)

      expect(result.error).toBeDefined()
      expect(result.error.message).toBe('Generic error')
      expect(result.error.stack_trace).toBe(
        'Error: Generic error\n    at app.js:10:5'
      )
      expect(result.error.type).toBe('Error')
    })

    it('should omit error object when stack trace is not provided', () => {
      const event = {
        timestamp: 1736937000000,
        message: 'Simple error without stack',
        errorType: 'Error'
      }

      const result = toEcs(event)

      expect(result.error).toBeUndefined()
    })

    it('should omit error object when stack trace is empty string', () => {
      const event = {
        timestamp: 1736937000000,
        message: 'Error with empty stack',
        stack: '',
        errorType: 'Error'
      }

      const result = toEcs(event)

      expect(result.error).toBeUndefined()
    })

    it('should omit error object when stack trace is null', () => {
      const event = {
        timestamp: 1736937000000,
        message: 'Error with null stack',
        stack: null,
        errorType: 'Error'
      }

      const result = toEcs(event)

      expect(result.error).toBeUndefined()
    })
  })

  describe('user agent field', () => {
    it('should include user agent information', () => {
      const event = {
        timestamp: 1736937000000,
        message: 'Test error',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      }

      const result = toEcs(event)

      expect(result.user_agent).toBeDefined()
      expect(result.user_agent.original).toBe(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
      )
    })

    it('should handle undefined user agent', () => {
      const event = {
        timestamp: 1736937000000,
        message: 'Test error'
      }

      const result = toEcs(event)

      expect(result.user_agent).toBeDefined()
      expect(result.user_agent.original).toBeUndefined()
    })

    it('should handle empty user agent', () => {
      const event = {
        timestamp: 1736937000000,
        message: 'Test error',
        userAgent: ''
      }

      const result = toEcs(event)

      expect(result.user_agent.original).toBe('')
    })
  })

  describe('url field', () => {
    it('should include URL path', () => {
      const event = {
        timestamp: 1736937000000,
        message: 'Test error',
        url: '/exemption/task-list'
      }

      const result = toEcs(event)

      expect(result.url).toBeDefined()
      expect(result.url.path).toBe('/exemption/task-list')
    })

    it('should handle undefined URL', () => {
      const event = {
        timestamp: 1736937000000,
        message: 'Test error'
      }

      const result = toEcs(event)

      expect(result.url).toBeDefined()
      expect(result.url.path).toBeUndefined()
    })

    it('should handle empty URL', () => {
      const event = {
        timestamp: 1736937000000,
        message: 'Test error',
        url: ''
      }

      const result = toEcs(event)

      expect(result.url.path).toBe('')
    })
  })

  describe('complete ECS transformation', () => {
    it('should transform complete browser error event', () => {
      const event = {
        timestamp: 1736937000000,
        message: 'TypeError: Cannot read property "foo" of undefined',
        level: 'error',
        type: 'error',
        stack:
          'TypeError: Cannot read property "foo" of undefined\n    at loadData (app.js:42:15)\n    at onClick (app.js:10:5)',
        errorType: 'TypeError',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        url: '/exemption/task-list'
      }

      const result = toEcs(event)

      expect(result).toEqual({
        '@timestamp': '2025-01-15T10:30:00.000Z',
        message: 'TypeError: Cannot read property "foo" of undefined',
        log: {
          level: 'error',
          logger: 'browser'
        },
        event: {
          action: 'error'
        },
        error: {
          message: 'TypeError: Cannot read property "foo" of undefined',
          stack_trace:
            'TypeError: Cannot read property "foo" of undefined\n    at loadData (app.js:42:15)\n    at onClick (app.js:10:5)',
          type: 'TypeError'
        },
        user_agent: {
          original: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        url: {
          path: '/exemption/task-list'
        }
      })
    })

    it('should transform minimal browser event', () => {
      const event = {
        timestamp: 1736937000000,
        message: 'Simple log message'
      }

      const result = toEcs(event)

      expect(result).toEqual({
        '@timestamp': '2025-01-15T10:30:00.000Z',
        message: 'Simple log message',
        log: {
          level: 'error',
          logger: 'browser'
        },
        event: {
          action: undefined
        },
        error: undefined,
        user_agent: {
          original: undefined
        },
        url: {
          path: undefined
        }
      })
    })
  })

  describe('edge cases', () => {
    it('should handle empty event object', () => {
      const event = {}

      const result = toEcs(event)

      // When timestamp is undefined, should use current time
      expect(result['@timestamp']).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      )
      expect(result.message).toBeUndefined()
      expect(result.log.level).toBe('error')
      expect(result.error).toBeUndefined()
    })

    it('should handle event with numeric message', () => {
      const event = {
        timestamp: 1736937000000,
        message: 404
      }

      const result = toEcs(event)

      expect(result.message).toBe(404)
    })

    it('should handle event with boolean fields', () => {
      const event = {
        timestamp: 1736937000000,
        message: 'Test',
        level: false
      }

      const result = toEcs(event)

      expect(result.log.level).toBe('error')
    })
  })
})
