import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'
import { routes } from '~/src/server/common/constants/routes.js'
import {
  getExemptionCache,
  updateExemptionSiteDetails
} from '~/src/server/common/helpers/session-cache/utils.js'
import { generatePointSpecificErrorMessage } from '~/src/server/common/helpers/site-details.js'
import { createOsgb36MultipleCoordinatesSchema } from '~/src/server/common/schemas/osgb36.js'
import { createWgs84MultipleCoordinatesSchema } from '~/src/server/common/schemas/wgs84.js'
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
  getValidationSchema,
  convertArrayErrorsToFlattenedErrors,
  processErrorDetail,
  createErrorSummary,
  createFieldErrors,
  handleValidationFailure,
  saveCoordinatesToSession,
  validateCoordinates
} from './utils.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock('~/src/server/common/helpers/site-details.js')
jest.mock('~/src/server/common/schemas/osgb36.js')
jest.mock('~/src/server/common/schemas/wgs84.js')

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
    describe.each(COORDINATE_SYSTEMS_TEST_DATA)(
      '$system coordinate system',
      ({ system, emptyCoordinate, sampleCoordinates }) => {
        it.each([
          { input: [], title: 'empty array' },
          { input: null, title: 'null' },
          { input: undefined, title: 'undefined' }
        ])(
          'should return 3 empty coordinates when $title provided',
          ({ input }) => {
            const result = normaliseCoordinatesForDisplay(input, system)
            expect(result).toEqual([
              emptyCoordinate,
              emptyCoordinate,
              emptyCoordinate
            ])
          }
        )

        it.each([
          { input: [sampleCoordinates[0]], description: 'one coordinate' },
          {
            input: [sampleCoordinates[0], sampleCoordinates[1]],
            description: 'two coordinates'
          }
        ])(
          'should pad with empty coordinates when fewer than 3 provided - $description',
          ({ input }) => {
            const result = normaliseCoordinatesForDisplay(input, system)
            expect(result).toHaveLength(3)

            input.forEach((coord, index) => {
              expect(result[index]).toEqual(coord)
            })

            for (let i = input.length; i < 3; i++) {
              expect(result[i]).toEqual(emptyCoordinate)
            }
          }
        )

        it('should return exactly 3 coordinates when 3 provided', () => {
          const result = normaliseCoordinatesForDisplay(
            sampleCoordinates,
            system
          )
          expect(result).toHaveLength(3)
          expect(result).toEqual(sampleCoordinates)
        })

        it('should truncate to 3 coordinates when more than 3 provided', () => {
          const extraCoordinates = [
            ...sampleCoordinates,
            sampleCoordinates[0],
            sampleCoordinates[1]
          ]
          const result = normaliseCoordinatesForDisplay(
            extraCoordinates,
            system
          )
          expect(result).toHaveLength(3)
          expect(result).toEqual(sampleCoordinates)
        })
      }
    )

    describe('edge cases', () => {
      it('should preserve existing coordinate data structure', () => {
        const coordinateWithExtra = {
          ...SAMPLE_WGS84_COORDINATES[0],
          additionalProperty: 'test'
        }
        const result = normaliseCoordinatesForDisplay(
          [coordinateWithExtra],
          COORDINATE_SYSTEMS.WGS84
        )
        expect(result[0]).toEqual(coordinateWithExtra)
      })

      it('should handle mixed coordinate systems gracefully', () => {
        const result = normaliseCoordinatesForDisplay(
          [SAMPLE_WGS84_COORDINATES[0]],
          COORDINATE_SYSTEMS.OSGB36
        )
        expect(result).toHaveLength(3)
        expect(result[0]).toEqual(SAMPLE_WGS84_COORDINATES[0])
        expect(result[1]).toEqual(EMPTY_OSGB36_COORDINATE)
        expect(result[2]).toEqual(EMPTY_OSGB36_COORDINATE)
      })
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
        backLink: routes.COORDINATE_SYSTEM_CHOICE
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

  describe('getValidationSchema', () => {
    const mockWgs84Schema = { validate: jest.fn() }
    const mockOsgb36Schema = { validate: jest.fn() }

    beforeEach(() => {
      createWgs84MultipleCoordinatesSchema.mockReturnValue(mockWgs84Schema)
      createOsgb36MultipleCoordinatesSchema.mockReturnValue(mockOsgb36Schema)
    })

    it('should return correct schema for coordinate systems', () => {
      expect(getValidationSchema(COORDINATE_SYSTEMS.WGS84)).toBe(
        mockWgs84Schema
      )
      expect(getValidationSchema(COORDINATE_SYSTEMS.OSGB36)).toBe(
        mockOsgb36Schema
      )
      expect(createWgs84MultipleCoordinatesSchema).toHaveBeenCalled()
      expect(createOsgb36MultipleCoordinatesSchema).toHaveBeenCalled()
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
          coordinateIndex: 0,
          enhancedMessage: 'Point 1: Field is required'
        }
      },
      {
        input: { path: ['coordinates2longitude'], message: 'Invalid format' },
        expected: {
          fieldName: 'coordinates2longitude',
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
        { href: '#coordinates0latitude', text: 'Point 1: Field is required' },
        { href: '#coordinates1longitude', text: 'Point 2: Invalid value' }
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
    const mockH = {
      view: jest.fn().mockReturnValue({ takeover: jest.fn() })
    }
    const mockExemption = { projectName: 'Test Project' }

    beforeEach(() => {
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
              href: '#coordinates0latitude',
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

  describe('saveCoordinatesToSession', () => {
    const mockRequest = {}
    const existingCoordinates = {
      [COORDINATE_SYSTEMS.OSGB36]: [{ eastings: '529090', northings: '181680' }]
    }

    it('should save coordinates to session', () => {
      getExemptionCache.mockReturnValue({
        siteDetails: { multipleCoordinates: existingCoordinates }
      })
      const coordinates = [{ latitude: '51.5074', longitude: '-0.1278' }]

      saveCoordinatesToSession(
        mockRequest,
        coordinates,
        COORDINATE_SYSTEMS.WGS84
      )

      expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        'multipleCoordinates',
        { ...existingCoordinates, [COORDINATE_SYSTEMS.WGS84]: coordinates }
      )
    })

    it.each([{ mockReturn: { siteDetails: {} } }, { mockReturn: null }])(
      'should handle missing cache scenarios - $description',
      ({ mockReturn }) => {
        getExemptionCache.mockReturnValue(mockReturn)
        const coordinates = [{ latitude: '51.5074', longitude: '-0.1278' }]

        saveCoordinatesToSession(
          mockRequest,
          coordinates,
          COORDINATE_SYSTEMS.WGS84
        )

        expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
          mockRequest,
          'multipleCoordinates',
          { [COORDINATE_SYSTEMS.WGS84]: coordinates }
        )
      }
    )
  })

  describe('validateCoordinates', () => {
    const mockSchema = { validate: jest.fn() }

    beforeEach(() => {
      createWgs84MultipleCoordinatesSchema.mockReturnValue(mockSchema)
      createOsgb36MultipleCoordinatesSchema.mockReturnValue(mockSchema)
    })

    it('should validate coordinates with correct payload and schema', () => {
      const coordinates = [{ latitude: '51.5074', longitude: '-0.1278' }]
      const exemptionId = 'test-id'
      const mockResult = { error: null, value: {} }
      mockSchema.validate.mockReturnValue(mockResult)

      const result = validateCoordinates(
        coordinates,
        exemptionId,
        COORDINATE_SYSTEMS.WGS84
      )

      expect(mockSchema.validate).toHaveBeenCalledWith(
        { coordinates, id: exemptionId },
        { abortEarly: false }
      )
      expect(createWgs84MultipleCoordinatesSchema).toHaveBeenCalled()
      expect(result).toBe(mockResult)
    })

    it('should use correct schema for OSGB36', () => {
      const coordinates = [{ eastings: '529090', northings: '181680' }]
      validateCoordinates(coordinates, 'test-id', COORDINATE_SYSTEMS.OSGB36)
      expect(createOsgb36MultipleCoordinatesSchema).toHaveBeenCalled()
    })
  })
})
