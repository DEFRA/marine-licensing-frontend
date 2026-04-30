import { vi } from 'vitest'
import {
  monthsOfActivitySubmitController,
  MARINE_LICENCE_MONTHS_OF_ACTIVITY_VIEW_ROUTE
} from '#src/server/marine-licence/site-details/months-of-activity/controller.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'
import {
  getMarineLicenceCache,
  updateMarineLicenceSiteActivityDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/marine-licence/save-site-details.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/marine-licence/save-site-details.js')

describe('#monthsOfActivitySubmitController', () => {
  beforeEach(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
    vi.mocked(updateMarineLicenceSiteActivityDetails).mockResolvedValue()
    vi.mocked(saveSiteDetailsToBackend).mockResolvedValue()
  })

  test('redirects to review site details when activityMonths is no', async () => {
    const h = createMockH()
    const request = createMockRequest({
      query: { site: '1', activity: '1' },
      payload: { months: 'no' }
    })

    await monthsOfActivitySubmitController.handler(request, h)

    expect(updateMarineLicenceSiteActivityDetails).toHaveBeenCalledWith(
      request,
      h,
      0,
      0,
      { activityMonths: { months: 'no' } }
    )

    expect(h.redirect).toHaveBeenCalledWith(
      `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-1-activity-1`
    )
  })

  test('saves details when activityMonths is yes', async () => {
    const h = createMockH()
    const request = createMockRequest({
      query: { site: '1', activity: '1' },
      payload: { months: 'yes', details: 'January to March only' }
    })

    await monthsOfActivitySubmitController.handler(request, h)

    expect(updateMarineLicenceSiteActivityDetails).toHaveBeenCalledWith(
      request,
      h,
      0,
      0,
      { activityMonths: { months: 'yes', details: 'January to March only' } }
    )
  })

  test('failAction renders view with errors', () => {
    const request = createMockRequest({
      query: { site: '1', activity: '1' },
      payload: { months: '' }
    })
    const h = { view: vi.fn().mockReturnThis(), takeover: vi.fn() }
    const err = {
      details: [
        {
          path: ['months'],
          message:
            'Select whether the activity will be limited to specific months of the year',
          type: 'any.required'
        }
      ]
    }

    monthsOfActivitySubmitController.options.validate.failAction(
      request,
      h,
      err
    )

    expect(h.view).toHaveBeenCalledWith(
      MARINE_LICENCE_MONTHS_OF_ACTIVITY_VIEW_ROUTE,
      expect.objectContaining({
        errors: expect.objectContaining({
          months: expect.objectContaining({
            text: 'Select whether the activity will be limited to specific months of the year'
          })
        })
      })
    )
  })
})
