import { vi } from 'vitest'
import {
  getUserSession,
  removeUserSession,
  refreshAccessToken,
  updateUserSession
} from '#src/server/common/plugins/auth/utils.js'
import { config } from '#src/config/config.js'
import { getOpenIdRefreshToken } from './get-oidc-config.js'
import jwt from '@hapi/jwt'
import { addSeconds } from 'date-fns'

vi.mock('~/src/config/config.js')
vi.mock('./get-oidc-config.js')
vi.mock('@hapi/jwt')
vi.mock('date-fns', () => ({
  addSeconds: vi.fn()
}))

describe('#utils', () => {
  let mockRequest
  let mockSession
  let mockAuthedUser
  let mockRefreshedSession

  const mockedGetOpenIdRefreshToken = vi.mocked(getOpenIdRefreshToken)

  beforeEach(() => {
    config.get.mockImplementation(() => ({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      scopes: ['test-scopes'],
      redirectUrl: 'http://test-redirect-url'
    }))

    mockRequest = {
      server: {
        app: {
          cache: {
            get: vi.fn(),
            drop: vi.fn(),
            set: vi.fn()
          }
        }
      },
      cookieAuth: {
        clear: vi.fn()
      },
      logger: {
        setBindings: vi.fn()
      },
      state: {
        userSession: {
          sessionId: 'test-id'
        }
      }
    }

    mockSession = {
      sessionId: 'test-id'
    }

    mockAuthedUser = {
      id: 'test-user-id',
      strategy: 'defraId',
      refreshToken: 'test-refresh-token',
      tokenUrl: 'http://test-token-url',
      firstName: 'John',
      lastName: 'Doe'
    }

    mockRefreshedSession = {
      access_token: 'test-access-token',
      id_token: 'test-id-token',
      refresh_token: 'test-new-refresh-token',
      expires_in: 3600
    }

    jwt.token.decode.mockReturnValue({
      decoded: {
        payload: {
          sub: 'test-user-id',
          correlationId: 'test-correlation-id',
          sessionId: 'test-id',
          contactId: 'test-contact-id',
          serviceId: 'test-service-id',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          uniqueReference: 'test-ref',
          loa: 'test-loa',
          aal: 'test-aal',
          enrolmentCount: 1,
          enrolmentRequestCount: 1,
          currentRelationshipId: 'test-relationship-id',
          relationships: ['test-relationship'],
          roles: ['test-role']
        }
      }
    })

    const mockDate = new Date('2023-01-01T12:00:00Z')
    addSeconds.mockReturnValue(mockDate)
    mockDate.toISOString = vi.fn().mockReturnValue('2023-01-01T12:00:00.000Z')

    mockedGetOpenIdRefreshToken.mockResolvedValue(mockRefreshedSession)
  })

  describe('#getUserSession', () => {
    test('When session has sessionId and cache returns user data', async () => {
      mockRequest.server.app.cache.get.mockResolvedValue('test')

      const result = await getUserSession(mockRequest, mockSession)

      expect(mockRequest.server.app.cache.get).toHaveBeenCalledWith('test-id')
      expect(result).toBe('test')
    })

    test('When session has sessionId but cache returns null', async () => {
      mockRequest.server.app.cache.get.mockResolvedValue(null)

      const result = await getUserSession(mockRequest, mockSession)

      expect(mockRequest.server.app.cache.get).toHaveBeenCalledWith('test-id')
      expect(result).toBeNull()
    })

    test('When session has no sessionId', async () => {
      const result = await getUserSession(mockRequest, {})
      expect(result).toBeNull()
    })

    test('When session is null', async () => {
      const result = await getUserSession(mockRequest, null)
      expect(result).toBeNull()
    })
  })

  describe('#removeUserSession', () => {
    test('user is removed from session', () => {
      removeUserSession(mockRequest, mockSession)

      expect(mockRequest.server.app.cache.drop).toHaveBeenCalledWith('test-id')
      expect(mockRequest.cookieAuth.clear).toHaveBeenCalled()
    })
  })

  describe('#refreshAccessToken', () => {
    test('When user session exists and refresh token is available', async () => {
      mockRequest.server.app.cache.get.mockResolvedValue(mockAuthedUser)

      const result = await refreshAccessToken(mockRequest, mockSession)

      expect(mockRequest.logger.setBindings).toHaveBeenCalledWith({
        refreshingAccessToken: 'defraId'
      })

      expect(mockedGetOpenIdRefreshToken).toHaveBeenCalledWith(
        'http://test-token-url',
        {
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
          grant_type: 'refresh_token',
          refresh_token: 'test-refresh-token',
          scope: 'test-scopes',
          redirect_uri: 'http://test-redirect-url/signin-oidc'
        }
      )
      expect(result).toEqual(mockRefreshedSession)
    })

    test('When user session exists but refresh token is null', async () => {
      mockRequest.server.app.cache.get.mockResolvedValue({
        ...mockAuthedUser,
        refreshToken: null
      })

      const result = await refreshAccessToken(mockRequest, mockSession)

      expect(mockedGetOpenIdRefreshToken).toHaveBeenCalledWith(
        'http://test-token-url',
        {
          client_id: 'test-client-id',
          client_secret: 'test-client-secret',
          grant_type: 'refresh_token',
          refresh_token: null,
          scope: 'test-scopes',
          redirect_uri: 'http://test-redirect-url/signin-oidc'
        }
      )
      expect(result).toEqual(mockRefreshedSession)
    })
  })

  describe('#updateUserSession', () => {
    test('When all parameters are valid and user session exists', async () => {
      mockRequest.server.app.cache.get.mockResolvedValue(mockAuthedUser)

      const result = await updateUserSession(mockRequest, mockRefreshedSession)

      expect(jwt.token.decode).toHaveBeenCalled()
      expect(mockRequest.server.app.cache.set).toHaveBeenCalledWith(
        'test-id',
        {
          ...mockAuthedUser,
          id: 'test-user-id',
          correlationId: 'test-correlation-id',
          contactId: 'test-contact-id',
          serviceId: 'test-service-id',
          firstName: 'John',
          lastName: 'Doe',
          displayName: 'John Doe',
          email: 'john.doe@example.com',
          uniqueReference: 'test-ref',
          loa: 'test-loa',
          aal: 'test-aal',
          enrolmentCount: 1,
          enrolmentRequestCount: 1,
          currentRelationshipId: 'test-relationship-id',
          relationships: ['test-relationship'],
          roles: ['test-role'],
          isAuthenticated: true,
          idToken: 'test-id-token',
          token: 'test-access-token',
          refreshToken: 'test-new-refresh-token',
          expiresIn: 3600000,
          expiresAt: '2023-01-01T12:00:00.000Z'
        },
        3600000
      )
      expect(result).toEqual(mockAuthedUser)
    })

    test('When user has no firstName or lastName', async () => {
      const payloadWithoutNames = {
        ...jwt.token.decode().decoded.payload,
        firstName: null,
        lastName: null
      }

      jwt.token.decode.mockReturnValue({
        decoded: { payload: payloadWithoutNames }
      })

      mockRequest.server.app.cache.get.mockResolvedValue(mockAuthedUser)

      await updateUserSession(mockRequest, mockRefreshedSession)

      expect(mockRequest.server.app.cache.set).toHaveBeenCalledWith(
        'test-id',
        expect.objectContaining({
          displayName: ''
        }),
        3600000
      )
    })

    test('When user has only firstName', async () => {
      const payloadWithFirstNameOnly = {
        ...jwt.token.decode().decoded.payload,
        firstName: 'John',
        lastName: null
      }
      jwt.token.decode.mockReturnValue({
        decoded: { payload: payloadWithFirstNameOnly }
      })
      mockRequest.server.app.cache.get.mockResolvedValue(mockAuthedUser)

      await updateUserSession(mockRequest, mockRefreshedSession)

      expect(mockRequest.server.app.cache.set).toHaveBeenCalledWith(
        'test-id',
        expect.objectContaining({
          displayName: 'John'
        }),
        3600000
      )
    })

    test('When user has only lastName', async () => {
      const payloadWithLastNameOnly = {
        ...jwt.token.decode().decoded.payload,
        firstName: null,
        lastName: 'Doe'
      }
      jwt.token.decode.mockReturnValue({
        decoded: { payload: payloadWithLastNameOnly }
      })
      mockRequest.server.app.cache.get.mockResolvedValue(mockAuthedUser)

      await updateUserSession(mockRequest, mockRefreshedSession)

      expect(mockRequest.server.app.cache.set).toHaveBeenCalledWith(
        'test-id',
        expect.objectContaining({
          displayName: 'Doe'
        }),
        3600000
      )
    })

    test('When user session is null', async () => {
      mockRequest.server.app.cache.get.mockResolvedValue(null)

      const result = await updateUserSession(mockRequest, mockRefreshedSession)

      expect(mockRequest.server.app.cache.set).toHaveBeenCalledWith(
        'test-id',
        expect.objectContaining({
          id: 'test-user-id',
          displayName: 'John Doe'
        }),
        3600000
      )
      expect(result).toBeNull()
    })
  })
})
