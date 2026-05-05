import { vi } from 'vitest'
import {
  workingHoursSubmitController,
  MARINE_LICENCE_WORKING_HOURS_VIEW_ROUTE
} from '#src/server/marine-licence/site-details/working-hours/controller.js'
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

describe('#workingHoursSubmitController', () => {
  beforeEach(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
    vi.mocked(updateMarineLicenceSiteActivityDetails).mockResolvedValue()
    vi.mocked(saveSiteDetailsToBackend).mockResolvedValue()
  })

  test('redirects to review site details', async () => {
    const h = createMockH()
    const request = createMockRequest({
      query: { site: '1', activity: '1' },
      payload: { workingHours: 'Monday to Friday, 9am to 5pm' }
    })

    await workingHoursSubmitController.handler(request, h)

    expect(updateMarineLicenceSiteActivityDetails).toHaveBeenCalledWith(
      request,
      h,
      0,
      0,
      { workingHours: 'Monday to Friday, 9am to 5pm' }
    )

    expect(saveSiteDetailsToBackend).toHaveBeenCalledWith(request, h, {
      siteIndex: 0
    })

    expect(h.redirect).toHaveBeenCalledWith(
      `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-1-activity-1`
    )
  })

  test('failAction renders view with errors', () => {
    const request = createMockRequest({
      query: { site: '1', activity: '1' },
      payload: { workingHours: '' }
    })
    const h = { view: vi.fn().mockReturnThis(), takeover: vi.fn() }
    const err = {
      details: [
        {
          path: ['workingHours'],
          message: 'Enter the proposed working hours',
          type: 'string.empty'
        }
      ]
    }

    workingHoursSubmitController.options.validate.failAction(request, h, err)

    expect(h.view).toHaveBeenCalledWith(
      MARINE_LICENCE_WORKING_HOURS_VIEW_ROUTE,
      expect.objectContaining({
        errors: expect.objectContaining({
          workingHours: expect.objectContaining({
            text: 'Enter the proposed working hours'
          })
        })
      })
    )
  })
})
