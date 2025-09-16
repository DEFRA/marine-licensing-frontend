import { jest } from '@jest/globals'
import { addSeconds } from 'date-fns'
import { setUserSession } from './utils.js'

jest.mock('date-fns', () => ({
  addSeconds: jest.fn()
}))

describe('utils', () => {
  describe('setUserSession', () => {
    let mockRequest
    let mockCache
    let mockCookieAuth

    beforeEach(() => {
      jest.clearAllMocks()

      mockCache = {
        set: jest.fn().mockResolvedValue()
      }

      mockCookieAuth = {
        set: jest.fn()
      }

      const mockExpiryDate = new Date('2024-01-01T12:00:00.000Z')
      addSeconds.mockReturnValue(mockExpiryDate)
    })

    it('should set cookie with session ID', async () => {
      mockRequest = {
        auth: {
          credentials: {
            profile: {
              sessionId: 'test-session-id-123'
            },
            expiresIn: 3600,
            token: 'mock-access-token',
            refreshToken: 'mock-refresh-token'
          },
          strategy: 'oauth',
          isAuthenticated: true
        },
        server: {
          app: {
            cache: mockCache
          }
        },
        cookieAuth: mockCookieAuth
      }
      await setUserSession(mockRequest)

      expect(mockCookieAuth.set).toHaveBeenCalledTimes(1)
      expect(mockCookieAuth.set).toHaveBeenCalledWith({
        sessionId: 'test-session-id-123'
      })
    })

    it('should generate a session ID if the profile does not have one', async () => {
      mockRequest = {
        auth: {
          credentials: {
            expiresIn: 3600,
            profile: {
              token: 'mock-access-token',
              refreshToken: 'mock-refresh-token'
            },
            strategy: 'oauth',
            isAuthenticated: true
          }
        },
        server: {
          app: {
            cache: mockCache
          }
        },
        cookieAuth: mockCookieAuth
      }

      await setUserSession(mockRequest)
      expect(typeof mockCookieAuth.set.mock.calls[0][0].sessionId).toBe(
        'string'
      )
    })
  })
})
