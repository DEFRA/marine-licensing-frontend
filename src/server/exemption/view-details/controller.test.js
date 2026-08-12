import { vi } from 'vitest'
import Boom from '@hapi/boom'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import * as exemptionSiteDetailsHelpers from '#src/server/common/helpers/exemptions/exemption-site-details.js'
import * as siteLocationDataHelpers from '#src/server/common/helpers/site-location-data.js'
import { getExemptionService } from '#src/services/exemption-service/index.js'
import { viewDetailsController, VIEW_DETAILS_VIEW_ROUTE } from './controller.js'
import {
  createSubmittedExemption,
  createFileUploadExemption,
  errorScenarios
} from '#tests/integration/view-details/test-utilities.js'

import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { getAuthProvider } from '#src/server/common/helpers/authenticated-requests.js'

vi.mock('~/src/services/exemption-service/index.js')
vi.mock('~/src/server/common/helpers/authenticated-requests.js', () => ({
  getAuthProvider: vi.fn().mockReturnValue('defra-id')
}))
vi.mock('~/src/server/common/helpers/site-location-data.js', () => ({
  buildSiteLocationData: vi.fn().mockReturnValue(null)
}))

describe('view details controller', () => {
  const getServer = setupTestServer()
  let mockExemptionService

  beforeEach(() => {
    mockExemptionService = {
      getExemptionById: vi.fn().mockResolvedValue(createSubmittedExemption()),
      getPublicExemptionById: vi
        .fn()
        .mockResolvedValue(createSubmittedExemption())
    }

    vi.mocked(getExemptionService).mockReturnValue(mockExemptionService)
  })

  describe('GET /exemption/view-details/{exemptionId}', () => {
    const validExemptionId = '507f1f77bcf86cd799439011'

    describe('successful scenarios', () => {
      test('should return 200 status for valid submitted exemption', async () => {
        const submittedExemption = createSubmittedExemption()
        mockExemptionService.getExemptionById.mockResolvedValue(
          submittedExemption
        )

        const { statusCode } = await makeGetRequest({
          url: `/exemption/view-details/${validExemptionId}`,
          server: getServer()
        })

        expect(statusCode).toBe(200)
      })

      test('should call exemption service with correct exemption ID', async () => {
        const submittedExemption = createSubmittedExemption()
        mockExemptionService.getExemptionById.mockResolvedValue(
          submittedExemption
        )

        await makeGetRequest({
          url: `/exemption/view-details/${validExemptionId}`,
          server: getServer()
        })

        expect(getExemptionService).toHaveBeenCalledWith(expect.any(Object))
        expect(mockExemptionService.getExemptionById).toHaveBeenCalledWith(
          validExemptionId
        )
      })
    })

    describe('data processing scenarios', () => {
      test('should handle exemption with no site details', async () => {
        const exemptionWithoutSiteDetails = createSubmittedExemption({
          siteDetails: null
        })
        mockExemptionService.getExemptionById.mockResolvedValue(
          exemptionWithoutSiteDetails
        )

        const { statusCode } = await makeGetRequest({
          url: `/exemption/view-details/${validExemptionId}`,
          server: getServer()
        })

        expect(statusCode).toBe(200)
      })

      test('should handle file upload data error gracefully', async () => {
        const fileUploadExemption = createFileUploadExemption('kml', 'test.kml')
        mockExemptionService.getExemptionById.mockResolvedValue(
          fileUploadExemption
        )

        const mockProcessedSiteDetails = {
          isFileUpload: true,
          method: 'File upload',
          fileType: 'KML',
          filename: 'test.kml'
        }

        const processSiteDetailsSpy = vi
          .spyOn(exemptionSiteDetailsHelpers, 'processSiteDetails')
          .mockReturnValue(mockProcessedSiteDetails)

        const { statusCode } = await makeGetRequest({
          url: `/exemption/view-details/${validExemptionId}`,
          server: getServer()
        })

        expect(statusCode).toBe(200)
        processSiteDetailsSpy.mockRestore()
      })
    })

    describe('error scenarios', () => {
      test('should throw 404 when exemption ID is missing', async () => {
        const { statusCode } = await makeGetRequest({
          url: '/exemption/view-details/',
          server: getServer()
        })

        expect(statusCode).toBe(404)
      })

      test('should throw 500 when exemption is not found in API', async () => {
        mockExemptionService.getExemptionById.mockRejectedValue(
          new Error('Exemption data not found')
        )

        const { statusCode } = await makeGetRequest({
          url: `/exemption/view-details/${validExemptionId}`,
          server: getServer()
        })

        expect(statusCode).toBe(500)
      })

      test('should throw 500 when API returns empty payload', async () => {
        mockExemptionService.getExemptionById.mockRejectedValue(
          new Error('Exemption data not found')
        )

        const { statusCode } = await makeGetRequest({
          url: `/exemption/view-details/${validExemptionId}`,
          server: getServer()
        })

        expect(statusCode).toBe(500)
      })

      test('should throw 403 when exemption is still in Draft status', async () => {
        mockExemptionService.getExemptionById.mockResolvedValue(
          errorScenarios.draftExemption
        )

        const { statusCode } = await makeGetRequest({
          url: `/exemption/view-details/${validExemptionId}`,
          server: getServer()
        })

        expect(statusCode).toBe(403)
      })

      test('should throw 403 when exemption has no application reference', async () => {
        mockExemptionService.getExemptionById.mockResolvedValue(
          errorScenarios.exemptionWithoutReference
        )

        const { statusCode } = await makeGetRequest({
          url: `/exemption/view-details/${validExemptionId}`,
          server: getServer()
        })

        expect(statusCode).toBe(403)
      })

      test('should throw any 403 returned from the backend when the public view has been requested by the exemption does not have consent to be public', async () => {
        const authError = Boom.forbidden('Forbidden')
        mockExemptionService.getPublicExemptionById.mockRejectedValue(authError)

        const { statusCode } = await makeGetRequest({
          url: `/exemption/view-public-details/${validExemptionId}`,
          server: getServer()
        })

        expect(statusCode).toBe(403)
      })

      test('should handle API authentication errors (403)', async () => {
        const authError = Boom.forbidden('Forbidden')
        mockExemptionService.getExemptionById.mockRejectedValue(authError)

        const { statusCode } = await makeGetRequest({
          url: `/exemption/view-details/${validExemptionId}`,
          server: getServer()
        })

        expect(statusCode).toBe(403)
      })

      test('should handle API not found errors (404)', async () => {
        const notFoundError = Boom.notFound('Not Found')
        mockExemptionService.getExemptionById.mockRejectedValue(notFoundError)

        const { statusCode } = await makeGetRequest({
          url: `/exemption/view-details/${validExemptionId}`,
          server: getServer()
        })

        expect(statusCode).toBe(404)
      })

      test('should handle unexpected API errors gracefully', async () => {
        mockExemptionService.getExemptionById.mockRejectedValue(
          new Error('Unexpected API error')
        )

        const { statusCode } = await makeGetRequest({
          url: `/exemption/view-details/${validExemptionId}`,
          server: getServer()
        })

        expect(statusCode).toBe(500)
      })

      test('should handle Boom errors properly', async () => {
        mockExemptionService.getExemptionById.mockRejectedValue(
          Boom.internal('Internal server error')
        )

        const { statusCode } = await makeGetRequest({
          url: `/exemption/view-details/${validExemptionId}`,
          server: getServer()
        })

        expect(statusCode).toBe(500)
      })
    })

    describe('controller unit tests', () => {
      test('should call view with correct data structure for applicant', async () => {
        const submittedExemption = createSubmittedExemption({
          organisation: { name: 'Dredging Co' }
        })
        const mockExemptionServiceInstance = {
          getExemptionById: vi.fn().mockResolvedValue(submittedExemption)
        }

        vi.mocked(getExemptionService).mockReturnValue(
          mockExemptionServiceInstance
        )

        vi.mocked(
          siteLocationDataHelpers.buildSiteLocationData
        ).mockReturnValue(null)

        const mockRequest = {
          path: '/exemption/view-details/:exemptionId',
          params: { exemptionId: validExemptionId },
          logger: { error: vi.fn() }
        }
        const mockH = { view: vi.fn() }

        await viewDetailsController.handler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith(
          VIEW_DETAILS_VIEW_ROUTE,
          expect.objectContaining({
            isApplicantView: true,
            pageTitle: submittedExemption.projectName,
            pageCaption: 'EXE/2025/00003',
            backLink: '/projects',
            isReadOnly: true,
            projectName: submittedExemption.projectName,
            activityDates: submittedExemption.activityDates,
            activityDescription: submittedExemption.activityDescription,
            publicRegister: submittedExemption.publicRegister,
            siteDetails: expect.any(Array),
            siteLocationData: null
          })
        )
      })

      test('should pass statusTagClass for active exemption', async () => {
        const activeExemption = createSubmittedExemption({
          status: 'Active'
        })
        const mockExemptionServiceInstance = {
          getExemptionById: vi.fn().mockResolvedValue(activeExemption)
        }

        vi.mocked(getExemptionService).mockReturnValue(
          mockExemptionServiceInstance
        )
        vi.mocked(getAuthProvider).mockReturnValue('entra-id')

        const mockRequest = {
          path: '/view-details/:exemptionId',
          params: { exemptionId: validExemptionId },
          logger: { error: vi.fn() }
        }
        const mockH = { view: vi.fn() }

        await viewDetailsController.handler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith(
          VIEW_DETAILS_VIEW_ROUTE,
          expect.objectContaining({
            statusTagClass: 'govuk-tag--green'
          })
        )
      })

      test('should pass statusTagClass for withdrawn exemption', async () => {
        const withdrawnExemption = createSubmittedExemption({
          status: 'Withdrawn',
          withdrawnAt: '2026-02-16T14:24:04.169Z'
        })
        const mockExemptionServiceInstance = {
          getExemptionById: vi.fn().mockResolvedValue(withdrawnExemption)
        }

        vi.mocked(getExemptionService).mockReturnValue(
          mockExemptionServiceInstance
        )
        vi.mocked(getAuthProvider).mockReturnValue('entra-id')

        const mockRequest = {
          path: '/view-details/:exemptionId',
          params: { exemptionId: validExemptionId },
          logger: { error: vi.fn() }
        }
        const mockH = { view: vi.fn() }

        await viewDetailsController.handler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith(
          VIEW_DETAILS_VIEW_ROUTE,
          expect.objectContaining({
            statusTagClass: 'govuk-tag--grey',
            withdrawnAt: '2026-02-16T14:24:04.169Z'
          })
        )
      })

      test('should call view with correct data structure for internal user', async () => {
        const submittedExemption = createSubmittedExemption({
          whoExemptionIsFor: 'Dave Barnett'
        })
        const mockExemptionServiceInstance = {
          getExemptionById: vi.fn().mockResolvedValue(submittedExemption)
        }

        vi.mocked(getExemptionService).mockReturnValue(
          mockExemptionServiceInstance
        )

        vi.mocked(
          siteLocationDataHelpers.buildSiteLocationData
        ).mockReturnValue(null)

        const mockRequest = {
          path: '/view-details/:exemptionId',
          params: { exemptionId: validExemptionId },
          logger: { error: vi.fn() }
        }
        const mockH = { view: vi.fn() }
        vi.mocked(getAuthProvider).mockReturnValue('entra-id')

        await viewDetailsController.handler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith(
          VIEW_DETAILS_VIEW_ROUTE,
          expect.objectContaining({
            isApplicantView: false,
            pageTitle: submittedExemption.projectName,
            pageCaption: 'EXE/2025/00003',
            backLink: null,
            isReadOnly: true,
            projectName: submittedExemption.projectName,
            activityDates: submittedExemption.activityDates,
            activityDescription: submittedExemption.activityDescription,
            publicRegister: submittedExemption.publicRegister,
            siteDetails: expect.any(Array),
            siteLocationData: null,
            whoExemptionIsFor: 'Dave Barnett'
          })
        )
      })

      test('should omit the back link if user if accessing the internal user page', async () => {
        const submittedExemption = createSubmittedExemption()
        const mockExemptionServiceInstance = {
          getExemptionById: vi.fn().mockResolvedValue(submittedExemption)
        }

        vi.mocked(getExemptionService).mockReturnValue(
          mockExemptionServiceInstance
        )
        vi.mocked(getAuthProvider).mockReturnValue('entra-id')

        const mockRequest = {
          path: '/view-details/:exemptionId',
          params: { exemptionId: validExemptionId },
          logger: { error: vi.fn() },
          auth: { credentials: { strategy: 'entra-id' } }
        }
        const mockH = { view: vi.fn() }

        await viewDetailsController.handler(mockRequest, mockH)

        expect(mockH.view.mock.calls[0][1].backLink).toBeNull()
      })

      test('should pass whoExemptionIsFor as undefined if the API does not return it', async () => {
        const submittedExemption = createSubmittedExemption({
          whoExemptionIsFor: undefined
        })
        const mockExemptionServiceInstance = {
          getExemptionById: vi.fn().mockResolvedValue(submittedExemption)
        }

        vi.mocked(getExemptionService).mockReturnValue(
          mockExemptionServiceInstance
        )
        vi.mocked(getAuthProvider).mockReturnValue('entra-id')

        const mockRequest = {
          path: '/view-details/:exemptionId',
          params: { exemptionId: validExemptionId },
          logger: { error: vi.fn() },
          auth: { credentials: { strategy: 'entra-id' } }
        }
        const mockH = { view: vi.fn() }

        await viewDetailsController.handler(mockRequest, mockH)
        expect(mockH.view.mock.calls[0][1].whoExemptionIsFor).toBeUndefined()
      })

      describe('whoExemptionIsFor for the applicant view', () => {
        const handleApplicantRequest = async (exemption) => {
          vi.mocked(getExemptionService).mockReturnValue({
            getExemptionById: vi.fn().mockResolvedValue(exemption)
          })

          const mockRequest = {
            path: '/exemption/view-details/:exemptionId',
            params: { exemptionId: validExemptionId },
            logger: { error: vi.fn() },
            auth: { credentials: { strategy: 'defra-id' } }
          }
          const mockH = { view: vi.fn() }

          await viewDetailsController.handler(mockRequest, mockH)
          return mockH.view.mock.calls[0][1]
        }

        test('should pass through the value returned by the API', async () => {
          const viewData = await handleApplicantRequest(
            createSubmittedExemption({ whoExemptionIsFor: 'Dave Barnett' })
          )

          expect(viewData.isApplicantView).toBe(true)
          expect(viewData.whoExemptionIsFor).toBe('Dave Barnett')
        })

        test('should pass whoExemptionIsFor as undefined when the API does not return it', async () => {
          const viewData = await handleApplicantRequest(
            createSubmittedExemption({ whoExemptionIsFor: undefined })
          )

          expect(viewData.whoExemptionIsFor).toBeUndefined()
        })
      })

      test('should handle file upload data error and use fallback', async () => {
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
        const mockExemptionServiceInstance = {
          getExemptionById: vi.fn().mockResolvedValue(fileUploadExemption)
        }

        vi.mocked(getExemptionService).mockReturnValue(
          mockExemptionServiceInstance
        )

        const mockProcessedSiteDetails = {
          isFileUpload: true,
          method: 'File upload',
          fileType: 'Shapefile',
          filename: 'Unknown file'
        }

        const processSiteDetailsSpy = vi
          .spyOn(exemptionSiteDetailsHelpers, 'processSiteDetails')
          .mockReturnValue(mockProcessedSiteDetails)

        const mockSiteLocationData = {
          multipleSiteDetails: 'No',
          method: 'File upload',
          isFileUpload: true,
          fileType: 'Shapefile',
          filename: 'test-boundary.zip'
        }

        vi.mocked(
          siteLocationDataHelpers.buildSiteLocationData
        ).mockReturnValue(mockSiteLocationData)

        const mockRequest = {
          path: '/exemption/view-details/:exemptionId',
          params: { exemptionId: validExemptionId },
          logger: { error: vi.fn() }
        }
        const mockH = { view: vi.fn() }

        await viewDetailsController.handler(mockRequest, mockH)

        expect(processSiteDetailsSpy).toHaveBeenCalledWith(
          fileUploadExemption,
          validExemptionId,
          expect.any(Object)
        )

        expect(
          vi.mocked(siteLocationDataHelpers.buildSiteLocationData)
        ).toHaveBeenCalledWith(
          fileUploadExemption.multipleSiteDetails,
          fileUploadExemption.siteDetails
        )

        expect(mockH.view).toHaveBeenCalledWith(
          VIEW_DETAILS_VIEW_ROUTE,
          expect.objectContaining({
            siteDetails: expect.objectContaining({
              isFileUpload: true,
              method: 'File upload',
              fileType: 'Shapefile',
              filename: 'Unknown file'
            }),
            siteLocationData: mockSiteLocationData
          })
        )

        processSiteDetailsSpy.mockRestore()
      })

      test('should handle file upload data error with KML file type fallback', async () => {
        const kmlFileUploadExemption = createFileUploadExemption(
          'kml',
          'test-area.kml',
          {
            siteDetails: { coordinatesType: 'file', fileUploadType: 'kml' }
          }
        )
        const mockExemptionServiceInstance = {
          getExemptionById: vi.fn().mockResolvedValue(kmlFileUploadExemption)
        }

        vi.mocked(getExemptionService).mockReturnValue(
          mockExemptionServiceInstance
        )

        const mockProcessedSiteDetails = {
          isFileUpload: true,
          method: 'File upload',
          fileType: 'KML',
          filename: 'Unknown file'
        }

        const processSiteDetailsSpy = vi
          .spyOn(exemptionSiteDetailsHelpers, 'processSiteDetails')
          .mockReturnValue(mockProcessedSiteDetails)

        const mockSiteLocationData = {
          multipleSiteDetails: 'No',
          method: 'File upload',
          isFileUpload: true,
          fileType: 'KML',
          filename: 'test-area.kml'
        }

        vi.mocked(
          siteLocationDataHelpers.buildSiteLocationData
        ).mockReturnValue(mockSiteLocationData)

        const mockRequest = {
          path: '/exemption/view-details/:exemptionId',
          params: { exemptionId: validExemptionId },
          logger: { error: vi.fn() }
        }
        const mockH = { view: vi.fn() }

        await viewDetailsController.handler(mockRequest, mockH)

        expect(processSiteDetailsSpy).toHaveBeenCalledWith(
          kmlFileUploadExemption,
          validExemptionId,
          expect.any(Object)
        )

        expect(
          vi.mocked(siteLocationDataHelpers.buildSiteLocationData)
        ).toHaveBeenCalledWith(
          kmlFileUploadExemption.multipleSiteDetails,
          kmlFileUploadExemption.siteDetails
        )

        expect(mockH.view).toHaveBeenCalledWith(
          VIEW_DETAILS_VIEW_ROUTE,
          expect.objectContaining({
            siteDetails: expect.objectContaining({
              isFileUpload: true,
              method: 'File upload',
              fileType: 'KML',
              filename: 'Unknown file'
            }),
            siteLocationData: mockSiteLocationData
          })
        )

        processSiteDetailsSpy.mockRestore()
      })

      test('should handle non-Boom errors', async () => {
        const submittedExemption = createSubmittedExemption()
        const mockExemptionServiceInstance = {
          getExemptionById: vi.fn().mockResolvedValue(submittedExemption)
        }

        vi.mocked(getExemptionService).mockReturnValue(
          mockExemptionServiceInstance
        )

        const mockError = new Error('Site details processing failed')
        const mockH = { view: vi.fn() }

        mockH.view.mockImplementation(() => {
          throw mockError
        })

        const mockRequest = {
          path: '/exemption/view-details/:exemptionId',
          params: { exemptionId: validExemptionId },
          logger: { error: vi.fn() }
        }

        await expect(
          viewDetailsController.handler(mockRequest, mockH)
        ).rejects.toThrow('Error displaying exemption details')

        expect(mockRequest.logger.error).toHaveBeenCalledWith(
          mockError,
          'Error displaying exemption details'
        )
      })

      test('should handle missing exemption ID in params', async () => {
        const mockExemptionServiceInstance = {
          getExemptionById: vi
            .fn()
            .mockRejectedValue(new Error('Exemption not found'))
        }

        vi.mocked(getExemptionService).mockReturnValue(
          mockExemptionServiceInstance
        )

        const mockRequest = {
          path: '/exemption/view-details/:exemptionId',
          params: {},
          logger: { error: vi.fn() }
        }
        const mockH = { view: vi.fn() }

        await expect(
          viewDetailsController.handler(mockRequest, mockH)
        ).rejects.toThrow('Error displaying exemption details')
      })

      test('should log errors appropriately', async () => {
        const mockExemptionServiceInstance = {
          getExemptionById: vi
            .fn()
            .mockRejectedValue(new Error('Exemption data not found'))
        }

        vi.mocked(getExemptionService).mockReturnValue(
          mockExemptionServiceInstance
        )

        const mockRequest = {
          path: '/exemption/view-details/:exemptionId',
          params: { exemptionId: 'invalid-id' },
          logger: { error: vi.fn() }
        }
        const mockH = { view: vi.fn() }

        await expect(
          viewDetailsController.handler(mockRequest, mockH)
        ).rejects.toThrow()

        expect(mockRequest.logger.error).toHaveBeenCalledWith(
          new Error('Exemption data not found'),
          'Error displaying exemption details'
        )
      })
    })

    test('renders the MCMS PDF link for an MCMS-hosted answers URL', async () => {
      mockExemptionService.getExemptionById.mockResolvedValue(
        createSubmittedExemption({
          mcmsContext: {
            activity: { label: 'Deposit of a substance or object' },
            articleCode: '17',
            pdfDownloadUrl:
              'https://marinelicensingtest.marinemanagement.org.uk/mmofox5uat/journey/self-service/outcome-document/123',
            iatQueryString: '?x=1'
          }
        })
      )
      const response = await makeGetRequest({
        url: '/exemption/view-details/507f1f77bcf86cd799439011',
        server: getServer()
      })
      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('Download a copy of')
      expect(response.payload).not.toContain(
        'View answers (opens in a new tab)'
      )
    })

    test('renders the "View answers" new-tab link for our own answers URL', async () => {
      mockExemptionService.getExemptionById.mockResolvedValue(
        createSubmittedExemption({
          mcmsContext: {
            activity: { label: 'Deposit of a substance or object' },
            articleCode: '17',
            pdfDownloadUrl:
              'https://get-permission-for-marine-work.defra.gov.uk/journey/self-service/outcome-document/BBBBBBBBBBBBBBBBBBBBBB',
            iatQueryString: '?x=1'
          }
        })
      )

      const response = await makeGetRequest({
        url: '/exemption/view-details/507f1f77bcf86cd799439011',
        server: getServer()
      })

      expect(response.statusCode).toBe(200)
      expect(response.payload).toContain('View answers (opens in a new tab)')
      expect(response.payload).toContain('target="_blank"')
      expect(response.payload).not.toContain('Download a copy')
    })

    describe('acceptance criteria verification', () => {
      test('AC1 - View details route pattern validation', () => {
        const route = `/exemption/view-details/${validExemptionId}`
        expect(route).toMatch(/^\/exemption\/view-details\/[a-f0-9]{24}$/)
      })

      test('AC2 - Navigation to view notification details page returns 200', async () => {
        const submittedExemption = createSubmittedExemption()
        mockExemptionService.getExemptionById.mockResolvedValue(
          submittedExemption
        )

        const { statusCode } = await makeGetRequest({
          url: `/exemption/view-details/${validExemptionId}`,
          server: getServer()
        })

        expect(statusCode).toBe(200)
      })

      test('AC4 - Unique URL accessibility', async () => {
        const submittedExemption = createSubmittedExemption()
        mockExemptionService.getExemptionById.mockResolvedValue(
          submittedExemption
        )

        const { statusCode } = await makeGetRequest({
          url: `/exemption/view-details/${validExemptionId}`,
          server: getServer()
        })

        expect(statusCode).toBe(200)
      })
    })

    describe('data integrity and edge cases', () => {
      test('should handle empty application reference', async () => {
        mockExemptionService.getExemptionById.mockResolvedValue(
          errorScenarios.exemptionWithEmptyReference
        )

        const { statusCode } = await makeGetRequest({
          url: `/exemption/view-details/${validExemptionId}`,
          server: getServer()
        })

        expect(statusCode).toBe(403)
      })

      test('should handle malformed site details data', async () => {
        mockExemptionService.getExemptionById.mockResolvedValue(
          errorScenarios.exemptionWithMalformedSiteDetails
        )

        const { statusCode } = await makeGetRequest({
          url: `/exemption/view-details/${validExemptionId}`,
          server: getServer()
        })

        expect(statusCode).toBe(200)
      })

      test('should fetch data from API ignoring any cache', async () => {
        const submittedExemption = createSubmittedExemption()
        mockExemptionService.getExemptionById.mockResolvedValue(
          submittedExemption
        )

        await makeGetRequest({
          url: `/exemption/view-details/${validExemptionId}`,
          server: getServer()
        })

        expect(mockExemptionService.getExemptionById).toHaveBeenCalledTimes(1)
        expect(mockExemptionService.getExemptionById).toHaveBeenCalledWith(
          validExemptionId
        )
      })
    })
  })
})
