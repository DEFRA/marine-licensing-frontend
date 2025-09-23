import { jest } from '@jest/globals'
import { isPast } from 'date-fns'
import { validateUserSession } from './validate.js'
import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'

import * as authUtils from '~/src/server/common/plugins/auth/utils.js'
import { AUTH_STRATEGIES } from '~/src/server/common/constants/auth.js'

jest.mock('~/src/server/common/plugins/auth/utils.js', () => ({
  getUserSession: jest.fn(),
  removeUserSession: jest.fn(),
  refreshAccessToken: jest.fn(),
  updateUserSession: jest.fn()
}))

jest.mock('date-fns', () => ({
  isPast: jest.fn(),
  parseISO: jest.fn(),
  subMinutes: jest.fn()
}))

describe('validateUserSession', () => {
  let mockRequest
  let mockSession
  let mockUserSession
  /** @type {Server} */
  const getServer = setupTestServer()

  beforeEach(() => {
    mockRequest = {
      path: '/'
    }

    mockSession = {
      sessionId: 'test-session-123'
    }

    mockUserSession = {
      sessionId: 'test-session-123',
      expiresAt: '2024-01-01T12:00:00.000Z',
      profile: { name: 'Test User' },
      strategy: AUTH_STRATEGIES.DEFRA_ID
    }

    mockRequest.server = getServer()
  })

  test('when user session does not exist', async () => {
    authUtils.getUserSession.mockResolvedValue(null)
    const result = await validateUserSession(mockRequest, mockSession)
    expect(result).toEqual({ isValid: false })
  })

  test('When user session exists and token is valid', async () => {
    authUtils.getUserSession.mockResolvedValue(mockUserSession)
    isPast.mockReturnValue(false)

    await getServer().app.cache.set(mockUserSession.sessionId, mockUserSession)

    const result = await validateUserSession(mockRequest, mockSession)

    expect(result).toEqual({
      isValid: true,
      credentials: mockUserSession
    })
  })

  test('fallback for if a user session does not exist and token is valid', async () => {
    authUtils.getUserSession.mockResolvedValue(mockUserSession)
    isPast.mockReturnValue(false)

    await getServer().app.cache.set(mockUserSession.sessionId, null)
    const result = await validateUserSession(mockRequest, mockSession)

    expect(result).toEqual({
      isValid: false
    })
  })

  test('When token has expired and refresh succeeds', async () => {
    const mockRefreshResponse = {
      ok: true,
      json: {
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
        expires_in: 3600
      }
    }

    const mockUpdatedSession = {
      sessionId: 'test-session-123',
      token: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expiresIn: 3600000
    }

    authUtils.getUserSession.mockResolvedValue(mockUserSession)
    authUtils.refreshAccessToken.mockResolvedValue(mockRefreshResponse)
    authUtils.updateUserSession.mockResolvedValue(mockUpdatedSession)
    isPast.mockReturnValue(true)

    const result = await validateUserSession(mockRequest, mockSession)

    expect(result).toEqual({
      isValid: true,
      credentials: mockUpdatedSession
    })
    expect(authUtils.refreshAccessToken).toHaveBeenCalledWith(
      mockRequest,
      mockSession
    )
    expect(authUtils.updateUserSession).toHaveBeenCalledWith(
      mockRequest,
      mockRefreshResponse.json
    )
  })

  test('When token has expired and refresh fails', async () => {
    const mockRefreshResponse = {
      ok: false
    }

    authUtils.getUserSession.mockResolvedValue(mockUserSession)
    authUtils.refreshAccessToken.mockResolvedValue(mockRefreshResponse)
    isPast.mockReturnValue(true)

    const result = await validateUserSession(mockRequest, mockSession)

    expect(result).toEqual({ isValid: false })
    expect(authUtils.refreshAccessToken).toHaveBeenCalledWith(
      mockRequest,
      mockSession
    )
    expect(authUtils.removeUserSession).toHaveBeenCalledWith(
      mockRequest,
      mockSession
    )
    expect(authUtils.updateUserSession).not.toHaveBeenCalled()
  })

  describe('auth strategies', () => {
    describe('DEFRA_ID strategy validation', () => {
      beforeEach(() => {
        mockUserSession.strategy = AUTH_STRATEGIES.DEFRA_ID
        authUtils.getUserSession.mockResolvedValue(mockUserSession)
        isPast.mockReturnValue(false)
      })

      test('should validate successfully for a route requiring defra ID', async () => {
        mockRequest.path = '/exemption/task-list'
        await getServer().app.cache.set(
          mockUserSession.sessionId,
          mockUserSession
        )

        const result = await validateUserSession(mockRequest, mockSession)

        expect(result).toEqual({
          isValid: true,
          credentials: mockUserSession
        })
      })

      test('should fail validation for a route requiring entra ID', async () => {
        mockRequest.path = '/view-details'
        await getServer().app.cache.set(
          mockUserSession.sessionId,
          mockUserSession
        )

        const result = await validateUserSession(mockRequest, mockSession)

        expect(result).toEqual({
          isValid: false
        })
      })
    })

    describe('ENTRA_ID strategy validation', () => {
      beforeEach(() => {
        mockUserSession.strategy = AUTH_STRATEGIES.ENTRA_ID
        authUtils.getUserSession.mockResolvedValue(mockUserSession)
        isPast.mockReturnValue(false)
      })

      test('should validate successfully for a route requiring entra ID', async () => {
        mockRequest.path = '/view-details'
        await getServer().app.cache.set(
          mockUserSession.sessionId,
          mockUserSession
        )

        const result = await validateUserSession(mockRequest, mockSession)

        expect(result).toEqual({
          isValid: true,
          credentials: mockUserSession
        })
      })

      test('should fail validation for a route requiring defra ID', async () => {
        mockRequest.path = '/exemption/task-list'
        await getServer().app.cache.set(
          mockUserSession.sessionId,
          mockUserSession
        )

        const result = await validateUserSession(mockRequest, mockSession)

        expect(result).toEqual({
          isValid: false
        })
      })
    })

    describe('No strategy set', () => {
      beforeEach(() => {
        mockUserSession.strategy = null
        authUtils.getUserSession.mockResolvedValue(mockUserSession)
        isPast.mockReturnValue(false)
      })

      test('should fail validation if no strategy is set', async () => {
        mockRequest.path = '/exemption/task-list'
        await getServer().app.cache.set(
          mockUserSession.sessionId,
          mockUserSession
        )

        const result = await validateUserSession(mockRequest, mockSession)

        expect(result).toEqual({
          isValid: false
        })
      })
    })
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
