import { createServer } from '~/src/server/index.js'
import {
  beforeYouStartController,
  BEFORE_YOU_START_SITE_DETAILS_VIEW_ROUTE
} from '~/src/server/exemption/site-details/before-you-start/controller.js'
import { getExemptionCache } from '~/src/server/common/helpers/session-cache/utils.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { config } from '~/src/config/config.js'
import { JSDOM } from 'jsdom'
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

      const { document } = new JSDOM(result).window

      expect(document.querySelector('h1').textContent.trim()).toBe(
        'Site details'
      )

      expect(
        document.querySelector('.govuk-caption-l').textContent.trim()
      ).toBe('Test Project')

      expect(
        document.querySelector('.govuk-caption-l').textContent.trim()
      ).toBe(mockExemption.projectName)

      expect(
        document
          .querySelector('.govuk-back-link[href="/exemption/task-list"')
          .textContent.trim()
      ).toBe('Back')

      expect(
        document
          .querySelector(
            '.govuk-link[href="/exemption/task-list?cancel=site-details"'
          )
          .textContent.trim()
      ).toBe('Cancel')

      expect(
        document
          .querySelector(
            '.govuk-button[href="/exemption/how-do-you-want-to-provide-the-coordinates"'
          )
          .textContent.trim()
      ).toBe('Continue')

      // Check for the main content sections
      expect(
        document.querySelector('h2.govuk-heading-m').textContent.trim()
      ).toBe('Before you start')
      expect(document.querySelectorAll('h2.govuk-heading-m')).toHaveLength(3)
      expect(
        document.querySelector('h3.govuk-heading-s').textContent.trim()
      ).toBe('Projects with multiple sites')

      expect(statusCode).toBe(statusCodes.ok)
    })
  })
})

/**
 * @import { Server } from '@hapi/hapi'
 */
