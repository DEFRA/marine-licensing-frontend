import { vi } from 'vitest'
import {
  CONFIRM_CHANGE_ACTIVITY_TYPE_VIEW_ROUTE,
  confirmChangeActivityTypeController,
  confirmChangeActivityTypeSubmitController
} from '#src/server/marine-licence/site-details/confirm-change-activity-type/controller.js'
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

describe('confirmChangeActivityTypeController', () => {
  beforeEach(() => {
    vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  describe('GET handler', () => {
    it('redirects to the task list when activityType or activitySubType are missing', () => {
      const request = createMockRequest({
        query: { site: '1', activity: '1' }
      })
      const h = createMockH()

      confirmChangeActivityTypeController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
      expect(h.view).not.toHaveBeenCalled()
    })

    it('redirects to the task list when activityType is not a recognised value', () => {
      const request = createMockRequest({
        query: {
          site: '1',
          activity: '1',
          activityType: 'not-a-real-type',
          activitySubType: 'construction-type-2'
        }
      })
      const h = createMockH()

      confirmChangeActivityTypeController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
      expect(h.view).not.toHaveBeenCalled()
    })

    it('redirects to the task list when activitySubType does not belong to activityType', () => {
      const request = createMockRequest({
        query: {
          site: '1',
          activity: '1',
          activityType: 'deposit',
          activitySubType: 'construction-type-2'
        }
      })
      const h = createMockH()

      confirmChangeActivityTypeController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
      expect(h.view).not.toHaveBeenCalled()
    })

    it('renders the confirmation view with the pending activity type/subtype', () => {
      const request = createMockRequest({
        query: {
          site: '1',
          activity: '1',
          activityType: 'construction',
          activitySubType: 'construction-type-2'
        }
      })
      const h = createMockH()

      confirmChangeActivityTypeController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        CONFIRM_CHANGE_ACTIVITY_TYPE_VIEW_ROUTE,
        {
          pageTitle:
            'Changing your type of activity will delete any uploaded construction drawings',
          heading:
            'Changing your type of activity will delete any uploaded construction drawings',
          projectName: mockMarineLicenceApplication.projectName,
          siteNumber: 1,
          activityDetailsNumber: 1,
          activityType: 'construction',
          activitySubType: 'construction-type-2',
          drawingRequiringActivityLabels: [
            'Construction of new marine works',
            'Alteration or improvement, including extending, of existing marine works'
          ],
          backLink: '/marine-licence/type-of-activity?site=1&activity=1',
          cancelLink: '/marine-licence/type-of-activity?site=1&activity=1'
        }
      )
    })
  })

  describe('POST handler', () => {
    it('saves the pending activity type/subtype, clears activities, and redirects to the sub-activity screen', async () => {
      const request = createMockRequest({
        payload: {
          site: '1',
          activity: '1',
          activityType: 'construction',
          activitySubType: 'construction-type-2'
        }
      })
      const h = createMockH()

      await confirmChangeActivityTypeSubmitController.handler(request, h)

      expect(
        cacheUtils.updateMarineLicenceSiteActivityDetails
      ).toHaveBeenCalledWith(request, h, 0, 0, {
        activityType: 'construction',
        activitySubType: 'construction-type-2',
        activities: null
      })
      expect(h.redirect).toHaveBeenCalledWith(
        '/marine-licence/activity-details/what-are-you-maintaining?site=1&activity=1'
      )
    })

    it('redirects to the task list without saving when activityType is not a recognised value', async () => {
      const request = createMockRequest({
        payload: {
          site: '1',
          activity: '1',
          activityType: 'not-a-real-type',
          activitySubType: 'construction-type-2'
        }
      })
      const h = createMockH()

      await confirmChangeActivityTypeSubmitController.handler(request, h)

      expect(
        cacheUtils.updateMarineLicenceSiteActivityDetails
      ).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    it('redirects to the task list without saving when activitySubType does not belong to activityType', async () => {
      const request = createMockRequest({
        payload: {
          site: '1',
          activity: '1',
          activityType: 'deposit',
          activitySubType: 'construction-type-1'
        }
      })
      const h = createMockH()

      await confirmChangeActivityTypeSubmitController.handler(request, h)

      expect(
        cacheUtils.updateMarineLicenceSiteActivityDetails
      ).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
      )
    })

    it('deletes the site construction drawings when the site has existing drawings and no other activity needs them', async () => {
      vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({
        ...mockMarineLicenceApplication,
        siteDetails: [
          {
            ...mockMarineLicenceApplication.siteDetails[0],
            activityDetails: [
              mockMarineLicenceApplication.siteDetails[0].activityDetails[0]
            ],
            constructionDrawings: [
              { filename: 'drawing-1.pdf' },
              { filename: 'drawing-2.pdf' }
            ]
          }
        ]
      })

      const request = createMockRequest({
        payload: {
          site: '1',
          activity: '1',
          activityType: 'construction',
          activitySubType: 'construction-type-2'
        }
      })
      const h = createMockH()

      await confirmChangeActivityTypeSubmitController.handler(request, h)

      expect(cacheUtils.updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
        request,
        h,
        0,
        'constructionDrawings',
        null
      )
      expect(
        authenticatedRequests.authenticatedPatchRequest
      ).toHaveBeenCalledWith(request, apiRoutes.DELETE_CONSTRUCTION_DRAWINGS, {
        id: mockMarineLicenceApplication.id,
        siteIndex: 0
      })
    })

    it('does not delete the site construction drawings when another activity on the site still requires one', async () => {
      vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({
        ...mockMarineLicenceApplication,
        siteDetails: [
          {
            ...mockMarineLicenceApplication.siteDetails[0],
            activityDetails: [
              {
                ...mockMarineLicenceApplication.siteDetails[0]
                  .activityDetails[0],
                activitySubType: 'construction-type-1'
              },
              {
                ...mockMarineLicenceApplication.siteDetails[0]
                  .activityDetails[0],
                activitySubType: 'construction-type-1'
              }
            ],
            constructionDrawings: [{ filename: 'drawing-1.pdf' }]
          }
        ]
      })

      const request = createMockRequest({
        payload: {
          site: '1',
          activity: '1',
          activityType: 'construction',
          activitySubType: 'construction-type-2'
        }
      })
      const h = createMockH()

      await confirmChangeActivityTypeSubmitController.handler(request, h)

      expect(cacheUtils.updateMarineLicenceSiteDetails).not.toHaveBeenCalled()
      expect(
        authenticatedRequests.authenticatedPatchRequest
      ).not.toHaveBeenCalled()
    })

    it('does not attempt to delete drawings when the site has none', async () => {
      const request = createMockRequest({
        payload: {
          site: '1',
          activity: '1',
          activityType: 'construction',
          activitySubType: 'construction-type-2'
        }
      })
      const h = createMockH()

      await confirmChangeActivityTypeSubmitController.handler(request, h)

      expect(cacheUtils.updateMarineLicenceSiteDetails).not.toHaveBeenCalled()
      expect(
        authenticatedRequests.authenticatedPatchRequest
      ).not.toHaveBeenCalled()
    })

    it('throws a Boom error when the delete request fails', async () => {
      vi.mocked(cacheUtils.getMarineLicenceCache).mockReturnValue({
        ...mockMarineLicenceApplication,
        siteDetails: [
          {
            ...mockMarineLicenceApplication.siteDetails[0],
            activityDetails: [
              mockMarineLicenceApplication.siteDetails[0].activityDetails[0]
            ],
            constructionDrawings: [{ filename: 'drawing-1.pdf' }]
          }
        ]
      })
      vi.mocked(
        authenticatedRequests.authenticatedPatchRequest
      ).mockRejectedValueOnce(new Error('API error'))

      const request = createMockRequest({
        payload: {
          site: '1',
          activity: '1',
          activityType: 'construction',
          activitySubType: 'construction-type-2'
        }
      })
      const h = createMockH()

      await expect(
        confirmChangeActivityTypeSubmitController.handler(request, h)
      ).rejects.toThrow('Error deleting construction drawings')
    })
  })
})
