import { createServer } from '~/src/server/index.js'
import {
  beforeYouStartController,
  BEFORE_YOU_START_SITE_DETAILS_VIEW_ROUTE
} from '~/src/server/exemption/site-details/before-you-start/controller.js'
import { getExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { config } from '~/src/config/config.js'
import { routes } from '~/src/server/common/constants/routes.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#beforeYouStart', () => {
  /** @type {Server} */
  let server

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    jest.resetAllMocks()
    jest.mocked(getExemptionCache).mockReturnValue(mockExemption)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('#beforeYouStartController', () => {
    test('beforeYouStartController handler should render with correct context', () => {
      const h = { view: jest.fn() }

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
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: routes.SITE_DETAILS
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
