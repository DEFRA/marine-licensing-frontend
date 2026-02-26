import { vi } from 'vitest'
import {
  mockExemption,
  setupTestServer
} from '#tests/integration/shared/test-setup-helpers.js'
import { mockExemption as mockExemptionData } from '#src/server/test-helpers/mocks/exemption.js'
import {
  makeGetRequest,
  makePostRequest
} from '#src/server/test-helpers/server-requests.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import * as authUtils from '#src/server/common/plugins/auth/utils.js'

const mockUserSession = {
  displayName: 'John Doe',
  email: 'john.doe@example.com',
  sessionId: 'test-session-123'
}

describe('declaration controller', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.spyOn(authUtils, 'getUserSession').mockResolvedValue(mockUserSession)
    mockExemption(mockExemptionData)
  })

  describe('GET /exemption/declaration', () => {
    test('Should render declaration page successfully', async () => {
      const { statusCode } = await makeGetRequest({
        url: '/exemption/declaration',
        server: getServer()
      })

      expect(statusCode).toBe(200)
    })
  })

  describe('POST /exemption/declaration', () => {
    beforeEach(() => {
      vi.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({
        payload: {
          message: 'success',
          value: {
            applicationReference: 'APP-123456',
            submittedAt: '2025-01-01T10:00:00.000Z'
          }
        }
      })
    })

    test('Should submit exemption and redirect to confirmation page after clearing exemption cache', async () => {
      const { clearExemptionCache } = mockExemption(mockExemptionData)
      const { statusCode, headers } = await makePostRequest({
        url: '/exemption/declaration',
        server: getServer()
      })

      expect(statusCode).toBe(302)
      expect(headers.location).toBe(
        '/exemption/confirmation?applicationReference=APP-123456'
      )
      expect(authRequests.authenticatedPostRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/exemption/submit',
        {
          id: mockExemptionData.id,
          userName: mockUserSession.displayName,
          userEmail: mockUserSession.email
        }
      )
      expect(clearExemptionCache).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object)
      )
    })

    test('Should handle API errors gracefully', async () => {
      const { clearExemptionCache } = mockExemption(mockExemptionData)
      vi.spyOn(authRequests, 'authenticatedPostRequest').mockRejectedValue(
        new Error('API Error')
      )

      const { statusCode } = await makePostRequest({
        url: '/exemption/declaration',
        server: getServer()
      })

      expect(statusCode).toBe(400)
      expect(clearExemptionCache).not.toHaveBeenCalled()
    })

    test('Should handle unexpected API response format', async () => {
      const { clearExemptionCache } = mockExemption(mockExemptionData)
      vi.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({
        payload: { message: 'error', error: 'Something went wrong' }
      })

      const { statusCode } = await makePostRequest({
        url: '/exemption/declaration',
        server: getServer()
      })

      expect(statusCode).toBe(400)
      expect(clearExemptionCache).not.toHaveBeenCalled()
    })

    test('Should handle API response with missing value', async () => {
      const { clearExemptionCache } = mockExemption(mockExemptionData)
      vi.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({
        payload: { message: 'success', value: null }
      })

      const { statusCode } = await makePostRequest({
        url: '/exemption/declaration',
        server: getServer()
      })

      expect(statusCode).toBe(400)
      expect(clearExemptionCache).not.toHaveBeenCalled()
    })

    test('Should error if user session is missing', async () => {
      vi.spyOn(authUtils, 'getUserSession').mockResolvedValue(null)

      const { statusCode } = await makePostRequest({
        url: '/exemption/declaration',
        server: getServer()
      })

      expect(statusCode).toBe(400)
    })

    test('Should error if user session has missing displayName', async () => {
      vi.spyOn(authUtils, 'getUserSession').mockResolvedValue({
        displayName: null,
        email: 'test@example.com'
      })

      const { statusCode } = await makePostRequest({
        url: '/exemption/declaration',
        server: getServer()
      })

      expect(statusCode).toBe(400)
    })

    test('Should error if user session has missing email', async () => {
      vi.spyOn(authUtils, 'getUserSession').mockResolvedValue({
        displayName: 'Test User',
        email: null
      })

      const { statusCode } = await makePostRequest({
        url: '/exemption/declaration',
        server: getServer()
      })

      expect(statusCode).toBe(400)
    })

    test('Should handle getUserSession throwing an error', async () => {
      vi.spyOn(authUtils, 'getUserSession')
        .mockResolvedValueOnce(mockUserSession) // used by server prehandler
        .mockRejectedValueOnce(new Error('Session retrieval failed')) // used by controller

      const { statusCode } = await makePostRequest({
        url: '/exemption/declaration',
        server: getServer()
      })

      expect(statusCode).toBe(400)
    })
  })
})
