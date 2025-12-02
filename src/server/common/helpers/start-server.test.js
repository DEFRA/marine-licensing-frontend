import { vi, beforeEach, afterEach } from 'vitest'

const mockLoggerInfo = vi.fn()
const mockLoggerError = vi.fn()

const mockHapiLoggerInfo = vi.fn()
const mockHapiLoggerError = vi.fn()

const mockCreateServer = vi.fn()

vi.mock('hapi-pino', () => ({
  default: {
    register: (server) => {
      server.decorate('server', 'logger', {
        info: mockHapiLoggerInfo,
        error: mockHapiLoggerError
      })
    },
    name: 'mock-hapi-pino'
  }
}))
vi.mock('~/src/server/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({
    info: (...args) => mockLoggerInfo(...args),
    error: (...args) => mockLoggerError(...args)
  })
}))
vi.mock('~/src/server/index.js', () => ({
  createServer: () => mockCreateServer()
}))

describe('#startServer', () => {
  let startServerImport

  beforeAll(async () => {
    vi.stubEnv('PORT', '3097')

    startServerImport =
      await import('~/src/server/common/helpers/start-server.js')
  })

  afterAll(() => {
    vi.unstubAllEnvs()
  })

  describe('When server starts', () => {
    let server

    beforeEach(() => {
      server = {
        start: vi.fn(),
        stop: vi.fn(),
        logger: {
          info: mockHapiLoggerInfo,
          error: mockHapiLoggerError
        }
      }
      mockCreateServer.mockResolvedValue(server)
    })

    afterEach(async () => {
      await server?.stop({ timeout: 0 })
    })

    test('Should start up server as expected', async () => {
      const result = await startServerImport.startServer()

      expect(mockCreateServer).toHaveBeenCalled()
      expect(server.start).toHaveBeenCalled()
      expect(mockHapiLoggerInfo).toHaveBeenCalledWith(
        'Server started successfully'
      )
      expect(result).toBe(server)
    })
  })

  describe('When server start fails', () => {
    beforeEach(() => {
      mockCreateServer.mockRejectedValue(new Error('Server failed to start'))
    })

    test('Should log failed startup message', async () => {
      await startServerImport.startServer()

      expect(mockLoggerInfo).toHaveBeenCalledWith('Server failed to start :(')
      expect(mockLoggerError).toHaveBeenCalledWith(
        { error: Error('Server failed to start') },
        'Server startup error'
      )
    })
  })
})
