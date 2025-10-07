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
    expect(loggerOptions.ignorePaths).toEqual(['/health'])
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
})
