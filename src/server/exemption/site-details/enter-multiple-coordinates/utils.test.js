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
  getSessionPayload,
  saveCoordinatesToSession,
  validateCoordinates
} from './utils.js'

// Mock dependencies
jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock('~/src/server/common/helpers/site-details.js')
jest.mock('~/src/server/common/schemas/osgb36.js')
jest.mock('~/src/server/common/schemas/wgs84.js')

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

    it('should have routes for all coordinate systems', () => {
      expect(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.WGS84]
      ).toBeDefined()
      expect(
        MULTIPLE_COORDINATES_VIEW_ROUTES[COORDINATE_SYSTEMS.OSGB36]
      ).toBeDefined()
    })
  })

  describe('normaliseCoordinatesForDisplay', () => {
    describe('WGS84 coordinate system', () => {
      it('should return 3 empty coordinates when no coordinates provided', () => {
        const result = normaliseCoordinatesForDisplay(
          [],
          COORDINATE_SYSTEMS.WGS84
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { latitude: '', longitude: '' },
          { latitude: '', longitude: '' },
          { latitude: '', longitude: '' }
        ])
      })

      it('should return 3 empty coordinates when coordinates is null', () => {
        const result = normaliseCoordinatesForDisplay(
          null,
          COORDINATE_SYSTEMS.WGS84
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { latitude: '', longitude: '' },
          { latitude: '', longitude: '' },
          { latitude: '', longitude: '' }
        ])
      })

      it('should return 3 empty coordinates when coordinates is undefined', () => {
        const result = normaliseCoordinatesForDisplay(
          undefined,
          COORDINATE_SYSTEMS.WGS84
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { latitude: '', longitude: '' },
          { latitude: '', longitude: '' },
          { latitude: '', longitude: '' }
        ])
      })

      it('should pad with empty coordinates when only 1 coordinate provided', () => {
        const coordinates = [{ latitude: '51.5074', longitude: '-0.1278' }]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.WGS84
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { latitude: '51.5074', longitude: '-0.1278' },
          { latitude: '', longitude: '' },
          { latitude: '', longitude: '' }
        ])
      })

      it('should pad with empty coordinates when only 2 coordinates provided', () => {
        const coordinates = [
          { latitude: '51.5074', longitude: '-0.1278' },
          { latitude: '52.4862', longitude: '-1.8904' }
        ]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.WGS84
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { latitude: '51.5074', longitude: '-0.1278' },
          { latitude: '52.4862', longitude: '-1.8904' },
          { latitude: '', longitude: '' }
        ])
      })

      it('should return exactly 3 coordinates when 3 coordinates provided', () => {
        const coordinates = [
          { latitude: '51.5074', longitude: '-0.1278' },
          { latitude: '52.4862', longitude: '-1.8904' },
          { latitude: '53.4808', longitude: '-2.2426' }
        ]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.WGS84
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual(coordinates)
      })

      it('should truncate to 3 coordinates when more than 3 provided', () => {
        const coordinates = [
          { latitude: '51.5074', longitude: '-0.1278' },
          { latitude: '52.4862', longitude: '-1.8904' },
          { latitude: '53.4808', longitude: '-2.2426' },
          { latitude: '54.9783', longitude: '-1.6178' },
          { latitude: '55.9533', longitude: '-3.1883' }
        ]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.WGS84
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { latitude: '51.5074', longitude: '-0.1278' },
          { latitude: '52.4862', longitude: '-1.8904' },
          { latitude: '53.4808', longitude: '-2.2426' }
        ])
      })

      it('should handle coordinates with partial data', () => {
        const coordinates = [
          { latitude: '51.5074', longitude: '' },
          { latitude: '', longitude: '-1.8904' }
        ]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.WGS84
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { latitude: '51.5074', longitude: '' },
          { latitude: '', longitude: '-1.8904' },
          { latitude: '', longitude: '' }
        ])
      })
    })

    describe('OSGB36 coordinate system', () => {
      it('should return 3 empty coordinates when no coordinates provided', () => {
        const result = normaliseCoordinatesForDisplay(
          [],
          COORDINATE_SYSTEMS.OSGB36
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { eastings: '', northings: '' },
          { eastings: '', northings: '' },
          { eastings: '', northings: '' }
        ])
      })

      it('should return 3 empty coordinates when coordinates is null', () => {
        const result = normaliseCoordinatesForDisplay(
          null,
          COORDINATE_SYSTEMS.OSGB36
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { eastings: '', northings: '' },
          { eastings: '', northings: '' },
          { eastings: '', northings: '' }
        ])
      })

      it('should pad with empty coordinates when only 1 coordinate provided', () => {
        const coordinates = [{ eastings: '529090', northings: '181680' }]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.OSGB36
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { eastings: '529090', northings: '181680' },
          { eastings: '', northings: '' },
          { eastings: '', northings: '' }
        ])
      })

      it('should pad with empty coordinates when only 2 coordinates provided', () => {
        const coordinates = [
          { eastings: '529090', northings: '181680' },
          { eastings: '406250', northings: '286550' }
        ]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.OSGB36
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { eastings: '529090', northings: '181680' },
          { eastings: '406250', northings: '286550' },
          { eastings: '', northings: '' }
        ])
      })

      it('should return exactly 3 coordinates when 3 coordinates provided', () => {
        const coordinates = [
          { eastings: '529090', northings: '181680' },
          { eastings: '406250', northings: '286550' },
          { eastings: '383500', northings: '398000' }
        ]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.OSGB36
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual(coordinates)
      })

      it('should truncate to 3 coordinates when more than 3 provided', () => {
        const coordinates = [
          { eastings: '529090', northings: '181680' },
          { eastings: '406250', northings: '286550' },
          { eastings: '383500', northings: '398000' },
          { eastings: '424000', northings: '565000' },
          { eastings: '325000', northings: '673000' }
        ]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.OSGB36
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { eastings: '529090', northings: '181680' },
          { eastings: '406250', northings: '286550' },
          { eastings: '383500', northings: '398000' }
        ])
      })

      it('should handle coordinates with partial data', () => {
        const coordinates = [
          { eastings: '529090', northings: '' },
          { eastings: '', northings: '286550' }
        ]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.OSGB36
        )

        expect(result).toHaveLength(3)
        expect(result).toEqual([
          { eastings: '529090', northings: '' },
          { eastings: '', northings: '286550' },
          { eastings: '', northings: '' }
        ])
      })
    })

    describe('edge cases', () => {
      it('should handle empty array for WGS84', () => {
        const result = normaliseCoordinatesForDisplay(
          [],
          COORDINATE_SYSTEMS.WGS84
        )

        expect(result).toHaveLength(3)
        expect(
          result.every(
            (coord) => coord.latitude === '' && coord.longitude === ''
          )
        ).toBe(true)
      })

      it('should handle empty array for OSGB36', () => {
        const result = normaliseCoordinatesForDisplay(
          [],
          COORDINATE_SYSTEMS.OSGB36
        )

        expect(result).toHaveLength(3)
        expect(
          result.every(
            (coord) => coord.eastings === '' && coord.northings === ''
          )
        ).toBe(true)
      })

      it('should preserve existing coordinate data structure', () => {
        const coordinates = [
          {
            latitude: '51.5074',
            longitude: '-0.1278',
            additionalProperty: 'test'
          }
        ]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.WGS84
        )

        expect(result[0]).toEqual({
          latitude: '51.5074',
          longitude: '-0.1278',
          additionalProperty: 'test'
        })
      })

      it('should handle mixed coordinate systems gracefully', () => {
        const coordinates = [{ latitude: '51.5074', longitude: '-0.1278' }]
        const result = normaliseCoordinatesForDisplay(
          coordinates,
          COORDINATE_SYSTEMS.OSGB36
        )

        expect(result).toHaveLength(3)
        expect(result[0]).toEqual({ latitude: '51.5074', longitude: '-0.1278' })
        expect(result[1]).toEqual({ eastings: '', northings: '' })
        expect(result[2]).toEqual({ eastings: '', northings: '' })
      })
    })
  })

  describe('PATTERNS', () => {
    it('should provide correct regex pattern for field brackets', () => {
      expect(PATTERNS.FIELD_BRACKETS).toEqual(/[[\]]/g)
    })

    it('should remove field brackets from strings', () => {
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
    it('should provide correct field mappings for WGS84', () => {
      expect(COORDINATE_FIELDS.WGS84).toEqual({
        primary: 'latitude',
        secondary: 'longitude'
      })
    })

    it('should provide correct field mappings for OSGB36', () => {
      expect(COORDINATE_FIELDS.OSGB36).toEqual({
        primary: 'eastings',
        secondary: 'northings'
      })
    })
  })

  describe('isWGS84', () => {
    it('should return true for WGS84 coordinate system', () => {
      expect(isWGS84(COORDINATE_SYSTEMS.WGS84)).toBe(true)
    })

    it('should return false for OSGB36 coordinate system', () => {
      expect(isWGS84(COORDINATE_SYSTEMS.OSGB36)).toBe(false)
    })

    it('should return false for undefined coordinate system', () => {
      expect(isWGS84(undefined)).toBe(false)
    })

    it('should return false for null coordinate system', () => {
      expect(isWGS84(null)).toBe(false)
    })
  })

  describe('extractCoordinateIndexFromFieldName', () => {
    it('should extract index from field name', () => {
      expect(extractCoordinateIndexFromFieldName('coordinates0latitude')).toBe(
        0
      )
      expect(extractCoordinateIndexFromFieldName('coordinates1longitude')).toBe(
        1
      )
      expect(extractCoordinateIndexFromFieldName('coordinates2eastings')).toBe(
        2
      )
    })

    it('should return 0 for field name without index', () => {
      expect(extractCoordinateIndexFromFieldName('latitude')).toBe(0)
      expect(extractCoordinateIndexFromFieldName('longitude')).toBe(0)
    })

    it('should handle multi-digit indices', () => {
      expect(extractCoordinateIndexFromFieldName('coordinates10latitude')).toBe(
        10
      )
      expect(
        extractCoordinateIndexFromFieldName('coordinates123longitude')
      ).toBe(123)
    })
  })

  describe('sanitiseFieldName', () => {
    it('should remove brackets from field path', () => {
      const fieldPath = ['coordinates[0][latitude]']
      expect(sanitiseFieldName(fieldPath)).toBe('coordinates0latitude')
    })

    it('should handle multiple brackets', () => {
      const fieldPath = ['coordinates[1][longitude]']
      expect(sanitiseFieldName(fieldPath)).toBe('coordinates1longitude')
    })

    it('should handle field path with no brackets', () => {
      const fieldPath = ['latitude']
      expect(sanitiseFieldName(fieldPath)).toBe('latitude')
    })

    it('should join multiple path segments', () => {
      const fieldPath = ['coordinates[0]', '[latitude]']
      expect(sanitiseFieldName(fieldPath)).toBe('coordinates0latitude')
    })
  })

  describe('convertPayloadToCoordinatesArray', () => {
    describe('WGS84 coordinates', () => {
      it('should convert WGS84 payload to coordinates array', () => {
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

      it('should handle missing fields with empty strings', () => {
        const payload = {
          'coordinates[0][latitude]': '51.5074',
          'coordinates[0][longitude]': '',
          'coordinates[1][latitude]': '',
          'coordinates[1][longitude]': '-1.8904'
        }

        const result = convertPayloadToCoordinatesArray(
          payload,
          COORDINATE_SYSTEMS.WGS84
        )

        expect(result).toEqual([
          { latitude: '51.5074', longitude: '' },
          { latitude: '', longitude: '-1.8904' }
        ])
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

    describe('OSGB36 coordinates', () => {
      it('should convert OSGB36 payload to coordinates array', () => {
        const payload = {
          'coordinates[0][eastings]': '529090',
          'coordinates[0][northings]': '181680',
          'coordinates[1][eastings]': '406250',
          'coordinates[1][northings]': '286550'
        }

        const result = convertPayloadToCoordinatesArray(
          payload,
          COORDINATE_SYSTEMS.OSGB36
        )

        expect(result).toEqual([
          { eastings: '529090', northings: '181680' },
          { eastings: '406250', northings: '286550' }
        ])
      })

      it('should handle missing fields with empty strings', () => {
        const payload = {
          'coordinates[0][eastings]': '529090',
          'coordinates[0][northings]': '',
          'coordinates[1][eastings]': '',
          'coordinates[1][northings]': '286550'
        }

        const result = convertPayloadToCoordinatesArray(
          payload,
          COORDINATE_SYSTEMS.OSGB36
        )

        expect(result).toEqual([
          { eastings: '529090', northings: '' },
          { eastings: '', northings: '286550' }
        ])
      })
    })

    it('should handle empty payload', () => {
      const result = convertPayloadToCoordinatesArray(
        {},
        COORDINATE_SYSTEMS.WGS84
      )
      expect(result).toEqual([])
    })

    it('should filter out non-coordinate keys from payload', () => {
      const payload = {
        'coordinates[0][latitude]': '51.5074',
        'coordinates[0][longitude]': '-0.1278',
        invalidKey: 'should be ignored',
        'anotherInvalidKey[0]': 'also ignored',
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
  })

  describe('getValidationSchema', () => {
    const mockWgs84Schema = { validate: jest.fn() }
    const mockOsgb36Schema = { validate: jest.fn() }

    beforeEach(() => {
      createWgs84MultipleCoordinatesSchema.mockReturnValue(mockWgs84Schema)
      createOsgb36MultipleCoordinatesSchema.mockReturnValue(mockOsgb36Schema)
    })

    it('should return WGS84 schema for WGS84 coordinate system', () => {
      const result = getValidationSchema(COORDINATE_SYSTEMS.WGS84)
      expect(result).toBe(mockWgs84Schema)
      expect(createWgs84MultipleCoordinatesSchema).toHaveBeenCalled()
    })

    it('should return OSGB36 schema for OSGB36 coordinate system', () => {
      const result = getValidationSchema(COORDINATE_SYSTEMS.OSGB36)
      expect(result).toBe(mockOsgb36Schema)
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
          {
            path: ['coordinates', 1, 'longitude'],
            message: 'Invalid value'
          }
        ]
      }

      const result = convertArrayErrorsToFlattenedErrors(error)

      expect(result.details).toEqual([
        {
          path: ['coordinates[0][latitude]'],
          message: 'Field is required'
        },
        {
          path: ['coordinates[1][longitude]'],
          message: 'Invalid value'
        }
      ])
    })

    it('should handle errors without details', () => {
      const error = { message: 'General error' }
      const result = convertArrayErrorsToFlattenedErrors(error)
      expect(result).toEqual(error)
    })

    it('should handle single segment paths', () => {
      const error = {
        details: [
          {
            path: ['id'],
            message: 'ID is required'
          }
        ]
      }

      const result = convertArrayErrorsToFlattenedErrors(error)

      expect(result.details).toEqual([
        {
          path: ['id'],
          message: 'ID is required'
        }
      ])
    })
  })

  describe('processErrorDetail', () => {
    beforeEach(() => {
      generatePointSpecificErrorMessage.mockImplementation(
        (message, index) => `Point ${index + 1}: ${message}`
      )
    })

    it('should process error detail correctly', () => {
      const detail = {
        path: ['coordinates0latitude'],
        message: 'Field is required'
      }

      const result = processErrorDetail(detail)

      expect(result).toEqual({
        fieldName: 'coordinates0latitude',
        coordinateIndex: 0,
        enhancedMessage: 'Point 1: Field is required'
      })
    })

    it('should handle different coordinate indices', () => {
      const detail = {
        path: ['coordinates2longitude'],
        message: 'Invalid format'
      }

      const result = processErrorDetail(detail)

      expect(result).toEqual({
        fieldName: 'coordinates2longitude',
        coordinateIndex: 2,
        enhancedMessage: 'Point 3: Invalid format'
      })
    })
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
          {
            path: ['coordinates0latitude'],
            message: 'Field is required'
          },
          {
            path: ['coordinates1longitude'],
            message: 'Invalid value'
          }
        ]
      }

      const result = createErrorSummary(validationError)

      expect(result).toEqual([
        {
          href: '#coordinates0latitude',
          text: 'Point 1: Field is required'
        },
        {
          href: '#coordinates1longitude',
          text: 'Point 2: Invalid value'
        }
      ])
    })

    it('should handle empty error details', () => {
      const validationError = { details: [] }
      const result = createErrorSummary(validationError)
      expect(result).toEqual([])
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
          {
            path: ['coordinates0latitude'],
            message: 'Field is required'
          },
          {
            path: ['coordinates1longitude'],
            message: 'Invalid value'
          }
        ]
      }

      const result = createFieldErrors(validationError)

      expect(result).toEqual({
        coordinates0latitude: {
          text: 'Point 1: Field is required'
        },
        coordinates1longitude: {
          text: 'Point 2: Invalid value'
        }
      })
    })

    it('should handle multiple errors for same field', () => {
      const validationError = {
        details: [
          {
            path: ['coordinates0latitude'],
            message: 'Field is required'
          },
          {
            path: ['coordinates0latitude'],
            message: 'Invalid format'
          }
        ]
      }

      const result = createFieldErrors(validationError)

      expect(result).toEqual({
        coordinates0latitude: {
          text: 'Point 1: Invalid format'
        }
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
      view: jest.fn().mockReturnValue({
        takeover: jest.fn()
      })
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
          {
            path: ['coordinates0latitude'],
            message: 'Field is required'
          }
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
            coordinates0latitude: {
              text: 'Point 1: Field is required'
            }
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
      expect(mockH.view).not.toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          errors: expect.anything(),
          errorSummary: expect.anything()
        })
      )
    })
  })

  describe('getSessionPayload', () => {
    it('should return coordinates from site details', () => {
      const siteDetails = {
        multipleCoordinates: {
          [COORDINATE_SYSTEMS.WGS84]: [
            { latitude: '51.5074', longitude: '-0.1278' }
          ]
        }
      }

      const result = getSessionPayload(siteDetails, COORDINATE_SYSTEMS.WGS84)

      expect(result).toEqual({
        coordinates: [{ latitude: '51.5074', longitude: '-0.1278' }]
      })
    })

    it('should return empty coordinates when no multipleCoordinates', () => {
      const siteDetails = {}
      const result = getSessionPayload(siteDetails, COORDINATE_SYSTEMS.WGS84)

      expect(result).toEqual({
        coordinates: []
      })
    })

    it('should return empty coordinates when coordinate system not found', () => {
      const siteDetails = {
        multipleCoordinates: {
          [COORDINATE_SYSTEMS.OSGB36]: [
            { eastings: '529090', northings: '181680' }
          ]
        }
      }

      const result = getSessionPayload(siteDetails, COORDINATE_SYSTEMS.WGS84)

      expect(result).toEqual({
        coordinates: []
      })
    })
  })

  describe('saveCoordinatesToSession', () => {
    const mockRequest = {}
    const mockExemption = {
      siteDetails: {
        multipleCoordinates: {
          [COORDINATE_SYSTEMS.OSGB36]: [
            { eastings: '529090', northings: '181680' }
          ]
        }
      }
    }

    beforeEach(() => {
      getExemptionCache.mockReturnValue(mockExemption)
    })

    it('should save coordinates to session', () => {
      const coordinates = [{ latitude: '51.5074', longitude: '-0.1278' }]

      saveCoordinatesToSession(
        mockRequest,
        coordinates,
        COORDINATE_SYSTEMS.WGS84
      )

      expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        'multipleCoordinates',
        {
          [COORDINATE_SYSTEMS.OSGB36]: [
            { eastings: '529090', northings: '181680' }
          ],
          [COORDINATE_SYSTEMS.WGS84]: coordinates
        }
      )
    })

    it('should handle empty existing multipleCoordinates', () => {
      getExemptionCache.mockReturnValue({ siteDetails: {} })
      const coordinates = [{ latitude: '51.5074', longitude: '-0.1278' }]

      saveCoordinatesToSession(
        mockRequest,
        coordinates,
        COORDINATE_SYSTEMS.WGS84
      )

      expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        'multipleCoordinates',
        {
          [COORDINATE_SYSTEMS.WGS84]: coordinates
        }
      )
    })

    it('should handle no exemption cache', () => {
      getExemptionCache.mockReturnValue(null)
      const coordinates = [{ latitude: '51.5074', longitude: '-0.1278' }]

      saveCoordinatesToSession(
        mockRequest,
        coordinates,
        COORDINATE_SYSTEMS.WGS84
      )

      expect(updateExemptionSiteDetails).toHaveBeenCalledWith(
        mockRequest,
        'multipleCoordinates',
        {
          [COORDINATE_SYSTEMS.WGS84]: coordinates
        }
      )
    })
  })

  describe('validateCoordinates', () => {
    const mockSchema = {
      validate: jest.fn()
    }

    beforeEach(() => {
      createWgs84MultipleCoordinatesSchema.mockReturnValue(mockSchema)
      createOsgb36MultipleCoordinatesSchema.mockReturnValue(mockSchema)
    })

    it('should validate coordinates with correct payload', () => {
      const coordinates = [{ latitude: '51.5074', longitude: '-0.1278' }]
      const exemptionId = 'test-id'
      const expectedPayload = { coordinates, id: exemptionId }

      validateCoordinates(coordinates, exemptionId, COORDINATE_SYSTEMS.WGS84)

      expect(mockSchema.validate).toHaveBeenCalledWith(expectedPayload, {
        abortEarly: false
      })
    })

    it('should use correct schema for WGS84', () => {
      const coordinates = [{ latitude: '51.5074', longitude: '-0.1278' }]
      const exemptionId = 'test-id'

      validateCoordinates(coordinates, exemptionId, COORDINATE_SYSTEMS.WGS84)

      expect(createWgs84MultipleCoordinatesSchema).toHaveBeenCalled()
    })

    it('should use correct schema for OSGB36', () => {
      const coordinates = [{ eastings: '529090', northings: '181680' }]
      const exemptionId = 'test-id'

      validateCoordinates(coordinates, exemptionId, COORDINATE_SYSTEMS.OSGB36)

      expect(createOsgb36MultipleCoordinatesSchema).toHaveBeenCalled()
    })

    it('should return validation result', () => {
      const mockResult = { error: null, value: {} }
      mockSchema.validate.mockReturnValue(mockResult)

      const result = validateCoordinates(
        [],
        'test-id',
        COORDINATE_SYSTEMS.WGS84
      )

      expect(result).toBe(mockResult)
    })
  })
})
