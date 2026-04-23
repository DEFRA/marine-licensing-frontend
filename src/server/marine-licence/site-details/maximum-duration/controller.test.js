import { vi } from 'vitest'
import {
  durationSubmitController,
  durationSettings,
  durationErrorMessages,
  MARINE_LICENCE_DURATION_VIEW_ROUTE
} from '#src/server/marine-licence/site-details/maximum-duration/controller.js'
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

describe('#duration', () => {
  beforeEach(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  describe('#durationSubmitController', () => {
    test('createFailAction was called with params', () => {
      const mockFailAction = vi.fn()
      vi.mocked(createFailAction).mockReturnValue(mockFailAction)

      const request = createMockRequest({ query: { site: 1, activity: 1 } })
      const h = createMockH()
      const err = new Error('validation error')

      durationSubmitController.options.validate.failAction(request, h, err)

      expect(createFailAction).toHaveBeenCalledWith({
        projectName: 'Test Project',
        viewRoute: MARINE_LICENCE_DURATION_VIEW_ROUTE,
        settings: durationSettings,
        errorMessages: { DURATION_REQUIRED: 'Enter the maximum duration of the activity' },
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
          'duration-years': '2',
          'duration-months': '6'
        }
      })

      await durationSubmitController.handler(request, redirectH)

      expect(updateMarineLicenceSiteActivityDetails).toHaveBeenCalledWith(
        request,
        redirectH,
        0,
        0,
        {
          durationYears: '2',
          durationMonths: '6'
        }
      )
      expect(redirectH.redirect).toHaveBeenCalledWith(
        '/marine-licence/review-site-details?site=1&activity=1'
      )
    })
  })
})
