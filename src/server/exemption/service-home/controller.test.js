import { vi } from 'vitest'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { routes } from '#src/server/common/constants/routes.js'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { serviceHomeController, SERVICE_HOME_VIEW_ROUTE } from './controller.js'
import { config } from '#src/config/config.js'

vi.mock('~/src/server/common/helpers/page-view-common-data.js')

describe('#serviceHome', () => {
  const getServer = setupTestServer()

  describe('#serviceHomeController', () => {
    test('Should return success response code', async () => {
      const { statusCode } = await makeGetRequest({
        server: getServer(),
        url: routes.SERVICE_HOME
      })

      expect(statusCode).toBe(statusCodes.ok)
    })

    test('Should render the service home view', async () => {
      const { result } = await makeGetRequest({
        server: getServer(),
        url: routes.SERVICE_HOME
      })

      expect(result).toContain('Home')
    })

    test('Should render service home template with correct context', () => {
      const h = { view: vi.fn() }
      const request = {}

      serviceHomeController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(SERVICE_HOME_VIEW_ROUTE, {
        pageTitle: 'Home',
        heading: 'Home',
        marineLicenseEnabled: false,
        cards: [
          {
            description: 'View all of the existing projects in this account.',
            link: '/projects',
            title: 'View Projects'
          },
          {
            description:
              "Find out if an activity needs a marine licence or if it's exempt.",
            link: 'https://marinelicensing.marinemanagement.org.uk/mmofox5/journey/self-service/start',
            title: 'Check if I need a marine licence'
          },
          {
            description:
              'View or manage projects not available in this account.',
            link: 'https://marinelicensing.marinemanagement.org.uk/mmofox5/fox/live/MMO_LOGIN/login',
            title: 'Sign in to the Marine Case Management System'
          }
        ]
      })
    })

    test('Should include Apply for Marine License card when feature enabled', () => {
      vi.spyOn(config, 'get').mockReturnValue({ enabled: true })
      const h = { view: vi.fn() }
      const request = {}

      serviceHomeController.handler(request, h)

      const viewContext = h.view.mock.calls[0][1]
      expect(viewContext.marineLicenseEnabled).toBe(true)
      expect(viewContext.cards).toHaveLength(4)
      expect(viewContext.cards[2].title).toBe('Apply for a Marine License')
    })
  })
})
