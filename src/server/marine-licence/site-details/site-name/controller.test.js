import { beforeAll, vi } from 'vitest'
import {
  siteNameController,
  siteNameSubmitController,
  SITE_NAME_VIEW_ROUTE
} from '#src/server/marine-licence/site-details/site-name/controller.js'
import {
  createMockRequest,
  createMockH
} from '#src/server/test-helpers/mocks/helpers.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  mockManualCoordinatesMarineLicence,
  mockMarineLicenceApplication
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/marine-licence/save-site-details.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/marine-licence/save-site-details.js')

describe('#siteName', () => {
  const mockSiteName = 'Test Site Name'
  const h = createMockH()

  beforeAll(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  describe('#siteNameController', () => {
    test('should render with correct context', () => {
      const request = createMockRequest()

      vi.mocked(getMarineLicenceCache).mockReturnValueOnce(
        mockManualCoordinatesMarineLicence
      )

      siteNameController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(SITE_NAME_VIEW_ROUTE, {
        pageTitle: 'Site name',
        heading: 'Site name',
        backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE,
        cancelLink: `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`,
        payload: {
          siteName: mockManualCoordinatesMarineLicence.siteDetails[0].siteName
        },
        projectName: 'Test Project',
        siteNumber: 1,
        action: false
      })
    })

    test('should include action in view context when action parameter is present', () => {
      const request = createMockRequest({ query: { action: 'add' } })

      siteNameController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        SITE_NAME_VIEW_ROUTE,
        expect.objectContaining({
          action: true
        })
      )
    })

    test('should redirect to task list when invalid site number', () => {
      vi.mocked(getMarineLicenceCache).mockReturnValueOnce({
        ...mockMarineLicenceApplication,
        siteDetails: []
      })

      const request = createMockRequest({ query: { site: '3' } })

      siteNameController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })
  })

  describe('#siteNameSubmitController', () => {
    test('should redirect to next page when valid site name is submitted', async () => {
      vi.mocked(updateMarineLicenceSiteDetails).mockReturnValueOnce({
        ...mockMarineLicenceApplication,
        siteDetails: [
          {
            ...mockMarineLicenceApplication.siteDetails[0],
            siteName: mockSiteName
          }
        ]
      })

      const request = createMockRequest({
        payload: { siteName: 'Test Site Name' }
      })

      vi.mocked(saveSiteDetailsToBackend).mockResolvedValueOnce(undefined)

      await siteNameSubmitController.handler(request, h)

      expect(updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
        request,
        h,
        0,
        'siteName',
        'Test Site Name'
      )
      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#site-details-1`
      )
    })

    test('should redirect to review site details when action param is set and coordinatesType is not file', async () => {
      vi.mocked(getMarineLicenceCache).mockReturnValueOnce({
        ...mockMarineLicenceApplication,
        siteDetails: [
          {
            ...mockMarineLicenceApplication.siteDetails[0],
            coordinatesType: 'coordinates'
          }
        ]
      })

      const request = createMockRequest({
        payload: { siteName: 'Test Site Name' },
        query: { action: 'change' }
      })

      vi.mocked(saveSiteDetailsToBackend).mockResolvedValueOnce(undefined)

      await siteNameSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#site-details-1`
      )
    })

    test('should redirect to coordinates entry when coordinatesType is not file', async () => {
      vi.mocked(getMarineLicenceCache).mockReturnValueOnce({
        ...mockMarineLicenceApplication,
        siteDetails: [
          {
            ...mockMarineLicenceApplication.siteDetails[0],
            coordinatesType: 'coordinates'
          }
        ]
      })

      const request = createMockRequest({
        payload: { siteName: 'Test Site Name' }
      })

      await siteNameSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_COORDINATES_ENTRY_CHOICE
      )
    })

    test('should handle validation failure with error details', () => {
      const request = createMockRequest({
        payload: { siteName: '' }
      })

      const err = {
        details: [
          {
            message: 'SITE_NAME_REQUIRED',
            field: ['siteName']
          }
        ]
      }

      siteNameSubmitController.options.validate.failAction(request, h, err)

      expect(h.view).toHaveBeenCalledWith(SITE_NAME_VIEW_ROUTE, {
        pageTitle: 'Site name',
        heading: 'Site name',
        backLink: `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#site-details-1`,
        payload: { siteName: '' },
        projectName: 'Test Project',
        siteNumber: 1,
        action: true,
        errors: expect.any(Object),
        errorSummary: expect.any(Array)
      })
    })

    test('should handle validation failure without error details', () => {
      const request = createMockRequest({
        payload: { siteName: 'invalid' }
      })

      siteNameSubmitController.options.validate.failAction(request, h, {})

      expect(h.view).toHaveBeenCalledWith(SITE_NAME_VIEW_ROUTE, {
        pageTitle: 'Site name',
        heading: 'Site name',
        backLink: `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#site-details-1`,
        payload: { siteName: 'invalid' },
        projectName: 'Test Project',
        siteNumber: 1,
        action: true
      })
    })

    test('should preserve action parameter in validation failure', () => {
      const request = createMockRequest({
        payload: { siteName: '' },
        query: { action: 'add' }
      })

      const err = {
        details: [
          {
            message: 'SITE_NAME_REQUIRED',
            field: ['siteName']
          }
        ]
      }

      siteNameSubmitController.options.validate.failAction(request, h, err)

      expect(h.view).toHaveBeenCalledWith(
        SITE_NAME_VIEW_ROUTE,
        expect.objectContaining({
          action: true,
          backLink: `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#site-details-1`
        })
      )
    })
  })
})
