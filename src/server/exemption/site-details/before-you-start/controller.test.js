import { vi } from 'vitest'
import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import {
  beforeYouStartController,
  BEFORE_YOU_START_SITE_DETAILS_VIEW_ROUTE
} from '~/src/server/exemption/site-details/before-you-start/controller.js'
import { getExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { config } from '~/src/config/config.js'
import { routes } from '~/src/server/common/constants/routes.js'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#beforeYouStart', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    vi.mocked(getExemptionCache).mockReturnValue(mockExemption)
  })

  describe('#beforeYouStartController', () => {
    test('beforeYouStartController handler should render with correct context', () => {
      const h = { view: vi.fn() }

      beforeYouStartController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(
        BEFORE_YOU_START_SITE_DETAILS_VIEW_ROUTE,
        {
          pageTitle: 'Site details',
          heading: 'Site details',
          projectName: 'Test Project'
        }
      )
    })

    test('Should provide expected response and correctly display project name', async () => {
      const { result, statusCode } = await makeGetRequest({
        url: routes.SITE_DETAILS,
        server: getServer()
      })

      expect(result).toEqual(
        expect.stringContaining(`Site details | ${config.get('serviceName')}`)
      )

      expect(statusCode).toBe(statusCodes.ok)
    })
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
