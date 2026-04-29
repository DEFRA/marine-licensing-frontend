import { vi } from 'vitest'
import {
  centreCoordinatesController,
  centreCoordinatesSubmitController,
  centreCoordinatesSubmitFailHandler
} from '#src/server/exemption/site-details/centre-coordinates/controller.js'
import { COORDINATE_SYSTEM_VIEW_ROUTES } from '#src/server/common/validation/centre-coordinates/constants.js'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/coordinate-systems.js'
import * as cacheUtils from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import * as coordinateUtils from '#src/server/common/helpers/coordinate-utils.js'
import {
  mockExemption,
  mockSite
} from '#src/server/test-helpers/mocks/exemption.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import { routes } from '#src/server/common/constants/routes.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/exemptions/save-site-details.js'

vi.mock('~/src/server/common/helpers/exemptions/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/exemptions/save-site-details.js')

describe('#centreCoordinates', () => {
  let getExemptionCacheSpy
  let getCoordinateSystemSpy

  const mockCoordinates = {
    [COORDINATE_SYSTEMS.WGS84]: {
      latitude: mockExemption.siteDetails[0].coordinates.latitude,
      longitude: mockExemption.siteDetails[0].coordinates.longitude
    },
    [COORDINATE_SYSTEMS.OSGB36]: { eastings: '425053', northings: '564180' }
  }

  beforeEach(() => {
    vi.mocked(saveSiteDetailsToBackend).mockResolvedValue()
    getExemptionCacheSpy = vi
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
    getCoordinateSystemSpy = vi
      .spyOn(coordinateUtils, 'getCoordinateSystem')
      .mockReturnValue({ coordinateSystem: COORDINATE_SYSTEMS.WGS84 })
  })

  describe('#centreCoordinatesController', () => {
    test('centreCoordinatesController handler should render with correct context with no existing data', () => {
      getExemptionCacheSpy.mockReturnValueOnce({})
      const h = { view: vi.fn() }

      const request = createMockRequest({ site: mockSite })
      centreCoordinatesController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          action: undefined,
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          buttonText: 'Continue',
          cancelLink: '/exemption/task-list?cancel=site-details',
          heading: 'Enter the coordinates at the centre point of the site',
          pageTitle: 'Enter the coordinates at the centre point of the site',
          payload: { latitude: undefined, longitude: undefined },
          projectName: undefined,
          siteNumber: null
        }
      )
    })

    test('centreCoordinatesController handler should render with correct context for wgs84', () => {
      const h = { view: vi.fn() }

      const request = createMockRequest({ site: mockSite })
      centreCoordinatesController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          action: undefined,
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          buttonText: 'Continue',
          cancelLink: '/exemption/task-list?cancel=site-details',
          heading: 'Enter the coordinates at the centre point of the site',
          pageTitle: 'Enter the coordinates at the centre point of the site',
          payload: { ...mockCoordinates[COORDINATE_SYSTEMS.WGS84] },
          projectName: 'Test Project',
          siteNumber: null
        }
      )
    })

    test('centreCoordinatesController handler should render with correct context for osgb36', () => {
      const h = { view: vi.fn() }

      getExemptionCacheSpy.mockReturnValueOnce({
        ...mockExemption,
        siteDetails: [
          {
            ...mockExemption.siteDetails[0],
            coordinates: mockCoordinates[COORDINATE_SYSTEMS.OSGB36]
          }
        ]
      })

      getCoordinateSystemSpy.mockReturnValueOnce({
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36
      })

      const request = createMockRequest({ site: mockSite })
      centreCoordinatesController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.OSGB36],
        {
          action: undefined,
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          buttonText: 'Continue',
          cancelLink: '/exemption/task-list?cancel=site-details',
          heading: 'Enter the coordinates at the centre point of the site',
          pageTitle: 'Enter the coordinates at the centre point of the site',
          payload: { ...mockCoordinates[COORDINATE_SYSTEMS.OSGB36] },
          projectName: 'Test Project',
          siteNumber: null
        }
      )
    })

    test('centreCoordinatesController handler should render with correct context with existing cache data', () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName,
        siteDetails: {
          ...mockExemption.siteDetails,
          coordinates: mockCoordinates[COORDINATE_SYSTEMS.WGS84]
        }
      })

      const h = { view: vi.fn() }

      const request = createMockRequest({ site: mockSite })
      centreCoordinatesController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          action: undefined,
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          buttonText: 'Continue',
          cancelLink: '/exemption/task-list?cancel=site-details',
          heading: 'Enter the coordinates at the centre point of the site',
          pageTitle: 'Enter the coordinates at the centre point of the site',
          payload: { ...mockCoordinates[COORDINATE_SYSTEMS.WGS84] },
          projectName: 'Test Project',
          siteNumber: null
        }
      )
    })

    test('centreCoordinatesController handler should render correctly when using a change link (direct change, no originalCoordinatesEntry)', () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName,
        multipleSiteDetails: { multipleSitesEnabled: true },
        siteDetails: {
          ...mockExemption.siteDetails,
          coordinates: mockCoordinates[COORDINATE_SYSTEMS.WGS84]
        }
      })

      const h = { view: vi.fn() }

      const request = createMockRequest({
        query: { action: 'change' },
        site: mockSite
      })

      centreCoordinatesController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          backLink: routes.REVIEW_SITE_DETAILS + '#site-details-1',
          buttonText: 'Save and continue',
          cancelLink: undefined,
          heading: 'Enter the coordinates at the centre point of the site',
          pageTitle: 'Enter the coordinates at the centre point of the site',
          payload: { ...mockCoordinates[COORDINATE_SYSTEMS.WGS84] },
          projectName: 'Test Project',
          siteNumber: 1,
          action: 'change'
        }
      )
    })

    test('centreCoordinatesController handler should render correctly when using a change link on previous page (with originalCoordinateSystem)', () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName,
        multipleSiteDetails: { multipleSitesEnabled: true },
        siteDetails: {
          ...mockExemption.siteDetails,
          coordinates: mockCoordinates[COORDINATE_SYSTEMS.WGS84]
        }
      })

      const h = { view: vi.fn() }

      const request = createMockRequest({
        query: { action: 'change' },
        site: mockSite
      })

      request.yar.get.mockReturnValue({ originalCoordinateSystem: 'osgb36' })

      centreCoordinatesController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          backLink: routes.COORDINATE_SYSTEM_CHOICE + '?site=1&action=change',
          buttonText: 'Continue',
          cancelLink: undefined,
          heading: 'Enter the coordinates at the centre point of the site',
          pageTitle: 'Enter the coordinates at the centre point of the site',
          payload: { ...mockCoordinates[COORDINATE_SYSTEMS.WGS84] },
          projectName: 'Test Project',
          siteNumber: 1,
          action: 'change'
        }
      )
    })

    test('centreCoordinatesController handler should show Continue button when coming through flow after Coordinates Entry change', () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName,
        multipleSiteDetails: { multipleSitesEnabled: true },
        siteDetails: {
          ...mockExemption.siteDetails,
          coordinates: mockCoordinates[COORDINATE_SYSTEMS.WGS84]
        }
      })

      const h = { view: vi.fn() }

      const request = createMockRequest({
        query: { action: 'change' },
        site: mockSite
      })

      request.yar.get.mockReturnValue({
        originalCoordinateSystem: 'osgb36',
        originalCoordinatesEntry: 'single'
      })

      centreCoordinatesController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          backLink: routes.COORDINATE_SYSTEM_CHOICE + '?site=1&action=change',
          buttonText: 'Continue',
          cancelLink: undefined,
          heading: 'Enter the coordinates at the centre point of the site',
          pageTitle: 'Enter the coordinates at the centre point of the site',
          payload: { ...mockCoordinates[COORDINATE_SYSTEMS.WGS84] },
          projectName: 'Test Project',
          siteNumber: 1,
          action: 'change'
        }
      )
    })
  })

  describe('#centreCoordinatesSubmitController', () => {
    test('Should correctly format error data', () => {
      const request = {
        query: {},
        payload: { latitude: 'invalid' },
        site: mockSite
      }

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      const err = {
        details: [
          {
            path: ['latitude'],
            message: 'TEST',
            type: 'any.only'
          }
        ]
      }

      centreCoordinatesSubmitFailHandler(request, h, err)

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          action: undefined,
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          buttonText: 'Continue',
          cancelLink: '/exemption/task-list?cancel=site-details',
          heading: 'Enter the coordinates at the centre point of the site',
          pageTitle: 'Enter the coordinates at the centre point of the site',
          projectName: 'Test Project',
          payload: { latitude: 'invalid' },
          siteNumber: null,
          errorSummary: [
            {
              href: '#latitude',
              text: 'TEST',
              field: ['latitude']
            }
          ],
          errors: {
            latitude: {
              field: ['latitude'],
              href: '#latitude',
              text: 'TEST'
            }
          }
        }
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should still render page if no error details are provided', () => {
      const request = createMockRequest({
        query: {},
        payload: {
          ...mockCoordinates[COORDINATE_SYSTEMS.WGS84],
          latitude: 'invalid'
        }
      })

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      const err = {}

      centreCoordinatesSubmitFailHandler(request, h, err)

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          action: undefined,
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          buttonText: 'Continue',
          cancelLink: '/exemption/task-list?cancel=site-details',
          heading: 'Enter the coordinates at the centre point of the site',
          pageTitle: 'Enter the coordinates at the centre point of the site',
          projectName: 'Test Project',
          payload: {
            ...mockCoordinates[COORDINATE_SYSTEMS.WGS84],
            latitude: 'invalid'
          },
          siteNumber: null
        }
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly set the cache when submitting wgs84 data', async () => {
      const h = {
        redirect: vi.fn()
      }

      const mockRequest = {
        payload: mockExemption.siteDetails[0].coordinates,
        site: mockSite
      }

      getCoordinateSystemSpy.mockReturnValueOnce({
        coordinateSystem: COORDINATE_SYSTEMS.WGS84
      })

      const request = createMockRequest(mockRequest)
      await centreCoordinatesSubmitController.handler(request, h)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        request,
        h,
        0,
        'coordinates',
        mockExemption.siteDetails[0].coordinates
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.WIDTH_OF_SITE)
    })

    test('Should trim spaces from wgs84 data and save the converted values', async () => {
      const h = {
        redirect: vi.fn()
      }

      const mockRequest = {
        payload: { latitude: ' 51.489676', longitude: '-0.231530 ' },
        site: mockSite
      }

      getCoordinateSystemSpy.mockReturnValueOnce({
        coordinateSystem: COORDINATE_SYSTEMS.WGS84
      })

      const request = createMockRequest(mockRequest)
      await centreCoordinatesSubmitController.handler(request, h)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        request,
        h,
        0,
        'coordinates',
        { latitude: '51.489676', longitude: '-0.231530' }
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.WIDTH_OF_SITE)
    })

    test('Should correctly set the cache when submitting OSGB36 data', async () => {
      const h = {
        redirect: vi.fn()
      }

      const mockRequest = {
        payload: mockCoordinates[COORDINATE_SYSTEMS.OSGB36],
        site: mockSite
      }

      getCoordinateSystemSpy.mockReturnValueOnce({
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36
      })

      const request = createMockRequest(mockRequest)
      await centreCoordinatesSubmitController.handler(request, h)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        request,
        h,
        0,
        'coordinates',
        mockCoordinates[COORDINATE_SYSTEMS.OSGB36]
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.WIDTH_OF_SITE)
    })

    test('Should trim spaces from OSGB36 data and save the converted values', async () => {
      const h = {
        redirect: vi.fn()
      }

      const mockRequest = {
        payload: { eastings: ' 425053', northings: '564180 ' },
        site: mockSite
      }

      getCoordinateSystemSpy.mockReturnValueOnce({
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36
      })

      const request = createMockRequest(mockRequest)
      await centreCoordinatesSubmitController.handler(request, h)

      expect(cacheUtils.updateExemptionSiteDetails).toHaveBeenCalledWith(
        request,
        h,
        0,
        'coordinates',
        { eastings: '425053', northings: '564180' }
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.WIDTH_OF_SITE)
    })

    test('Should correctly handle validation errors', () => {
      const request = {
        payload: { latitude: 'invalid' },
        site: mockSite
      }

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      const mockRequest = createMockRequest(request)
      centreCoordinatesSubmitController.handler(mockRequest, h)

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          payload: request.payload
        })
      )

      expect(h.view().takeover).toHaveBeenCalled()
      expect(cacheUtils.updateExemptionSiteDetails).not.toHaveBeenCalled()
    })

    test('Should correctly output errors for multiple sites', () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName,
        multipleSiteDetails: { multipleSitesEnabled: true }
      })

      const request = {
        query: {},
        payload: { latitude: 'invalid' },
        site: mockSite
      }

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      centreCoordinatesSubmitFailHandler(request, h, {})

      expect(h.view).toHaveBeenCalledWith(
        COORDINATE_SYSTEM_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          action: undefined,
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          buttonText: 'Continue',
          cancelLink: '/exemption/task-list?cancel=site-details',
          heading: 'Enter the coordinates at the centre point of the site',
          pageTitle: 'Enter the coordinates at the centre point of the site',
          projectName: 'Test Project',
          payload: { latitude: 'invalid' },
          siteNumber: null
        }
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('Should correctly handle change link submit when only changing this page value', async () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName,
        multipleSiteDetails: { multipleSitesEnabled: true },
        siteDetails: mockExemption.siteDetails
      })

      const request = {
        payload: { latitude: '51.489676', longitude: '-0.231530 ' },
        site: mockSite,
        query: { action: 'change' }
      }

      const h = { redirect: vi.fn() }

      const mockRequest = createMockRequest(request)
      await centreCoordinatesSubmitController.handler(mockRequest, h)

      expect(saveSiteDetailsToBackend).toHaveBeenCalledWith(mockRequest, h)
      expect(h.redirect).toHaveBeenCalledWith(
        routes.REVIEW_SITE_DETAILS + '#site-details-1'
      )
    })

    test('Should correctly handle change link submit when arriving from earlier pages in the flow', async () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName,
        multipleSiteDetails: { multipleSitesEnabled: true }
      })

      const request = {
        payload: { latitude: '51.489676', longitude: '-0.231530 ' },
        site: {
          ...mockSite,
          siteDetails: { ...mockSite.siteDetails, circleWidth: null }
        },
        query: { action: 'change' }
      }

      const h = { redirect: vi.fn() }

      const mockRequest = createMockRequest(request)
      await centreCoordinatesSubmitController.handler(mockRequest, h)

      expect(saveSiteDetailsToBackend).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(routes.WIDTH_OF_SITE)
    })

    test('Should correctly handle invalid change link submit', async () => {
      getExemptionCacheSpy.mockReturnValue({
        projectName: mockExemption.projectName,
        multipleSiteDetails: { multipleSitesEnabled: true }
      })

      const request = {
        payload: { latitude: 'invalid' },
        site: mockSite,
        query: { action: 'change' }
      }

      const h = {
        view: vi.fn().mockReturnValue({
          takeover: vi.fn()
        })
      }

      const mockRequest = createMockRequest(request)
      await centreCoordinatesSubmitController.handler(mockRequest, h)

      expect(h.view).toHaveBeenCalled()
    })
  })
})
