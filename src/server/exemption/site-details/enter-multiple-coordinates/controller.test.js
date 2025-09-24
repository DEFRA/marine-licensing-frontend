import {
  multipleCoordinatesController,
  multipleCoordinatesSubmitController
} from '~/src/server/exemption/site-details/enter-multiple-coordinates/controller.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import * as coordinateUtils from '~/src/server/common/helpers/coordinate-utils.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { updateExemptionSiteDetails } from '~/src/server/common/helpers/session-cache/utils.js'
import {
  MULTIPLE_COORDINATES_VIEW_ROUTES,
  multipleCoordinatesPageData,
  handleValidationFailure
} from '~/src/server/exemption/site-details/enter-multiple-coordinates/utils.js'
import { mockSite } from '~/src/server/test-helpers/mocks.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock(
  '~/src/server/exemption/site-details/enter-multiple-coordinates/utils.js',
  () => {
    const actualUtils = jest.requireActual(
      '~/src/server/exemption/site-details/enter-multiple-coordinates/utils.js'
    )
    return {
      ...actualUtils,
      handleValidationFailure: jest.fn()
    }
  }
)

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
    jest.resetAllMocks()
    getExemptionCacheSpy = jest
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
    getCoordinateSystemSpy = jest
      .spyOn(coordinateUtils, 'getCoordinateSystem')
      .mockReturnValue({ coordinateSystem: COORDINATE_SYSTEMS.WGS84 })

    handleValidationFailure.mockImplementation((request, h) => {
      const mockViewResult = {
        takeover: jest.fn()
      }
      h.view.mockReturnValue(mockViewResult)
      return h
        .view(MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84], {
          heading:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          coordinates: expect.any(Array),
          projectName: mockExemption.projectName
        })
        .takeover()
    })
  })

  describe('#multipleCoordinatesController', () => {
    const mockH = { view: jest.fn() }

    beforeEach(() => {
      mockH.view.mockClear()
    })

    test('should render WGS84 template with correct context', () => {
      multipleCoordinatesController.handler({ site: mockSite }, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          ...multipleCoordinatesPageData,
          coordinates: [...mockCoordinates.wgs84, paddedCoordinates.wgs84],
          projectName: 'Test Project'
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

      multipleCoordinatesController.handler({ site: mockSite }, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.OSGB36],
        {
          ...multipleCoordinatesPageData,
          coordinates: [...mockCoordinates.osgb36, paddedCoordinates.osgb36],
          projectName: 'Test Project'
        }
      )
    })

    test('should handle empty exemption cache gracefully', () => {
      getExemptionCacheSpy.mockReturnValueOnce(undefined)

      multipleCoordinatesController.handler({ site: mockSite }, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          ...multipleCoordinatesPageData,
          coordinates: [
            paddedCoordinates.wgs84,
            paddedCoordinates.wgs84,
            paddedCoordinates.wgs84
          ],
          projectName: undefined
        })
      )
    })
  })

  describe('#multipleCoordinatesSubmitController', () => {
    const mockTakeover = jest.fn()
    const mockViewResult = {
      takeover: mockTakeover
    }
    const mockH = {
      view: jest.fn().mockReturnValue(mockViewResult),
      redirect: jest.fn()
    }

    beforeEach(() => {
      mockH.view.mockClear()
      mockH.redirect.mockClear()
      mockTakeover.mockClear()
      mockH.view.mockReturnValue(mockViewResult)
    })

    test('should successfully process and save valid coordinates', () => {
      const payload = {
        'coordinates[0][latitude]': '51.507400',
        'coordinates[0][longitude]': '-0.127800',
        'coordinates[1][latitude]': '51.517500',
        'coordinates[1][longitude]': '-0.137600',
        'coordinates[2][latitude]': '51.527600',
        'coordinates[2][longitude]': '-0.147700'
      }
      const request = { payload, site: mockSite }

      multipleCoordinatesSubmitController.handler(request, mockH)

      expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
        request,
        0,
        'coordinates',
        expect.any(Array)
      )
      expect(mockH.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })

    test('should trim spaces from WGS84 coordinates and save the converted versions', () => {
      const payload = {
        'coordinates[0][latitude]': ' 51.507400',
        'coordinates[0][longitude]': '-0.127800 ',
        'coordinates[1][latitude]': '51.517500 ',
        'coordinates[1][longitude]': '  -0.137600',
        'coordinates[2][latitude]': ' 51.527600  ',
        'coordinates[2][longitude]': '  -0.147700 '
      }
      const request = { payload, site: mockSite }

      multipleCoordinatesSubmitController.handler(request, mockH)

      expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
        request,
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
      expect(mockH.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })

    test('should handle validation errors by calling handleValidationFailure', () => {
      const payload = {
        'coordinates[0][latitude]': 'invalid'
      }
      const request = { payload, site: mockSite }

      multipleCoordinatesSubmitController.handler(request, mockH)

      expect(handleValidationFailure).toHaveBeenCalledWith(
        request,
        mockH,
        {
          _original: {
            coordinates: [
              {
                latitude: 'invalid',
                longitude: ''
              }
            ],
            id: 'test-exemption-id'
          },
          details: [
            {
              context: {
                key: 'latitude',
                label: 'coordinates[0].latitude',
                value: 'invalid'
              },
              message: 'Latitude must be a number',
              path: ['coordinates[0][latitude]'],
              type: 'string.pattern.base'
            },
            {
              context: {
                key: 'longitude',
                label: 'coordinates[0].longitude',
                value: ''
              },
              message: 'Enter the longitude',
              path: ['coordinates[0][longitude]'],
              type: 'string.empty'
            },
            {
              context: {
                key: 'coordinates',
                label: 'coordinates',
                limit: 3,
                value: [
                  {
                    latitude: 'invalid',
                    longitude: ''
                  }
                ]
              },
              message: 'You must provide at least 3 coordinate points',
              path: ['coordinates'],
              type: 'array.min'
            }
          ]
        },
        COORDINATE_SYSTEMS.WGS84
      )
    })

    test('should handle OSGB36 coordinate system correctly', () => {
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
      const request = { payload, site: mockSite }

      multipleCoordinatesSubmitController.handler(request, mockH)

      expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
        request,
        0,
        'coordinates',
        expect.any(Array)
      )
      expect(mockH.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })

    test('should trim spaces from OSGB36 coordinates and save the converted values', () => {
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
      const request = { payload, site: mockSite }

      multipleCoordinatesSubmitController.handler(request, mockH)

      expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
        request,
        0,
        'coordinates',
        expect.any(Array)
      )
      expect(mockH.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })

    test('should default to WGS84 when coordinateSystem is invalid', () => {
      const payload = {
        'coordinates[0][latitude]': '51.507400',
        'coordinates[0][longitude]': '-0.127800',
        'coordinates[1][latitude]': '51.517500',
        'coordinates[1][longitude]': '-0.137600',
        'coordinates[2][latitude]': '51.527600',
        'coordinates[2][longitude]': '-0.147700'
      }
      const request = { payload, site: mockSite }

      multipleCoordinatesSubmitController.handler(request, mockH)

      expect(mockH.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })

    test('should re-render the page with an added wgs84 point when the add point button is clicked', () => {
      const payload = {
        'coordinates[0][latitude]': '51.507400',
        'coordinates[0][longitude]': '-0.127800',
        'coordinates[1][latitude]': '51.517500',
        'coordinates[1][longitude]': '-0.137600',
        'coordinates[2][latitude]': '51.527600',
        'coordinates[2][longitude]': '-0.147700',
        add: 'add'
      }
      const request = { payload, site: mockSite }

      getCoordinateSystemSpy.mockReturnValueOnce({
        coordinateSystem: COORDINATE_SYSTEMS.WGS84
      })

      multipleCoordinatesSubmitController.handler(request, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          ...multipleCoordinatesPageData,
          coordinates: expect.any(Array),
          projectName: 'Test Project'
        })
      )
    })

    test('should re-render the page with an added osgb36 point when the add point button is clicked', () => {
      const payload = {
        'coordinates[0][eastings]': '530000',
        'coordinates[0][northings]': '181000',
        'coordinates[1][eastings]': '530100',
        'coordinates[1][northings]': '181100',
        'coordinates[2][eastings]': '530200',
        'coordinates[2][northings]': '181200',
        add: 'add'
      }
      const request = { payload, site: mockSite }

      getCoordinateSystemSpy.mockReturnValueOnce({
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36
      })

      multipleCoordinatesSubmitController.handler(request, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.OSGB36],
        expect.objectContaining({
          ...multipleCoordinatesPageData,
          coordinates: expect.any(Array),
          projectName: 'Test Project'
        })
      )
    })

    test('should re-render the page with a removed point when the remove button is clicked', () => {
      const payload = {
        'coordinates[0][eastings]': '530000',
        'coordinates[0][northings]': '181000',
        'coordinates[1][eastings]': '530100',
        'coordinates[1][northings]': '181100',
        'coordinates[2][eastings]': '530200',
        'coordinates[2][northings]': '181200',
        remove: '3'
      }
      const request = { payload, site: mockSite }

      getCoordinateSystemSpy.mockReturnValueOnce({
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36
      })

      multipleCoordinatesSubmitController.handler(request, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.OSGB36],
        expect.objectContaining({
          ...multipleCoordinatesPageData,
          coordinates: expect.any(Array),
          projectName: 'Test Project'
        })
      )
    })
  })
})
