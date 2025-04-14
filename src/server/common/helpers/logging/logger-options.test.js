import { loggerOptions } from './logger-options.js'
import { getTraceId } from '@defra/hapi-tracing'

jest.mock('@defra/hapi-tracing', () => ({
  getTraceId: jest.fn()
}))

jest.mock('@elastic/ecs-pino-format', () => ({
  ecsFormat: jest
    .fn()
    .mockImplementation(({ serviceVersion, serviceName }) => ({
      formatCalled: true,
      serviceVersion,
      serviceName
    }))
}))

jest.mock('~/src/config/config.js', () => ({
  config: {
    get: jest.fn((key) => {
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
  beforeEach(() => {
    jest.clearAllMocks()
  })

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
