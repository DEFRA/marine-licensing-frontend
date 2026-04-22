import { vi } from 'vitest'
import {
  activityDescriptionSubmitController,
  MARINE_LICENCE_ACTIVITY_DESCRIPTION_VIEW_ROUTE
} from '#src/server/marine-licence/site-details/activity-description/controller.js'
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

describe('#activityDescriptionSubmitController', () => {
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
      payload: { activityDescription: 'Test description' }
    })

    await activityDescriptionSubmitController.handler(request, h)

    expect(updateMarineLicenceSiteActivityDetails).toHaveBeenCalledWith(
      request,
      h,
      0,
      0,
      { activityDescription: 'Test description' }
    )

    expect(h.redirect).toHaveBeenCalledWith(
      `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-1-activity-1`
    )
  })

  test('failAction renders view with errors', () => {
    const request = createMockRequest({
      query: { site: '1', activity: '1' },
      payload: { activityDescription: '' }
    })
    const h = { view: vi.fn().mockReturnThis(), takeover: vi.fn() }
    const err = {
      details: [
        {
          path: ['activityDescription'],
          message: 'Enter the activity description',
          type: 'string.empty'
        }
      ]
    }

    activityDescriptionSubmitController.options.validate.failAction(
      request,
      h,
      err
    )

    expect(h.view).toHaveBeenCalledWith(
      MARINE_LICENCE_ACTIVITY_DESCRIPTION_VIEW_ROUTE,
      expect.objectContaining({
        errors: expect.objectContaining({
          activityDescription: expect.objectContaining({
            text: 'Enter the activity description'
          })
        })
      })
    )
  })
})
