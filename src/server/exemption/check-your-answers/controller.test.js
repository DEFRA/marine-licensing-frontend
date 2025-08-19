import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { createServer } from '~/src/server/index.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'
import * as authUtils from '~/src/server/common/plugins/auth/utils.js'
import * as reviewUtils from '~/src/server/exemption/site-details/review-site-details/utils.js'

const mockUserSession = {
  displayName: 'John Doe',
  email: 'john.doe@example.com',
  sessionId: 'test-session-123'
}

describe('check your answers controller', () => {
  let server
  let getExemptionCacheSpy

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    jest.resetAllMocks()

    jest
      .spyOn(authRequests, 'authenticatedGetRequest')
      .mockResolvedValue({ payload: { value: mockExemption } })

    jest.spyOn(authUtils, 'getUserSession').mockResolvedValue(mockUserSession)

    getExemptionCacheSpy = jest
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('POST /exemption/check-your-answers', () => {
    beforeEach(() => {
      jest.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({
        payload: {
          message: 'success',
          value: {
            applicationReference: 'APP-123456',
            submittedAt: '2025-01-01T10:00:00.000Z'
          }
        }
      })
    })

    test('Should submit exemption and redirect to confirmation page', async () => {
      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(302)
      expect(headers.location).toBe(
        '/exemption/confirmation?applicationReference=APP-123456'
      )
      expect(authRequests.authenticatedPostRequest).toHaveBeenCalledWith(
        expect.any(Object),
        '/exemption/submit',
        {
          id: mockExemption.id,
          userName: mockUserSession.displayName,
          userEmail: mockUserSession.email
        }
      )
    })

    test('Should throw a 404 if exemption is not found', async () => {
      getExemptionCacheSpy.mockReturnValueOnce({})
      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })
      expect(statusCode).toBe(404)
    })

    test('Should handle API errors gracefully', async () => {
      jest
        .spyOn(authRequests, 'authenticatedPostRequest')
        .mockRejectedValue(new Error('API Error'))

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(400)
    })

    test('Should handle unexpected API response format', async () => {
      jest.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({
        payload: { message: 'error', error: 'Something went wrong' }
      })

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(400)
    })

    test('Should handle API response with missing value', async () => {
      jest.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({
        payload: { message: 'success', value: null }
      })

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(400)
    })

    test('Should redirect even with missing applicationReference when value exists', async () => {
      jest.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({
        payload: { message: 'success', value: {} }
      })

      const { statusCode, headers } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(302)
      expect(headers.location).toBe(
        '/exemption/confirmation?applicationReference=undefined'
      )
    })

    test('Should handle API response with wrong message type', async () => {
      jest.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({
        payload: {
          message: 'pending',
          value: { applicationReference: 'APP-123' }
        }
      })

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(400)
    })

    test('Should error if user session is missing', async () => {
      jest.spyOn(authUtils, 'getUserSession').mockResolvedValue(null)

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(400)
    })

    test('Should error if user session has missing displayName', async () => {
      jest.spyOn(authUtils, 'getUserSession').mockResolvedValue({
        displayName: null,
        email: 'test@example.com'
      })

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(400)
    })

    test('Should error if user session has missing email', async () => {
      jest.spyOn(authUtils, 'getUserSession').mockResolvedValue({
        displayName: 'Test User',
        email: null
      })

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(400)
    })

    test('Should error if user session has empty displayName', async () => {
      jest.spyOn(authUtils, 'getUserSession').mockResolvedValue({
        displayName: '',
        email: 'test@example.com'
      })

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(400)
    })

    test('Should error if user session has empty email', async () => {
      jest.spyOn(authUtils, 'getUserSession').mockResolvedValue({
        displayName: 'Test User',
        email: ''
      })

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(400)
    })
  })

  test('Should throw a 404 if exemption is not found', async () => {
    getExemptionCacheSpy.mockReturnValueOnce({})
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(404)
  })

  test('Should throw a 404 if exemption data is not found from server', async () => {
    jest
      .spyOn(authRequests, 'authenticatedGetRequest')
      .mockResolvedValueOnce({ payload: {} })
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(404)
  })

  test('Should throw a 404 if exemption data has no taskList', async () => {
    jest.spyOn(authRequests, 'authenticatedGetRequest').mockResolvedValueOnce({
      payload: {
        value: {
          id: 'test-id'
          // Missing taskList property
        }
      }
    })
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(404)
  })

  test('Should throw a 404 if exemption data value is null', async () => {
    jest.spyOn(authRequests, 'authenticatedGetRequest').mockResolvedValueOnce({
      payload: {
        value: null
      }
    })
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(404)
  })

  test('Should handle API error when fetching exemption data', async () => {
    jest
      .spyOn(authRequests, 'authenticatedGetRequest')
      .mockRejectedValueOnce(new Error('API connection failed'))
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(500)
  })

  test('Should handle malformed API response on GET request', async () => {
    jest.spyOn(authRequests, 'authenticatedGetRequest').mockResolvedValueOnce({
      payload: null
    })
    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(404)
  })

  test('Should render page when exemption has no siteDetails', async () => {
    const exemptionWithoutSiteDetails = {
      ...mockExemption,
      siteDetails: null
    }

    getExemptionCacheSpy.mockReturnValueOnce(exemptionWithoutSiteDetails)

    const { statusCode } = await server.inject({
      method: 'GET',
      url: '/exemption/check-your-answers'
    })
    expect(statusCode).toBe(200)
  })

  describe('Controller error handling edge cases', () => {
    test('Should handle POST request with missing exemption cache', async () => {
      getExemptionCacheSpy.mockReturnValueOnce(null)

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(500)
    })

    test('Should handle GET request with missing exemption cache', async () => {
      getExemptionCacheSpy.mockReturnValueOnce(null)

      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(500)
    })

    test('Should handle getUserSession throwing an error', async () => {
      jest
        .spyOn(authUtils, 'getUserSession')
        .mockRejectedValueOnce(new Error('Session retrieval failed'))

      const { statusCode } = await server.inject({
        method: 'POST',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(400)
    })

    test('Should handle validateAndFetchExemption with network timeout', async () => {
      jest
        .spyOn(authRequests, 'authenticatedGetRequest')
        .mockRejectedValueOnce(new Error('ECONNRESET'))

      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(500)
    })

    test('Should handle file upload processing error and use fallback data', async () => {
      const fileUploadExemption = {
        ...mockExemption,
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'kml',
          uploadedFile: {
            filename: 'test.kml'
          }
        }
      }

      getExemptionCacheSpy.mockReturnValueOnce(fileUploadExemption)

      const mockError = new Error('File processing error')
      const getFileUploadSummaryDataSpy = jest
        .spyOn(reviewUtils, 'getFileUploadSummaryData')
        .mockImplementation(() => {
          throw mockError
        })

      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)
      expect(getFileUploadSummaryDataSpy).toHaveBeenCalledWith(
        fileUploadExemption
      )
      getFileUploadSummaryDataSpy.mockRestore()
    })

    test('Should handle file upload processing error and use Shapefile and Unknown file fallbacks', async () => {
      const shapefileExemption = {
        ...mockExemption,
        siteDetails: {
          coordinatesType: 'file',
          fileUploadType: 'shapefile', // This should trigger 'Shapefile' fallback
          uploadedFile: {
            // No filename property - this should trigger 'Unknown file' fallback
          }
        }
      }

      getExemptionCacheSpy.mockReturnValueOnce(shapefileExemption)

      const mockError = new Error('Shapefile processing error')
      const getFileUploadSummaryDataSpy = jest
        .spyOn(reviewUtils, 'getFileUploadSummaryData')
        .mockImplementation(() => {
          throw mockError
        })

      const { statusCode } = await server.inject({
        method: 'GET',
        url: '/exemption/check-your-answers'
      })

      expect(statusCode).toBe(200)
      expect(getFileUploadSummaryDataSpy).toHaveBeenCalledWith(
        shapefileExemption
      )
      getFileUploadSummaryDataSpy.mockRestore()
    })
  })
})
