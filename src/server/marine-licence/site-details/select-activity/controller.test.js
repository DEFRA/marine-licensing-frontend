import { vi } from 'vitest'
import {
  selectActivitySubmitController,
  SELECT_ACTIVITY_VIEW_ROUTE
} from '#src/server/marine-licence/site-details/select-activity/controller.js'
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
import { getActivityOptions } from '#src/server/marine-licence/site-details/select-activity/utils.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/marine-licence/save-site-details.js')
vi.mock('~/src/server/common/helpers/createFailAction.js')

describe('#selectActivity', () => {
  beforeEach(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  describe('#selectActivitySubmitController', () => {
    const commonTestExpectedReturn = {
      viewRoute: SELECT_ACTIVITY_VIEW_ROUTE,
      payload: {},
      settings: {
        backLink: '/marine-licence/type-of-activity',
        activityDetailsNumber: 1,
        siteNumber: 1,
        projectName: 'Test Project'
      }
    }

    const h = createMockH()

    test('createFailAction was called with params correctly for construction variant', () => {
      const mockFailAction = vi.fn()
      vi.mocked(createFailAction).mockReturnValue(mockFailAction)

      const request = createMockRequest({
        params: { activityVariant: 'what-are-you-constructing' },
        query: { site: 1, activity: 1 }
      })
      const err = {
        details: [{ path: ['activities'], message: 'validation error' }]
      }

      selectActivitySubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      const expectedActivityOptions = getActivityOptions('construction')

      expect(createFailAction).toHaveBeenCalledWith({
        ...commonTestExpectedReturn,
        errorMessages: {
          ACTIVITIES_OTHER_REASON_REQUIRED:
            'Enter details of the other structures',
          ACTIVITIES_REQUIRED: 'Select at least one type of structure'
        },
        settings: {
          ...commonTestExpectedReturn.settings,
          activityOptions: expectedActivityOptions,
          heading: 'What are you constructing?',
          pageTitle: 'What are you constructing?'
        }
      })
    })

    test('createFailAction was called with params correctly for deposit variant', () => {
      const mockFailAction = vi.fn()
      vi.mocked(createFailAction).mockReturnValue(mockFailAction)

      const mockMarineLicenceApplicationDepositActivity = structuredClone(
        mockMarineLicenceApplication
      )

      mockMarineLicenceApplicationDepositActivity.siteDetails[0].activityDetails[0].activityType =
        'deposit'

      vi.mocked(getMarineLicenceCache).mockReturnValueOnce(
        mockMarineLicenceApplicationDepositActivity
      )

      const request = createMockRequest({
        params: { activityVariant: 'what-deposit-activity-are-you-continuing' },
        query: { site: 1, activity: 1 }
      })
      const err = {
        details: [{ path: ['activities'], message: 'validation error' }]
      }

      selectActivitySubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      const expectedActivityOptions = getActivityOptions('deposit')

      expect(createFailAction).toHaveBeenCalledWith({
        ...commonTestExpectedReturn,
        errorMessages: {
          ACTIVITIES_REQUIRED:
            'Select at least one type of substance or object',
          ACTIVITIES_OTHER_REASON_REQUIRED:
            'Enter details of the other deposits'
        },
        settings: {
          ...commonTestExpectedReturn.settings,
          activityOptions: expectedActivityOptions,
          heading: 'What deposit activity are you continuing?',
          pageTitle: 'What deposit activity are you continuing?'
        }
      })
    })

    test('createFailAction was called with params correctly for removal variant', () => {
      const mockFailAction = vi.fn()
      vi.mocked(createFailAction).mockReturnValue(mockFailAction)

      const mockMarineLicenceApplicationDepositActivity = structuredClone(
        mockMarineLicenceApplication
      )

      mockMarineLicenceApplicationDepositActivity.siteDetails[0].activityDetails[0].activityType =
        'removal'

      vi.mocked(getMarineLicenceCache).mockReturnValueOnce(
        mockMarineLicenceApplicationDepositActivity
      )

      const request = createMockRequest({
        params: { activityVariant: 'what-are-you-removing-for-the-first-time' },
        query: { site: 1, activity: 1 }
      })
      const err = {
        details: [{ path: ['activities'], message: 'validation error' }]
      }

      selectActivitySubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      const expectedActivityOptions = getActivityOptions('removal')

      expect(createFailAction).toHaveBeenCalledWith({
        ...commonTestExpectedReturn,
        errorMessages: {
          ACTIVITIES_REQUIRED: 'Select at least one substance or object',
          ACTIVITIES_OTHER_REASON_REQUIRED:
            'Enter details of the other substances or objects'
        },
        settings: {
          ...commonTestExpectedReturn.settings,
          activityOptions: expectedActivityOptions,
          heading:
            'What are you removing for the first time on a one off basis?',
          pageTitle:
            'What are you removing for the first time on a one off basis?'
        }
      })
    })

    test('handler should persist activityType and activitySubType and redirect', async () => {
      const redirectH = createMockH()
      const request = createMockRequest({
        query: { site: 1, activity: 1 },
        payload: {
          activities: ['CON1'],
          otherActivity: ''
        }
      })

      await selectActivitySubmitController.handler(request, redirectH)

      expect(updateMarineLicenceSiteActivityDetails).toHaveBeenCalledWith(
        request,
        redirectH,
        0,
        0,
        {
          activities: {
            selections: ['CON1']
          }
        }
      )
      expect(redirectH.redirect).toHaveBeenCalledWith(
        '/marine-licence/review-site-details#activity-details-site-1-activity-1'
      )
      expect(redirectH.redirect).toHaveBeenCalled()
    })
  })
})
