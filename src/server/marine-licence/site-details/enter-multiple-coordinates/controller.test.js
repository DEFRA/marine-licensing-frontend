import { vi } from 'vitest'
import {
  multipleCoordinatesController,
  multipleCoordinatesSubmitController
} from '#src/server/marine-licence/site-details/enter-multiple-coordinates/controller.js'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/coordinate-systems.js'
import * as cacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  updateMarineLicenceSiteDetails,
  getSavedSiteDetails
} from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import {
  MULTIPLE_COORDINATES_VIEW_ROUTES,
  multipleCoordinatesPageData
} from '#src/server/marine-licence/site-details/enter-multiple-coordinates/utils.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'
import { saveSiteDetailsToBackend } from '#src/server/common/helpers/marine-licence/save-site-details.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/marine-licence/save-site-details.js')

describe('#multipleCoordinates (marine licence)', () => {
  let getMarineLicenceCacheSpy

  const mockCoordinates = {
    wgs84: [
      { latitude: '51.507400', longitude: '-0.127800' },
      { latitude: '51.517500', longitude: '-0.137600' }
    ],
    osgb36: [
      { easting: '530000', northing: '181000' },
      { easting: '530100', northing: '181100' }
    ]
  }

  const paddedCoordinates = {
    wgs84: { latitude: '', longitude: '' },
    osgb36: { easting: '', northing: '' }
  }

  const mockMarineLicence = {
    id: 'test-ml-id',
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
    getMarineLicenceCacheSpy = vi
      .spyOn(cacheUtils, 'getMarineLicenceCache')
      .mockReturnValue(mockMarineLicence)

    vi.mocked(updateMarineLicenceSiteDetails).mockResolvedValue(undefined)
    vi.mocked(getSavedSiteDetails).mockReturnValue({})
  })

  describe('#multipleCoordinatesController', () => {
    const mockH = { view: vi.fn() }

    beforeEach(() => {
      mockH.view.mockClear()
    })

    test('should render WGS84 template with correct context', () => {
      getMarineLicenceCacheSpy.mockReturnValue({
        ...mockMarineLicence,
        siteDetails: [
          {
            coordinateSystem: COORDINATE_SYSTEMS.WGS84,
            coordinates: mockCoordinates.wgs84
          }
        ]
      })

      multipleCoordinatesController.handler(createMockRequest(), mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          ...multipleCoordinatesPageData,
          action: undefined,
          backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE,
          cancelLink:
            marineLicenceRoutes.MARINE_LICENCE_TASK_LIST +
            '?cancel=site-details',
          coordinates: [...mockCoordinates.wgs84, paddedCoordinates.wgs84],
          projectName: 'Test Project',
          siteNumber: 1
        }
      )
    })

    test('should render OSGB36 template with correct context', () => {
      getMarineLicenceCacheSpy.mockReturnValue({
        ...mockMarineLicence,
        siteDetails: [
          {
            coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
            coordinates: mockCoordinates.osgb36
          }
        ]
      })

      multipleCoordinatesController.handler(createMockRequest(), mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.OSGB36],
        {
          ...multipleCoordinatesPageData,
          action: undefined,
          backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE,
          cancelLink:
            marineLicenceRoutes.MARINE_LICENCE_TASK_LIST +
            '?cancel=site-details',
          coordinates: [...mockCoordinates.osgb36, paddedCoordinates.osgb36],
          projectName: 'Test Project',
          siteNumber: 1
        }
      )
    })

    test('should handle empty cache gracefully', () => {
      getMarineLicenceCacheSpy.mockReturnValue(undefined)

      multipleCoordinatesController.handler(createMockRequest(), mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          ...multipleCoordinatesPageData,
          action: undefined,
          backLink: marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE,
          cancelLink:
            marineLicenceRoutes.MARINE_LICENCE_TASK_LIST +
            '?cancel=site-details',
          coordinates: [
            paddedCoordinates.wgs84,
            paddedCoordinates.wgs84,
            paddedCoordinates.wgs84
          ],
          projectName: undefined,
          siteNumber: 1
        }
      )
    })

    test('should render with change action back link pointing to review page', () => {
      getMarineLicenceCacheSpy.mockReturnValue({
        ...mockMarineLicence,
        siteDetails: [
          {
            coordinateSystem: COORDINATE_SYSTEMS.WGS84,
            coordinates: mockCoordinates.wgs84
          }
        ]
      })

      multipleCoordinatesController.handler(
        createMockRequest({ query: { action: 'change' } }),
        mockH
      )

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          ...multipleCoordinatesPageData,
          action: 'change',
          backLink: `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#site-details-1`,
          cancelLink: undefined,
          coordinates: [...mockCoordinates.wgs84, paddedCoordinates.wgs84],
          projectName: 'Test Project',
          siteNumber: 1
        }
      )
    })
  })

  describe('#multipleCoordinatesSubmitController', () => {
    const mockTakeover = vi.fn()
    const mockViewResult = { takeover: mockTakeover }
    const mockH = {
      view: vi.fn().mockReturnValue(mockViewResult),
      redirect: vi.fn()
    }

    beforeEach(() => {
      mockH.view.mockClear()
      mockH.redirect.mockClear()
      mockTakeover.mockClear()
      mockH.view.mockReturnValue(mockViewResult)
      vi.mocked(saveSiteDetailsToBackend).mockResolvedValue()
    })

    test('should save valid coordinates and redirect to same page', async () => {
      getMarineLicenceCacheSpy.mockReturnValue({
        ...mockMarineLicence,
        siteDetails: [{ coordinateSystem: COORDINATE_SYSTEMS.WGS84 }]
      })
      const payload = {
        'coordinates[0][latitude]': '51.507400',
        'coordinates[0][longitude]': '-0.127800',
        'coordinates[1][latitude]': '51.517500',
        'coordinates[1][longitude]': '-0.137600',
        'coordinates[2][latitude]': '51.527600',
        'coordinates[2][longitude]': '-0.147700'
      }
      const request = createMockRequest({ payload })

      await multipleCoordinatesSubmitController.handler(request, mockH)

      expect(updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
        request,
        mockH,
        0,
        'coordinates',
        expect.any(Array)
      )
      expect(mockH.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#site-details-1`
      )
    })

    test('should call saveSiteDetailsToBackend on valid submission', async () => {
      getMarineLicenceCacheSpy.mockReturnValue({
        ...mockMarineLicence,
        siteDetails: [{ coordinateSystem: COORDINATE_SYSTEMS.WGS84 }]
      })
      const payload = {
        'coordinates[0][latitude]': '51.507400',
        'coordinates[0][longitude]': '-0.127800',
        'coordinates[1][latitude]': '51.517500',
        'coordinates[1][longitude]': '-0.137600',
        'coordinates[2][latitude]': '51.527600',
        'coordinates[2][longitude]': '-0.147700'
      }
      const request = createMockRequest({ payload })

      await multipleCoordinatesSubmitController.handler(request, mockH)

      expect(saveSiteDetailsToBackend).toHaveBeenCalledWith(request, mockH)
    })

    test('should handle validation errors by re-rendering with errors', () => {
      getMarineLicenceCacheSpy.mockReturnValue({
        ...mockMarineLicence,
        siteDetails: [{ coordinateSystem: COORDINATE_SYSTEMS.WGS84 }]
      })
      const request = createMockRequest({
        payload: { 'coordinates[0][latitude]': 'invalid' }
      })

      multipleCoordinatesSubmitController.handler(request, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          coordinates: [{ latitude: 'invalid', longitude: '' }],
          errorSummary: expect.any(Array),
          errors: expect.any(Object),
          projectName: 'Test Project'
        })
      )
    })

    test('should use review page back link on validation error when action is set', () => {
      getMarineLicenceCacheSpy.mockReturnValue({
        ...mockMarineLicence,
        siteDetails: [{ coordinateSystem: COORDINATE_SYSTEMS.WGS84 }]
      })
      const request = createMockRequest({
        payload: { 'coordinates[0][latitude]': 'invalid' },
        query: { action: 'change' }
      })

      multipleCoordinatesSubmitController.handler(request, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          backLink: `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#site-details-1`
        })
      )
    })

    test('should handle OSGB36 coordinates correctly', async () => {
      getMarineLicenceCacheSpy.mockReturnValue({
        ...mockMarineLicence,
        siteDetails: [{ coordinateSystem: COORDINATE_SYSTEMS.OSGB36 }]
      })
      const payload = {
        'coordinates[0][easting]': '530000',
        'coordinates[0][northing]': '181000',
        'coordinates[1][easting]': '530100',
        'coordinates[1][northing]': '181100',
        'coordinates[2][easting]': '530200',
        'coordinates[2][northing]': '181200'
      }
      const request = createMockRequest({ payload })

      await multipleCoordinatesSubmitController.handler(request, mockH)

      expect(updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
        request,
        mockH,
        0,
        'coordinates',
        expect.any(Array)
      )
      expect(mockH.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS}#site-details-1`
      )
    })

    test('should re-render with added WGS84 point when add button clicked', async () => {
      getMarineLicenceCacheSpy.mockReturnValue({
        ...mockMarineLicence,
        siteDetails: [{ coordinateSystem: COORDINATE_SYSTEMS.WGS84 }]
      })
      const payload = {
        'coordinates[0][latitude]': '51.507400',
        'coordinates[0][longitude]': '-0.127800',
        'coordinates[1][latitude]': '51.517500',
        'coordinates[1][longitude]': '-0.137600',
        'coordinates[2][latitude]': '51.527600',
        'coordinates[2][longitude]': '-0.147700',
        add: 'add'
      }

      await multipleCoordinatesSubmitController.handler(
        createMockRequest({ payload }),
        mockH
      )

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          coordinates: expect.any(Array),
          projectName: 'Test Project'
        })
      )
    })

    test('should re-render with added OSGB36 point when add button clicked', async () => {
      getMarineLicenceCacheSpy.mockReturnValue({
        ...mockMarineLicence,
        siteDetails: [{ coordinateSystem: COORDINATE_SYSTEMS.OSGB36 }]
      })
      const payload = {
        'coordinates[0][easting]': '530000',
        'coordinates[0][northing]': '181000',
        'coordinates[1][easting]': '530100',
        'coordinates[1][northing]': '181100',
        'coordinates[2][easting]': '530200',
        'coordinates[2][northing]': '181200',
        add: 'add'
      }

      await multipleCoordinatesSubmitController.handler(
        createMockRequest({ payload }),
        mockH
      )

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.OSGB36],
        expect.objectContaining({
          coordinates: expect.any(Array),
          projectName: 'Test Project'
        })
      )
    })

    test('should re-render with removed point when remove button clicked', async () => {
      getMarineLicenceCacheSpy.mockReturnValue({
        ...mockMarineLicence,
        siteDetails: [{ coordinateSystem: COORDINATE_SYSTEMS.OSGB36 }]
      })
      const payload = {
        'coordinates[0][easting]': '530000',
        'coordinates[0][northing]': '181000',
        'coordinates[1][easting]': '530100',
        'coordinates[1][northing]': '181100',
        'coordinates[2][easting]': '530200',
        'coordinates[2][northing]': '181200',
        remove: '3'
      }

      await multipleCoordinatesSubmitController.handler(
        createMockRequest({ payload }),
        mockH
      )

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.OSGB36],
        expect.objectContaining({
          coordinates: expect.any(Array),
          projectName: 'Test Project'
        })
      )
    })
  })
})
