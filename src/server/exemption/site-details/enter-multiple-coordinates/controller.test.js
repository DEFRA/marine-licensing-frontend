import { createServer } from '~/src/server/index.js'
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
  normaliseCoordinatesForDisplay,
  isWGS84,
  multipleCoordinatesPageData,
  convertPayloadToCoordinatesArray,
  convertArrayErrorsToFlattenedErrors,
  handleValidationFailure
} from '~/src/server/exemption/site-details/enter-multiple-coordinates/utils.js'
import { validateCoordinates } from '~/src/server/exemption/site-details/enter-multiple-coordinates/validation/validation.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock(
  '~/src/server/exemption/site-details/enter-multiple-coordinates/utils.js',
  () => {
    const actualUtils = jest.requireActual(
      '~/src/server/exemption/site-details/enter-multiple-coordinates/utils.js'
    )
    return {
      MULTIPLE_COORDINATES_VIEW_ROUTES: {
        WGS84: 'wgs84.njk',
        OSGB36: 'osgb36.njk'
      },
      normaliseCoordinatesForDisplay: jest.fn(),
      isWGS84: jest.fn(),
      multipleCoordinatesPageData: {
        heading:
          'Enter multiple sets of coordinates to mark the boundary of the site',
        backLink: '/exemption/what-coordinate-system'
      },
      convertPayloadToCoordinatesArray: jest.fn(),
      validateCoordinates: jest.fn(),
      convertArrayErrorsToFlattenedErrors: jest.fn(),
      handleValidationFailure: jest.fn(),
      removeCoordinateAtIndex: actualUtils.removeCoordinateAtIndex,
      REQUIRED_COORDINATES_COUNT: actualUtils.REQUIRED_COORDINATES_COUNT
    }
  }
)
jest.mock(
  '~/src/server/exemption/site-details/enter-multiple-coordinates/validation/validation.js',
  () => {
    return {
      validateCoordinates: jest.fn()
    }
  }
)

describe('#multipleCoordinates', () => {
  /** @type {Server} */
  let server
  let getExemptionCacheSpy
  let getCoordinateSystemSpy

  const mockCoordinates = {
    wgs84: [
      { latitude: '51.5074', longitude: '-0.1278' },
      { latitude: '51.5175', longitude: '-0.1376' }
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
    siteDetails: {
      coordinateSystem: COORDINATE_SYSTEMS.WGS84,
      coordinates: mockCoordinates.wgs84
    }
  }

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    jest.resetAllMocks()
    getExemptionCacheSpy = jest
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)
    getCoordinateSystemSpy = jest
      .spyOn(coordinateUtils, 'getCoordinateSystem')
      .mockReturnValue({ coordinateSystem: COORDINATE_SYSTEMS.WGS84 })

    normaliseCoordinatesForDisplay.mockImplementation(
      (system, coords) => coords || []
    )
    isWGS84.mockImplementation(
      (coordinateSystem) => coordinateSystem === COORDINATE_SYSTEMS.WGS84
    )
    const expectedCoordinates = [{ latitude: '51.5074', longitude: '-0.1278' }]
    convertPayloadToCoordinatesArray.mockImplementation(() => {
      return expectedCoordinates
    })
    validateCoordinates.mockReturnValue({ error: null })
    convertArrayErrorsToFlattenedErrors.mockImplementation((error) => error)
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

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('#multipleCoordinatesController', () => {
    const mockH = { view: jest.fn() }

    beforeEach(() => {
      mockH.view.mockClear()
    })

    test('should render WGS84 template with correct context', () => {
      normaliseCoordinatesForDisplay.mockReturnValueOnce(mockCoordinates.wgs84)

      multipleCoordinatesController.handler({}, mockH)

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
      normaliseCoordinatesForDisplay.mockReturnValueOnce(mockCoordinates.osgb36)

      multipleCoordinatesController.handler({}, mockH)

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
      normaliseCoordinatesForDisplay.mockReturnValueOnce([])

      multipleCoordinatesController.handler({}, mockH)

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
        'coordinates[0][latitude]': '51.5074',
        'coordinates[0][longitude]': '-0.1278'
      }
      const request = { payload }
      const expectedCoordinates = [
        { latitude: '51.5074', longitude: '-0.1278' },
        paddedCoordinates.wgs84,
        paddedCoordinates.wgs84
      ]

      convertPayloadToCoordinatesArray.mockReturnValueOnce(expectedCoordinates)
      normaliseCoordinatesForDisplay.mockReturnValueOnce(expectedCoordinates)

      multipleCoordinatesSubmitController.handler(request, mockH)

      expect(convertPayloadToCoordinatesArray).toHaveBeenCalledWith(
        payload,
        COORDINATE_SYSTEMS.WGS84
      )
      expect(validateCoordinates).toHaveBeenCalledWith(
        expectedCoordinates,
        mockExemption.id,
        COORDINATE_SYSTEMS.WGS84
      )
      expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
        request,
        0,
        'coordinates',
        expectedCoordinates
      )
      expect(mockH.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })

    test('should handle validation errors by calling handleValidationFailure', () => {
      const payload = {
        'coordinates[0][latitude]': 'invalid'
      }
      const request = { payload }
      const mockValidationError = {
        details: [{ path: ['coordinates', 0, 'latitude'], message: 'Invalid' }]
      }

      validateCoordinates.mockReturnValueOnce({ error: mockValidationError })
      convertArrayErrorsToFlattenedErrors.mockReturnValueOnce(
        mockValidationError
      )

      multipleCoordinatesSubmitController.handler(request, mockH)

      expect(handleValidationFailure).toHaveBeenCalledWith(
        request,
        mockH,
        mockValidationError,
        COORDINATE_SYSTEMS.WGS84
      )
    })

    test('should handle OSGB36 coordinate system correctly', () => {
      getCoordinateSystemSpy.mockReturnValueOnce({
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36
      })
      const payload = {
        'coordinates[0][eastings]': '530000',
        'coordinates[0][northings]': '181000'
      }
      const request = { payload }
      const expectedCoordinates = [
        { eastings: '530000', northings: '181000' },
        paddedCoordinates.osgb36,
        paddedCoordinates.osgb36
      ]

      isWGS84.mockReturnValueOnce(false)
      convertPayloadToCoordinatesArray.mockReturnValueOnce(expectedCoordinates)
      normaliseCoordinatesForDisplay.mockReturnValueOnce(expectedCoordinates)

      multipleCoordinatesSubmitController.handler(request, mockH)

      expect(convertPayloadToCoordinatesArray).toHaveBeenCalledWith(
        payload,
        COORDINATE_SYSTEMS.OSGB36
      )
      expect(validateCoordinates).toHaveBeenCalledWith(
        expectedCoordinates,
        mockExemption.id,
        COORDINATE_SYSTEMS.OSGB36
      )
      expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
        request,
        0,
        'coordinates',
        expectedCoordinates
      )
      expect(mockH.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })

    test('should default to WGS84 when coordinateSystem is invalid', () => {
      const payload = {
        'coordinates[0][latitude]': '51.5074'
      }
      const request = { payload }

      isWGS84.mockReturnValueOnce(false)

      multipleCoordinatesSubmitController.handler(request, mockH)

      expect(convertPayloadToCoordinatesArray).toHaveBeenCalledWith(
        payload,
        COORDINATE_SYSTEMS.WGS84
      )
      expect(mockH.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
    })

    test('should re-render the page with an added wgs84 point when the add point button is clicked', () => {
      const payload = {
        'coordinates[0][latitude]': '51.5074',
        'coordinates[0][longitude]': '-0.1278',
        'coordinates[1][latitude]': '51.5175',
        'coordinates[1][longitude]': '-0.1376',
        'coordinates[2][latitude]': '51.5276',
        'coordinates[2][longitude]': '-0.1477',
        add: 'add'
      }
      const request = { payload }

      const existingCoordinates = [
        { latitude: '51.5074', longitude: '-0.1278' },
        { latitude: '51.5175', longitude: '-0.1376' },
        { latitude: '51.5276', longitude: '-0.1477' }
      ]
      const expectedCoordinates = [
        ...existingCoordinates,
        { latitude: '', longitude: '' },
        paddedCoordinates.wgs84
      ]
      getCoordinateSystemSpy.mockReturnValueOnce({
        coordinateSystem: COORDINATE_SYSTEMS.WGS84
      })
      convertPayloadToCoordinatesArray.mockReturnValueOnce(existingCoordinates)
      normaliseCoordinatesForDisplay.mockReturnValueOnce(expectedCoordinates)

      multipleCoordinatesSubmitController.handler(request, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          ...multipleCoordinatesPageData,
          coordinates: expectedCoordinates,
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
      const request = { payload }

      const existingCoordinates = [
        { eastings: '530000', northings: '181000' },
        { eastings: '530100', northings: '181100' },
        { eastings: '530200', northings: '181200' }
      ]
      const expectedCoordinates = [
        ...existingCoordinates,
        { eastings: '', northings: '' }
      ]
      getCoordinateSystemSpy.mockReturnValueOnce({
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36
      })
      convertPayloadToCoordinatesArray.mockReturnValueOnce(existingCoordinates)
      normaliseCoordinatesForDisplay.mockReturnValueOnce(expectedCoordinates)

      multipleCoordinatesSubmitController.handler(request, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.OSGB36],
        expect.objectContaining({
          ...multipleCoordinatesPageData,
          coordinates: expectedCoordinates,
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
      const request = { payload }

      const existingCoordinates = [
        { eastings: '530000', northings: '181000' },
        { eastings: '530100', northings: '181100' },
        { eastings: '530200', northings: '181200' }
      ]

      const expectedCoordinates = [
        { eastings: '530100', northings: '181100' },
        { eastings: '530200', northings: '181200' },
        paddedCoordinates.osgb36
      ]

      getCoordinateSystemSpy.mockReturnValueOnce({
        coordinateSystem: COORDINATE_SYSTEMS.OSGB36
      })
      convertPayloadToCoordinatesArray.mockReturnValueOnce(existingCoordinates)
      normaliseCoordinatesForDisplay.mockReturnValueOnce(expectedCoordinates)

      multipleCoordinatesSubmitController.handler(request, mockH)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.OSGB36],
        expect.objectContaining({
          ...multipleCoordinatesPageData,
          coordinates: expectedCoordinates,
          projectName: 'Test Project'
        })
      )
    })
  })
})
