import { createServer } from '~/src/server/index.js'
import {
  widthOfSiteController,
  widthOfSiteSubmitController,
  WIDTH_OF_SITE_VIEW_ROUTE
} from '~/src/server/exemption/site-details/width-of-site/controller.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { config } from '~/src/config/config.js'
import { JSDOM } from 'jsdom'
import { routes } from '~/src/server/common/constants/routes.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#widthOfSite', () => {
  /** @type {Server} */
  let server
  let getExemptionCacheSpy

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    jest.resetAllMocks()
    getExemptionCacheSpy = jest
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('#widthOfSiteController', () => {
    test('widthController handler should render with correct context', () => {
      const h = { view: jest.fn() }

      widthOfSiteController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(WIDTH_OF_SITE_VIEW_ROUTE, {
        pageTitle: 'Enter the width of the circular site in metres',
        heading: 'Enter the width of the circular site in metres',
        backLink: routes.CIRCLE_CENTRE_POINT,
        payload: {
          width: mockExemption.siteDetails.circleWidth
        },
        projectName: 'Test Project'
      })
    })

    test('widthController handler should render with correct context with no existing cache data', () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName
      })

      const h = { view: jest.fn() }

      widthOfSiteController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(WIDTH_OF_SITE_VIEW_ROUTE, {
        pageTitle: 'Enter the width of the circular site in metres',
        heading: 'Enter the width of the circular site in metres',
        backLink: routes.CIRCLE_CENTRE_POINT,
        payload: {},
        projectName: 'Test Project'
      })
    })

    test('Should provide expected response and correctly pre populate data', async () => {
      const { result, statusCode } = await server.inject({
        method: 'GET',
        url: routes.WIDTH_OF_SITE
      })

      expect(result).toEqual(
        expect.stringContaining(
          `Enter the width of the circular site in metres | ${config.get('serviceName')}`
        )
      )

      const { document } = new JSDOM(result).window

      expect(document.querySelector('h1').textContent.trim()).toBe(
        'Enter the width of the circular site in metres'
      )

      expect(
        document.querySelector('.govuk-caption-l').textContent.trim()
      ).toBe('Test Project')

      expect(
        document.querySelector('.govuk-caption-l').textContent.trim()
      ).toBe(mockExemption.projectName)

      expect(document.querySelector('#width').value).toBe(
        mockExemption.siteDetails.circleWidth
      )

      expect(
        document
          .querySelector(
            `.govuk-back-link[href="${routes.CIRCLE_CENTRE_POINT}"`
          )
          .textContent.trim()
      ).toBe('Back')

      expect(
        document
          .querySelector(
            '.govuk-link[href="/exemption/task-list?cancel=site-details"'
          )
          .textContent.trim()
      ).toBe('Cancel')

      expect(statusCode).toBe(statusCodes.ok)
    })
  })

  describe('#widthOfSiteSubmitController', () => {
    test('Should correctly format error data', () => {
      const request = {
        payload: { width: 'invalid' }
      }

      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      const err = {
        details: [
          {
            path: ['width'],
            message: 'TEST',
            type: 'any.only'
          }
        ]
      }

      widthOfSiteSubmitController.options.validate.failAction(request, h, err)

      expect(h.view).toHaveBeenCalledWith(WIDTH_OF_SITE_VIEW_ROUTE, {
        pageTitle: 'Enter the width of the circular site in metres',
        heading: 'Enter the width of the circular site in metres',
        backLink: routes.CIRCLE_CENTRE_POINT,
        projectName: 'Test Project',
        payload: { width: 'invalid' },
        errorSummary: [
          {
            href: '#width',
            text: 'TEST',
            field: ['width']
          }
        ],
        errors: {
          width: {
            field: ['width'],
            href: '#width',
            text: 'TEST'
          }
        }
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly output page with no error data in object', () => {
      const request = {
        payload: { width: 'invalid' }
      }

      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      widthOfSiteSubmitController.options.validate.failAction(request, h, {})

      expect(h.view).toHaveBeenCalledWith(WIDTH_OF_SITE_VIEW_ROUTE, {
        pageTitle: 'Enter the width of the circular site in metres',
        heading: 'Enter the width of the circular site in metres',
        backLink: routes.CIRCLE_CENTRE_POINT,
        projectName: 'Test Project',
        payload: { width: 'invalid' }
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should stay on current page when POST is successful', async () => {
      const h = {
        redirect: jest.fn()
      }

      await widthOfSiteSubmitController.handler(
        { payload: { width: 'single' } },
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.WIDTH_OF_SITE)
    })

    test('Should correctly set the cache when submitting', async () => {
      const h = {
        redirect: jest.fn().mockReturnValue({
          takeover: jest.fn()
        }),
        view: jest.fn()
      }

      const mockRequest = { payload: { width: 'single' } }

      await widthOfSiteSubmitController.handler(mockRequest, h)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        'circleWidth',
        'single'
      )
    })
  })
})
