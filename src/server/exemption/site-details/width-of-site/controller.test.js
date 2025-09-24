import { setupTestServer } from '~/tests/integration/shared/test-setup-helpers.js'
import {
  widthOfSiteController,
  widthOfSiteSubmitController,
  WIDTH_OF_SITE_VIEW_ROUTE
} from '~/src/server/exemption/site-details/width-of-site/controller.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { mockExemption, mockSite } from '~/src/server/test-helpers/mocks.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { config } from '~/src/config/config.js'
import { JSDOM } from 'jsdom'
import { routes } from '~/src/server/common/constants/routes.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#widthOfSite', () => {
  const getServer = setupTestServer()
  let getExemptionCacheSpy

  beforeEach(() => {
    getExemptionCacheSpy = jest
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
  })

  describe('#widthOfSiteController', () => {
    test('widthController handler should render with correct context', () => {
      const h = { view: jest.fn() }

      widthOfSiteController.handler({ site: mockSite }, h)

      expect(h.view).toHaveBeenCalledWith(WIDTH_OF_SITE_VIEW_ROUTE, {
        pageTitle: 'Enter the width of the circular site in metres',
        heading: 'Enter the width of the circular site in metres',
        backLink: routes.CIRCLE_CENTRE_POINT,
        payload: {
          width: mockExemption.siteDetails[0].circleWidth
        },
        projectName: 'Test Project'
      })
    })

    test('widthController handler should render with correct context with no existing cache data', () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName
      })

      const h = { view: jest.fn() }

      widthOfSiteController.handler({ site: mockSite }, h)

      expect(h.view).toHaveBeenCalledWith(WIDTH_OF_SITE_VIEW_ROUTE, {
        pageTitle: 'Enter the width of the circular site in metres',
        heading: 'Enter the width of the circular site in metres',
        backLink: routes.CIRCLE_CENTRE_POINT,
        payload: {},
        projectName: 'Test Project'
      })
    })

    test('Should provide expected response and correctly pre populate data', async () => {
      const { result, statusCode } = await makeGetRequest({
        url: routes.WIDTH_OF_SITE,
        server: getServer()
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
        mockExemption.siteDetails[0].circleWidth
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

    test('Should redirect to review site details page when POST is successful', async () => {
      const h = {
        redirect: jest.fn()
      }

      await widthOfSiteSubmitController.handler(
        { payload: { width: 'single' }, site: mockSite },
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })

    test('Should trim spaces from the width string', async () => {
      const h = {
        redirect: jest.fn()
      }

      const mockRequest = { payload: { width: ' 50 ' }, site: mockSite }
      await widthOfSiteSubmitController.handler(mockRequest, h)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        0,
        'circleWidth',
        '50'
      )
    })

    test('Should correctly set the cache when submitting', async () => {
      const h = {
        redirect: jest.fn().mockReturnValue({
          takeover: jest.fn()
        }),
        view: jest.fn()
      }

      const mockRequest = { payload: { width: 'single' }, site: mockSite }

      await widthOfSiteSubmitController.handler(mockRequest, h)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        0,
        'circleWidth',
        'single'
      )
    })
  })
})
