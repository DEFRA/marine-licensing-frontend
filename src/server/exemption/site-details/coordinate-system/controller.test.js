import { vi } from 'vitest'
import { setupTestServer } from '#tests/integration/shared/test-setup-helpers.js'
import {
  coordinateSystemController,
  coordinateSystemSubmitController,
  COORDINATE_SYSTEM_VIEW_ROUTE
} from '#src/server/exemption/site-details/coordinate-system/controller.js'
import * as cacheUtils from '#src/server/common/helpers/session-cache/utils.js'
import {
  mockExemption,
  mockSite,
  createMockRequest
} from '#src/server/test-helpers/mocks.js'
import { makeGetRequest } from '#src/server/test-helpers/server-requests.js'
import { statusCodes } from '#src/server/common/constants/status-codes.js'
import { JSDOM } from 'jsdom'
import { routes } from '#src/server/common/constants/routes.js'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')

describe('#coordinateSystem', () => {
  const getServer = setupTestServer()
  let getExemptionCacheSpy

  vi.mocked(cacheUtils.setSavedSiteDetails)
  vi.mocked(cacheUtils.updateExemptionSiteDetails)

  beforeEach(() => {
    getExemptionCacheSpy = vi
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
  })

  describe('#coordinateSystemController', () => {
    test('should render with correct context with no existing data', async () => {
      getExemptionCacheSpy.mockReturnValueOnce({})
      const h = { view: vi.fn() }

      const request = createMockRequest({
        site: {
          ...mockSite,
          siteDetails: {}
        }
      })

      await coordinateSystemController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(COORDINATE_SYSTEM_VIEW_ROUTE, {
        pageTitle: 'Which coordinate system do you want to use?',
        heading: 'Which coordinate system do you want to use?',
        backLink: routes.COORDINATES_ENTRY_CHOICE,
        cancelLink: routes.TASK_LIST + '?cancel=site-details',
        payload: { coordinateSystem: undefined },
        projectName: undefined,
        siteNumber: null,
        action: undefined
      })
    })

    test('Should provide expected response and correctly pre populate data', async () => {
      const { result, statusCode } = await makeGetRequest({
        url: routes.COORDINATE_SYSTEM_CHOICE,
        server: getServer()
      })

      const { document } = new JSDOM(result).window

      expect(document.querySelector('h1').textContent.trim()).toBe(
        'Which coordinate system do you want to use?'
      )

      expect(
        document.querySelector('.govuk-caption-l').textContent.trim()
      ).toBe('Test Project')

      expect(
        document.querySelector('.govuk-caption-l').textContent.trim()
      ).toBe(mockExemption.projectName)

      expect(document.querySelector('#coordinateSystem').value).toBe('wgs84')
      expect(document.querySelector('#coordinateSystem-2').value).toBe('osgb36')

      const hint = document.querySelector('.govuk-hint')
      expect(hint.hasAttribute('open')).toBe(false)
      expect(hint.innerHTML).toContain(
        '<h2 class="govuk-heading-s">WGS84 (World Geodetic System 1984)</h2>'
      )
      expect(hint.innerHTML).toContain(
        '<h2 class="govuk-heading-s">British National Grid (OSGB36)</h2>'
      )

      const hintSummary = document.querySelector('.govuk-details__summary-text')
      expect(hintSummary.textContent.trim()).toBe(
        'Help with the coordinate systems'
      )

      expect(
        document
          .querySelector(
            '.govuk-back-link[href="/exemption/how-do-you-want-to-enter-the-coordinates"]'
          )
          .textContent.trim()
      ).toBe('Back')

      expect(
        document
          .querySelector(
            '.govuk-link[href="/exemption/task-list?cancel=site-details"]'
          )
          .textContent.trim()
      ).toBe('Cancel')

      expect(statusCode).toBe(statusCodes.ok)
    })

    test('should use Review Site Details back link when coordinateSystem has value in action mode', async () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: 'Test Project',
        siteDetails: [{ coordinateSystem: 'wgs84' }]
      })

      const h = { view: vi.fn() }
      const request = createMockRequest({
        site: mockSite,
        query: { action: 'change', site: '1' },
        yar: {
          flash: vi.fn().mockReturnValue([]),
          get: vi.fn().mockReturnValue({}),
          set: vi.fn()
        }
      })

      await coordinateSystemController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(COORDINATE_SYSTEM_VIEW_ROUTE, {
        pageTitle: 'Which coordinate system do you want to use?',
        heading: 'Which coordinate system do you want to use?',
        backLink: `${routes.REVIEW_SITE_DETAILS}#site-details-1`,
        cancelLink: undefined,
        payload: { coordinateSystem: 'wgs84' },
        projectName: 'Test Project',
        siteNumber: null,
        action: 'change'
      })
    })

    test('coordinateSystemController handler should render correctly when using a change link', async () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName,
        multipleSiteDetails: { multipleSitesEnabled: true }
      })

      const h = { view: vi.fn() }

      const request = createMockRequest({
        query: { action: 'change' },
        site: {
          ...mockSite,
          siteDetails: {}
        }
      })

      await coordinateSystemController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(COORDINATE_SYSTEM_VIEW_ROUTE, {
        pageTitle: 'Which coordinate system do you want to use?',
        heading: 'Which coordinate system do you want to use?',
        backLink: `${routes.REVIEW_SITE_DETAILS}#site-details-1`,
        cancelLink: undefined,
        payload: { coordinateSystem: undefined },
        projectName: 'Test Project',
        siteNumber: 1,
        action: 'change'
      })
    })

    test('coordinateSystemController handler should render back to coordinates entry when originalCoordinatesEntry exists', async () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName,
        multipleSiteDetails: { multipleSitesEnabled: true }
      })

      const h = { view: vi.fn() }

      const request = createMockRequest({
        query: { action: 'change' },
        site: {
          ...mockSite,
          siteDetails: {}
        }
      })

      request.yar.get.mockReturnValue({ originalCoordinatesEntry: 'single' })

      await coordinateSystemController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(COORDINATE_SYSTEM_VIEW_ROUTE, {
        pageTitle: 'Which coordinate system do you want to use?',
        heading: 'Which coordinate system do you want to use?',
        backLink: `${routes.COORDINATES_ENTRY_CHOICE}?site=1&action=change`,
        cancelLink: undefined,
        payload: { coordinateSystem: undefined },
        projectName: 'Test Project',
        siteNumber: 1,
        action: 'change'
      })
    })
  })

  describe('#coordinateSystemSubmitController', () => {
    test('should redirect to multiple coordinates page when coordinatesEntry is multiple', async () => {
      const request = createMockRequest({
        payload: { coordinateSystem: 'wgs84' },
        site: {
          ...mockSite,
          siteDetails: { coordinatesEntry: 'multiple' }
        }
      })

      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: 'Test Project'
      })

      const h = { redirect: vi.fn() }

      await coordinateSystemSubmitController.handler(request, h)
      expect(h.redirect).toHaveBeenCalledWith(routes.ENTER_MULTIPLE_COORDINATES)
    })

    test('should redirect to multiple coordinates with action params when action is present', async () => {
      const request = createMockRequest({
        payload: { coordinateSystem: 'wgs84' },
        site: {
          ...mockSite,
          siteNumber: 1,
          siteDetails: { coordinatesEntry: 'multiple' }
        },
        query: { action: 'change' }
      })

      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: 'Test Project'
      })

      const h = { redirect: vi.fn() }

      await coordinateSystemSubmitController.handler(request, h)
      expect(h.redirect).toHaveBeenCalledWith(
        `${routes.ENTER_MULTIPLE_COORDINATES}?site=1&action=change`
      )
    })

    test('should stay on page when coordinatesEntry is neither single nor multiple', async () => {
      const request = createMockRequest({
        payload: { coordinateSystem: 'wgs84' },
        site: {
          ...mockSite,
          siteDetails: { coordinatesEntry: 'invalid' }
        }
      })

      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: 'Test Project'
      })

      const h = { view: vi.fn(), redirect: vi.fn() }

      await coordinateSystemSubmitController.handler(request, h)
      expect(h.view).toHaveBeenCalledWith(COORDINATE_SYSTEM_VIEW_ROUTE, {
        pageTitle: 'Which coordinate system do you want to use?',
        heading: 'Which coordinate system do you want to use?',
        projectName: 'Test Project',
        backLink: routes.COORDINATES_ENTRY_CHOICE,
        payload: { coordinateSystem: 'wgs84' }
      })
    })

    test('Should correctly format error data', () => {
      const request = createMockRequest({
        payload: { coordinateSystem: 'invalid' },
        site: {}
      })

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      const err = {
        details: [
          {
            path: ['coordinateSystem'],
            message: 'TEST',
            type: 'any.only'
          }
        ]
      }

      coordinateSystemSubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      expect(h.view).toHaveBeenCalledWith(COORDINATE_SYSTEM_VIEW_ROUTE, {
        pageTitle: 'Which coordinate system do you want to use?',
        heading: 'Which coordinate system do you want to use?',
        projectName: 'Test Project',
        backLink: routes.COORDINATES_ENTRY_CHOICE,
        cancelLink: routes.TASK_LIST + '?cancel=site-details',
        payload: { coordinateSystem: 'invalid' },
        siteNumber: null,
        action: undefined,
        errorSummary: [
          {
            href: '#coordinateSystem',
            text: 'TEST',
            field: ['coordinateSystem']
          }
        ],
        errors: {
          coordinateSystem: {
            field: ['coordinateSystem'],
            href: '#coordinateSystem',
            text: 'TEST'
          }
        }
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should still render page if no error details are provided', () => {
      const request = createMockRequest({
        payload: { coordinateSystem: 'invalid' },
        site: {}
      })

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      const err = {}

      coordinateSystemSubmitController.options.validate.failAction(
        request,
        h,
        err
      )

      expect(h.view).toHaveBeenCalledWith(COORDINATE_SYSTEM_VIEW_ROUTE, {
        pageTitle: 'Which coordinate system do you want to use?',
        heading: 'Which coordinate system do you want to use?',
        projectName: 'Test Project',
        backLink: routes.COORDINATES_ENTRY_CHOICE,
        cancelLink: routes.TASK_LIST + '?cancel=site-details',
        payload: { coordinateSystem: 'invalid' },
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
        payload: { coordinateSystem: 'invalid' },
        site: mockSite
      }

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      coordinateSystemSubmitController.options.validate.failAction(
        request,
        h,
        {}
      )

      expect(h.view).toHaveBeenCalledWith(COORDINATE_SYSTEM_VIEW_ROUTE, {
        pageTitle: 'Which coordinate system do you want to use?',
        heading: 'Which coordinate system do you want to use?',
        projectName: 'Test Project',
        backLink: routes.COORDINATES_ENTRY_CHOICE,
        cancelLink: routes.TASK_LIST + '?cancel=site-details',
        payload: { coordinateSystem: 'invalid' },
        siteNumber: 1,
        action: undefined
      })

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('should validate payload correctly on valid data', () => {
      const request = { coordinateSystem: 'wgs84' }
      const payloadValidator =
        coordinateSystemSubmitController.options.validate.payload
      const result = payloadValidator.validate(request)

      expect(result.error).toBeUndefined()
    })

    test('Should correctly set the cache when submitting', async () => {
      const h = {
        redirect: vi.fn()
      }

      const mockRequest = {
        payload: { coordinateSystem: 'wgs84' },
        site: mockSite
      }

      const request = createMockRequest(mockRequest)
      await coordinateSystemSubmitController.handler(request, h)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        request,
        h,
        0,
        'coordinateSystem',
        'wgs84'
      )
    })

    test('coordinateSystemSubmitController handler should submit correctly when using a change link when data is the same', async () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName,
        multipleSiteDetails: { multipleSitesEnabled: true }
      })

      const h = { view: vi.fn(), redirect: vi.fn() }

      const request = createMockRequest({
        query: { action: 'change' },
        site: mockSite
      })

      await coordinateSystemSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        routes.REVIEW_SITE_DETAILS + '#site-details-1'
      )
    })

    test('coordinateSystemSubmitController handler should submit correctly when using a change link when data is different for multiple coordinates', async () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName,
        multipleSiteDetails: { multipleSitesEnabled: true },
        siteDetails: [{ coordinatesEntry: 'multiple' }]
      })

      const h = { view: vi.fn(), redirect: vi.fn() }

      const request = createMockRequest({
        query: { action: 'change' },
        site: mockSite,
        payload: { coordinateSystem: 'wgs84' }
      })

      request.yar.flash.mockReturnValueOnce({
        savedSiteDetails: { originalCoordinateSystem: 'osgb36' }
      })

      await coordinateSystemSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        routes.CIRCLE_CENTRE_POINT + '?site=1&action=change'
      )
    })

    test('coordinateSystemSubmitController handler should submit correctly when using a change link when data is different for single coordinates', async () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName,
        multipleSiteDetails: { multipleSitesEnabled: true },
        siteDetails: [{ coordinatesEntry: 'single' }]
      })

      const h = { view: vi.fn(), redirect: vi.fn() }

      const request = createMockRequest({
        query: { action: 'change' },
        site: mockSite,
        payload: { coordinateSystem: 'wgs84' }
      })

      request.yar.flash.mockReturnValueOnce({
        savedSiteDetails: { originalCoordinateSystem: 'osgb36' }
      })

      await coordinateSystemSubmitController.handler(request, h)

      expect(h.redirect).toHaveBeenCalledWith(
        routes.CIRCLE_CENTRE_POINT + '?site=1&action=change'
      )
    })
  })
})
