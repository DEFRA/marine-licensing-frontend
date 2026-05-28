import { beforeAll, vi } from 'vitest'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as marineLicenceService from '#src/services/marine-licence-service/index.js'
import * as authenticatedRequests from '#src/server/common/helpers/authenticated-requests.js'
import {
  FILE_UPLOAD_REVIEW_VIEW_ROUTE,
  reviewSiteDetailsController,
  reviewSiteDetailsSubmitController
} from '#src/server/marine-licence/site-details/review-site-details/controller.js'
import { MANUAL_ENTRY_REVIEW_VIEW_ROUTE } from '#src/server/marine-licence/site-details/review-site-details/utils.js'
import { mockExemption } from '#src/server/test-helpers/mocks/exemption.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import {
  mockFileUploadMarineLicence,
  mockManualCoordinatesMarineLicence
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/services/marine-licence-service/index.js')
vi.mock('~/src/server/common/helpers/authenticated-requests.js')

function createMockHandler(type = 'view') {
  if (type === 'redirect') {
    return { redirect: vi.fn() }
  }
  return { view: vi.fn() }
}

describe('#reviewSiteDetails', () => {
  let getMarineLicenceCacheSpy
  let setMarineLicenceCacheSpy

  const mockRequest = createMockRequest()

  beforeAll(() => {
    const mockMarineLicenceServiceInstance = {
      getMarineLicenceById: vi
        .fn()
        .mockResolvedValue(mockFileUploadMarineLicence)
    }

    vi.mocked(marineLicenceService.getMarineLicenceService).mockReturnValue(
      mockMarineLicenceServiceInstance
    )
  })

  beforeEach(() => {
    getMarineLicenceCacheSpy = vi
      .mocked(cacheUtils.getMarineLicenceCache)
      .mockReturnValue(mockExemption)

    setMarineLicenceCacheSpy = vi
      .mocked(cacheUtils.setMarineLicenceCache)
      .mockResolvedValue(true)
  })

  describe('reviewSiteDetailsController', () => {
    test('should redirect to task list when no marine licence ID exists', async () => {
      getMarineLicenceCacheSpy.mockReturnValueOnce({})

      const h = createMockHandler('redirect')

      await reviewSiteDetailsController.handler(mockRequest, h)

      expect(mockRequest.yar.flash).not.toHaveBeenCalled()

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    test('should render file-upload-review for file-upload coordinatesType', async () => {
      getMarineLicenceCacheSpy.mockReturnValueOnce({ id: 'test-id' })

      const mockMarineLicenceServiceInstance = {
        getMarineLicenceById: vi
          .fn()
          .mockResolvedValue(mockFileUploadMarineLicence)
      }
      vi.spyOn(marineLicenceService, 'getMarineLicenceService').mockReturnValue(
        mockMarineLicenceServiceInstance
      )

      const h = createMockHandler()

      await reviewSiteDetailsController.handler(mockRequest, h)

      expect(marineLicenceService.getMarineLicenceService).toHaveBeenCalledWith(
        mockRequest
      )

      expect(setMarineLicenceCacheSpy).toHaveBeenCalled()

      expect(
        mockMarineLicenceServiceInstance.getMarineLicenceById
      ).toHaveBeenCalledWith('test-id')
      expect(h.view).toHaveBeenCalledWith(
        FILE_UPLOAD_REVIEW_VIEW_ROUTE,
        expect.objectContaining({
          heading: 'Review site details',
          pageTitle: 'Review site details',
          backLink: marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD,
          projectName: 'Test Project'
        })
      )
    })

    test('should redirect to task list for unknown coordinatesType', async () => {
      getMarineLicenceCacheSpy.mockReturnValueOnce({ id: 'test-id' })

      const unknownTypeMarineLicence = {
        ...mockFileUploadMarineLicence,
        siteDetails: [
          {
            ...mockFileUploadMarineLicence.siteDetails[0],
            coordinatesType: 'unknown'
          }
        ]
      }
      const mockMarineLicenceServiceInstance = {
        getMarineLicenceById: vi
          .fn()
          .mockResolvedValue(unknownTypeMarineLicence)
      }
      vi.spyOn(marineLicenceService, 'getMarineLicenceService').mockReturnValue(
        mockMarineLicenceServiceInstance
      )

      const h = createMockHandler('redirect')

      await reviewSiteDetailsController.handler(mockRequest, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    test('should render manual-entry-review for coordinates coordinatesType', async () => {
      getMarineLicenceCacheSpy.mockReturnValueOnce({ id: 'test-id' })

      const mockMarineLicenceServiceInstance = {
        getMarineLicenceById: vi
          .fn()
          .mockResolvedValue(mockManualCoordinatesMarineLicence)
      }
      vi.spyOn(marineLicenceService, 'getMarineLicenceService').mockReturnValue(
        mockMarineLicenceServiceInstance
      )

      const h = createMockHandler()

      await reviewSiteDetailsController.handler(mockRequest, h)

      expect(h.view).toHaveBeenCalledWith(
        MANUAL_ENTRY_REVIEW_VIEW_ROUTE,
        expect.objectContaining({
          heading: 'Review site details',
          pageTitle: 'Review site details',
          projectName: 'Test Project'
        })
      )
    })
  })

  describe('reviewSiteDetailsSubmitController', () => {
    test('should set coordinatesType and redirect to site name for new site when add is in payload', async () => {
      getMarineLicenceCacheSpy.mockReturnValue({
        id: 'test-id',
        siteDetails: [{ coordinatesType: 'coordinates', siteName: 'Site 1' }]
      })
      vi.mocked(cacheUtils.updateMarineLicenceSiteDetails).mockResolvedValue({})

      const h = createMockHandler('redirect')
      const request = createMockRequest({ payload: { add: 'add' } })

      await reviewSiteDetailsSubmitController.handler(request, h)

      expect(cacheUtils.updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
        request,
        h,
        1,
        'coordinatesType',
        'coordinates'
      )
      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_SITE_NAME}?site=2`
      )
    })

    test('should redirect to task list when no addActivity in payload', async () => {
      const h = createMockHandler('redirect')
      const request = createMockRequest({ payload: {} })

      await reviewSiteDetailsSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    test('should redirect to check-your-answers when flash returnTo is set', async () => {
      const h = createMockHandler('redirect')
      const request = createMockRequest({ payload: {} })
      request.yar.flash.mockReturnValue([
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      ])

      await reviewSiteDetailsSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      )
    })

    test('should call the API and redirect to review page with the next activity anchor', async () => {
      getMarineLicenceCacheSpy.mockReturnValue({
        id: 'test-id',
        siteDetails: [{ activityDetails: [{ activityType: 'existing' }] }]
      })
      vi.mocked(
        authenticatedRequests.authenticatedPatchRequest
      ).mockResolvedValue({})

      const h = createMockHandler('redirect')
      const request = createMockRequest({
        payload: { addActivity: 'addActivity', siteNumber: '1' }
      })

      await reviewSiteDetailsSubmitController.handler(request, h)

      expect(
        vi.mocked(authenticatedRequests.authenticatedPatchRequest)
      ).toHaveBeenCalledWith(request, apiRoutes.ADD_ACTIVITY_TO_SITE, {
        siteIndex: 0,
        id: 'test-id'
      })
      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-1-activity-2`
      )
    })
  })
})
