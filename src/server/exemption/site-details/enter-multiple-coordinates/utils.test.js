import { vi } from 'vitest'
import { COORDINATE_SYSTEMS } from '#src/server/common/constants/exemptions.js'
import { routes } from '#src/server/common/constants/routes.js'
import { getExemptionCache } from '#src/server/common/helpers/exemptions/session-cache/utils.js'
import { generatePointSpecificErrorMessage } from '#src/server/common/helpers/site-details.js'
import {
  PATTERNS,
  multipleCoordinatesPageData,
  COORDINATE_FIELDS,
  MULTIPLE_COORDINATES_VIEW_ROUTES,
  isWGS84,
  normaliseCoordinatesForDisplay,
  extractCoordinateIndexFromFieldName,
  sanitiseFieldName,
  convertPayloadToCoordinatesArray,
  convertArrayErrorsToFlattenedErrors,
  processErrorDetail,
  createErrorSummary,
  createFieldErrors,
  handleValidationFailure,
  removeCoordinateAtIndex
} from './utils.js'

vi.mock('~/src/server/common/helpers/exemptions/session-cache/utils.js')
vi.mock('~/src/server/common/helpers/site-details.js')
vi.mock('~/src/server/common/schemas/osgb36.js')
vi.mock('~/src/server/common/schemas/wgs84.js')

const EMPTY_WGS84_COORDINATE = { latitude: '', longitude: '' }
const EMPTY_OSGB36_COORDINATE = { eastings: '', northings: '' }

const SAMPLE_WGS84_COORDINATES = [
  { latitude: '51.5074', longitude: '-0.1278' },
  { latitude: '52.4862', longitude: '-1.8904' },
  { latitude: '53.4808', longitude: '-2.2426' }
]

const SAMPLE_OSGB36_COORDINATES = [
  { eastings: '529090', northings: '181680' },
  { eastings: '406250', northings: '286550' },
  { eastings: '383500', northings: '398000' }
]

const COORDINATE_SYSTEMS_TEST_DATA = [
  {
    system: COORDINATE_SYSTEMS.WGS84,
    emptyCoordinate: EMPTY_WGS84_COORDINATE,
    sampleCoordinates: SAMPLE_WGS84_COORDINATES,
    fields: { primary: 'latitude', secondary: 'longitude' }
  },
  {
    system: COORDINATE_SYSTEMS.OSGB36,
    emptyCoordinate: EMPTY_OSGB36_COORDINATE,
    sampleCoordinates: SAMPLE_OSGB36_COORDINATES,
    fields: { primary: 'eastings', secondary: 'northings' }
  }
]

describe('enter-multiple-coordinates utils', () => {
  describe('MULTIPLE_COORDINATES_VIEW_ROUTES', () => {
    it('should provide correct route mappings for coordinate systems', () => {
      expect(MULTIPLE_COORDINATES_VIEW_ROUTES).toEqual({
        [COORDINATE_SYSTEMS.WGS84]:
          'exemption/site-details/enter-multiple-coordinates/wgs84',
        [COORDINATE_SYSTEMS.OSGB36]:
          'exemption/site-details/enter-multiple-coordinates/osgb36'
      })
    })
  })

  describe('normaliseCoordinatesForDisplay', () => {
    it('should return 3 empty coordinates when array is empty', () => {
      expect(
        normaliseCoordinatesForDisplay(COORDINATE_SYSTEMS.WGS84, [])
      ).toEqual([
        { latitude: '', longitude: '' },
        { latitude: '', longitude: '' },
        { latitude: '', longitude: '' }
      ])
      expect(
        normaliseCoordinatesForDisplay(COORDINATE_SYSTEMS.OSGB36, [])
      ).toEqual([
        { eastings: '', northings: '' },
        { eastings: '', northings: '' },
        { eastings: '', northings: '' }
      ])
    })

    it('should return 3 empty coordinates if first coordinate is WGS84 but system is OSGB36', () => {
      const coords = [{ latitude: '51.5', longitude: '-0.1' }]
      expect(
        normaliseCoordinatesForDisplay(COORDINATE_SYSTEMS.OSGB36, coords)
      ).toEqual([
        { eastings: '', northings: '' },
        { eastings: '', northings: '' },
        { eastings: '', northings: '' }
      ])
    })

    it('should return 3 empty coordinates if first coordinate is OSGB36 but system is WGS84', () => {
      const coords = [{ eastings: '123456', northings: '654321' }]
      expect(
        normaliseCoordinatesForDisplay(COORDINATE_SYSTEMS.WGS84, coords)
      ).toEqual([
        { latitude: '', longitude: '' },
        { latitude: '', longitude: '' },
        { latitude: '', longitude: '' }
      ])
    })

    it('should pad with empty coordinates if fewer than 3 and keys match system', () => {
      const coords = [{ latitude: '51.5', longitude: '-0.1' }]
      expect(
        normaliseCoordinatesForDisplay(COORDINATE_SYSTEMS.WGS84, coords)
      ).toEqual([
        { latitude: '51.5', longitude: '-0.1' },
        { latitude: '', longitude: '' },
        { latitude: '', longitude: '' }
      ])
    })

    it('should return coordinates as-is if 3 or more and keys match system', () => {
      const coords = [
        { latitude: '51.5', longitude: '-0.1' },
        { latitude: '52.5', longitude: '-1.1' },
        { latitude: '53.5', longitude: '-2.1' }
      ]
      expect(
        normaliseCoordinatesForDisplay(COORDINATE_SYSTEMS.WGS84, coords)
      ).toEqual(coords)
    })

    it('should return 3 empty coordinates if first coordinate is not an object', () => {
      expect(
        normaliseCoordinatesForDisplay(COORDINATE_SYSTEMS.WGS84, [null])
      ).toEqual([
        { latitude: '', longitude: '' },
        { latitude: '', longitude: '' },
        { latitude: '', longitude: '' }
      ])
    })

    it('should return 3 empty coordinates if no coordinates', () => {
      expect(normaliseCoordinatesForDisplay(COORDINATE_SYSTEMS.WGS84)).toEqual([
        { latitude: '', longitude: '' },
        { latitude: '', longitude: '' },
        { latitude: '', longitude: '' }
      ])
    })

    it('should return 3 empty coordinates if array contains mixed coordinate types and first does not match', () => {
      const coords = [
        { eastings: '123456', northings: '654321' },
        { latitude: '51.5', longitude: '-0.1' }
      ]
      expect(
        normaliseCoordinatesForDisplay(COORDINATE_SYSTEMS.WGS84, coords)
      ).toEqual([
        { latitude: '', longitude: '' },
        { latitude: '', longitude: '' },
        { latitude: '', longitude: '' }
      ])
    })

    it('should pick osgb36 if first coordinate has both field types when system is OSGB36', () => {
      const coords = [
        {
          latitude: '51.5',
          longitude: '-0.1',
          eastings: '123456',
          northings: '654321'
        }
      ]
      expect(
        normaliseCoordinatesForDisplay(COORDINATE_SYSTEMS.OSGB36, coords)
      ).toEqual([
        { eastings: '123456', northings: '654321' },
        { eastings: '', northings: '' },
        { eastings: '', northings: '' }
      ])
    })

    it('should pick wsg84 if first coordinate has both field types when system is WSG84', () => {
      const coords = [
        {
          latitude: '51.5',
          longitude: '-0.1',
          eastings: '123456',
          northings: '654321'
        }
      ]
      expect(
        normaliseCoordinatesForDisplay(COORDINATE_SYSTEMS.WGS84, coords)
      ).toEqual([
        { latitude: '51.5', longitude: '-0.1' },
        { latitude: '', longitude: '' },
        { latitude: '', longitude: '' }
      ])
    })

    it('should return 3 empty coordinates when coordinate system is invalid/unknown', () => {
      const coords = [{ latitude: '51.5', longitude: '-0.1' }]
      const invalidCoordinateSystem = 'INVALID_SYSTEM'

      expect(
        normaliseCoordinatesForDisplay(invalidCoordinateSystem, coords)
      ).toEqual([
        { eastings: '', northings: '' },
        { eastings: '', northings: '' },
        { eastings: '', northings: '' }
      ])
    })
  })

  describe('PATTERNS', () => {
    it('should provide correct regex pattern and remove field brackets', () => {
      expect(PATTERNS.FIELD_BRACKETS).toEqual(/[[\]]/g)

      const testString = 'coordinates[0][latitude]'
      const result = testString.replace(PATTERNS.FIELD_BRACKETS, '')
      expect(result).toBe('coordinates0latitude')
    })
  })

  describe('multipleCoordinatesPageData', () => {
    it('should provide correct page data', () => {
      expect(multipleCoordinatesPageData).toEqual({
        heading:
          'Enter multiple sets of coordinates to mark the boundary of the site',
        pageTitle:
          'Enter multiple sets of coordinates to mark the boundary of the site',
        backLink: routes.COORDINATE_SYSTEM_CHOICE,
        cancelLink: '/exemption/task-list?cancel=site-details'
      })
    })
  })

  describe('COORDINATE_FIELDS', () => {
    it('should provide correct field mappings for both coordinate systems', () => {
      expect(COORDINATE_FIELDS.WGS84).toEqual({
        primary: 'latitude',
        secondary: 'longitude'
      })
      expect(COORDINATE_FIELDS.OSGB36).toEqual({
        primary: 'eastings',
        secondary: 'northings'
      })
    })
  })

  describe('isWGS84', () => {
    it('should return correct boolean for coordinate systems', () => {
      expect(isWGS84(COORDINATE_SYSTEMS.WGS84)).toBe(true)
      expect(isWGS84(COORDINATE_SYSTEMS.OSGB36)).toBe(false)
      expect(isWGS84(undefined)).toBe(false)
      expect(isWGS84(null)).toBe(false)
    })
  })

  describe('extractCoordinateIndexFromFieldName', () => {
    it.each([
      { input: 'coordinates0latitude', expected: 0 },
      { input: 'coordinates1longitude', expected: 1 },
      { input: 'coordinates2eastings', expected: 2 },
      { input: 'coordinates10latitude', expected: 10 },
      { input: 'coordinates123longitude', expected: 123 },
      { input: 'latitude', expected: 0 },
      { input: 'longitude', expected: 0 }
    ])(
      'should extract index from field name - $input should return $expected',
      ({ input, expected }) => {
        expect(extractCoordinateIndexFromFieldName(input)).toBe(expected)
      }
    )
  })

  describe('sanitiseFieldName', () => {
    it.each([
      {
        input: ['coordinates[0][latitude]'],
        expected: 'coordinates0latitude'
      },
      {
        input: ['coordinates[1][longitude]'],
        expected: 'coordinates1longitude'
      },
      { input: ['latitude'], expected: 'latitude' },
      {
        input: ['coordinates[0]', '[latitude]'],
        expected: 'coordinates0latitude'
      }
    ])(
      'should remove brackets from field paths - $input should return $expected',
      ({ input, expected }) => {
        expect(sanitiseFieldName(input)).toBe(expected)
      }
    )
  })

  describe('convertPayloadToCoordinatesArray', () => {
    describe.each(COORDINATE_SYSTEMS_TEST_DATA)(
      '$system coordinates',
      ({ system, fields, sampleCoordinates }) => {
        it('should convert payload to coordinates array', () => {
          const payload = {
            [`coordinates[0][${fields.primary}]`]:
              sampleCoordinates[0][fields.primary],
            [`coordinates[0][${fields.secondary}]`]:
              sampleCoordinates[0][fields.secondary],
            [`coordinates[1][${fields.primary}]`]:
              sampleCoordinates[1][fields.primary],
            [`coordinates[1][${fields.secondary}]`]:
              sampleCoordinates[1][fields.secondary]
          }

          const result = convertPayloadToCoordinatesArray(payload, system)
          expect(result).toEqual([sampleCoordinates[0], sampleCoordinates[1]])
        })

        it('should handle missing fields with empty strings', () => {
          const payload = {
            [`coordinates[0][${fields.primary}]`]:
              sampleCoordinates[0][fields.primary],
            [`coordinates[0][${fields.secondary}]`]: '',
            [`coordinates[1][${fields.primary}]`]: '',
            [`coordinates[1][${fields.secondary}]`]:
              sampleCoordinates[1][fields.secondary]
          }

          const result = convertPayloadToCoordinatesArray(payload, system)
          expect(result).toEqual([
            {
              [fields.primary]: sampleCoordinates[0][fields.primary],
              [fields.secondary]: ''
            },
            {
              [fields.primary]: '',
              [fields.secondary]: sampleCoordinates[1][fields.secondary]
            }
          ])
        })
      }
    )

    it('should handle empty payload and filter invalid keys', () => {
      expect(
        convertPayloadToCoordinatesArray({}, COORDINATE_SYSTEMS.WGS84)
      ).toEqual([])

      const payloadWithInvalidKeys = {
        'coordinates[0][latitude]': '51.5074',
        'coordinates[0][longitude]': '-0.1278',
        invalidKey: 'should be ignored',
        'anotherInvalidKey[0]': 'also ignored'
      }

      const result = convertPayloadToCoordinatesArray(
        payloadWithInvalidKeys,
        COORDINATE_SYSTEMS.WGS84
      )
      expect(result).toEqual([{ latitude: '51.5074', longitude: '-0.1278' }])
    })

    it('should handle non-sequential indices', () => {
      const payload = {
        'coordinates[0][latitude]': '51.5074',
        'coordinates[0][longitude]': '-0.1278',
        'coordinates[2][latitude]': '52.4862',
        'coordinates[2][longitude]': '-1.8904'
      }

      const result = convertPayloadToCoordinatesArray(
        payload,
        COORDINATE_SYSTEMS.WGS84
      )
      expect(result).toEqual([
        { latitude: '51.5074', longitude: '-0.1278' },
        undefined,
        { latitude: '52.4862', longitude: '-1.8904' }
      ])
    })
  })

  describe('convertArrayErrorsToFlattenedErrors', () => {
    it('should convert array error paths to flattened format', () => {
      const error = {
        details: [
          {
            path: ['coordinates', 0, 'latitude'],
            message: 'Field is required'
          },
          { path: ['coordinates', 1, 'longitude'], message: 'Invalid value' }
        ]
      }

      const result = convertArrayErrorsToFlattenedErrors(error)
      expect(result.details).toEqual([
        { path: ['coordinates[0][latitude]'], message: 'Field is required' },
        { path: ['coordinates[1][longitude]'], message: 'Invalid value' }
      ])
    })

    it('should handle errors without details and single segment paths', () => {
      const errorWithoutDetails = { message: 'General error' }
      expect(convertArrayErrorsToFlattenedErrors(errorWithoutDetails)).toEqual(
        errorWithoutDetails
      )

      const errorWithSinglePath = {
        details: [{ path: ['id'], message: 'ID is required' }]
      }
      const result = convertArrayErrorsToFlattenedErrors(errorWithSinglePath)
      expect(result.details).toEqual([
        { path: ['id'], message: 'ID is required' }
      ])
    })
  })

  describe('processErrorDetail', () => {
    beforeEach(() => {
      generatePointSpecificErrorMessage.mockImplementation(
        (message, index) => `Point ${index + 1}: ${message}`
      )
    })

    it.each([
      {
        input: {
          path: ['coordinates0latitude'],
          message: 'Field is required'
        },
        expected: {
          fieldName: 'coordinates0latitude',
          fieldId: 'coordinates-0-latitude',
          coordinateIndex: 0,
          enhancedMessage: 'Point 1: Field is required'
        }
      },
      {
        input: { path: ['coordinates2longitude'], message: 'Invalid format' },
        expected: {
          fieldName: 'coordinates2longitude',
          fieldId: 'coordinates-2-longitude',
          coordinateIndex: 2,
          enhancedMessage: 'Point 3: Invalid format'
        }
      }
    ])(
      'should process error details correctly - $input.path[0]',
      ({ input, expected }) => {
        expect(processErrorDetail(input)).toEqual(expected)
      }
    )
  })

  describe('createErrorSummary', () => {
    beforeEach(() => {
      generatePointSpecificErrorMessage.mockImplementation(
        (message, index) => `Point ${index + 1}: ${message}`
      )
    })

    it('should create error summary from validation error', () => {
      const validationError = {
        details: [
          { path: ['coordinates0latitude'], message: 'Field is required' },
          { path: ['coordinates1longitude'], message: 'Invalid value' }
        ]
      }

      const result = createErrorSummary(validationError)
      expect(result).toEqual([
        { href: '#coordinates-0-latitude', text: 'Point 1: Field is required' },
        { href: '#coordinates-1-longitude', text: 'Point 2: Invalid value' }
      ])
    })

    it('should handle empty error details', () => {
      expect(createErrorSummary({ details: [] })).toEqual([])
    })
  })

  describe('createFieldErrors', () => {
    beforeEach(() => {
      generatePointSpecificErrorMessage.mockImplementation(
        (message, index) => `Point ${index + 1}: ${message}`
      )
    })

    it('should create field errors from validation error', () => {
      const validationError = {
        details: [
          { path: ['coordinates0latitude'], message: 'Field is required' },
          { path: ['coordinates1longitude'], message: 'Invalid value' }
        ]
      }

      const result = createFieldErrors(validationError)
      expect(result).toEqual({
        coordinates0latitude: { text: 'Point 1: Field is required' },
        coordinates1longitude: { text: 'Point 2: Invalid value' }
      })
    })

    it('should handle multiple errors for same field (last error wins)', () => {
      const validationError = {
        details: [
          { path: ['coordinates0latitude'], message: 'Field is required' },
          { path: ['coordinates0latitude'], message: 'Invalid format' }
        ]
      }

      const result = createFieldErrors(validationError)
      expect(result).toEqual({
        coordinates0latitude: { text: 'Point 1: Invalid format' }
      })
    })
  })

  describe('handleValidationFailure', () => {
    const mockRequest = {
      payload: {
        'coordinates[0][latitude]': '51.5074',
        'coordinates[0][longitude]': '-0.1278'
      }
    }
    const mockTakeover = vi.fn()
    const mockH = {
      view: vi.fn().mockReturnValue({ takeover: mockTakeover })
    }
    const mockExemption = { projectName: 'Test Project' }

    beforeEach(() => {
      vi.clearAllMocks()
      mockH.view.mockReturnValue({ takeover: mockTakeover })
      getExemptionCache.mockReturnValue(mockExemption)
      generatePointSpecificErrorMessage.mockImplementation(
        (message, index) => `Point ${index + 1}: ${message}`
      )
    })

    it('should handle validation failure with error details', () => {
      const error = {
        details: [
          { path: ['coordinates0latitude'], message: 'Field is required' }
        ]
      }

      handleValidationFailure(
        mockRequest,
        mockH,
        error,
        COORDINATE_SYSTEMS.WGS84
      )

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          coordinates: [{ latitude: '51.5074', longitude: '-0.1278' }],
          errors: {
            coordinates0latitude: { text: 'Point 1: Field is required' }
          },
          errorSummary: [
            {
              href: '#coordinates-0-latitude',
              text: 'Point 1: Field is required'
            }
          ],
          projectName: 'Test Project'
        })
      )
    })

    it('should handle validation failure without error details', () => {
      const error = { message: 'General error' }

      handleValidationFailure(
        mockRequest,
        mockH,
        error,
        COORDINATE_SYSTEMS.WGS84
      )

      expect(mockH.view).toHaveBeenCalledWith(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84],
        expect.objectContaining({
          coordinates: [{ latitude: '51.5074', longitude: '-0.1278' }],
          projectName: 'Test Project'
        })
      )
    })
  })

  describe('removeCoordinateAtIndex', () => {
    const baseCoords = [
      { latitude: '1', longitude: '1' },
      { latitude: '2', longitude: '2' },
      { latitude: '3', longitude: '3' },
      { latitude: '4', longitude: '4' },
      { latitude: '5', longitude: '5' }
    ]

    it('should not remove if index is less than 3', () => {
      expect(removeCoordinateAtIndex(baseCoords, 0)).toEqual(baseCoords)
      expect(removeCoordinateAtIndex(baseCoords, 2)).toEqual(baseCoords)
    })

    it('should not remove if removing would leave fewer than 3 coordinates', () => {
      const coords = [
        { latitude: '1', longitude: '1' },
        { latitude: '2', longitude: '2' },
        { latitude: '3', longitude: '3' },
        { latitude: '4', longitude: '4' }
      ]

      expect(removeCoordinateAtIndex(coords, 3)).toEqual([
        { latitude: '1', longitude: '1' },
        { latitude: '2', longitude: '2' },
        { latitude: '3', longitude: '3' }
      ])

      expect(
        removeCoordinateAtIndex(
          [
            { latitude: '1', longitude: '1' },
            { latitude: '2', longitude: '2' },
            { latitude: '3', longitude: '3' }
          ],
          3
        )
      ).toEqual([
        { latitude: '1', longitude: '1' },
        { latitude: '2', longitude: '2' },
        { latitude: '3', longitude: '3' }
      ])
    })

    it('should remove the coordinate at index 3 or greater if more than REQUIRED_COORDINATES_COUNT remain after removal', () => {
      expect(removeCoordinateAtIndex(baseCoords, 3)).toEqual([
        { latitude: '1', longitude: '1' },
        { latitude: '2', longitude: '2' },
        { latitude: '3', longitude: '3' },
        { latitude: '5', longitude: '5' }
      ])
      expect(removeCoordinateAtIndex(baseCoords, 4)).toEqual([
        { latitude: '1', longitude: '1' },
        { latitude: '2', longitude: '2' },
        { latitude: '3', longitude: '3' },
        { latitude: '4', longitude: '4' }
      ])
    })

    it('should return the same array if index is out of bounds', () => {
      expect(removeCoordinateAtIndex(baseCoords, 10)).toEqual(baseCoords)
      expect(removeCoordinateAtIndex([], 3)).toEqual([])
    })

    it('should not mutate the original array', () => {
      const coordsCopy = [...baseCoords]
      removeCoordinateAtIndex(coordsCopy, 3)
      expect(coordsCopy).toEqual(baseCoords)
    })
  })
})
