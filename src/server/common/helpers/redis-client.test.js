import { vi, beforeEach, describe, it, expect } from 'vitest'

const mockLoggerInfo = vi.fn()
const mockLoggerError = vi.fn()

// Mock logger first
vi.mock('~/src/server/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({
    info: (...args) => mockLoggerInfo(...args),
    error: (...args) => mockLoggerError(...args)
  })
}))

// Let's try mocking the module at runtime for each test
let buildRedisClient
let Redis
let Cluster

beforeEach(async () => {
  vi.resetModules()

  // Mock ioredis dynamically
  vi.doMock('ioredis', () => ({
    Redis: vi.fn().mockImplementation((options) => ({
      on: vi.fn(),
      __options: options
    })),
    Cluster: vi.fn().mockImplementation((nodes, options) => ({
      on: vi.fn(),
      __nodes: nodes,
      __options: options
    }))
  }))

  // Import after mocking
  const ioredis = await import('ioredis')
  Redis = ioredis.Redis
  Cluster = ioredis.Cluster

  const redisClientModule =
    await import('~/src/server/common/helpers/redis-client.js')
  buildRedisClient = redisClientModule.buildRedisClient
})

describe('buildRedisClient', () => {
  describe('When using single Redis instance', () => {
    const redisConfigSingle = {
      host: '127.0.0.1',
      username: '',
      password: '',
      keyPrefix: 'marine-licensing-frontend:',
      useSingleInstanceCache: true,
      useTLS: false
    }
    let client

    beforeEach(() => {
      client = buildRedisClient(redisConfigSingle)
    })

    it('should instantiate a single Redis client with correct options', () => {
      expect(Redis).toHaveBeenCalledWith({
        port: 6379,
        host: '127.0.0.1',
        db: 0,
        keyPrefix: 'marine-licensing-frontend:'
      })
      expect(client.on).toHaveBeenCalledWith('connect', expect.any(Function))
      expect(client.on).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('should call logger.info on connect event', () => {
      // Get the mock on function and call the connect handler
      const onFn = client.on
      const connectCall = onFn.mock.calls.find((call) => call[0] === 'connect')
      expect(connectCall).toBeDefined()
      const connectHandler = connectCall[1]
      connectHandler()
      expect(mockLoggerInfo).toHaveBeenCalledWith('Connected to Redis server')
    })

    it('should call logger.error on error event', () => {
      // Get the mock on function and call the error handler
      const onFn = client.on
      const errorCall = onFn.mock.calls.find((call) => call[0] === 'error')
      expect(errorCall).toBeDefined()
      const errorHandler = errorCall[1]
      const testError = new Error('Test Error')
      errorHandler(testError)
      expect(mockLoggerError).toHaveBeenCalledWith(
        `Redis connection error ${testError.toString()}`
      )
    })
  })

  describe('When using Redis Cluster', () => {
    const redisConfigCluster = {
      host: '127.0.0.1',
      username: 'user',
      password: 'pass',
      keyPrefix: 'marine-licensing-frontend:',
      useSingleInstanceCache: false,
      useTLS: true
    }
    let client

    beforeEach(() => {
      client = buildRedisClient(redisConfigCluster)
    })

    it('should instantiate a Redis Cluster client with correct options', () => {
      expect(Cluster).toHaveBeenCalledWith(
        [{ host: '127.0.0.1', port: 6379 }],
        {
          keyPrefix: 'marine-licensing-frontend:',
          slotsRefreshTimeout: 10000,
          dnsLookup: expect.any(Function),
          redisOptions: { db: 0, username: 'user', password: 'pass', tls: {} }
        }
      )
      expect(client.on).toHaveBeenCalledWith('connect', expect.any(Function))
      expect(client.on).toHaveBeenCalledWith('error', expect.any(Function))
    })

    it('should call logger.info on connect event for cluster', () => {
      // Get the mock on function and call the connect handler
      const onFn = client.on
      const connectCall = onFn.mock.calls.find((call) => call[0] === 'connect')
      expect(connectCall).toBeDefined()
      const connectHandler = connectCall[1]
      connectHandler()
      expect(mockLoggerInfo).toHaveBeenCalledWith('Connected to Redis server')
    })

    it('should call logger.error on error event for cluster', () => {
      // Get the mock on function and call the error handler
      const onFn = client.on
      const errorCall = onFn.mock.calls.find((call) => call[0] === 'error')
      expect(errorCall).toBeDefined()
      const errorHandler = errorCall[1]
      const testError = new Error('Cluster Error')
      errorHandler(testError)
      expect(mockLoggerError).toHaveBeenCalledWith(
        `Redis connection error ${testError.toString()}`
      )
    })
  })
})
