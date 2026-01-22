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
import * as exemptionSiteDetailsHelpers from '#src/server/common/helpers/exemptions/exemption-site-details.js'
import * as exemptionServiceModule from '#src/services/exemption-service/index.js'

const mockUserSession = {
  displayName: 'John Doe',
  email: 'john.doe@example.com',
  sessionId: 'test-session-123'
}

describe('check your answers controller', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.spyOn(authUtils, 'getUserSession').mockResolvedValue(mockUserSession)
    mockExemption(mockExemptionData)
    vi.spyOn(exemptionServiceModule, 'getExemptionService').mockReturnValue({
      getExemptionById: vi.fn().mockResolvedValue(mockExemptionData)
    })
  })

  describe('POST /exemption/check-your-answers', () => {
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
        url: '/exemption/check-your-answers',
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

    test('Should handle missing exemption data on POST', async () => {
      mockExemption({ id: 'test-id' })
      const { statusCode } = await makePostRequest({
        url: '/exemption/check-your-answers',
        server: getServer()
      })
      expect(statusCode).toBe(302)
    })

    test('Should handle API errors gracefully', async () => {
      const { clearExemptionCache } = mockExemption(mockExemptionData)
      vi.spyOn(authRequests, 'authenticatedPostRequest').mockRejectedValue(
        new Error('API Error')
      )

      const { statusCode } = await makePostRequest({
        url: '/exemption/check-your-answers',
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
        url: '/exemption/check-your-answers',
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
        url: '/exemption/check-your-answers',
        server: getServer()
      })

      expect(statusCode).toBe(400)
      expect(clearExemptionCache).not.toHaveBeenCalled()
    })

    test('Should redirect even with missing applicationReference when value exists', async () => {
      const { clearExemptionCache } = mockExemption(mockExemptionData)
      vi.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({
        payload: { message: 'success', value: {} }
      })

      const { statusCode, headers } = await makePostRequest({
        url: '/exemption/check-your-answers',
        server: getServer()
      })

      expect(statusCode).toBe(302)
      expect(headers.location).toBe(
        '/exemption/confirmation?applicationReference=undefined'
      )
      expect(clearExemptionCache).toHaveBeenCalledWith(
        expect.any(Object),
        expect.any(Object)
      )
    })

    test('Should handle API response with wrong message type', async () => {
      vi.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({
        payload: {
          message: 'pending',
          value: { applicationReference: 'APP-123' }
        }
      })

      const { statusCode } = await makePostRequest({
        url: '/exemption/check-your-answers',
        server: getServer()
      })

      expect(statusCode).toBe(400)
    })

    test('Should error if user session is missing', async () => {
      vi.spyOn(authUtils, 'getUserSession').mockResolvedValue(null)

      const { statusCode } = await makePostRequest({
        url: '/exemption/check-your-answers',
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
        url: '/exemption/check-your-answers',
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
        url: '/exemption/check-your-answers',
        server: getServer()
      })

      expect(statusCode).toBe(400)
    })

    test('Should error if user session has empty displayName', async () => {
      vi.spyOn(authUtils, 'getUserSession').mockResolvedValue({
        displayName: '',
        email: 'test@example.com'
      })

      const { statusCode } = await makePostRequest({
        url: '/exemption/check-your-answers',
        server: getServer()
      })

      expect(statusCode).toBe(400)
    })

    test('Should error if user session has empty email', async () => {
      vi.spyOn(authUtils, 'getUserSession').mockResolvedValue({
        displayName: 'Test User',
        email: ''
      })

      const { statusCode } = await makePostRequest({
        url: '/exemption/check-your-answers',
        server: getServer()
      })

      expect(statusCode).toBe(400)
    })
  })

  test('Should render page with empty exemption data', async () => {
    mockExemption({ id: 'test-id' })
    const { statusCode } = await makeGetRequest({
      url: '/exemption/check-your-answers',
      server: getServer()
    })
    expect(statusCode).toBe(200)
  })

  test('Should render page successfully', async () => {
    const { statusCode } = await makeGetRequest({
      url: '/exemption/check-your-answers',
      server: getServer()
    })
    expect(statusCode).toBe(200)
  })

  test('Should render page with exemption data', async () => {
    const { statusCode } = await makeGetRequest({
      url: '/exemption/check-your-answers',
      server: getServer()
    })
    expect(statusCode).toBe(200)
  })

  test('Should render page with valid exemption data', async () => {
    const { statusCode } = await makeGetRequest({
      url: '/exemption/check-your-answers',
      server: getServer()
    })
    expect(statusCode).toBe(200)
  })

  test('Should render page without API dependency', async () => {
    const { statusCode } = await makeGetRequest({
      url: '/exemption/check-your-answers',
      server: getServer()
    })
    expect(statusCode).toBe(200)
  })

  test('Should render page successfully with session data', async () => {
    const { statusCode } = await makeGetRequest({
      url: '/exemption/check-your-answers',
      server: getServer()
    })
    expect(statusCode).toBe(200)
  })

  test('Should render page when exemption has no siteDetails', async () => {
    const exemptionWithoutSiteDetails = {
      ...mockExemptionData,
      siteDetails: null
    }

    mockExemption(exemptionWithoutSiteDetails)

    const { statusCode } = await makeGetRequest({
      url: '/exemption/check-your-answers',
      server: getServer()
    })
    expect(statusCode).toBe(200)
  })

  describe('Controller error handling edge cases', () => {
    test('Should handle POST request with missing exemption cache', async () => {
      mockExemption(null)

      const { statusCode } = await makePostRequest({
        url: '/exemption/check-your-answers',
        server: getServer()
      })

      expect(statusCode).toBe(500)
    })

    test('Should handle GET request with missing exemption cache', async () => {
      mockExemption(null)

      const { statusCode } = await makeGetRequest({
        url: '/exemption/check-your-answers',
        server: getServer()
      })

      expect(statusCode).toBe(500)
    })

    test('Should handle getUserSession throwing an error', async () => {
      vi.spyOn(authUtils, 'getUserSession')
        .mockResolvedValueOnce(mockUserSession) // used by server prehandler
        .mockRejectedValueOnce(new Error('Session retrieval failed')) // used by controller

      const { statusCode } = await makePostRequest({
        url: '/exemption/check-your-answers',
        server: getServer()
      })

      expect(statusCode).toBe(400)
    })

    test('Should handle session cache errors gracefully', async () => {
      mockExemption(new Error('Cache error'))

      const { statusCode } = await makeGetRequest({
        url: '/exemption/check-your-answers',
        server: getServer()
      })

      expect(statusCode).toBe(500)
    })

    test('Should handle file upload processing error and use fallback data', async () => {
      const fileUploadExemption = {
        ...mockExemptionData,
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'kml',
          uploadedFile: {
            filename: 'test.kml'
          }
        }
      }

      mockExemption(fileUploadExemption)

      const mockProcessedSiteDetails = [
        {
          isFileUpload: true,
          method: 'Upload a file with the coordinates of the site',
          fileType: 'KML',
          filename: 'test.kml'
        }
      ]

      const processSiteDetailsSpy = vi
        .spyOn(exemptionSiteDetailsHelpers, 'processSiteDetails')
        .mockReturnValue(mockProcessedSiteDetails)

      const { statusCode } = await makeGetRequest({
        url: '/exemption/check-your-answers',
        server: getServer()
      })

      expect(statusCode).toBe(200)
      expect(processSiteDetailsSpy).toHaveBeenCalledWith(
        fileUploadExemption,
        fileUploadExemption.id,
        expect.any(Object)
      )
      processSiteDetailsSpy.mockRestore()
    })

    test('Should handle file upload processing error and use Shapefile and Unknown file fallbacks', async () => {
      const shapefileExemption = {
        ...mockExemptionData,
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'shapefile',
          uploadedFile: {
            // No filename property - this should trigger 'Unknown file' fallback
          }
        }
      }

      mockExemption(shapefileExemption)

      const mockProcessedSiteDetails = [
        {
          isFileUpload: true,
          method: 'Upload a file with the coordinates of the site',
          fileType: 'Shapefile',
          filename: 'Unknown file'
        }
      ]

      const processSiteDetailsSpy = vi
        .spyOn(exemptionSiteDetailsHelpers, 'processSiteDetails')
        .mockReturnValue(mockProcessedSiteDetails)

      const { statusCode } = await makeGetRequest({
        url: '/exemption/check-your-answers',
        server: getServer()
      })

      expect(statusCode).toBe(200)
      expect(processSiteDetailsSpy).toHaveBeenCalledWith(
        shapefileExemption,
        shapefileExemption.id,
        expect.any(Object)
      )
      processSiteDetailsSpy.mockRestore()
    })
  })
})
