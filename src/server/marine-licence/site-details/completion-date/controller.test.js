import { vi } from 'vitest'
import {
  completionDateSubmitController,
  MARINE_LICENCE_COMPLETION_DATE_VIEW_ROUTE
} from '#src/server/marine-licence/site-details/completion-date/controller.js'
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

describe('#completionDateSubmitController', () => {
  beforeEach(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
    vi.mocked(updateMarineLicenceSiteActivityDetails).mockResolvedValue()
    vi.mocked(saveSiteDetailsToBackend).mockResolvedValue()
  })

  test('redirects to review site details when completionDate is no', async () => {
    const h = createMockH()
    const request = createMockRequest({
      query: { site: '1', activity: '1' },
      payload: { date: 'no' }
    })

    await completionDateSubmitController.handler(request, h)

    expect(updateMarineLicenceSiteActivityDetails).toHaveBeenCalledWith(
      request,
      h,
      0,
      0,
      { completionDate: { date: 'no' } }
    )

    expect(h.redirect).toHaveBeenCalledWith(
      `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#activity-details-site-1-activity-1`
    )
  })

  test('saves reason when completionDate is yes', async () => {
    const h = createMockH()
    const request = createMockRequest({
      query: { site: '1', activity: '1' },
      payload: { date: 'yes', reason: 'Test reason' }
    })

    await completionDateSubmitController.handler(request, h)

    expect(updateMarineLicenceSiteActivityDetails).toHaveBeenCalledWith(
      request,
      h,
      0,
      0,
      { completionDate: { date: 'yes', reason: 'Test reason' } }
    )
  })

  test('failAction renders view with errors', () => {
    const request = createMockRequest({
      query: { site: '1', activity: '1' },
      payload: { date: '' }
    })
    const h = { view: vi.fn().mockReturnThis(), takeover: vi.fn() }
    const err = {
      details: [
        {
          path: ['date'],
          message:
            'Select whether any part of the project needs to be completed by a certain date',
          type: 'any.required'
        }
      ]
    }

    completionDateSubmitController.options.validate.failAction(request, h, err)

    expect(h.view).toHaveBeenCalledWith(
      MARINE_LICENCE_COMPLETION_DATE_VIEW_ROUTE,
      expect.objectContaining({
        errors: expect.objectContaining({
          date: expect.objectContaining({
            text: 'Select whether any part of the project needs to be completed by a certain date'
          })
        })
      })
    )
  })
})
