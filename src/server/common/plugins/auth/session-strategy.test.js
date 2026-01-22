import { vi, describe, test, expect, beforeEach } from 'vitest'
import { createSessionStrategy } from './session-strategy.js'
import * as validateModule from '#src/server/common/plugins/auth/validate.js'
import { routes } from '#src/server/common/constants/routes.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import { cacheMcmsContextFromQueryParams } from '#src/server/common/helpers/mcms-context/cache-mcms-context.js'

vi.mock('#src/server/common/plugins/auth/validate.js', () => ({
  validateUserSession: vi.fn()
}))
vi.mock('#src/server/common/helpers/mcms-context/cache-mcms-context.js')

const DEFRA_ACCOUNT_URL = 'https://defra-account.example.com'

vi.mock('#src/config/config.js', () => ({
  config: {
    get: vi.fn((key) => {
      if (key === 'defraId') {
        return {
          accountManagementUrl: DEFRA_ACCOUNT_URL
        }
      }
      return {}
    })
  }
}))

describe('session-strategy', () => {
  let mockServer
  let mockRequest
  let redirectToFn

  beforeEach(() => {
    mockServer = {
      auth: {
        strategy: vi.fn((name, type, options) => {
          redirectToFn = options.redirectTo
        }),
        default: vi.fn()
      }
    }
  })

  test('should set up session strategy with correct configuration', () => {
    createSessionStrategy(mockServer)

    expect(mockServer.auth.strategy).toHaveBeenCalledWith(
      'session',
      'cookie',
      expect.objectContaining({
        cookie: expect.objectContaining({
          name: 'userSession',
          path: '/',
          isSameSite: 'Lax'
        }),
        keepAlive: true
      })
    )
    expect(mockServer.auth.default).toHaveBeenCalledWith('session')
  })

  describe('redirectTo callback', () => {
    describe('when path is "/" and user is not referred from Defra Account', () => {
      beforeEach(() => {
        createSessionStrategy(mockServer)

        mockRequest = createMockRequest({
          path: '/',
          url: '/',
          headers: { referer: 'https://www.gov.uk/guidance' }
        })
      })

      test('should redirect to dashboard after signin when coming to / without a IAT query string ', () => {
        mockRequest.query = {}

        const result = redirectToFn(mockRequest)

        expect(mockRequest.yar.flash).toHaveBeenCalledWith(
          'redirectPath',
          routes.DASHBOARD,
          true
        )
        expect(result).toBe(routes.SIGNIN)
      })

      test('should cache MCMS context and cache the current path when ACTIVITY_TYPE exists', () => {
        mockRequest.query = { ACTIVITY_TYPE: 'some-activity' }

        const result = redirectToFn(mockRequest)

        expect(mockRequest.yar.flash).toHaveBeenCalledWith(
          'redirectPath',
          '/',
          true
        )
        expect(result).toBe(routes.SIGNIN)
        expect(cacheMcmsContextFromQueryParams).toHaveBeenCalledWith(
          mockRequest
        )
      })
    })

    describe('when path is "/" and user is referred from Defra Account', () => {
      beforeEach(() => {
        createSessionStrategy(mockServer)
        mockRequest.path = '/'
        mockRequest.headers.referer = DEFRA_ACCOUNT_URL
      })

      test('should flash current path and not check ACTIVITY_TYPE', () => {
        mockRequest.query = {}

        const result = redirectToFn(mockRequest)

        expect(mockRequest.yar.flash).toHaveBeenCalledWith(
          'redirectPath',
          '/',
          true
        )
        expect(mockRequest.yar.flash).toHaveBeenCalledTimes(1)
        expect(result).toBe(routes.SIGNIN)
      })
    })

    describe('when path is not "/"', () => {
      beforeEach(() => {
        createSessionStrategy(mockServer)
        mockRequest = createMockRequest({
          path: '/home',
          url: '/home'
        })
      })

      test('should redirect to Defra ID signin and cache the current path for non-root paths', () => {
        mockRequest.path = '/exemption/task-list'

        const result = redirectToFn(mockRequest)

        expect(mockRequest.yar.flash).toHaveBeenCalledWith(
          'redirectPath',
          '/exemption/task-list',
          true
        )
        expect(result).toBe(routes.SIGNIN)
      })

      test('should redirect to Entra ID signin for Entra ID routes', () => {
        mockRequest.path = '/view-details'

        const result = redirectToFn(mockRequest)

        expect(mockRequest.yar.flash).toHaveBeenCalledWith(
          'redirectPath',
          '/view-details',
          true
        )
        expect(result).toBe(routes.SIGNIN_ENTRA)
      })

      test('should redirect to Entra ID signin for routes starting with an entra ID route pattern', () => {
        mockRequest.path = '/view-details/some-id'

        const result = redirectToFn(mockRequest)

        expect(mockRequest.yar.flash).toHaveBeenCalledWith(
          'redirectPath',
          '/view-details/some-id',
          true
        )
        expect(result).toBe(routes.SIGNIN_ENTRA)
      })
    })

    describe('validate callback', () => {
      let validateFn

      beforeEach(() => {
        mockServer.auth.strategy = vi.fn((name, type, options) => {
          validateFn = options.validate
        })
        createSessionStrategy(mockServer)

        mockRequest = createMockRequest()
      })

      test('should call validateUserSession and return validity', async () => {
        const mockSession = { sessionId: 'test-123' }
        const mockValidity = { isValid: true, credentials: {} }

        validateModule.validateUserSession.mockResolvedValue(mockValidity)

        const result = await validateFn(mockRequest, mockSession)

        expect(validateModule.validateUserSession).toHaveBeenCalledWith(
          mockRequest,
          mockSession
        )
        expect(result).toEqual(mockValidity)
        expect(mockRequest.yar.clear).not.toHaveBeenCalled()
      })

      test('should clear exemption cache when validation fails', async () => {
        const mockSession = { sessionId: 'test-123' }
        const mockValidity = { isValid: false }

        validateModule.validateUserSession.mockResolvedValue(mockValidity)

        const result = await validateFn(mockRequest, mockSession)

        expect(validateModule.validateUserSession).toHaveBeenCalledWith(
          mockRequest,
          mockSession
        )
        expect(result).toEqual(mockValidity)
        expect(mockRequest.yar.clear).toHaveBeenCalledWith('exemption')
      })
    })
  })
})
