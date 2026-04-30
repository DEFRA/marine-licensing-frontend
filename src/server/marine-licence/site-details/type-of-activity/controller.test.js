import { vi } from 'vitest'
import {
  typeOfActivitySubmitController,
  typeOfActivitySettings,
  typeOfActivityErrorMessages,
  MARINE_LICENCE_TYPE_OF_ACTIVITY_VIEW_ROUTE
} from '#src/server/marine-licence/site-details/type-of-activity/controller.js'
import {
  getMarineLicenceCache,
  updateMarineLicenceSiteActivityDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { createFailAction } from '#src/server/common/helpers/createFailAction.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  createMockRequest,
  createMockH
} from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/createFailAction.js')

describe('#typeOfActivity', () => {
  beforeEach(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  describe('#typeOfActivitySubmitController', () => {
    test('createFailAction was called with params', () => {
      const mockFailAction = vi.fn()
      vi.mocked(createFailAction).mockReturnValue(mockFailAction)

      const request = createMockRequest({ query: { site: 1, activity: 1 } })
      const h = createMockH()
      const err = new Error('validation error')

      typeOfActivitySubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      expect(createFailAction).toHaveBeenCalledWith({
        projectName: 'Test Project',
        viewRoute: MARINE_LICENCE_TYPE_OF_ACTIVITY_VIEW_ROUTE,
        settings: typeOfActivitySettings,
        errorMessages: typeOfActivityErrorMessages,
        backLink:
          '/marine-licence/review-site-details#activity-details-site-1-activity-1',
        params: {
          activityDetailsNumber: 1,
          siteNumber: 1
        },
        payload: {}
      })
    })

    test('handler should persist activityType and activitySubType and redirect', async () => {
      const redirectH = createMockH()
      const request = createMockRequest({
        query: { site: 1, activity: 1 },
        payload: {
          activityType: 'removal',
          activitySubTypeConstruction: '',
          activitySubTypeDeposit: '',
          activitySubTypeRemoval: 'removal-type-2'
        }
      })

      await typeOfActivitySubmitController.handler(request, redirectH)

      expect(updateMarineLicenceSiteActivityDetails).toHaveBeenCalledWith(
        request,
        redirectH,
        0,
        0,
        {
          activities: null,
          activityType: 'removal',
          activitySubType: 'removal-type-2'
        }
      )
      expect(redirectH.redirect).toHaveBeenCalledWith(
        '/marine-licence/activity-details/what-are-you-removing-on-an-ongoing-basis?site=1&activity=1'
      )
    })

    describe('activityTypeChanged', () => {
      test('clears activities when activityType changes', async () => {
        const redirectH = createMockH()
        const request = createMockRequest({
          query: { site: 1, activity: 1 },
          payload: {
            activityType: 'deposit',
            activitySubTypeConstruction: '',
            activitySubTypeDeposit: 'deposit-type-1',
            activitySubTypeRemoval: ''
          }
        })

        await typeOfActivitySubmitController.handler(request, redirectH)

        expect(updateMarineLicenceSiteActivityDetails).toHaveBeenCalledWith(
          request,
          redirectH,
          0,
          0,
          {
            activities: null,
            activityType: 'deposit',
            activitySubType: 'deposit-type-1'
          }
        )
      })

      test('clears activities when activitySubType changes', async () => {
        const redirectH = createMockH()
        const request = createMockRequest({
          query: { site: 1, activity: 1 },
          payload: {
            activityType: 'construction',
            activitySubTypeConstruction: 'construction-type-2',
            activitySubTypeDeposit: '',
            activitySubTypeRemoval: ''
          }
        })

        await typeOfActivitySubmitController.handler(request, redirectH)

        expect(updateMarineLicenceSiteActivityDetails).toHaveBeenCalledWith(
          request,
          redirectH,
          0,
          0,
          {
            activities: null,
            activityType: 'construction',
            activitySubType: 'construction-type-2'
          }
        )
      })

      test('does not clear activities when activityType and activitySubType are unchanged', async () => {
        const redirectH = createMockH()
        const request = createMockRequest({
          query: { site: 1, activity: 1 },
          payload: {
            activityType: 'construction',
            activitySubTypeConstruction: 'construction-type-1',
            activitySubTypeDeposit: '',
            activitySubTypeRemoval: ''
          }
        })

        await typeOfActivitySubmitController.handler(request, redirectH)

        expect(updateMarineLicenceSiteActivityDetails).toHaveBeenCalledWith(
          request,
          redirectH,
          0,
          0,
          {
            activityType: 'construction',
            activitySubType: 'construction-type-1'
          }
        )
      })
    })
  })
})
