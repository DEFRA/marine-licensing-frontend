import { vi } from 'vitest'
import {
  DELETE_ACTIVITY_VIEW_ROUTE,
  deleteActivityController,
  deleteActivitySubmitController
} from '#src/server/marine-licence/site-details/delete-activity/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as authenticatedRequests from '#src/server/common/helpers/authenticated-requests.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import {
  createMockRequest,
  createMockH
} from '#src/server/test-helpers/mocks/helpers.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/authenticated-requests.js')

describe('deleteActivityController', () => {
  beforeEach(() => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  describe('GET handler', () => {
    it('should redirect to review site details when attempting to delete the first activity', () => {
      const request = createMockRequest({
        query: { site: '1', activity: '1' }
      })
      const h = createMockH()

      deleteActivityController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
      )
      expect(h.view).not.toHaveBeenCalled()
    })

    it('should render the confirmation view with correct data for activities', () => {
      const request = createMockRequest({
        query: { site: '1', activity: '2' }
      })
      const h = createMockH()

      deleteActivityController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(DELETE_ACTIVITY_VIEW_ROUTE, {
        pageTitle: 'Are you sure you want to delete this activity?',
        heading: 'Are you sure you want to delete this activity?',
        siteNumber: 1,
        siteIndex: 0,
        activityIndex: 1,
        activityDetailsNumber: 2,
        projectName: mockMarineLicenceApplication.projectName,
        backLink: marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS,
        marineLicenceRoutes
      })
    })
  })

  describe('POST handler', () => {
    it('should call authenticatedPatchRequest with correct payload and redirect to review', async () => {
      vi.mocked(
        authenticatedRequests.authenticatedPatchRequest
      ).mockResolvedValue({})

      const request = createMockRequest({
        payload: { siteIndex: '0', activityIndex: '0' }
      })
      const h = createMockH()

      await deleteActivitySubmitController.handler(request, h)

      expect(
        vi.mocked(authenticatedRequests.authenticatedPatchRequest)
      ).toHaveBeenCalledWith(request, apiRoutes.DELETE_ACTIVITY_FROM_SITE, {
        id: mockMarineLicenceApplication.id,
        siteIndex: 0,
        activityIndex: 0
      })

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
      )
    })

    it('should throw error when API call fails', async () => {
      vi.mocked(
        authenticatedRequests.authenticatedPatchRequest
      ).mockRejectedValueOnce(new Error('API error'))

      const request = createMockRequest({
        payload: { siteIndex: '0', activityIndex: '0' }
      })
      const h = createMockH()

      await expect(
        deleteActivitySubmitController.handler(request, h)
      ).rejects.toThrow('Error deleting activity')
    })
  })
})
