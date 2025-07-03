import { jest } from '@jest/globals'
import { isPast } from 'date-fns'
import { validateUserSession } from './validate.js'
import * as authUtils from '~/src/server/common/plugins/auth/utils.js'

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

  beforeEach(() => {
    jest.clearAllMocks()

    mockRequest = {}

    mockSession = {
      sessionId: 'test-session-123'
    }
  })

  test('when user session does not exist', async () => {
    authUtils.getUserSession.mockResolvedValue(null)
    const result = await validateUserSession(mockRequest, mockSession)
    expect(result).toEqual({ isValid: false })
  })

  test('When user session exists and token is valid', async () => {
    const mockUserSession = {
      sessionId: 'test-session-123',
      expiresAt: '2024-12-31T23:59:59.000Z',
      profile: { name: 'Test User' }
    }

    authUtils.getUserSession.mockResolvedValue(mockUserSession)
    isPast.mockReturnValue(false)

    const result = await validateUserSession(mockRequest, mockSession)

    expect(result).toEqual({
      isValid: true,
      credentials: mockUserSession
    })
  })

  test('When token has expired and refresh succeeds', async () => {
    const mockUserSession = {
      sessionId: 'test-session-123',
      expiresAt: '2024-01-01T12:00:00.000Z',
      profile: { name: 'Test User' }
    }

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
    const mockUserSession = {
      sessionId: 'test-session-123',
      expiresAt: '2024-01-01T12:00:00.000Z',
      profile: { name: 'Test User' }
    }

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
})
