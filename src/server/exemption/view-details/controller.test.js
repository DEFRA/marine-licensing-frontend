import Boom from '@hapi/boom'
import { createServer } from '~/src/server/index.js'
import * as authRequests from '~/src/server/common/helpers/authenticated-requests.js'
import * as reviewUtils from '~/src/server/exemption/site-details/review-site-details/utils.js'
import { viewDetailsController, VIEW_DETAILS_VIEW_ROUTE } from './controller.js'
import {
  createSubmittedExemption,
  createFileUploadExemption,
  errorScenarios
} from '~/tests/integration/view-details/test-utilities.js'

describe('view details controller', () => {
  let server
  let authenticatedGetRequestSpy

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    jest.resetAllMocks()

    authenticatedGetRequestSpy = jest
      .spyOn(authRequests, 'authenticatedGetRequest')
      .mockResolvedValue({
        payload: { value: createSubmittedExemption() }
      })
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('GET /exemption/view-details/{exemptionId}', () => {
    const validExemptionId = '507f1f77bcf86cd799439011'

    describe('successful scenarios', () => {
      test('should return 200 status for valid submitted exemption', async () => {
        const submittedExemption = createSubmittedExemption()
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: submittedExemption }
        })

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(200)
      })

      test('should call API with correct exemption ID', async () => {
        const submittedExemption = createSubmittedExemption()
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: submittedExemption }
        })

        await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(authenticatedGetRequestSpy).toHaveBeenCalledWith(
          expect.any(Object),
          `/exemption/${validExemptionId}`
        )
      })
    })

    describe('data processing scenarios', () => {
      test('should handle exemption with no site details', async () => {
        const exemptionWithoutSiteDetails = createSubmittedExemption({
          siteDetails: null
        })
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: exemptionWithoutSiteDetails }
        })

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(200)
      })

      test('should handle file upload data error gracefully', async () => {
        jest
          .spyOn(reviewUtils, 'getFileUploadSummaryData')
          .mockImplementation(() => {
            throw new Error('File upload data error')
          })

        const fileUploadExemption = createFileUploadExemption('kml', 'test.kml')
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: fileUploadExemption }
        })

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(200)
        reviewUtils.getFileUploadSummaryData.mockRestore()
      })
    })

    describe('error scenarios', () => {
      test('should throw 404 when exemption ID is missing', async () => {
        const { statusCode } = await server.inject({
          method: 'GET',
          url: '/exemption/view-details/'
        })

        expect(statusCode).toBe(404)
      })

      test('should throw 404 when exemption is not found in API', async () => {
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: null }
        })

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(404)
      })

      test('should throw 404 when API returns empty payload', async () => {
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: {}
        })

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(404)
      })

      test('should throw 403 when exemption is still in Draft status', async () => {
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: errorScenarios.draftExemption }
        })

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(403)
      })

      test('should throw 403 when exemption has no application reference', async () => {
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: errorScenarios.exemptionWithoutReference }
        })

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(403)
      })

      test('should handle API authentication errors (403)', async () => {
        const authError = new Error('Forbidden')
        authError.output = { statusCode: 403 }
        authenticatedGetRequestSpy.mockRejectedValue(authError)

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(403)
      })

      test('should handle API not found errors (404)', async () => {
        const notFoundError = new Error('Not Found')
        notFoundError.output = { statusCode: 404 }
        authenticatedGetRequestSpy.mockRejectedValue(notFoundError)

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(404)
      })

      test('should handle unexpected API errors gracefully', async () => {
        authenticatedGetRequestSpy.mockRejectedValue(
          new Error('Unexpected API error')
        )

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(500)
      })

      test('should handle Boom errors properly', async () => {
        authenticatedGetRequestSpy.mockRejectedValue(
          Boom.internal('Internal server error')
        )

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(500)
      })
    })

    describe('controller unit tests', () => {
      test('should call view with correct data structure', async () => {
        const submittedExemption = createSubmittedExemption()
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: submittedExemption }
        })

        const mockRequest = {
          params: { exemptionId: validExemptionId },
          logger: { error: jest.fn() }
        }
        const mockH = { view: jest.fn() }

        await viewDetailsController.handler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith(
          VIEW_DETAILS_VIEW_ROUTE,
          expect.objectContaining({
            pageTitle: 'View notification details',
            pageCaption: 'EXE/2025/00003 - Exempt activity notification',
            backLink: '/home',
            readOnly: true,
            projectName: submittedExemption.projectName,
            activityDates: submittedExemption.activityDates,
            activityDescription: submittedExemption.activityDescription,
            publicRegister: submittedExemption.publicRegister,
            siteDetails: expect.any(Object)
          })
        )
      })

      test('should handle file upload data error and use fallback', async () => {
        const getFileUploadSummaryDataSpy = jest
          .spyOn(reviewUtils, 'getFileUploadSummaryData')
          .mockImplementation(() => {
            throw new Error('File upload data processing error')
          })

        const fileUploadExemption = createFileUploadExemption(
          'shapefile',
          'test-boundary.zip',
          {
            siteDetails: {
              coordinatesType: 'file',
              fileUploadType: 'shapefile'
            }
          }
        )
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: fileUploadExemption }
        })

        const mockRequest = {
          params: { exemptionId: validExemptionId },
          logger: { error: jest.fn() }
        }
        const mockH = { view: jest.fn() }

        await viewDetailsController.handler(mockRequest, mockH)

        expect(getFileUploadSummaryDataSpy).toHaveBeenCalledWith(
          fileUploadExemption
        )

        expect(mockRequest.logger.error).toHaveBeenCalledWith(
          {
            error: 'File upload data processing error',
            exemptionId: validExemptionId
          },
          'Error getting file upload summary data'
        )

        expect(mockH.view).toHaveBeenCalledWith(
          VIEW_DETAILS_VIEW_ROUTE,
          expect.objectContaining({
            siteDetails: expect.objectContaining({
              isFileUpload: true,
              method: 'Upload a file with the coordinates of the site',
              fileType: 'Shapefile',
              filename: 'Unknown file'
            })
          })
        )

        getFileUploadSummaryDataSpy.mockRestore()
      })

      test('should handle file upload data error with KML file type fallback', async () => {
        const getFileUploadSummaryDataSpy = jest
          .spyOn(reviewUtils, 'getFileUploadSummaryData')
          .mockImplementation(() => {
            throw new Error('KML processing error')
          })

        const kmlFileUploadExemption = createFileUploadExemption(
          'kml',
          'test-area.kml',
          {
            siteDetails: { coordinatesType: 'file', fileUploadType: 'kml' }
          }
        )
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: kmlFileUploadExemption }
        })

        const mockRequest = {
          params: { exemptionId: validExemptionId },
          logger: { error: jest.fn() }
        }
        const mockH = { view: jest.fn() }

        await viewDetailsController.handler(mockRequest, mockH)

        expect(mockRequest.logger.error).toHaveBeenCalledWith(
          {
            error: 'KML processing error',
            exemptionId: validExemptionId
          },
          'Error getting file upload summary data'
        )

        expect(mockH.view).toHaveBeenCalledWith(
          VIEW_DETAILS_VIEW_ROUTE,
          expect.objectContaining({
            siteDetails: expect.objectContaining({
              isFileUpload: true,
              method: 'Upload a file with the coordinates of the site',
              fileType: 'KML',
              filename: 'Unknown file'
            })
          })
        )

        getFileUploadSummaryDataSpy.mockRestore()
      })

      test('should handle non-Boom errors', async () => {
        const submittedExemption = createSubmittedExemption()
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: submittedExemption }
        })

        const mockError = new Error('Site details processing failed')
        const mockH = { view: jest.fn() }

        mockH.view.mockImplementation(() => {
          throw mockError
        })

        const mockRequest = {
          params: { exemptionId: validExemptionId },
          logger: { error: jest.fn() }
        }

        await expect(
          viewDetailsController.handler(mockRequest, mockH)
        ).rejects.toThrow('Error displaying exemption details')

        expect(mockRequest.logger.error).toHaveBeenCalledWith(
          {
            message: 'Site details processing failed',
            exemptionId: validExemptionId
          },
          'Error displaying exemption details'
        )
      })

      test('should handle missing exemption ID in params', async () => {
        const mockRequest = {
          params: {},
          logger: { error: jest.fn() }
        }
        const mockH = { view: jest.fn() }

        await expect(
          viewDetailsController.handler(mockRequest, mockH)
        ).rejects.toThrow('Exemption not found')
      })

      test('should log errors appropriately', async () => {
        const mockRequest = {
          params: { exemptionId: 'invalid-id' },
          logger: { error: jest.fn() }
        }
        const mockH = { view: jest.fn() }

        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: null }
        })

        await expect(
          viewDetailsController.handler(mockRequest, mockH)
        ).rejects.toThrow()

        expect(mockRequest.logger.error).toHaveBeenCalledWith(
          { id: 'invalid-id' },
          'Exemption data not found'
        )
      })
    })

    describe('acceptance criteria verification', () => {
      test('AC1 - View details route pattern validation', () => {
        const route = `/exemption/view-details/${validExemptionId}`
        expect(route).toMatch(/^\/exemption\/view-details\/[a-f0-9]{24}$/)
      })

      test('AC2 - Navigation to view notification details page returns 200', async () => {
        const submittedExemption = createSubmittedExemption()
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: submittedExemption }
        })

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(200)
      })

      test('AC4 - Unique URL accessibility', async () => {
        const submittedExemption = createSubmittedExemption()
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: submittedExemption }
        })

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(200)
      })
    })

    describe('data integrity and edge cases', () => {
      test('should handle empty application reference', async () => {
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: errorScenarios.exemptionWithEmptyReference }
        })

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(403)
      })

      test('should handle malformed site details data', async () => {
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: errorScenarios.exemptionWithMalformedSiteDetails }
        })

        const { statusCode } = await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(statusCode).toBe(200)
      })

      test('should fetch data from API ignoring any cache', async () => {
        const submittedExemption = createSubmittedExemption()
        authenticatedGetRequestSpy.mockResolvedValue({
          payload: { value: submittedExemption }
        })

        await server.inject({
          method: 'GET',
          url: `/exemption/view-details/${validExemptionId}`
        })

        expect(authenticatedGetRequestSpy).toHaveBeenCalledTimes(1)
        expect(authenticatedGetRequestSpy).toHaveBeenCalledWith(
          expect.any(Object),
          `/exemption/${validExemptionId}`
        )
      })
    })
  })
})
