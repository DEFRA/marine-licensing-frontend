import { describe, test, expect, vi } from 'vitest'
import { journeyLogger } from './journey-logger.js'

describe('journeyLogger', () => {
  test('should have correct plugin name', () => {
    expect(journeyLogger.plugin.name).toBe('journey-logger')
  })

  test('should register onPostAuth extension', () => {
    const server = {
      ext: vi.fn()
    }

    journeyLogger.plugin.register(server)

    expect(server.ext).toHaveBeenCalledWith('onPostAuth', expect.any(Function))
  })

  describe('onPostAuth handler', () => {
    test('should set transaction.id binding when yar.id is present', () => {
      const server = { ext: vi.fn() }
      journeyLogger.plugin.register(server)

      const handler = server.ext.mock.calls[0][1]
      const request = {
        yar: { id: 'test-session-id-123' },
        logger: { setBindings: vi.fn() }
      }
      const h = { continue: Symbol('continue') }

      const result = handler(request, h)

      expect(request.logger.setBindings).toHaveBeenCalledWith({
        'transaction.id': 'test-session-id-123'
      })
      expect(result).toBe(h.continue)
    })

    test('should not set binding when yar is undefined', () => {
      const server = { ext: vi.fn() }
      journeyLogger.plugin.register(server)

      const handler = server.ext.mock.calls[0][1]
      const request = {
        yar: undefined,
        logger: { setBindings: vi.fn() }
      }
      const h = { continue: Symbol('continue') }

      const result = handler(request, h)

      expect(request.logger.setBindings).not.toHaveBeenCalled()
      expect(result).toBe(h.continue)
    })

    test('should not set binding when yar.id is undefined', () => {
      const server = { ext: vi.fn() }
      journeyLogger.plugin.register(server)

      const handler = server.ext.mock.calls[0][1]
      const request = {
        yar: { id: undefined },
        logger: { setBindings: vi.fn() }
      }
      const h = { continue: Symbol('continue') }

      const result = handler(request, h)

      expect(request.logger.setBindings).not.toHaveBeenCalled()
      expect(result).toBe(h.continue)
    })

    test('should not set binding when logger is undefined', () => {
      const server = { ext: vi.fn() }
      journeyLogger.plugin.register(server)

      const handler = server.ext.mock.calls[0][1]
      const request = {
        yar: { id: 'test-session-id' },
        logger: undefined
      }
      const h = { continue: Symbol('continue') }

      const result = handler(request, h)

      expect(result).toBe(h.continue)
    })

    test('should not set binding when logger.setBindings is undefined', () => {
      const server = { ext: vi.fn() }
      journeyLogger.plugin.register(server)

      const handler = server.ext.mock.calls[0][1]
      const request = {
        yar: { id: 'test-session-id' },
        logger: {}
      }
      const h = { continue: Symbol('continue') }

      const result = handler(request, h)

      expect(result).toBe(h.continue)
    })
  })
})
