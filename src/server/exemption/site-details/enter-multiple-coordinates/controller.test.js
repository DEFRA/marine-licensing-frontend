import { vi } from 'vitest'
import {
  multipleCoordinatesController,
  multipleCoordinatesSubmitController
} from '#src/server/exemption/site-details/enter-multiple-coordinates/controller.js'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/exemptions.js'
import * as cacheUtils from '#src/server/common/helpers/session-cache/utils.js'
import * as coordinateUtils from '#src/server/common/helpers/coordinate-utils.js'
import { routes } from '#src/server/common/constants/routes.js'
import { updateExemptionSiteDetails } from '#src/server/common/helpers/session-cache/utils.js'
import {
  MULTIPLE_COORDINATES_VIEW_ROUTES,
  multipleCoordinatesPageData
} from '#src/server/exemption/site-details/enter-multiple-coordinates/utils.js'
import { mockSite, createMockRequest } from '#src/server/test-helpers/mocks.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/save-site-details.js'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/save-site-details.js')

describe('#multipleCoordinates', () => {
  let getExemptionCacheSpy
  let getCoordinateSystemSpy

  const mockCoordinates = {
    wgs84: [
      { latitude: '51.507400', longitude: '-0.127800' },
      { latitude: '51.517500', longitude: '-0.137600' }
    ],
    osgb36: [
      { eastings: '530000', northings: '181000' },
      { eastings: '530100', northings: '181100' }
    ]
  }

  const paddedCoordinates = {
    wgs84: { latitude: '', longitude: '' },
    osgb36: { eastings: '', northings: '' }
  }

  const mockExemption = {
    id: 'test-exemption-id',
    projectName: 'Test Project',
    siteDetails: [
      {
        coordinateSystem: COORDINATE_SYSTEMS.WGS84,
        coordinates: mockCoordinates.wgs84
      }
    ]
  }

  beforeEach(() => {
    vi.resetAllMocks()
    getExemptionCacheSpy = vi
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)

    vi.mocked(saveSiteDetailsToBackend).mockResolvedValue()

    getCoordinateSystemSpy = vi
      .spyOn(coordinateUtils, 'getCoordinateSystem')
      .mockReturnValue({ coordinateSystem: COORDINATE_SYSTEMS.WGS84 })
  })

  describe('#multipleCoordinatesController', () => {
    const mockH = { view: vi.fn() }

    beforeEach(() => {
      mockH.view.mockClear()
    })

    test('should render WGS84 template with correct context', () => {
      const request = createMockRequest({ site: mockSite })
      multipleCoordinatesController.handler(request, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          ...multipleCoordinatesPageData,
          action: undefined,
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          cancelLink: routes.TASK_LIST + '?cancel=site-details',
          coordinates: [...mockCoordinates.wgs84, paddedCoordinates.wgs84],
          projectName: 'Test Project',
          siteNumber: null
        }
      )
    })

    test('should render OSGB36 template with correct context', () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        ...mockExemption,
        siteDetails: [
          {
            coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
            coordinates: mockCoordinates.osgb36
          }
        ]
      })

      const request = createMockRequest({ site: mockSite })
      multipleCoordinatesController.handler(request, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.OSGB36],
        {
          ...multipleCoordinatesPageData,
          action: undefined,
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          cancelLink: routes.TASK_LIST + '?cancel=site-details',
          coordinates: [...mockCoordinates.osgb36, paddedCoordinates.osgb36],
          projectName: 'Test Project',
          siteNumber: null
        }
      )
    })

    test('should handle empty exemption cache gracefully', () => {
      getExemptionCacheSpy.mockReturnValueOnce(undefined)

      const request = createMockRequest({ site: mockSite })
      multipleCoordinatesController.handler(request, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          ...multipleCoordinatesPageData,
          action: undefined,
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          cancelLink: routes.TASK_LIST + '?cancel=site-details',
          coordinates: [
            paddedCoordinates.wgs84,
            paddedCoordinates.wgs84,
            paddedCoordinates.wgs84
          ],
          projectName: undefined,
          siteNumber: null
        }
      )
    })
  })

  describe('#multipleCoordinatesSubmitController', () => {
    const mockTakeover = vi.fn()
    const mockViewResult = {
      takeover: mockTakeover
    }
    const mockH = {
      view: vi.fn().mockReturnValue(mockViewResult),
      redirect: vi.fn()
    }

    beforeEach(() => {
      mockH.view.mockClear()
      mockH.redirect.mockClear()
      mockTakeover.mockClear()
      mockH.view.mockReturnValue(mockViewResult)
    })

    test('should successfully process and save valid coordinates', async () => {
      const payload = {
        'coordinates[0][latitude]': '51.507400',
        'coordinates[0][longitude]': '-0.127800',
        'coordinates[1][latitude]': '51.517500',
        'coordinates[1][longitude]': '-0.137600',
        'coordinates[2][latitude]': '51.527600',
        'coordinates[2][longitude]': '-0.147700'
      }
      const request = createMockRequest({ payload, site: mockSite })

      await multipleCoordinatesSubmitController.handler(request, mockH)

      expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
        request,
        mockH,
        0,
        'coordinates',
        expect.any(Array)
      )
      expect(saveSiteDetailsToBackend).toHaveBeenCalledWith(request, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })

    test('should trim spaces from WGS84 coordinates and save the converted versions', async () => {
      const payload = {
        'coordinates[0][latitude]': ' 51.507400',
        'coordinates[0][longitude]': '-0.127800 ',
        'coordinates[1][latitude]': '51.517500 ',
        'coordinates[1][longitude]': '  -0.137600',
        'coordinates[2][latitude]': ' 51.527600  ',
        'coordinates[2][longitude]': '  -0.147700 '
      }
      const request = createMockRequest({ payload, site: mockSite })

      await multipleCoordinatesSubmitController.handler(request, mockH)

      expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
        request,
        mockH,
        0,
        'coordinates',
        [
          {
            latitude: '51.507400',
            longitude: '-0.127800'
          },
          {
            latitude: '51.517500',
            longitude: '-0.137600'
          },
          {
            latitude: '51.527600',
            longitude: '-0.147700'
          }
        ]
      )
      expect(saveSiteDetailsToBackend).toHaveBeenCalledWith(request, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })

    test('should handle validation errors by rendering the view with errors', () => {
      const payload = {
        'coordinates[0][latitude]': 'invalid'
      }
      const request = createMockRequest({ payload, site: mockSite })

      multipleCoordinatesSubmitController.handler(request, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          backLink: '/exemption/what-coordinate-system',
          cancelLink: '/exemption/task-list?cancel=site-details',
          heading:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          pageTitle:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          projectName: 'Test Project',
          coordinates: [
            {
              latitude: 'invalid',
              longitude: ''
            }
          ],
          errorSummary: [
            {
              href: '#coordinates-0-latitude',
              text: 'Latitude of start and end point must be a number'
            },
            {
              href: '#coordinates-0-longitude',
              text: 'Enter the longitude of start and end point'
            },
            {
              href: '#coordinates',
              text: 'You must provide at least 3 coordinate points'
            }
          ],
          errors: {
            coordinates: {
              text: 'You must provide at least 3 coordinate points'
            },

            coordinates0latitude: {
              text: 'Latitude of start and end point must be a number'
            },

            coordinates0longitude: {
              text: 'Enter the longitude of start and end point'
            }
          }
        }
      )
    })

    test('should handle OSGB36 coordinate system correctly', async () => {
      getCoordinateSystemSpy.mockReturnValueOnce({
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36
      })
      const payload = {
        'coordinates[0][eastings]': '530000',
        'coordinates[0][northings]': '181000',
        'coordinates[1][eastings]': '530100',
        'coordinates[1][northings]': '181100',
        'coordinates[2][eastings]': '530200',
        'coordinates[2][northings]': '181200'
      }
      const request = createMockRequest({ payload, site: mockSite })

      await multipleCoordinatesSubmitController.handler(request, mockH)

      expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
        request,
        mockH,
        0,
        'coordinates',
        expect.any(Array)
      )
      expect(saveSiteDetailsToBackend).toHaveBeenCalledWith(request, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })

    test('should trim spaces from OSGB36 coordinates and save the converted values', async () => {
      getCoordinateSystemSpy.mockReturnValueOnce({
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36
      })
      const payload = {
        'coordinates[0][eastings]': ' 530000',
        'coordinates[0][northings]': '181000 ',
        'coordinates[1][eastings]': '530100',
        'coordinates[1][northings]': '181100',
        'coordinates[2][eastings]': '530200',
        'coordinates[2][northings]': '181200'
      }
      const request = createMockRequest({ payload, site: mockSite })

      await multipleCoordinatesSubmitController.handler(request, mockH)

      expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
        request,
        mockH,
        0,
        'coordinates',
        expect.any(Array)
      )
      expect(saveSiteDetailsToBackend).toHaveBeenCalledWith(request, mockH)
      expect(mockH.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })

    test('should default to WGS84 when coordinateSystem is invalid', async () => {
      const payload = {
        'coordinates[0][latitude]': '51.507400',
        'coordinates[0][longitude]': '-0.127800',
        'coordinates[1][latitude]': '51.517500',
        'coordinates[1][longitude]': '-0.137600',
        'coordinates[2][latitude]': '51.527600',
        'coordinates[2][longitude]': '-0.147700'
      }
      const request = createMockRequest({ payload, site: mockSite })

      await multipleCoordinatesSubmitController.handler(request, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })

    test('should re-render the page with an added wgs84 point when the add point button is clicked', async () => {
      const payload = {
        'coordinates[0][latitude]': '51.507400',
        'coordinates[0][longitude]': '-0.127800',
        'coordinates[1][latitude]': '51.517500',
        'coordinates[1][longitude]': '-0.137600',
        'coordinates[2][latitude]': '51.527600',
        'coordinates[2][longitude]': '-0.147700',
        add: 'add'
      }
      const request = createMockRequest({ payload, site: mockSite })

      getCoordinateSystemSpy.mockReturnValueOnce({
        coordinateSystem: COORDINATE_SYSTEMS.WGS84
      })

      await multipleCoordinatesSubmitController.handler(request, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          ...multipleCoordinatesPageData,
          coordinates: expect.any(Array),
          projectName: 'Test Project'
        })
      )
    })

    test('should re-render the page with an added osgb36 point when the add point button is clicked', async () => {
      const payload = {
        'coordinates[0][eastings]': '530000',
        'coordinates[0][northings]': '181000',
        'coordinates[1][eastings]': '530100',
        'coordinates[1][northings]': '181100',
        'coordinates[2][eastings]': '530200',
        'coordinates[2][northings]': '181200',
        add: 'add'
      }
      const request = createMockRequest({ payload, site: mockSite })

      getCoordinateSystemSpy.mockReturnValueOnce({
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36
      })

      await multipleCoordinatesSubmitController.handler(request, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.OSGB36],
        expect.objectContaining({
          ...multipleCoordinatesPageData,
          coordinates: expect.any(Array),
          projectName: 'Test Project'
        })
      )
    })

    test('should re-render the page with a removed point when the remove button is clicked', async () => {
      const payload = {
        'coordinates[0][eastings]': '530000',
        'coordinates[0][northings]': '181000',
        'coordinates[1][eastings]': '530100',
        'coordinates[1][northings]': '181100',
        'coordinates[2][eastings]': '530200',
        'coordinates[2][northings]': '181200',
        remove: '3'
      }
      const request = createMockRequest({ payload, site: mockSite })

      getCoordinateSystemSpy.mockReturnValueOnce({
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36
      })

      await multipleCoordinatesSubmitController.handler(request, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.OSGB36],
        expect.objectContaining({
          ...multipleCoordinatesPageData,
          coordinates: expect.any(Array),
          projectName: 'Test Project'
        })
      )
    })

    test('Should correctly output errors for multiple sites', () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName,
        multipleSiteDetails: { multipleSitesEnabled: true },
        siteDetails: [
          {
            coordinateSystem: COORDINATE_SYSTEMS.WGS84,
            coordinates: mockCoordinates.wgs84
          }
        ]
      })

      const request = createMockRequest({ site: mockSite })
      multipleCoordinatesController.handler(request, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          ...multipleCoordinatesPageData,
          action: undefined,
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          cancelLink: routes.TASK_LIST + '?cancel=site-details',
          coordinates: [...mockCoordinates.wgs84, paddedCoordinates.wgs84],
          projectName: 'Test Project',
          siteNumber: 1
        }
      )
    })

    test('multipleCoordinatesController handler should render correctly when using a change link', () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName,
        multipleSiteDetails: { multipleSitesEnabled: true },
        siteDetails: [
          {
            coordinateSystem: COORDINATE_SYSTEMS.WGS84,
            coordinates: mockCoordinates.wgs84
          }
        ]
      })

      const request = createMockRequest({
        query: { action: 'change' },
        site: mockSite
      })

      multipleCoordinatesController.handler(request, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          ...multipleCoordinatesPageData,
          action: 'change',
          backLink: routes.REVIEW_SITE_DETAILS + '#site-details-1',
          cancelLink: undefined,
          coordinates: [...mockCoordinates.wgs84, paddedCoordinates.wgs84],
          projectName: 'Test Project',
          siteNumber: 1
        }
      )
    })

    test('multipleCoordinatesController handler should render correctly when using a change link on previous page', () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName,
        multipleSiteDetails: { multipleSitesEnabled: true },
        siteDetails: [
          {
            coordinateSystem: COORDINATE_SYSTEMS.WGS84,
            coordinates: mockCoordinates.wgs84
          }
        ]
      })

      const request = createMockRequest({
        query: { action: 'change' },
        site: mockSite
      })

      request.yar.get.mockReturnValue({ originalCoordinateSystem: 'osgb36' })

      multipleCoordinatesController.handler(request, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          ...multipleCoordinatesPageData,
          action: 'change',
          backLink: routes.COORDINATE_SYSTEM_CHOICE + '?site=1&action=change',
          cancelLink: undefined,
          coordinates: [...mockCoordinates.wgs84, paddedCoordinates.wgs84],
          projectName: 'Test Project',
          siteNumber: 1
        }
      )
    })

    test('Should correctly handle change link submit', async () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        projectName: mockExemption.projectName,
        multipleSiteDetails: { multipleSitesEnabled: true }
      })

      const payload = {
        'coordinates[0][latitude]': '51.507400',
        'coordinates[0][longitude]': '-0.127800',
        'coordinates[1][latitude]': '51.517500',
        'coordinates[1][longitude]': '-0.137600',
        'coordinates[2][latitude]': '51.527600',
        'coordinates[2][longitude]': '-0.147700'
      }

      const request = createMockRequest({
        payload,
        site: mockSite,
        query: { action: 'change' }
      })

      await multipleCoordinatesSubmitController.handler(request, mockH)

      expect(saveSiteDetailsToBackend).toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(
        routes.REVIEW_SITE_DETAILS + '#site-details-1'
      )
    })

    test('Should correctly handle invalid change link submit', async () => {
      getExemptionCacheSpy.mockReturnValue({
        projectName: mockExemption.projectName,
        multipleSiteDetails: { multipleSitesEnabled: true }
      })

      const payload = {
        'coordinates[0][latitude]': 'invalid'
      }

      const request = createMockRequest({
        payload,
        site: mockSite,
        query: { action: 'change' }
      })

      await multipleCoordinatesSubmitController.handler(request, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          backLink: '/exemption/what-coordinate-system',
          cancelLink: '/exemption/task-list?cancel=site-details',
          coordinates: [
            {
              latitude: 'invalid',
              longitude: ''
            }
          ],
          errorSummary: [
            {
              href: '#coordinates-0-latitude',
              text: 'Latitude of start and end point must be a number'
            },
            {
              href: '#coordinates-0-longitude',
              text: 'Enter the longitude of start and end point'
            },
            {
              href: '#coordinates',
              text: 'You must provide at least 3 coordinate points'
            }
          ],
          errors: {
            coordinates: {
              text: 'You must provide at least 3 coordinate points'
            },
            coordinates0latitude: {
              text: 'Latitude of start and end point must be a number'
            },
            coordinates0longitude: {
              text: 'Enter the longitude of start and end point'
            }
          },
          heading:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          pageTitle:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          projectName: 'Test Project'
        }
      )
    })
  })
})
