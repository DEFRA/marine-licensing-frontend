import { vi } from 'vitest'
import { config } from '#src/config/config.js'

import { getCacheEngine } from '#src/server/common/helpers/session-cache/cache-engine.js'
import { Engine as CatboxRedis } from '@hapi/catbox-redis'
import { Engine as CatboxMemory } from '@hapi/catbox-memory'

const mockLoggerInfo = vi.fn()
const mockLoggerError = vi.fn()

vi.mock('~/src/server/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({
    info: mockLoggerInfo,
    error: mockLoggerError
  })
}))

const mockRedisOn = vi.fn()

vi.mock('~/src/server/common/helpers/redis-client.js', () => ({
  buildRedisClient: vi.fn(() => ({
    on: mockRedisOn
  }))
}))

vi.mock('ioredis', () => ({
  Redis: vi.fn().mockImplementation(() => ({
    on: mockRedisOn
  })),
  Cluster: vi.fn().mockImplementation(() => ({
    on: mockRedisOn
  }))
}))

vi.mock('@hapi/catbox-redis', () => ({
  Engine: vi.fn()
}))

vi.mock('@hapi/catbox-memory', () => ({
  Engine: vi.fn()
}))

describe('#getCacheEngine', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    config.set('isProduction', false)
  })

  describe('When Redis cache engine has been requested', () => {
    beforeEach(() => {
      getCacheEngine('redis')
    })

    test('Should setup Redis cache', () => {
      expect(CatboxRedis).toHaveBeenCalledWith(expect.any(Object))
    })

    test('Should log expected Redis message', () => {
      expect(mockLoggerInfo).toHaveBeenCalledWith('Using Redis session cache')
    })
  })

  describe('When In memory cache engine has been requested', () => {
    beforeEach(() => {
      getCacheEngine()
    })

    test('Should setup In memory cache', () => {
      expect(CatboxMemory).toHaveBeenCalledTimes(1)
    })

    test('Should log expected CatBox memory message', () => {
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        'Using Catbox Memory session cache'
      )
    })
  })

  describe('When In memory cache engine has been requested in Production', () => {
    beforeEach(() => {
      config.set('isProduction', true)
      getCacheEngine()
    })

    test('Should log Production warning message', () => {
      expect(mockLoggerError).toHaveBeenCalledWith(
        'Catbox Memory is for local development only, it should not be used in production!'
      )
    })

    test('Should setup In memory cache', () => {
      expect(CatboxMemory).toHaveBeenCalledTimes(1)
    })

    test('Should log expected message', () => {
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        'Using Catbox Memory session cache'
      )
    })
  })
})
