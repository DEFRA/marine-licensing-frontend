import { beforeAll, vi } from 'vitest'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as marineLicenceService from '#src/services/marine-licence-service/index.js'
import * as authenticatedRequests from '#src/server/common/helpers/authenticated-requests.js'
import {
  FILE_UPLOAD_REVIEW_VIEW_ROUTE,
  reviewSiteDetailsController,
  reviewSiteDetailsSubmitController
} from '#src/server/marine-licence/site-details/review-site-details/controller.js'
import { mockExemption } from '#src/server/test-helpers/mocks/exemption.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { mockFileUploadMarineLicence } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
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

    test('should load data from ExemptionService', async () => {
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
  })

  describe('reviewSiteDetailsSubmitController', () => {
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
