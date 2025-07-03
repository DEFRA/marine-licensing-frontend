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

      const mockExpiryDate = new Date('2024-01-01T12:00:00.000Z')
      addSeconds.mockReturnValue(mockExpiryDate)
    })

    it('should set cookie with session ID', async () => {
      await setUserSession(mockRequest)

      expect(mockCookieAuth.set).toHaveBeenCalledTimes(1)
      expect(mockCookieAuth.set).toHaveBeenCalledWith({
        sessionId: 'test-session-id-123'
      })
    })
  })
})
