import { createServer } from '~/src/server/index.js'
import {
  multipleCoordinatesController,
  multipleCoordinatesSubmitController
} from '~/src/server/exemption/site-details/enter-multiple-coordinates/controller.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/coordinates.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  MULTIPLE_COORDINATES_VIEW_ROUTES,
  normaliseCoordinatesForDisplay
} from '~/src/server/exemption/site-details/enter-multiple-coordinates/utils.js'
import { createWgs84MultipleCoordinatesSchema } from '~/src/server/common/schemas/wgs84.js'
import { createOsgb36MultipleCoordinatesSchema } from '~/src/server/common/schemas/osgb36.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock(
  '~/src/server/exemption/site-details/enter-multiple-coordinates/utils.js',
  () => ({
    MULTIPLE_COORDINATES_VIEW_ROUTES: {
      WGS84: 'wgs84.njk',
      OSGB36: 'osgb36.njk'
    },
    normaliseCoordinatesForDisplay: jest.fn()
  })
)
jest.mock('~/src/server/common/schemas/wgs84.js')
jest.mock('~/src/server/common/schemas/osgb36.js')

describe('#multipleCoordinates', () => {
  /** @type {Server} */
  let server
  let getExemptionCacheSpy
  let updateExemptionSiteDetailsSpy

  const mockMultipleCoordinates = {
    [COORDINATE_SYSTEMS.WGS84]: [
      { latitude: '51.5074', longitude: '-0.1278' },
      { latitude: '51.5175', longitude: '-0.1376' }
    ],
    [COORDINATE_SYSTEMS.OSGB36]: [
      { eastings: '530000', northings: '181000' },
      { eastings: '530100', northings: '181100' }
    ]
  }

  const mockExemptionWithMultipleCoordinates = {
    ...mockExemption,
    siteDetails: {
      ...mockExemption.siteDetails,
      coordinateSystem: COORDINATE_SYSTEMS.WGS84,
      multipleCoordinates: {
        [COORDINATE_SYSTEMS.WGS84]:
          mockMultipleCoordinates[COORDINATE_SYSTEMS.WGS84]
      }
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
      .mockReturnValue(mockExemptionWithMultipleCoordinates)
    updateExemptionSiteDetailsSpy = jest
      .spyOn(cacheUtils, 'updateExemptionSiteDetails')
      .mockImplementation(() => ({}))
    normaliseCoordinatesForDisplay.mockImplementation((coords) => coords || [])

    // Set up default successful validation schemas
    const mockSuccessfulSchema = {
      validate: jest.fn().mockReturnValue({ error: null })
    }
    createWgs84MultipleCoordinatesSchema.mockReturnValue(mockSuccessfulSchema)
    createOsgb36MultipleCoordinatesSchema.mockReturnValue(mockSuccessfulSchema)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('#multipleCoordinatesController', () => {
    test('should render with correct context when no existing coordinates', () => {
      getExemptionCacheSpy.mockReturnValueOnce({
        ...mockExemption,
        siteDetails: {}
      })
      normaliseCoordinatesForDisplay.mockReturnValueOnce([])

      const h = { view: jest.fn() }

      multipleCoordinatesController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          heading:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          coordinates: [],
          projectName: 'Test Project'
        }
      )
    })

    test('should render with correct context for WGS84 coordinates', () => {
      const h = { view: jest.fn() }
      const mockNormalisedCoordinates =
        mockMultipleCoordinates[COORDINATE_SYSTEMS.WGS84]
      normaliseCoordinatesForDisplay.mockReturnValueOnce(
        mockNormalisedCoordinates
      )

      multipleCoordinatesController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          heading:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          coordinates: mockNormalisedCoordinates,
          projectName: 'Test Project'
        }
      )

      expect(normaliseCoordinatesForDisplay).toHaveBeenCalledWith(
        mockMultipleCoordinates[COORDINATE_SYSTEMS.WGS84],
        COORDINATE_SYSTEMS.WGS84
      )
    })

    test('should render with correct context for OSGB36 coordinates', () => {
      const h = { view: jest.fn() }
      const mockNormalisedCoordinates =
        mockMultipleCoordinates[COORDINATE_SYSTEMS.OSGB36]

      getExemptionCacheSpy.mockReturnValueOnce({
        ...mockExemption,
        siteDetails: {
          ...mockExemption.siteDetails,
          coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
          multipleCoordinates: {
            [COORDINATE_SYSTEMS.OSGB36]:
              mockMultipleCoordinates[COORDINATE_SYSTEMS.OSGB36]
          }
        }
      })

      normaliseCoordinatesForDisplay.mockReturnValueOnce(
        mockNormalisedCoordinates
      )

      multipleCoordinatesController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.OSGB36],
        {
          heading:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          coordinates: mockNormalisedCoordinates,
          projectName: 'Test Project'
        }
      )

      expect(normaliseCoordinatesForDisplay).toHaveBeenCalledWith(
        mockMultipleCoordinates[COORDINATE_SYSTEMS.OSGB36],
        COORDINATE_SYSTEMS.OSGB36
      )
    })

    test('should handle empty exemption cache gracefully', () => {
      getExemptionCacheSpy.mockReturnValueOnce(undefined)
      normaliseCoordinatesForDisplay.mockReturnValueOnce([])

      const h = { view: jest.fn() }

      multipleCoordinatesController.handler({}, h)

      expect(h.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          heading:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          coordinates: [],
          projectName: undefined
        }
      )
    })
  })

  describe('#multipleCoordinatesSubmitController', () => {
    test('should successfully process valid WGS84 coordinates', () => {
      const payload = {
        'coordinates[0][latitude]': '51.507400',
        'coordinates[0][longitude]': '-0.127800',
        'coordinates[1][latitude]': '51.517500',
        'coordinates[1][longitude]': '-0.137600',
        'coordinates[2][latitude]': '51.527600',
        'coordinates[2][longitude]': '-0.147700',
        coordinateSystem: 'WGS84'
      }

      const request = { payload }
      const h = { view: jest.fn() }
      const mockNormalisedCoordinates =
        mockMultipleCoordinates[COORDINATE_SYSTEMS.WGS84]

      // Mock successful validation by ensuring valid exemption with id
      const validExemption = {
        ...mockExemptionWithMultipleCoordinates,
        id: 'valid-exemption-id'
      }
      getExemptionCacheSpy.mockReturnValueOnce(validExemption)
      getExemptionCacheSpy.mockReturnValueOnce(validExemption)

      normaliseCoordinatesForDisplay.mockReturnValueOnce(
        mockNormalisedCoordinates
      )

      const expectedCoordinates = [
        { latitude: '51.507400', longitude: '-0.127800' },
        { latitude: '51.517500', longitude: '-0.137600' },
        { latitude: '51.527600', longitude: '-0.147700' }
      ]

      multipleCoordinatesSubmitController.handler(request, h)

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        request,
        'multipleCoordinates',
        { [COORDINATE_SYSTEMS.WGS84]: expectedCoordinates }
      )

      expect(h.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          heading:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          coordinates: mockNormalisedCoordinates,
          projectName: 'Test Project'
        }
      )
    })

    test('should successfully process valid OSGB36 coordinates', () => {
      const payload = {
        'coordinates[0][eastings]': '530000',
        'coordinates[0][northings]': '181000',
        'coordinates[1][eastings]': '530100',
        'coordinates[1][northings]': '181100',
        'coordinates[2][eastings]': '530200',
        'coordinates[2][northings]': '181200',
        coordinateSystem: 'OSGB36'
      }

      const request = { payload }
      const h = { view: jest.fn() }
      const mockNormalisedCoordinates =
        mockMultipleCoordinates[COORDINATE_SYSTEMS.OSGB36]

      // Mock successful validation by ensuring valid exemption with id
      const validExemption = {
        ...mockExemption,
        id: 'valid-exemption-id',
        siteDetails: {
          ...mockExemption.siteDetails,
          coordinateSystem: COORDINATE_SYSTEMS.OSGB36,
          multipleCoordinates: {}
        }
      }
      getExemptionCacheSpy.mockReturnValueOnce(validExemption)
      getExemptionCacheSpy.mockReturnValueOnce(validExemption)

      normaliseCoordinatesForDisplay.mockReturnValueOnce(
        mockNormalisedCoordinates
      )

      const expectedCoordinates = [
        { eastings: '530000', northings: '181000' },
        { eastings: '530100', northings: '181100' },
        { eastings: '530200', northings: '181200' }
      ]

      multipleCoordinatesSubmitController.handler(request, h)

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        request,
        'multipleCoordinates',
        { [COORDINATE_SYSTEMS.OSGB36]: expectedCoordinates }
      )

      expect(h.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.OSGB36],
        {
          heading:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          coordinates: mockNormalisedCoordinates,
          projectName: 'Test Project'
        }
      )
    })

    test('should handle validation errors and display error messages', () => {
      // Mock validation failure with error details
      const mockValidationError = {
        details: [
          {
            path: ['coordinates', 0, 'latitude'],
            message: 'Invalid latitude value'
          }
        ]
      }
      const mockFailingSchema = {
        validate: jest.fn().mockReturnValue({
          error: mockValidationError
        })
      }
      createWgs84MultipleCoordinatesSchema.mockReturnValue(mockFailingSchema)

      const payload = {
        'coordinates[0][latitude]': 'invalid',
        'coordinates[0][longitude]': '-0.1278',
        coordinateSystem: 'WGS84'
      }

      const request = { payload }
      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      // Mock validation failure by having invalid coordinates
      multipleCoordinatesSubmitController.handler(request, h)

      // Should not update cache when validation fails
      expect(updateExemptionSiteDetailsSpy).not.toHaveBeenCalled()

      // Should render with error context
      expect(h.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          heading:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          coordinates: expect.any(Array),
          projectName: 'Test Project'
        })
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('should handle empty payload gracefully', () => {
      const request = {
        payload: { coordinateSystem: 'WGS84' }
      }
      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      normaliseCoordinatesForDisplay.mockReturnValueOnce([])

      multipleCoordinatesSubmitController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          heading:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          coordinates: [],
          projectName: 'Test Project'
        })
      )
    })

    test('should handle missing coordinate fields in payload', () => {
      // Mock exemption with empty coordinates so only payload is processed
      getExemptionCacheSpy.mockReturnValueOnce({
        ...mockExemption,
        siteDetails: {}
      })
      getExemptionCacheSpy.mockReturnValueOnce({
        ...mockExemption,
        siteDetails: {}
      })

      const payload = {
        'coordinates[0][latitude]': '51.5074',
        coordinateSystem: 'WGS84'
        // Missing longitude
      }

      const request = { payload }
      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      const expectedCoordinates = [{ latitude: '51.5074', longitude: '' }]
      normaliseCoordinatesForDisplay.mockReturnValueOnce(expectedCoordinates)

      multipleCoordinatesSubmitController.handler(request, h)

      // Should still process the partial coordinates
      expect(h.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          coordinates: expectedCoordinates,
          projectName: 'Test Project'
        })
      )
    })

    test('should handle sparse coordinate indices', () => {
      const payload = {
        'coordinates[0][latitude]': '51.5074',
        'coordinates[0][longitude]': '-0.1278',
        'coordinates[2][latitude]': '51.5175',
        'coordinates[2][longitude]': '-0.1376',
        coordinateSystem: 'WGS84'
        // Missing index 1
      }

      const request = { payload }
      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      multipleCoordinatesSubmitController.handler(request, h)

      // Should handle sparse arrays correctly
      expect(h.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          heading:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          projectName: 'Test Project'
        })
      )
    })

    test('should handle validation error without details property', () => {
      // Mock the validation schema to return an error without details
      const mockValidationError = new Error('Custom validation error')
      const mockSchema = {
        validate: jest.fn().mockReturnValue({
          error: mockValidationError
        })
      }

      createWgs84MultipleCoordinatesSchema.mockReturnValue(mockSchema)

      const payload = {
        'coordinates[0][latitude]': '51.5074',
        'coordinates[0][longitude]': '-0.1278',
        coordinateSystem: 'WGS84'
      }

      const request = { payload }
      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      normaliseCoordinatesForDisplay.mockReturnValueOnce([
        { latitude: '51.5074', longitude: '-0.1278' }
      ])

      multipleCoordinatesSubmitController.handler(request, h)

      // Should not update cache when validation fails
      expect(updateExemptionSiteDetailsSpy).not.toHaveBeenCalled()

      // Should render with error context but without errorSummary or errors
      expect(h.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          heading:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          coordinates: expect.any(Array),
          projectName: 'Test Project'
        })
      )

      expect(h.view().takeover).toHaveBeenCalled()

      // Verify that the view was called without errorSummary or errors properties
      const calledWith = h.view.mock.calls[0][1]
      expect(calledWith).not.toHaveProperty('errorSummary')
      expect(calledWith).not.toHaveProperty('errors')
    })

    test('should default to WGS84 when coordinateSystem is undefined', () => {
      const payload = {
        'coordinates[0][latitude]': '51.5074',
        'coordinates[0][longitude]': '-0.1278'
        // coordinateSystem is undefined
      }

      const request = { payload }
      const h = { view: jest.fn() }

      const validExemption = {
        ...mockExemptionWithMultipleCoordinates,
        id: 'valid-exemption-id'
      }
      getExemptionCacheSpy.mockReturnValueOnce(validExemption)

      const expectedCoordinates = [
        { latitude: '51.5074', longitude: '-0.1278' }
      ]
      normaliseCoordinatesForDisplay.mockReturnValueOnce(expectedCoordinates)

      multipleCoordinatesSubmitController.handler(request, h)

      // Should use WGS84 as default
      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        request,
        'multipleCoordinates',
        { [COORDINATE_SYSTEMS.WGS84]: expectedCoordinates }
      )

      expect(h.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          coordinates: expectedCoordinates,
          projectName: 'Test Project'
        })
      )
    })

    test('should default to WGS84 when coordinateSystem has unexpected value', () => {
      const payload = {
        'coordinates[0][latitude]': '51.5074',
        'coordinates[0][longitude]': '-0.1278',
        coordinateSystem: 'INVALID_SYSTEM'
      }

      const request = { payload }
      const h = { view: jest.fn() }

      const validExemption = {
        ...mockExemptionWithMultipleCoordinates,
        id: 'valid-exemption-id'
      }
      getExemptionCacheSpy.mockReturnValueOnce(validExemption)

      const expectedCoordinates = [
        { latitude: '51.5074', longitude: '-0.1278' }
      ]
      normaliseCoordinatesForDisplay.mockReturnValueOnce(expectedCoordinates)

      multipleCoordinatesSubmitController.handler(request, h)

      // Should use WGS84 as default
      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        request,
        'multipleCoordinates',
        { [COORDINATE_SYSTEMS.WGS84]: expectedCoordinates }
      )

      expect(h.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          coordinates: expectedCoordinates,
          projectName: 'Test Project'
        })
      )
    })

    test('should handle undefined exemption gracefully', () => {
      const payload = {
        'coordinates[0][latitude]': '51.5074',
        'coordinates[0][longitude]': '-0.1278',
        coordinateSystem: 'WGS84'
      }

      const request = { payload }
      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      // Mock undefined exemption
      getExemptionCacheSpy.mockReturnValueOnce(undefined)

      multipleCoordinatesSubmitController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        {
          heading:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          coordinates: [],
          projectName: undefined
        }
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('should handle exemption without projectName gracefully', () => {
      const payload = {
        'coordinates[0][latitude]': '51.5074',
        'coordinates[0][longitude]': '-0.1278',
        coordinateSystem: 'WGS84'
      }

      const request = { payload }
      const h = { view: jest.fn() }

      const exemptionWithoutProjectName = {
        ...mockExemptionWithMultipleCoordinates,
        id: 'valid-exemption-id',
        projectName: undefined
      }
      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithoutProjectName)

      const expectedCoordinates = [
        { latitude: '51.5074', longitude: '-0.1278' }
      ]
      normaliseCoordinatesForDisplay.mockReturnValueOnce(expectedCoordinates)

      multipleCoordinatesSubmitController.handler(request, h)

      expect(h.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          coordinates: expectedCoordinates,
          projectName: undefined
        })
      )
    })

    test('should handle exemption with undefined id gracefully', () => {
      const payload = {
        'coordinates[0][latitude]': '51.5074',
        'coordinates[0][longitude]': '-0.1278',
        coordinateSystem: 'WGS84'
      }

      const request = { payload }
      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      const exemptionWithUndefinedId = {
        ...mockExemptionWithMultipleCoordinates,
        id: undefined
      }
      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithUndefinedId)

      multipleCoordinatesSubmitController.handler(request, h)

      // Should not update cache when exemption has invalid id
      expect(updateExemptionSiteDetailsSpy).not.toHaveBeenCalled()

      expect(h.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          heading:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          coordinates: expect.any(Array),
          projectName: 'Test Project'
        })
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('should handle exemption with null id gracefully', () => {
      const payload = {
        'coordinates[0][latitude]': '51.5074',
        'coordinates[0][longitude]': '-0.1278',
        coordinateSystem: 'WGS84'
      }

      const request = { payload }
      const h = {
        view: jest.fn().mockReturnValue({
          takeover: jest.fn()
        })
      }

      const exemptionWithNullId = {
        ...mockExemptionWithMultipleCoordinates,
        id: null
      }
      getExemptionCacheSpy.mockReturnValueOnce(exemptionWithNullId)

      multipleCoordinatesSubmitController.handler(request, h)

      // Should not update cache when exemption has invalid id
      expect(updateExemptionSiteDetailsSpy).not.toHaveBeenCalled()

      expect(h.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          heading:
            'Enter multiple sets of coordinates to mark the boundary of the site',
          backLink: routes.COORDINATE_SYSTEM_CHOICE,
          coordinates: expect.any(Array),
          projectName: 'Test Project'
        })
      )

      expect(h.view().takeover).toHaveBeenCalled()
    })

    test('should handle coordinates array with undefined elements', () => {
      const payload = {
        'coordinates[0][latitude]': '51.5074',
        'coordinates[0][longitude]': '-0.1278',
        'coordinates[3][latitude]': '51.5175',
        'coordinates[3][longitude]': '-0.1376',
        coordinateSystem: 'WGS84'
        // Creates sparse array with undefined elements at indices 1 and 2
      }

      const request = { payload }
      const h = { view: jest.fn() }

      const validExemption = {
        ...mockExemptionWithMultipleCoordinates,
        id: 'valid-exemption-id'
      }
      getExemptionCacheSpy.mockReturnValueOnce(validExemption)

      const expectedCoordinates = [
        { latitude: '51.5074', longitude: '-0.1278' },
        undefined,
        undefined,
        { latitude: '51.5175', longitude: '-0.1376' }
      ]
      normaliseCoordinatesForDisplay.mockReturnValueOnce(expectedCoordinates)

      multipleCoordinatesSubmitController.handler(request, h)

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        request,
        'multipleCoordinates',
        { [COORDINATE_SYSTEMS.WGS84]: expectedCoordinates }
      )

      expect(h.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          coordinates: expectedCoordinates,
          projectName: 'Test Project'
        })
      )
    })
  })
})
