import { Cluster, Redis } from 'ioredis'
import { buildRedisClient } from '~/src/server/common/helpers/redis-client.js'
import {
  __loggerInfoMock,
  __loggerErrorMock
} from '~/src/server/common/helpers/logging/logger.js'

const mockRedisEventHandlers = new Map()
const mockClusterEventHandlers = new Map()

jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation((options) => ({
      __options: options,
      on: jest.fn((event, cb) => {
        mockRedisEventHandlers.set(event, cb)
      })
    })),
    Cluster: jest.fn().mockImplementation((nodes, options) => ({
      __nodes: nodes,
      __options: options,
      on: jest.fn((event, cb) => {
        mockClusterEventHandlers.set(event, cb)
      })
    }))
  }
})

jest.mock('~/src/server/common/helpers/logging/logger.js', () => {
  const loggerInfoMockLocal = jest.fn()
  const loggerErrorMockLocal = jest.fn()
  return {
    createLogger: jest.fn(() => ({
      info: loggerInfoMockLocal,
      error: loggerErrorMockLocal
    })),
    __loggerInfoMock: loggerInfoMockLocal,
    __loggerErrorMock: loggerErrorMockLocal
  }
})

describe('buildRedisClient', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRedisEventHandlers.clear()
    mockClusterEventHandlers.clear()
  })

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
      expect(client.__options).toMatchObject({
        port: 6379,
        host: '127.0.0.1',
        db: 0,
        keyPrefix: 'marine-licensing-frontend:'
      })
    })

    it('should call logger.info on connect event', () => {
      const connectCallback = mockRedisEventHandlers.get('connect')
      expect(connectCallback).toBeDefined()
      connectCallback()
      expect(__loggerInfoMock).toHaveBeenCalledWith('Connected to Redis server')
    })

    it('should call logger.error on error event', () => {
      const errorCallback = mockRedisEventHandlers.get('error')
      expect(errorCallback).toBeDefined()
      const error = new Error('Test Error')
      errorCallback(error)
      expect(__loggerErrorMock).toHaveBeenCalledWith(
        `Redis connection error ${error.toString()}`
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
      expect(client.__nodes).toEqual([{ host: '127.0.0.1', port: 6379 }])
    })

    it('should call logger.info on connect event for cluster', () => {
      const connectCallback = mockClusterEventHandlers.get('connect')
      expect(connectCallback).toBeDefined()
      connectCallback()
      expect(__loggerInfoMock).toHaveBeenCalledWith('Connected to Redis server')
    })

    it('should call logger.error on error event for cluster', () => {
      const errorCallback = mockClusterEventHandlers.get('error')
      expect(errorCallback).toBeDefined()
      const error = new Error('Cluster Error')
      errorCallback(error)
      expect(__loggerErrorMock).toHaveBeenCalledWith(
        `Redis connection error ${error.toString()}`
      )
    })
  })
})
