import { vi } from 'vitest'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import {
  beforeYouStartController,
  BEFORE_YOU_START_SITE_DETAILS_VIEW_ROUTE
} from '#src/server/exemption/site-details/before-you-start/controller.js'
import {
  clearSavedSiteDetails,
  getExemptionCache
} from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { mockExemption } from '#src/server/test-helpers/mocks/exemption.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { routes } from '#src/server/common/constants/routes.js'

vi.mock('~/src/server/common/helpers/exemptions/session-cache/utils.js')

describe('#beforeYouStart', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.mocked(getExemptionCache).mockReturnValue(mockExemption)
    vi.mocked(clearSavedSiteDetails)
  })

  describe('#beforeYouStartController', () => {
    test('beforeYouStartController handler should render with correct context', async () => {
      const h = { view: vi.fn() }

      await beforeYouStartController.handler({ yar: { clear: vi.fn() } }, h)

      expect(h.view).toHaveBeenCalledWith(
        BEFORE_YOU_START_SITE_DETAILS_VIEW_ROUTE,
        {
          pageTitle: 'Site details',
          heading: 'Site details',
          projectName: 'Test Project'
        }
      )
    })

    test('Should provide expected response', async () => {
      const { statusCode } = await makeGetRequest({
        url: routes.SITE_DETAILS,
        server: getServer()
      })

      expect(statusCode).toBe(statusCodes.ok)
    })
  })
})
