import { HttpServiceConfig } from './config.js'

describe('HttpServiceConfig', () => {
  beforeEach(() => {
    // Clear environment variables
    delete process.env.NODE_ENV
    delete process.env.npm_package_version
  })

  describe('forDevelopment', () => {
    it('should create development configuration', () => {
      const config = HttpServiceConfig.forDevelopment()

      expect(config.timeout).toBe(10000)
      expect(config.retries).toBe(2)
      expect(config.retryDelay).toBe(500)
      expect(config.retryStrategy).toBe('fixed')
      expect(config.headers['User-Agent']).toBe('marine-licensing-frontend-dev')
    })
  })

  describe('forTesting', () => {
    it('should create testing configuration', () => {
      const config = HttpServiceConfig.forTesting()

      expect(config.timeout).toBe(5000)
      expect(config.retries).toBe(1)
      expect(config.retryDelay).toBe(100)
      expect(config.retryStrategy).toBe('fixed')
      expect(config.headers['User-Agent']).toBe(
        'marine-licensing-frontend-test'
      )
    })
  })

  describe('forProduction', () => {
    it('should create production configuration', () => {
      const config = HttpServiceConfig.forProduction()

      expect(config.timeout).toBe(45000)
      expect(config.retries).toBe(3)
      expect(config.retryDelay).toBe(2000)
      expect(config.retryStrategy).toBe('exponential')
      expect(config.headers['User-Agent']).toContain(
        'marine-licensing-frontend'
      )
    })
  })

  describe('forEnvironment', () => {
    it('should return production config for production environment', () => {
      const config = HttpServiceConfig.forEnvironment('production')
      expect(config.timeout).toBe(45000)
    })

    it('should return development config for development environment', () => {
      const config = HttpServiceConfig.forEnvironment('development')
      expect(config.timeout).toBe(10000)
    })

    it('should return testing config for test environment', () => {
      const config = HttpServiceConfig.forEnvironment('test')
      expect(config.timeout).toBe(5000)
    })

    it('should use NODE_ENV when no environment specified', () => {
      process.env.NODE_ENV = 'development'
      const config = HttpServiceConfig.forEnvironment()
      expect(config.timeout).toBe(10000)
    })

    it('should default to production config for unknown environment', () => {
      const config = HttpServiceConfig.forEnvironment('unknown')
      expect(config.timeout).toBe(45000)
      expect(config.retries).toBe(3)
      expect(config.retryStrategy).toBe('exponential')
    })
  })
})
