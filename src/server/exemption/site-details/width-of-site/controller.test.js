import { vi } from 'vitest'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import {
  widthOfSiteController,
  widthOfSiteSubmitController,
  WIDTH_OF_SITE_VIEW_ROUTE
} from '#src/server/exemption/site-details/width-of-site/controller.js'
import * as cacheUtils from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import {
  mockExemption,
  mockSite
} from '#src/server/test-helpers/mocks/exemption.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { JSDOM } from 'jsdom'
import { routes } from '#src/server/common/constants/routes.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/exemptions/save-site-details.js'

vi.mock('~/src/server/common/helpers/exemptions/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/exemptions/save-site-details.js')

describe('#widthOfSite', () => {
  const getServer = setupTestServer()
  let getExemptionCacheSpy

  beforeEach(() => {
    getExemptionCacheSpy = vi
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)

    vi.mocked(saveSiteDetailsToBackend).mockResolvedValue()
  })

  describe('#widthOfSiteController', () => {
    test('widthController handler should render with correct context', () => {
      const h = { view: vi.fn() }

      widthOfSiteController.handler({ query: {}, site: mockSite }, h)

      expect(h.view).toHaveBeenCalledWith(WIDTH_OF_SITE_VIEW_ROUTE, {
        pageTitle: 'Enter the width of the circular site in metres',
        heading: 'Enter the width of the circular site in metres',
        backLink: routes.CIRCLE_CENTRE_POINT,
        cancelLink: '/exemption/task-list?cancel=site-details',
        payload: {
          width: mockExemption.siteDetails[0].circleWidth
        },
        projectName: 'Test Project',
        siteNumber: null,
        action: undefined
      })
    })

    test('widthController handler should render with correct context with no existing cache data', () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName
      })

      const h = { view: vi.fn() }

      widthOfSiteController.handler({ query: {}, site: mockSite }, h)

      expect(h.view).toHaveBeenCalledWith(WIDTH_OF_SITE_VIEW_ROUTE, {
        pageTitle: 'Enter the width of the circular site in metres',
        heading: 'Enter the width of the circular site in metres',
        backLink: routes.CIRCLE_CENTRE_POINT,
        cancelLink: '/exemption/task-list?cancel=site-details',
        payload: {
          width: undefined
        },
        projectName: 'Test Project',
        siteNumber: null,
        action: undefined
      })
    })

    test('widthController handler should render correctly when using a change link', () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName,
        multipleSiteDetails: { multipleSitesEnabled: true }
      })

      const h = { view: vi.fn() }

      const request = createMockRequest({
        query: { action: 'change' },
        site: mockSite
      })

      widthOfSiteController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(WIDTH_OF_SITE_VIEW_ROUTE, {
        pageTitle: 'Enter the width of the circular site in metres',
        heading: 'Enter the width of the circular site in metres',
        backLink: routes.REVIEW_SITE_DETAILS + '#site-details-1',
        cancelLink: undefined,
        payload: {
          width: undefined
        },
        projectName: 'Test Project',
        siteNumber: 1,
        action: 'change'
      })
    })

    test('Should provide expected response and correctly pre populate data', async () => {
      const { result, statusCode } = await makeGetRequest({
        url: routes.WIDTH_OF_SITE,
        server: getServer()
      })

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
        query: {},
        payload: { width: 'invalid' }
      }

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
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
        cancelLink: '/exemption/task-list?cancel=site-details',
        projectName: 'Test Project',
        payload: { width: 'invalid' },
        siteNumber: null,
        action: undefined,
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
        query: {},
        payload: { width: 'invalid' }
      }

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      widthOfSiteSubmitController.options.validate.failAction(request, h, {})

      expect(h.view).toHaveBeenCalledWith(WIDTH_OF_SITE_VIEW_ROUTE, {
        pageTitle: 'Enter the width of the circular site in metres',
        heading: 'Enter the width of the circular site in metres',
        backLink: routes.CIRCLE_CENTRE_POINT,
        cancelLink: '/exemption/task-list?cancel=site-details',
        projectName: 'Test Project',
        payload: { width: 'invalid' },
        siteNumber: null,
        action: undefined
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly output errors for multiple sites', () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName,
        multipleSiteDetails: { multipleSitesEnabled: true }
      })

      const request = {
        query: {},
        payload: { width: 'invalid' }
      }

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      widthOfSiteSubmitController.options.validate.failAction(request, h, {})

      expect(h.view).toHaveBeenCalledWith(WIDTH_OF_SITE_VIEW_ROUTE, {
        pageTitle: 'Enter the width of the circular site in metres',
        heading: 'Enter the width of the circular site in metres',
        backLink: routes.CIRCLE_CENTRE_POINT,
        cancelLink: '/exemption/task-list?cancel=site-details',
        projectName: 'Test Project',
        payload: { width: 'invalid' },
        siteNumber: 1,
        action: undefined
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should redirect to review site details page when POST is successful', async () => {
      const h = {
        redirect: vi.fn()
      }

      await widthOfSiteSubmitController.handler(
        { query: {}, payload: { width: 'single' }, site: mockSite },
        h
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })

    test('Should trim spaces from the width string', async () => {
      const h = {
        redirect: vi.fn()
      }

      const mockRequest = {
        payload: { width: ' 50 ' },
        site: mockSite,
        query: { action: 'change' }
      }
      await widthOfSiteSubmitController.handler(mockRequest, h)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        h,
        0,
        'circleWidth',
        '50'
      )

      expect(saveSiteDetailsToBackend).toHaveBeenCalledWith(mockRequest, h)
    })

    test('Should correctly set the cache when submitting', async () => {
      const h = {
        redirect: vi.fn().mockReturnValue({
          takeover: vi.fn()
        }),
        view: vi.fn()
      }

      const mockRequest = createMockRequest({
        payload: { width: 'single' },
        site: mockSite,
        query: { action: 'change' }
      })

      await widthOfSiteSubmitController.handler(mockRequest, h)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        h,
        0,
        'circleWidth',
        'single'
      )
      expect(saveSiteDetailsToBackend).toHaveBeenCalledWith(mockRequest, h)
    })
  })
})
