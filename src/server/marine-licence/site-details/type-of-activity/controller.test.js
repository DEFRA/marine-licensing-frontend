import { vi } from 'vitest'
import {
  typeOfActivitySubmitController,
  MARINE_LICENCE_TYPE_OF_ACTIVITY_VIEW_ROUTE,
  typeOfActivityErrorMessages
} from '#src/server/marine-licence/site-details/type-of-activity/controller.js'

import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  getMarineLicenceCache,
  updateMarineLicenceSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#typeOfActivity', () => {
  beforeEach(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
  })

  describe('#typeOfActivitySubmitController', () => {
    test('failAction should pass errors through to view', () => {
      const request = {
        payload: {
          activityType: 'construction',
          activitySubTypeConstruction: ''
        }
      }
      const viewH = {
        view: vi.fn().mockReturnValue({ takeover: vi.fn() })
      }

      const err = {
        details: [
          {
            path: ['activitySubTypeConstruction'],
            message: 'ACTIVITY_TYPE_CONSTRUCTION_REQUIRED',
            type: 'custom'
          }
        ]
      }

      typeOfActivitySubmitController.options.validate.failAction(
        request,
        viewH,
        err
      )

      expect(viewH.view).toHaveBeenCalledWith(
        MARINE_LICENCE_TYPE_OF_ACTIVITY_VIEW_ROUTE,
        expect.objectContaining({
          errorSummary: [
            {
              href: '#activitySubTypeConstruction',
              text: typeOfActivityErrorMessages.ACTIVITY_TYPE_CONSTRUCTION_REQUIRED,
              field: ['activitySubTypeConstruction']
            }
          ]
        })
      )
      expect(viewH.view().takeover).toHaveBeenCalled()
    })

    test('handler should persist activityType and activitySubType and redirect', async () => {
      const redirectH = {
        redirect: vi.fn().mockReturnValue({ takeover: vi.fn() })
      }
      const request = {
        payload: {
          activityType: 'removal',
          activitySubTypeConstruction: '',
          activitySubTypeDeposit: '',
          activitySubTypeRemoval: 'removal-type-2'
        }
      }

      await typeOfActivitySubmitController.handler(request, redirectH)

      expect(updateMarineLicenceSiteDetails).toHaveBeenNthCalledWith(
        1,
        request,
        redirectH,
        0,
        'activityType',
        'removal'
      )
      expect(updateMarineLicenceSiteDetails).toHaveBeenNthCalledWith(
        2,
        request,
        redirectH,
        0,
        'activitySubType',
        'removal-type-2'
      )
      expect(redirectH.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
      )
      expect(redirectH.redirect().takeover).toHaveBeenCalled()
    })
  })
})
