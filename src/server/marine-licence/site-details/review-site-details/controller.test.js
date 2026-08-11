import { beforeAll, vi } from 'vitest'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as marineLicenceService from '#src/services/marine-licence-service/index.js'
import * as authenticatedRequests from '#src/server/common/helpers/authenticated-requests.js'
import * as marinePlanPolicyQuery from '#src/server/common/helpers/marine-licence/marine-plan-policy-query.js'
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
import { RETURN_TO_CACHE_KEY } from '#src/server/common/constants/cache.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/services/marine-licence-service/index.js')
vi.mock('~/src/server/common/helpers/authenticated-requests.js')
vi.mock(
  '~/src/server/common/helpers/marine-licence/marine-plan-policy-query.js'
)

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

    test('should show the marine plan policies question when siteDetails is COMPLETED', async () => {
      getMarineLicenceCacheSpy.mockReturnValueOnce({ id: 'test-id' })

      vi.spyOn(marineLicenceService, 'getMarineLicenceService').mockReturnValue(
        {
          getMarineLicenceById: vi.fn().mockResolvedValue({
            ...mockFileUploadMarineLicence,
            siteDetailsDataComplete: true
          })
        }
      )

      const h = createMockHandler()

      await reviewSiteDetailsController.handler(mockRequest, h)

      expect(h.view).toHaveBeenCalledWith(
        FILE_UPLOAD_REVIEW_VIEW_ROUTE,
        expect.objectContaining({
          showMarinePlanPoliciesQuestion: true,
          errors: undefined,
          errorSummary: undefined
        })
      )
    })

    test('should not show the marine plan policies question when siteDetails is not COMPLETED', async () => {
      getMarineLicenceCacheSpy.mockReturnValueOnce({ id: 'test-id' })

      vi.spyOn(marineLicenceService, 'getMarineLicenceService').mockReturnValue(
        {
          getMarineLicenceById: vi.fn().mockResolvedValue({
            ...mockFileUploadMarineLicence,
            siteDetailsDataComplete: false
          })
        }
      )

      const h = createMockHandler()

      await reviewSiteDetailsController.handler(mockRequest, h)

      expect(h.view).toHaveBeenCalledWith(
        FILE_UPLOAD_REVIEW_VIEW_ROUTE,
        expect.objectContaining({
          showMarinePlanPoliciesQuestion: false
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

    test('should redirect to task list when siteDetails is not COMPLETED', async () => {
      getMarineLicenceCacheSpy.mockReturnValueOnce({
        id: 'test-id',
        siteDetails: []
      })
      vi.spyOn(marineLicenceService, 'getMarineLicenceService').mockReturnValue(
        {
          getMarineLicenceById: vi
            .fn()
            .mockResolvedValue({ siteDetailsDataComplete: false })
        }
      )

      const h = createMockHandler('redirect')
      const request = createMockRequest({ payload: {} })

      await reviewSiteDetailsSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    test('should call calculate-marine-plan-policies API and redirect to spinner when siteDetails is COMPLETED and answer is yes', async () => {
      getMarineLicenceCacheSpy.mockReturnValueOnce({
        id: 'test-id',
        siteDetails: []
      })
      vi.spyOn(marineLicenceService, 'getMarineLicenceService').mockReturnValue(
        {
          getMarineLicenceById: vi.fn().mockResolvedValue({
            siteDetailsDataComplete: true,
            siteDetails: []
          })
        }
      )
      vi.mocked(
        marinePlanPolicyQuery.triggerMarinePlanPolicyQuery
      ).mockResolvedValue(undefined)
      vi.mocked(
        authenticatedRequests.authenticatedPatchRequest
      ).mockResolvedValue({})

      const h = createMockHandler('redirect')
      const request = createMockRequest({
        payload: { finishedEnteringSiteDetails: 'yes' }
      })

      await reviewSiteDetailsSubmitController.handler(request, h)

      expect(
        vi.mocked(authenticatedRequests.authenticatedPatchRequest)
      ).toHaveBeenCalledWith(request, apiRoutes.CONFIRM_SITE_DETAILS, {
        id: 'test-id',
        confirmed: true
      })
      expect(
        vi.mocked(marinePlanPolicyQuery.triggerMarinePlanPolicyQuery)
      ).toHaveBeenCalledWith(request, 'test-id')
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_CALCULATE_MARINE_PLAN_POLICIES
      )
    })

    test('should skip recalculation and redirect straight to check-your-answers when answer is yes, siteDetails is already confirmed and the user came from check-your-answers', async () => {
      getMarineLicenceCacheSpy.mockReturnValueOnce({
        id: 'test-id',
        siteDetails: []
      })
      vi.spyOn(marineLicenceService, 'getMarineLicenceService').mockReturnValue(
        {
          getMarineLicenceById: vi.fn().mockResolvedValue({
            siteDetailsDataComplete: true,
            siteDetails: [],
            siteDetailsConfirmed: true
          })
        }
      )
      vi.mocked(
        authenticatedRequests.authenticatedPatchRequest
      ).mockResolvedValue({})

      const h = createMockHandler('redirect')
      const request = createMockRequest({
        payload: { finishedEnteringSiteDetails: 'yes' },
        query: { from: 'check-your-answers' }
      })

      await reviewSiteDetailsSubmitController.handler(request, h)

      expect(
        vi.mocked(authenticatedRequests.authenticatedPatchRequest)
      ).toHaveBeenCalledWith(request, apiRoutes.CONFIRM_SITE_DETAILS, {
        id: 'test-id',
        confirmed: true
      })
      expect(
        vi.mocked(marinePlanPolicyQuery.triggerMarinePlanPolicyQuery)
      ).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      )
    })

    test('should still recalculate when answer is yes, siteDetails is not already confirmed and the user came from check-your-answers', async () => {
      getMarineLicenceCacheSpy.mockReturnValueOnce({
        id: 'test-id',
        siteDetails: []
      })
      vi.spyOn(marineLicenceService, 'getMarineLicenceService').mockReturnValue(
        {
          getMarineLicenceById: vi.fn().mockResolvedValue({
            siteDetailsDataComplete: true,
            siteDetails: [],
            siteDetailsConfirmed: false
          })
        }
      )
      vi.mocked(
        marinePlanPolicyQuery.triggerMarinePlanPolicyQuery
      ).mockResolvedValue(undefined)
      vi.mocked(
        authenticatedRequests.authenticatedPatchRequest
      ).mockResolvedValue({})

      const h = createMockHandler('redirect')
      const request = createMockRequest({
        payload: { finishedEnteringSiteDetails: 'yes' },
        query: { from: 'check-your-answers' }
      })

      await reviewSiteDetailsSubmitController.handler(request, h)

      expect(
        vi.mocked(marinePlanPolicyQuery.triggerMarinePlanPolicyQuery)
      ).toHaveBeenCalledWith(request, 'test-id')
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_CALCULATE_MARINE_PLAN_POLICIES
      )
    })

    test('should still recalculate when answer is yes, siteDetails is already confirmed but the user did not come from check-your-answers', async () => {
      getMarineLicenceCacheSpy.mockReturnValueOnce({
        id: 'test-id',
        siteDetails: []
      })
      vi.spyOn(marineLicenceService, 'getMarineLicenceService').mockReturnValue(
        {
          getMarineLicenceById: vi.fn().mockResolvedValue({
            siteDetailsDataComplete: true,
            siteDetails: [],
            siteDetailsConfirmed: true
          })
        }
      )
      vi.mocked(
        marinePlanPolicyQuery.triggerMarinePlanPolicyQuery
      ).mockResolvedValue(undefined)
      vi.mocked(
        authenticatedRequests.authenticatedPatchRequest
      ).mockResolvedValue({})

      const h = createMockHandler('redirect')
      const request = createMockRequest({
        payload: { finishedEnteringSiteDetails: 'yes' }
      })

      await reviewSiteDetailsSubmitController.handler(request, h)

      expect(
        vi.mocked(marinePlanPolicyQuery.triggerMarinePlanPolicyQuery)
      ).toHaveBeenCalledWith(request, 'test-id')
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_CALCULATE_MARINE_PLAN_POLICIES
      )
    })

    test('should not call calculate-marine-plan-policies API and redirect to task list when siteDetails is COMPLETED and answer is no', async () => {
      getMarineLicenceCacheSpy.mockReturnValueOnce({
        id: 'test-id',
        siteDetails: []
      })
      vi.spyOn(marineLicenceService, 'getMarineLicenceService').mockReturnValue(
        {
          getMarineLicenceById: vi.fn().mockResolvedValue({
            siteDetailsDataComplete: true,
            siteDetails: []
          })
        }
      )
      vi.mocked(
        authenticatedRequests.authenticatedPatchRequest
      ).mockResolvedValue({})

      const h = createMockHandler('redirect')
      const request = createMockRequest({
        payload: { finishedEnteringSiteDetails: 'no' }
      })

      await reviewSiteDetailsSubmitController.handler(request, h)

      expect(
        vi.mocked(authenticatedRequests.authenticatedPatchRequest)
      ).toHaveBeenCalledWith(request, apiRoutes.CONFIRM_SITE_DETAILS, {
        id: 'test-id',
        confirmed: false
      })
      expect(
        vi.mocked(marinePlanPolicyQuery.triggerMarinePlanPolicyQuery)
      ).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    test('should show a validation error when siteDetails is COMPLETED and no answer is given', async () => {
      getMarineLicenceCacheSpy.mockReturnValueOnce({
        id: 'test-id',
        siteDetails: []
      })
      vi.spyOn(marineLicenceService, 'getMarineLicenceService').mockReturnValue(
        {
          getMarineLicenceById: vi.fn().mockResolvedValue({
            ...mockFileUploadMarineLicence,
            siteDetailsDataComplete: true
          })
        }
      )

      const h = createMockHandler()
      const request = createMockRequest({ payload: {} })

      await reviewSiteDetailsSubmitController.handler(request, h)

      expect(
        vi.mocked(authenticatedRequests.authenticatedPatchRequest)
      ).not.toHaveBeenCalled()
      expect(
        vi.mocked(marinePlanPolicyQuery.triggerMarinePlanPolicyQuery)
      ).not.toHaveBeenCalled()
      expect(h.view).toHaveBeenCalledWith(
        FILE_UPLOAD_REVIEW_VIEW_ROUTE,
        expect.objectContaining({
          showMarinePlanPoliciesQuestion: true,
          errorSummary: [
            expect.objectContaining({
              text: 'Select if you have finished entering your site details',
              href: '#finishedEnteringSiteDetails'
            })
          ],
          errors: expect.objectContaining({
            finishedEnteringSiteDetails: expect.objectContaining({
              text: 'Select if you have finished entering your site details'
            })
          })
        })
      )
    })

    test('should keep the check-your-answers back link when validation fails and the user came from check-your-answers', async () => {
      getMarineLicenceCacheSpy.mockReturnValueOnce({
        id: 'test-id',
        siteDetails: []
      })
      vi.spyOn(marineLicenceService, 'getMarineLicenceService').mockReturnValue(
        {
          getMarineLicenceById: vi.fn().mockResolvedValue({
            ...mockFileUploadMarineLicence,
            siteDetailsDataComplete: true
          })
        }
      )

      const h = createMockHandler()
      const request = createMockRequest({
        payload: {},
        query: { from: 'check-your-answers' }
      })

      await reviewSiteDetailsSubmitController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        FILE_UPLOAD_REVIEW_VIEW_ROUTE,
        expect.objectContaining({
          backLink: marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
        })
      )
    })

    test('should redirect to check-your-answers when flash returnTo is set and siteDetails is not COMPLETED', async () => {
      getMarineLicenceCacheSpy.mockReturnValueOnce({
        id: 'test-id',
        siteDetails: []
      })
      vi.spyOn(marineLicenceService, 'getMarineLicenceService').mockReturnValue(
        {
          getMarineLicenceById: vi
            .fn()
            .mockResolvedValue({ siteDetailsDataComplete: false })
        }
      )

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

    test('should show a validation error rather than redirecting when flash returnTo is set but siteDetails is COMPLETED and no answer is given', async () => {
      getMarineLicenceCacheSpy.mockReturnValueOnce({
        id: 'test-id',
        siteDetails: []
      })
      vi.spyOn(marineLicenceService, 'getMarineLicenceService').mockReturnValue(
        {
          getMarineLicenceById: vi.fn().mockResolvedValue({
            ...mockFileUploadMarineLicence,
            siteDetailsDataComplete: true
          })
        }
      )

      const h = createMockHandler()
      const request = createMockRequest({ payload: {} })
      request.yar.flash.mockReturnValue([
        marineLicenceRoutes.MARINE_LICENCE_CHECK_YOUR_ANSWERS
      ])

      await reviewSiteDetailsSubmitController.handler(request, h)

      expect(h.redirect).toBeUndefined()
      expect(h.view).toHaveBeenCalledWith(
        FILE_UPLOAD_REVIEW_VIEW_ROUTE,
        expect.objectContaining({
          errorSummary: [
            expect.objectContaining({
              text: 'Select if you have finished entering your site details'
            })
          ]
        })
      )
    })

    test('should clear the returnTo cache when siteDetails is COMPLETED so a stale flash does not linger', async () => {
      getMarineLicenceCacheSpy.mockReturnValueOnce({
        id: 'test-id',
        siteDetails: []
      })
      vi.spyOn(marineLicenceService, 'getMarineLicenceService').mockReturnValue(
        {
          getMarineLicenceById: vi.fn().mockResolvedValue({
            ...mockFileUploadMarineLicence,
            siteDetailsDataComplete: true
          })
        }
      )

      const h = createMockHandler('redirect')
      const request = createMockRequest({
        payload: { finishedEnteringSiteDetails: 'no' }
      })

      await reviewSiteDetailsSubmitController.handler(request, h)

      expect(request.yar.flash).toHaveBeenCalledWith(RETURN_TO_CACHE_KEY)
      expect(request.yar.clear).toHaveBeenCalledWith(RETURN_TO_CACHE_KEY)
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

    test('adds two drawing slots the first time, so the already-visible first card is materialised too', async () => {
      getMarineLicenceCacheSpy.mockReturnValue({
        id: 'test-id',
        siteDetails: [{ activityDetails: [] }]
      })
      vi.mocked(
        authenticatedRequests.authenticatedPatchRequest
      ).mockResolvedValue({})

      const h = createMockHandler('redirect')
      const request = createMockRequest({
        payload: {
          addConstructionDrawing: 'addConstructionDrawing',
          siteNumber: '1'
        }
      })

      await reviewSiteDetailsSubmitController.handler(request, h)

      expect(
        vi.mocked(authenticatedRequests.authenticatedPatchRequest)
      ).toHaveBeenCalledTimes(2)
      expect(
        vi.mocked(authenticatedRequests.authenticatedPatchRequest)
      ).toHaveBeenCalledWith(request, apiRoutes.ADD_CONSTRUCTION_DRAWING, {
        siteIndex: 0,
        id: 'test-id'
      })
      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#construction-drawing-site-1-2`
      )
    })

    test('adds a single drawing slot when one already exists', async () => {
      getMarineLicenceCacheSpy.mockReturnValue({
        id: 'test-id',
        siteDetails: [
          {
            activityDetails: [],
            constructionDrawings: [{ filename: 'existing.pdf' }]
          }
        ]
      })
      vi.mocked(
        authenticatedRequests.authenticatedPatchRequest
      ).mockResolvedValue({})

      const h = createMockHandler('redirect')
      const request = createMockRequest({
        payload: {
          addConstructionDrawing: 'addConstructionDrawing',
          siteNumber: '1'
        }
      })

      await reviewSiteDetailsSubmitController.handler(request, h)

      expect(
        vi.mocked(authenticatedRequests.authenticatedPatchRequest)
      ).toHaveBeenCalledTimes(1)
      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#construction-drawing-site-1-2`
      )
    })

    test('treats a non-array constructionDrawings value as empty rather than producing NaN', async () => {
      getMarineLicenceCacheSpy.mockReturnValue({
        id: 'test-id',
        siteDetails: [
          {
            activityDetails: [],
            constructionDrawings: {}
          }
        ]
      })
      vi.mocked(
        authenticatedRequests.authenticatedPatchRequest
      ).mockResolvedValue({})

      const h = createMockHandler('redirect')
      const request = createMockRequest({
        payload: {
          addConstructionDrawing: 'addConstructionDrawing',
          siteNumber: '1'
        }
      })

      await reviewSiteDetailsSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#construction-drawing-site-1-2`
      )
    })
  })
})
