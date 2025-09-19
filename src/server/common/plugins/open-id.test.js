import { jest } from '@jest/globals'
import { config } from '~/src/config/config.js'
import { createDefraIdStrategy } from '~/src/server/common/plugins/auth/defra-id-strategy.js'
import { createEntraIdStrategy } from '~/src/server/common/plugins/auth/entra-id-strategy.js'
import { createSessionStrategy } from '~/src/server/common/plugins/auth/session-strategy.js'
import { AUTH_STRATEGIES } from '~/src/server/common/constants/auth.js'
import { validateUserSession } from '~/src/server/common/plugins/auth/validate.js'
import { clearExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'
import { cacheMcmsContextFromQueryParams } from '~/src/server/common/helpers/mcms-context/cache-mcms-context.js'
import { redirectPathCacheKey } from '~/src/server/common/constants/routes.js'

// Mock external dependencies that these strategy functions depend on
jest.mock('~/src/config/config.js')
jest.mock('~/src/server/common/plugins/auth/open-id-provider.js')
jest.mock('~/src/server/common/plugins/auth/validate.js')
jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock('~/src/server/common/helpers/mcms-context/cache-mcms-context.js')

// Helper to create a mock server that tracks strategy calls
const createMockServer = () => ({
  auth: {
    strategy: jest.fn(),
    default: jest.fn()
  }
})

describe('Strategy Functions Integration Tests', () => {
  let mockServer
  const mockConfig = jest.mocked(config)

  beforeEach(() => {
    mockServer = createMockServer()
    jest.clearAllMocks()
  })

  describe('createDefraIdStrategy', () => {
    test('should register basic strategy when auth is disabled', async () => {
      mockConfig.get.mockImplementation((key) => {
        if (key === 'defraId') return { authEnabled: false }
        return {}
      })

      await createDefraIdStrategy(mockServer)

      expect(mockServer.auth.strategy).toHaveBeenCalledWith(
        AUTH_STRATEGIES.DEFRA_ID,
        'basic',
        {
          validate: expect.any(Function)
        }
      )

      const validateFn = mockServer.auth.strategy.mock.calls[0][2].validate
      expect(validateFn()).toEqual({ isValid: true })
    })

    test('should try to register bell strategy when auth is enabled', async () => {
      mockConfig.get.mockImplementation((key) => {
        if (key === 'defraId')
          return {
            authEnabled: true,
            clientId: 'test',
            clientSecret: 'test',
            redirectUrl: 'http://test',
            serviceId: 'test'
          }
        if (key === 'session.cookie') return { password: 'test', secure: true }
        return {}
      })

      // This will complete because openIdProvider mock returns undefined,
      // but the function will still call server.auth.strategy
      await createDefraIdStrategy(mockServer)

      // Verify it tried to register a bell strategy
      expect(mockServer.auth.strategy).toHaveBeenCalledWith(
        AUTH_STRATEGIES.DEFRA_ID,
        'bell',
        expect.objectContaining({
          clientId: 'test',
          clientSecret: 'test',
          password: 'test',
          isSecure: true,
          location: expect.any(Function)
        })
      )
      const locationCallback =
        mockServer.auth.strategy.mock.calls[0][2].location
      expect(locationCallback()).toBe('http://test/signin-oidc')
    })
  })

  describe('createEntraIdStrategy', () => {
    test('should register basic strategy when auth is disabled', async () => {
      mockConfig.get.mockImplementation((key) => {
        if (key === 'entraId') return { authEnabled: false }
        return {}
      })

      await createEntraIdStrategy(mockServer)

      expect(mockServer.auth.strategy).toHaveBeenCalledWith(
        AUTH_STRATEGIES.ENTRA_ID,
        'basic',
        {
          validate: expect.any(Function)
        }
      )

      const validateFn = mockServer.auth.strategy.mock.calls[0][2].validate
      expect(validateFn()).toEqual({ isValid: true })
    })

    test('should try to register bell strategy when auth is enabled', async () => {
      mockConfig.get.mockImplementation((key) => {
        if (key === 'entraId')
          return {
            authEnabled: true,
            clientId: 'test',
            clientSecret: 'test',
            redirectUrl: 'http://test',
            serviceId: 'test'
          }
        if (key === 'session.cookie') return { password: 'test', secure: true }
        return {}
      })

      // This will complete because openIdProvider mock returns undefined,
      // but the function will still call server.auth.strategy
      await createEntraIdStrategy(mockServer)

      // Verify it tried to register a bell strategy
      expect(mockServer.auth.strategy).toHaveBeenCalledWith(
        AUTH_STRATEGIES.ENTRA_ID,
        'bell',
        expect.objectContaining({
          clientId: 'test',
          clientSecret: 'test',
          password: 'test',
          isSecure: true,
          location: expect.any(Function)
        })
      )
      const locationCallback =
        mockServer.auth.strategy.mock.calls[0][2].location
      expect(locationCallback()).toBe('http://test/auth')
    })
  })

  describe('createSessionStrategy', () => {
    test('should not register when neither auth is enabled', () => {
      mockConfig.get.mockImplementation((key) => {
        if (key === 'defraId') return { authEnabled: false }
        if (key === 'entraId') return { authEnabled: false }
        return {}
      })

      createSessionStrategy(mockServer)

      expect(mockServer.auth.strategy).not.toHaveBeenCalled()
    })

    test('should register session strategy when defraId auth is enabled', () => {
      mockConfig.get.mockImplementation((key) => {
        if (key === 'defraId') return { authEnabled: true }
        if (key === 'entraId') return { authEnabled: false }
        if (key === 'session.cookie')
          return { password: 'test', secure: true, ttl: 3600000 }
        return {}
      })

      createSessionStrategy(mockServer)

      expect(mockServer.auth.strategy).toHaveBeenCalledWith(
        'session',
        'cookie',
        expect.objectContaining({
          cookie: expect.objectContaining({
            name: 'userSession',
            password: 'test',
            isSecure: true,
            ttl: 3600000
          }),
          validate: expect.any(Function),
          redirectTo: expect.any(Function)
        })
      )

      expect(mockServer.auth.default).toHaveBeenCalledWith('session')
    })

    test('should register session strategy when entraId auth is enabled', () => {
      mockConfig.get.mockImplementation((key) => {
        if (key === 'defraId') return { authEnabled: false }
        if (key === 'entraId') return { authEnabled: true }
        if (key === 'session.cookie')
          return { password: 'test', secure: true, ttl: 3600000 }
        return {}
      })

      createSessionStrategy(mockServer)

      expect(mockServer.auth.strategy).toHaveBeenCalledWith(
        'session',
        'cookie',
        expect.objectContaining({
          cookie: expect.objectContaining({
            name: 'userSession',
            password: 'test',
            isSecure: true,
            ttl: 3600000
          }),
          validate: expect.any(Function),
          redirectTo: expect.any(Function)
        })
      )

      expect(mockServer.auth.default).toHaveBeenCalledWith('session')
    })

    describe('redirectTo method', () => {
      let redirectToFn
      let mockRequest
      const mockCacheMcmsContextFromQueryParams = jest.mocked(
        cacheMcmsContextFromQueryParams
      )

      beforeEach(() => {
        mockConfig.get.mockImplementation((key) => {
          if (key === 'defraId') return { authEnabled: true }
          if (key === 'entraId') return { authEnabled: false }
          if (key === 'session.cookie')
            return { password: 'test', secure: true, ttl: 3600000 }
          return {}
        })

        createSessionStrategy(mockServer)
        redirectToFn = mockServer.auth.strategy.mock.calls[0][2].redirectTo

        mockRequest = {
          path: '/some/path',
          yar: {
            flash: jest.fn()
          }
        }
      })

      test('should redirect to regular login for non-entraId routes', () => {
        mockRequest.path = '/exemption/task-list'

        const result = redirectToFn(mockRequest)

        expect(mockCacheMcmsContextFromQueryParams).toHaveBeenCalledWith(
          mockRequest
        )
        expect(result).toBe('/signin')
        expect(mockRequest.yar.flash).toHaveBeenCalledWith(
          redirectPathCacheKey,
          '/exemption/task-list',
          true
        )
      })

      test('should redirect to entra login for entraId routes', () => {
        mockRequest.path = '/view-details'

        const result = redirectToFn(mockRequest)

        expect(mockCacheMcmsContextFromQueryParams).toHaveBeenCalledWith(
          mockRequest
        )
        expect(result).toBe('/signin-entra')
        expect(mockRequest.yar.flash).toHaveBeenCalledWith(
          redirectPathCacheKey,
          '/view-details',
          true
        )
      })

      test('should redirect to entra login for routes starting with entraId route', () => {
        mockRequest.path = '/view-details/some-id'

        const result = redirectToFn(mockRequest)

        expect(mockCacheMcmsContextFromQueryParams).toHaveBeenCalledWith(
          mockRequest
        )
        expect(result).toBe('/signin-entra')
        expect(mockRequest.yar.flash).toHaveBeenCalledWith(
          redirectPathCacheKey,
          '/view-details/some-id',
          true
        )
      })
    })

    describe('validate method', () => {
      let validateFn
      let mockRequest
      let mockSession
      const mockValidateUserSession = jest.mocked(validateUserSession)
      const mockClearExemptionCache = jest.mocked(clearExemptionCache)

      beforeEach(() => {
        mockConfig.get.mockImplementation((key) => {
          if (key === 'defraId') return { authEnabled: true }
          if (key === 'entraId') return { authEnabled: false }
          if (key === 'session.cookie')
            return { password: 'test', secure: true, ttl: 3600000 }
          return {}
        })

        createSessionStrategy(mockServer)
        validateFn = mockServer.auth.strategy.mock.calls[0][2].validate

        mockRequest = {
          path: '/some/path',
          yar: {
            flash: jest.fn()
          }
        }

        mockSession = {
          userId: 'test-user-id'
        }
      })

      test('should return validation result from validateUserSession', async () => {
        mockValidateUserSession.mockResolvedValue({
          isValid: true,
          credentials: { userId: 'test' }
        })

        const result = await validateFn(mockRequest, mockSession)

        expect(mockValidateUserSession).toHaveBeenCalledWith(
          mockRequest,
          mockSession
        )
        expect(result).toEqual({
          isValid: true,
          credentials: { userId: 'test' }
        })
      })

      test('should clear exemption cache when validation fails', async () => {
        mockValidateUserSession.mockResolvedValue({ isValid: false })

        const result = await validateFn(mockRequest, mockSession)

        expect(mockValidateUserSession).toHaveBeenCalledWith(
          mockRequest,
          mockSession
        )
        expect(mockClearExemptionCache).toHaveBeenCalledWith(mockRequest)
        expect(result).toEqual({ isValid: false })
      })

      test('should not clear exemption cache when validation succeeds', async () => {
        mockValidateUserSession.mockResolvedValue({
          isValid: true,
          credentials: { userId: 'test' }
        })

        const result = await validateFn(mockRequest, mockSession)

        expect(mockValidateUserSession).toHaveBeenCalledWith(
          mockRequest,
          mockSession
        )
        expect(mockClearExemptionCache).not.toHaveBeenCalled()
        expect(result).toEqual({
          isValid: true,
          credentials: { userId: 'test' }
        })
      })
    })
  })
})
