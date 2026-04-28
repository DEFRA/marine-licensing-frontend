import { vi } from 'vitest'
import {
  activityDurationSubmitController,
  activityDurationSettings,
  MARINE_LICENCE_DURATION_VIEW_ROUTE
} from '#src/server/marine-licence/site-details/activity-duration/controller.js'
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
vi.mock('~/src/server/common/helpers/marine-licence/save-site-details.js')

describe('#activityDuration', () => {
  beforeEach(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  describe('#activityDurationSubmitController', () => {
    test('createFailAction was called with params', () => {
      const mockFailAction = vi.fn()
      vi.mocked(createFailAction).mockReturnValue(mockFailAction)

      const request = createMockRequest({ query: { site: 1, activity: 1 } })
      const h = createMockH()
      const err = new Error('validation error')

      activityDurationSubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      expect(createFailAction).toHaveBeenCalledWith({
        projectName: 'Test Project',
        viewRoute: MARINE_LICENCE_DURATION_VIEW_ROUTE,
        settings: activityDurationSettings,
        errorMessages: {
          DURATION_BOTH_ZERO: 'Years and months cannot both be 0',
          DURATION_REQUIRED: 'Enter the maximum duration of the activity',
          MONTHS_NOT_VALID:
            'Number of months must be an integer between 0 and 11',
          MONTHS_REQUIRED: 'Enter the number of months',
          YEARS_NOT_INTEGER: 'Number of years must be an integer',
          YEARS_REQUIRED: 'Enter the number of years'
        },
        backLink:
          '/marine-licence/review-site-details#activity-details-site-1-activity-1',
        params: {
          activityDetailsNumber: 1,
          siteNumber: 1
        },
        payload: {}
      })
    })

    test('handler should persist durationYears and durationMonths and redirect', async () => {
      const redirectH = createMockH()
      const request = createMockRequest({
        query: { site: 1, activity: 1 },
        payload: {
          'activity-duration-years': '2',
          'activity-duration-months': '6'
        }
      })

      await activityDurationSubmitController.handler(request, redirectH)

      expect(updateMarineLicenceSiteActivityDetails).toHaveBeenCalledWith(
        request,
        redirectH,
        0,
        0,
        {
          activityDuration: {
            months: '6',
            years: '2'
          }
        }
      )
      expect(redirectH.redirect).toHaveBeenCalledWith(
        '/marine-licence/review-site-details?site=1&activity=1'
      )
    })
  })
})
