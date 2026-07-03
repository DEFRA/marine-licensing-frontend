import { vi } from 'vitest'
import {
  marineLicenceRoutes,
  routes
} from '#src/server/common/constants/routes.js'
import {
  feeEstimateAreYouSureController,
  FEE_ESTIMATE_ARE_YOU_SURE_VIEW_ROUTE
} from '#src/server/marine-licence/fee-estimate-are-you-sure/controller.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'

vi.mock('#src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#feeEstimateAreYouSure', () => {
  const mockLicence = {
    projectName: 'Test Project',
    id: 'test-id'
  }

  beforeEach(() => {
    vi.spyOn(cacheUtils, 'getMarineLicenceCache').mockReturnValue(mockLicence)
  })

  describe('#feeEstimateAreYouSureController', () => {
    test('should render view with project data from cache', async () => {
      const h = { view: vi.fn() }
      await feeEstimateAreYouSureController.handler({ query: {} }, h)
      expect(h.view).toHaveBeenCalledWith(
        FEE_ESTIMATE_ARE_YOU_SURE_VIEW_ROUTE,
        {
          pageTitle: 'Are you sure you do not accept the fee estimate?',
          heading: 'Are you sure you do not accept the fee estimate?',
          warningText:
            'If you do not accept the fee estimate you will not be able to submit your application.',
          bodyText:
            'The information provided will be saved as a draft in this account. You can come back later to accept the fee estimate if you need to submit your application.',
          projectName: mockLicence.projectName,
          backLink: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_FEE_ESTIMATE,
          finishLink: routes.DASHBOARD
        }
      )
    })
  })
})
