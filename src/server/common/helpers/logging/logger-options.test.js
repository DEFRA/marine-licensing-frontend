import { vi } from 'vitest'
import { loggerOptions } from './logger-options.js'
import { getTraceId } from '@defra/hapi-tracing'

vi.mock('@defra/hapi-tracing', () => ({
  getTraceId: vi.fn()
}))

vi.mock('@elastic/ecs-pino-format', () => ({
  ecsFormat: vi.fn().mockImplementation(({ serviceVersion, serviceName }) => ({
    formatCalled: true,
    serviceVersion,
    serviceName
  }))
}))

vi.mock('~/src/config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      if (key === 'log') {
        return {
          enabled: true,
          redact: ['req.headers.authorization'],
          level: 'info',
          format: 'ecs'
        }
      }
      if (key === 'serviceName') return 'TestService'
      if (key === 'serviceVersion') return '1.0.0'
      return {}
    })
  }
}))

describe('loggerOptions', () => {
  it('should have correct properties based on config and ecsFormat', () => {
    expect(loggerOptions.enabled).toBe(true)
    expect(loggerOptions.ignoreFunc).toBeDefined()
    expect(typeof loggerOptions.ignoreFunc).toBe('function')
    expect(loggerOptions.redact).toEqual({
      paths: ['req.headers.authorization'],
      remove: true
    })
    expect(loggerOptions.level).toBe('info')
    expect(loggerOptions.nesting).toBe(true)
    expect(loggerOptions.formatCalled).toBe(true)
    expect(loggerOptions.serviceVersion).toBe('1.0.0')
    expect(loggerOptions.serviceName).toBe('TestService')
  })

  it('mixin returns object with trace when getTraceId returns a value', () => {
    getTraceId.mockReturnValue('abc123')
    expect(loggerOptions.mixin()).toEqual({ trace: { id: 'abc123' } })
  })

  it('mixin returns empty object when getTraceId returns undefined', () => {
    getTraceId.mockReturnValue(undefined)
    expect(loggerOptions.mixin()).toEqual({})
  })

  it('ignoreFunc should return true for paths starting with /public/', () => {
    const request = { path: '/public/assets/script.js' }
    expect(loggerOptions.ignoreFunc({}, request)).toBe(true)
  })

  it('ignoreFunc should return true for /health', () => {
    const request = { path: '/health' }
    expect(loggerOptions.ignoreFunc({}, request)).toBe(true)
  })

  it('ignoreFunc should return true for /favicon.ico', () => {
    const request = { path: '/favicon.ico' }
    expect(loggerOptions.ignoreFunc({}, request)).toBe(true)
  })

  it('ignoreFunc should return false for /api/browser-logs when the payload is undefined', () => {
    const request = { path: '/api/browser-logs', payload: undefined }
    expect(loggerOptions.ignoreFunc({}, request)).toBe(false)
  })

  it('ignoreFunc should return true for /api/browser-logs when the payload is defined', () => {
    const request = { path: '/api/browser-logs', payload: { foo: 'bar' } }
    expect(loggerOptions.ignoreFunc({}, request)).toBe(true)
  })

  it('ignoreFunc should return false for paths not starting with /public/', () => {
    const request = { path: '/api/endpoint' }
    expect(loggerOptions.ignoreFunc({}, request)).toBe(false)
  })

  it('ignoreFunc should return false for /public without trailing path', () => {
    const request = { path: '/public' }
    expect(loggerOptions.ignoreFunc({}, request)).toBe(false)
  })
})
