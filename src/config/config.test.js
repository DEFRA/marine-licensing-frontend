import { beforeEach, describe, expect, test, vi } from 'vitest'

describe('isCdpProductionLikeEnvironment', () => {
  test('should return true for prod environment', async () => {
    const { isCdpProductionLikeEnvironment } = await import('./config.js')
    expect(isCdpProductionLikeEnvironment('prod')).toBe(true)
  })

  test('should return true for perf-test environment', async () => {
    const { isCdpProductionLikeEnvironment } = await import('./config.js')
    expect(isCdpProductionLikeEnvironment('perf-test')).toBe(true)
  })

  test('should return true for test environment', async () => {
    const { isCdpProductionLikeEnvironment } = await import('./config.js')
    expect(isCdpProductionLikeEnvironment('test')).toBe(true)
  })

  test('should return false for local environment', async () => {
    const { isCdpProductionLikeEnvironment } = await import('./config.js')
    expect(isCdpProductionLikeEnvironment('local')).toBe(false)
  })

  test('should return false for dev environment', async () => {
    const { isCdpProductionLikeEnvironment } = await import('./config.js')
    expect(isCdpProductionLikeEnvironment('dev')).toBe(false)
  })

  test('should return false for ext-test environment', async () => {
    const { isCdpProductionLikeEnvironment } = await import('./config.js')
    expect(isCdpProductionLikeEnvironment('ext-test')).toBe(false)
  })

  test('should return false for undefined environment', async () => {
    const { isCdpProductionLikeEnvironment } = await import('./config.js')
    expect(isCdpProductionLikeEnvironment(undefined)).toBe(false)
  })

  test('should return false for null environment', async () => {
    const { isCdpProductionLikeEnvironment } = await import('./config.js')
    expect(isCdpProductionLikeEnvironment(null)).toBe(false)
  })

  test('should return false for unknown environment', async () => {
    const { isCdpProductionLikeEnvironment } = await import('./config.js')
    expect(isCdpProductionLikeEnvironment('unknown')).toBe(false)
  })
})

describe('config validation', () => {
  let originalEnv

  beforeEach(() => {
    originalEnv = { ...process.env }
    vi.resetModules()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  describe('required-from-env-in-cdp format', () => {
    test('should allow default values in local environment', async () => {
      process.env.ENVIRONMENT = 'local'
      process.env.NODE_ENV = 'test'

      const { config } = await import('./config.js')

      expect(config.get('appBaseUrl')).toBe('http://localhost:3000')
      expect(config.get('redis.host')).toBe('127.0.0.1')
    })

    test('should allow default values in dev environment', async () => {
      process.env.ENVIRONMENT = 'dev'
      process.env.NODE_ENV = 'production'

      const { config } = await import('./config.js')

      expect(config.get('appBaseUrl')).toBe('http://localhost:3000')
      expect(config.get('defraId.clientSecret')).toBe('test_value')
    })

    test('should reject default values in prod environment', async () => {
      process.env.ENVIRONMENT = 'prod'
      process.env.NODE_ENV = 'production'

      await expect(async () => {
        await import('./config.js')
      }).rejects.toThrow(/must be set for prod environment/)
    })

    test('should reject default values in perf-test environment', async () => {
      process.env.ENVIRONMENT = 'perf-test'
      process.env.NODE_ENV = 'production'

      await expect(async () => {
        await import('./config.js')
      }).rejects.toThrow(/must be set for perf-test environment/)
    })

    test('should reject empty string values in prod environment', async () => {
      process.env.ENVIRONMENT = 'prod'
      process.env.NODE_ENV = 'production'
      process.env.SESSION_COOKIE_PASSWORD = ''

      await expect(async () => {
        await import('./config.js')
      }).rejects.toThrow(/must be set for prod environment/)
    })

    test('should accept overridden values in prod environment', async () => {
      process.env.ENVIRONMENT = 'prod'
      process.env.NODE_ENV = 'test'
      process.env.SESSION_COOKIE_PASSWORD =
        'production-password-at-least-32-chars'
      process.env.REDIS_HOST = 'prod-redis.example.com'
      process.env.REDIS_USERNAME = 'prod-user'
      process.env.REDIS_PASSWORD = 'prod-password'
      process.env.MARINE_LICENSING_BACKEND_API_URL = 'https://api.example.com'
      process.env.DEFRA_ID_OIDC_CONFIGURATION_URL =
        'https://defra-id.example.com'
      process.env.DEFRA_ID_CLIENT_ID = 'prod-client-id'
      process.env.DEFRA_ID_CLIENT_SECRET = 'prod-secret'
      process.env.DEFRA_ID_SERVICE_ID = 'prod-service'
      process.env.DEFRA_ID_ACCOUNT_MANAGEMENT_URL =
        'https://account.example.com'
      process.env.ENTRA_ID_OIDC_CONFIGURATION_URL = 'https://entra.example.com'
      process.env.ENTRA_ID_CLIENT_ID = 'entra-client-id'
      process.env.ENTRA_ID_CLIENT_SECRET = 'entra-secret'
      process.env.CDP_UPLOADER_BASE_URL = 'https://uploader.example.com'
      process.env.CDP_UPLOAD_BUCKET = 'prod-bucket'
      process.env.APP_BASE_URL = 'https://app.example.com'

      const { config } = await import('./config.js')

      expect(config.get('appBaseUrl')).toBe('https://app.example.com')
      expect(config.get('redis.host')).toBe('prod-redis.example.com')
      expect(config.get('defraId.clientSecret')).toBe('prod-secret')
    })

    test('should list all missing required vars in error message', async () => {
      process.env.ENVIRONMENT = 'prod'
      process.env.NODE_ENV = 'production'

      try {
        await import('./config.js')
        expect.fail('Should have thrown validation error')
      } catch (error) {
        const errorMessage = error.message
        expect(errorMessage).toContain('SESSION_COOKIE_PASSWORD')
        expect(errorMessage).toContain('REDIS_HOST')
        expect(errorMessage).toContain('REDIS_USERNAME')
        expect(errorMessage).toContain('REDIS_PASSWORD')
        expect(errorMessage).toContain('MARINE_LICENSING_BACKEND_API_URL')
        expect(errorMessage).toContain('DEFRA_ID_OIDC_CONFIGURATION_URL')
        expect(errorMessage).toContain('DEFRA_ID_CLIENT_ID')
        expect(errorMessage).toContain('DEFRA_ID_CLIENT_SECRET')
        expect(errorMessage).toContain('DEFRA_ID_SERVICE_ID')
        expect(errorMessage).toContain('DEFRA_ID_ACCOUNT_MANAGEMENT_URL')
        expect(errorMessage).toContain('ENTRA_ID_OIDC_CONFIGURATION_URL')
        expect(errorMessage).toContain('ENTRA_ID_CLIENT_ID')
        expect(errorMessage).toContain('ENTRA_ID_CLIENT_SECRET')
        expect(errorMessage).toContain('CDP_UPLOADER_BASE_URL')
        expect(errorMessage).toContain('APP_BASE_URL')
      }
    })
  })

  describe('CLARITY_PROJECT_ID warning', () => {
    test('should warn when CLARITY_PROJECT_ID is not set in prod', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      process.env.ENVIRONMENT = 'prod'
      process.env.NODE_ENV = 'production'
      process.env.SESSION_COOKIE_PASSWORD =
        'production-password-at-least-32-chars'
      process.env.REDIS_HOST = 'prod-redis.example.com'
      process.env.REDIS_USERNAME = 'prod-user'
      process.env.REDIS_PASSWORD = 'prod-password'
      process.env.MARINE_LICENSING_BACKEND_API_URL = 'https://api.example.com'
      process.env.DEFRA_ID_OIDC_CONFIGURATION_URL =
        'https://defra-id.example.com'
      process.env.DEFRA_ID_CLIENT_ID = 'prod-client-id'
      process.env.DEFRA_ID_CLIENT_SECRET = 'prod-secret'
      process.env.DEFRA_ID_SERVICE_ID = 'prod-service'
      process.env.DEFRA_ID_ACCOUNT_MANAGEMENT_URL =
        'https://account.example.com'
      process.env.ENTRA_ID_OIDC_CONFIGURATION_URL = 'https://entra.example.com'
      process.env.ENTRA_ID_CLIENT_ID = 'entra-client-id'
      process.env.ENTRA_ID_CLIENT_SECRET = 'entra-secret'
      process.env.CDP_UPLOADER_BASE_URL = 'https://uploader.example.com'
      process.env.CDP_UPLOAD_BUCKET = 'prod-bucket'
      process.env.APP_BASE_URL = 'https://app.example.com'

      await import('./config.js')

      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('CLARITY_PROJECT_ID')
      )
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('prod environment')
      )

      warnSpy.mockRestore()
    })

    test('should not warn when CLARITY_PROJECT_ID is set in prod', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      process.env.ENVIRONMENT = 'prod'
      process.env.NODE_ENV = 'production'
      process.env.CLARITY_PROJECT_ID = 'some-clarity-id'
      process.env.SESSION_COOKIE_PASSWORD =
        'production-password-at-least-32-chars'
      process.env.REDIS_HOST = 'prod-redis.example.com'
      process.env.REDIS_USERNAME = 'prod-user'
      process.env.REDIS_PASSWORD = 'prod-password'
      process.env.MARINE_LICENSING_BACKEND_API_URL = 'https://api.example.com'
      process.env.DEFRA_ID_OIDC_CONFIGURATION_URL =
        'https://defra-id.example.com'
      process.env.DEFRA_ID_CLIENT_ID = 'prod-client-id'
      process.env.DEFRA_ID_CLIENT_SECRET = 'prod-secret'
      process.env.DEFRA_ID_SERVICE_ID = 'prod-service'
      process.env.DEFRA_ID_ACCOUNT_MANAGEMENT_URL =
        'https://account.example.com'
      process.env.ENTRA_ID_OIDC_CONFIGURATION_URL = 'https://entra.example.com'
      process.env.ENTRA_ID_CLIENT_ID = 'entra-client-id'
      process.env.ENTRA_ID_CLIENT_SECRET = 'entra-secret'
      process.env.CDP_UPLOADER_BASE_URL = 'https://uploader.example.com'
      process.env.CDP_UPLOAD_BUCKET = 'prod-bucket'
      process.env.APP_BASE_URL = 'https://app.example.com'

      await import('./config.js')

      expect(warnSpy).not.toHaveBeenCalled()

      warnSpy.mockRestore()
    })

    test('should not warn in local environment', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

      process.env.ENVIRONMENT = 'local'
      process.env.NODE_ENV = 'development'

      await import('./config.js')

      expect(warnSpy).not.toHaveBeenCalled()

      warnSpy.mockRestore()
    })
  })
})
