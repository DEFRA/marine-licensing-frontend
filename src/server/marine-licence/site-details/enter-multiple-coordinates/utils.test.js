import { vi } from 'vitest'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/coordinate-systems.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { getMarineLicenceCache } from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { generatePointSpecificErrorMessage } from '#src/server/common/helpers/site-details.js'
import {
  MULTIPLE_COORDINATES_VIEW_ROUTES,
  multipleCoordinatesPageData,
  normaliseCoordinatesForDisplay,
  convertPayloadToCoordinatesArray,
  convertArrayErrorsToFlattenedErrors,
  createErrorSummary,
  createFieldErrors,
  handleValidationFailure,
  removeCoordinateAtIndex,
  isWGS84
} from './utils.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/site-details.js')

const EMPTY_WGS84 = { latitude: '', longitude: '' }
const EMPTY_OSGB36 = { easting: '', northing: '' }

const SAMPLE_WGS84 = [
  { latitude: '51.5074', longitude: '-0.1278' },
  { latitude: '52.4862', longitude: '-1.8904' },
  { latitude: '53.4808', longitude: '-2.2426' }
]

const SAMPLE_OSGB36 = [
  { easting: '529090', northing: '181680' },
  { easting: '406250', northing: '286550' },
  { easting: '383500', northing: '398000' }
]

describe('enter-multiple-coordinates utils (marine licence)', () => {
  describe('MULTIPLE_COORDINATES_VIEW_ROUTES', () => {
    test('should point to shared templates', () => {
      expect(MULTIPLE_COORDINATES_VIEW_ROUTES).toEqual({
        [COORDINATE_SYSTEMS.WGS84]: 'templates/multiple-coordinates-wgs84',
        [COORDINATE_SYSTEMS.OSGB36]: 'templates/multiple-coordinates-osgb36'
      })
    })
  })

  describe('multipleCoordinatesPageData', () => {
    test('should use marine licence coordinate system choice as back link', () => {
      expect(multipleCoordinatesPageData.backLink).toBe(
        marineLicenceRoutes.MARINE_LICENCE_COORDINATE_SYSTEM_CHOICE
      )
    })

    test('should use marine licence task list cancel link', () => {
      expect(multipleCoordinatesPageData.cancelLink).toBe(
        marineLicenceRoutes.MARINE_LICENCE_TASK_LIST + '?cancel=site-details'
      )
    })
  })

  describe('isWGS84', () => {
    test('returns true for WGS84', () => {
      expect(isWGS84(COORDINATE_SYSTEMS.WGS84)).toBe(true)
    })

    test('returns false for OSGB36', () => {
      expect(isWGS84(COORDINATE_SYSTEMS.OSGB36)).toBe(false)
    })
  })

  describe('normaliseCoordinatesForDisplay', () => {
    test('returns 3 empty WGS84 coordinates when array is empty', () => {
      expect(
        normaliseCoordinatesForDisplay(COORDINATE_SYSTEMS.WGS84, [])
      ).toEqual([EMPTY_WGS84, EMPTY_WGS84, EMPTY_WGS84])
    })

    test('returns 3 empty OSGB36 coordinates when array is empty', () => {
      expect(
        normaliseCoordinatesForDisplay(COORDINATE_SYSTEMS.OSGB36, [])
      ).toEqual([EMPTY_OSGB36, EMPTY_OSGB36, EMPTY_OSGB36])
    })

    test('pads WGS84 coordinates to minimum 3', () => {
      const result = normaliseCoordinatesForDisplay(COORDINATE_SYSTEMS.WGS84, [
        SAMPLE_WGS84[0],
        SAMPLE_WGS84[1]
      ])
      expect(result).toHaveLength(3)
      expect(result[2]).toEqual(EMPTY_WGS84)
    })

    test('resets to defaults when coordinate system does not match data', () => {
      const result = normaliseCoordinatesForDisplay(
        COORDINATE_SYSTEMS.WGS84,
        SAMPLE_OSGB36
      )
      expect(result).toEqual([EMPTY_WGS84, EMPTY_WGS84, EMPTY_WGS84])
    })
  })

  describe('convertPayloadToCoordinatesArray', () => {
    test('converts WGS84 payload to coordinates array', () => {
      const payload = {
        'coordinates[0][latitude]': '51.5074',
        'coordinates[0][longitude]': '-0.1278',
        'coordinates[1][latitude]': '52.4862',
        'coordinates[1][longitude]': '-1.8904'
      }
      const result = convertPayloadToCoordinatesArray(
        payload,
        COORDINATE_SYSTEMS.WGS84
      )
      expect(result).toEqual([
        { latitude: '51.5074', longitude: '-0.1278' },
        { latitude: '52.4862', longitude: '-1.8904' }
      ])
    })

    test('converts OSGB36 payload to coordinates array', () => {
      const payload = {
        'coordinates[0][easting]': '529090',
        'coordinates[0][northing]': '181680'
      }
      const result = convertPayloadToCoordinatesArray(
        payload,
        COORDINATE_SYSTEMS.OSGB36
      )
      expect(result).toEqual([{ easting: '529090', northing: '181680' }])
    })
  })

  describe('removeCoordinateAtIndex', () => {
    test('removes coordinate above minimum threshold', () => {
      const coords = [...SAMPLE_WGS84, { latitude: '54.0', longitude: '-3.0' }]
      const result = removeCoordinateAtIndex(coords, 3)
      expect(result).toHaveLength(3)
    })

    test('does not remove coordinate at or below minimum threshold', () => {
      const result = removeCoordinateAtIndex(SAMPLE_WGS84, 2)
      expect(result).toHaveLength(3)
    })
  })

  describe('convertArrayErrorsToFlattenedErrors', () => {
    test('flattens array path segments into bracket notation', () => {
      const error = {
        details: [
          {
            path: ['coordinates', 0, 'latitude'],
            message: 'invalid latitude'
          }
        ]
      }
      const result = convertArrayErrorsToFlattenedErrors(error)
      expect(result.details[0].path).toEqual(['coordinates[0][latitude]'])
    })

    test('returns error unchanged when no details', () => {
      const error = { message: 'unknown error' }
      expect(convertArrayErrorsToFlattenedErrors(error)).toBe(error)
    })
  })

  describe('createErrorSummary', () => {
    test('returns array of href/text pairs', () => {
      vi.mocked(generatePointSpecificErrorMessage).mockReturnValue(
        'Enter latitude'
      )
      const error = {
        details: [{ path: ['coordinates0latitude'], message: 'Enter latitude' }]
      }
      const result = createErrorSummary(error)
      expect(result).toEqual([
        expect.objectContaining({
          href: expect.any(String),
          text: 'Enter latitude'
        })
      ])
    })
  })

  describe('createFieldErrors', () => {
    test('returns object keyed by field name', () => {
      vi.mocked(generatePointSpecificErrorMessage).mockReturnValue(
        'Enter latitude'
      )
      const error = {
        details: [{ path: ['coordinates0latitude'], message: 'Enter latitude' }]
      }
      const result = createFieldErrors(error)
      expect(result).toEqual(
        expect.objectContaining({
          coordinates0latitude: { text: 'Enter latitude' }
        })
      )
    })
  })

  describe('handleValidationFailure', () => {
    const mockTakeover = vi.fn()
    const mockH = {
      view: vi.fn().mockReturnValue({ takeover: mockTakeover })
    }

    beforeEach(() => {
      mockH.view.mockClear()
      mockTakeover.mockClear()
      vi.mocked(getMarineLicenceCache).mockReturnValue({
        projectName: 'Test Project'
      })
      mockH.view.mockReturnValue({ takeover: mockTakeover })
    })

    test('renders view with errors when error has details', () => {
      const request = {
        payload: { 'coordinates[0][latitude]': 'bad' },
        yar: { get: vi.fn() }
      }
      const error = {
        details: [{ path: ['coordinates0latitude'], message: 'bad value' }]
      }

      handleValidationFailure(request, mockH, error, COORDINATE_SYSTEMS.WGS84)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          errorSummary: expect.any(Array),
          errors: expect.any(Object),
          projectName: 'Test Project'
        })
      )
      expect(mockTakeover).toHaveBeenCalled()
    })

    test('renders view without errors when error has no details', () => {
      const request = {
        payload: {},
        yar: { get: vi.fn() }
      }
      const error = { message: 'generic error' }

      handleValidationFailure(request, mockH, error, COORDINATE_SYSTEMS.WGS84)

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.not.objectContaining({ errorSummary: expect.anything() })
      )
      expect(mockTakeover).toHaveBeenCalled()
    })
  })
})
