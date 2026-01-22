import { vi } from 'vitest'
import { config } from '#src/config/config.js'
import { createDefraIdStrategy } from '#src/server/common/plugins/auth/defra-id-strategy.js'
import { createEntraIdStrategy } from '#src/server/common/plugins/auth/entra-id-strategy.js'
import { createSessionStrategy } from '#src/server/common/plugins/auth/session-strategy.js'
import { AUTH_STRATEGIES } from '#src/server/common/constants/auth.js'
import { validateUserSession } from '#src/server/common/plugins/auth/validate.js'
import { clearExemptionCache } from '#src/server/common/helpers/exemptions/session-cache/utils.js'

// Mock external dependencies that these strategy functions depend on
vi.mock('~/src/config/config.js')
vi.mock('~/src/server/common/plugins/auth/open-id-provider.js')
vi.mock('~/src/server/common/plugins/auth/validate.js')
vi.mock('~/src/server/common/helpers/exemptions/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/mcms-context/cache-mcms-context.js')
vi.mock('#src/server/common/helpers/logging/logger.js', () => ({
  createLogger: vi.fn(() => ({ error: vi.fn() }))
}))

// Helper to create a mock server that tracks strategy calls
const createMockServer = () => ({
  auth: {
    strategy: vi.fn(),
    default: vi.fn()
  }
})

describe('Strategy Functions Integration Tests', () => {
  let mockServer
  const mockConfig = vi.mocked(config)

  beforeEach(() => {
    mockServer = createMockServer()
  })

  describe('createDefraIdStrategy', () => {
    test('should try to register bell strategy', async () => {
      mockConfig.get.mockImplementation((key) => {
        if (key === 'defraId') {
          return {
            clientId: 'test',
            clientSecret: 'test',
            redirectUrl: 'http://test',
            serviceId: 'test'
          }
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
    test('should try to register bell strategy', async () => {
      mockConfig.get.mockImplementation((key) => {
        if (key === 'entraId') {
          return {
            clientId: 'test',
            clientSecret: 'test',
            redirectUrl: 'http://test',
            serviceId: 'test'
          }
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
    test('should register session strategy', () => {
      mockConfig.get.mockImplementation((key) => {
        if (key === 'session.cookie') {
          return { password: 'test', secure: true, ttl: 3600000 }
        }
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

    describe('validate method', () => {
      let validateFn
      let mockRequest
      let mockSession
      const mockValidateUserSession = vi.mocked(validateUserSession)
      const mockClearExemptionCache = vi.mocked(clearExemptionCache)

      beforeEach(() => {
        mockConfig.get.mockImplementation((key) => {
          if (key === 'session.cookie') {
            return { password: 'test', secure: true, ttl: 3600000 }
          }
          return {}
        })

        createSessionStrategy(mockServer)
        validateFn = mockServer.auth.strategy.mock.calls[0][2].validate

        mockRequest = {
          path: '/some/path',
          yar: {
            flash: vi.fn(),
            clear: vi.fn()
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
        expect(mockRequest.yar.clear).toHaveBeenCalledWith('exemption')
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
