import { vi } from 'vitest'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import {
  beforeYouStartController,
  BEFORE_YOU_START_SITE_DETAILS_VIEW_ROUTE
} from '#src/server/marine-licence/site-details/before-you-start/controller.js'
import {
  clearSavedMarineLicenceSiteDetails,
  getMarineLicenceCache
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')

describe('#beforeYouStart', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.mocked(getMarineLicenceCache).mockReturnValue(
      mockMarineLicenceApplication
    )
    vi.mocked(clearSavedMarineLicenceSiteDetails)
  })

  describe('#beforeYouStartController', () => {
    test('beforeYouStartController handler should render with correct context', async () => {
      const h = { view: vi.fn() }

      await beforeYouStartController.handler({ yar: { clear: vi.fn() } }, h)

      expect(h.view).toHaveBeenCalledWith(
        BEFORE_YOU_START_SITE_DETAILS_VIEW_ROUTE,
        {
          backLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST,
          cancelLink: `${marineLicenceRoutes.MARINE_LICENCE_TASK_LIST}?cancel=site-details`,
          continueLink:
            marineLicenceRoutes.MARINE_LICENCE_COORDINATES_TYPE_CHOICE,
          pageTitle: 'Site details',
          heading: 'Site details',
          projectName: 'Test Project',
          isMarineLicence: true
        }
      )
    })

    test('Should provide expected response', async () => {
      const { statusCode } = await makeGetRequest({
        url: marineLicenceRoutes.MARINE_LICENCE_SITE_DETAILS,
        server: getServer()
      })

      expect(statusCode).toBe(statusCodes.ok)
    })
  })
})
