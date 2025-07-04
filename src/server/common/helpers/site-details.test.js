import {
  COORDINATE_ERROR_MESSAGES,
  generatePointSpecificErrorMessage,
  createPointSpecificErrorMessages
} from './site-details.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/coordinates.js'

describe('site-details helper', () => {
  describe('COORDINATE_ERROR_MESSAGES', () => {
    test('should contain WGS84 error messages', () => {
      expect(COORDINATE_ERROR_MESSAGES[COORDINATE_SYSTEMS.WGS84]).toBeDefined()
      expect(
        COORDINATE_ERROR_MESSAGES[COORDINATE_SYSTEMS.WGS84].LATITUDE_REQUIRED
      ).toBe('Enter the latitude')
      expect(
        COORDINATE_ERROR_MESSAGES[COORDINATE_SYSTEMS.WGS84].LONGITUDE_REQUIRED
      ).toBe('Enter the longitude')
    })

    test('should contain OSGB36 error messages', () => {
      expect(COORDINATE_ERROR_MESSAGES[COORDINATE_SYSTEMS.OSGB36]).toBeDefined()
      expect(
        COORDINATE_ERROR_MESSAGES[COORDINATE_SYSTEMS.OSGB36].EASTINGS_REQUIRED
      ).toBe('Enter the eastings')
      expect(
        COORDINATE_ERROR_MESSAGES[COORDINATE_SYSTEMS.OSGB36].NORTHINGS_REQUIRED
      ).toBe('Enter the northings')
    })
  })

  describe('generatePointSpecificErrorMessage', () => {
    test('should generate correct message for start and end point (index 0)', () => {
      const result = generatePointSpecificErrorMessage('Enter the latitude', 0)
      expect(result).toBe('Enter the latitude of start and end point')
    })

    test('should generate correct message for point 2 (index 1)', () => {
      const result = generatePointSpecificErrorMessage('Enter the longitude', 1)
      expect(result).toBe('Enter the longitude of point 2')
    })

    test('should generate correct message for point 3 (index 2)', () => {
      const result = generatePointSpecificErrorMessage(
        'Eastings must be 6 digits',
        2
      )
      expect(result).toBe('Eastings of point 3 must be 6 digits')
    })

    test('should return original message if no mapping found', () => {
      const originalMessage = 'Some unknown error message'
      const result = generatePointSpecificErrorMessage(originalMessage, 1)
      expect(result).toBe(originalMessage)
    })
  })

  describe('createPointSpecificErrorMessages', () => {
    test('should create WGS84 point-specific error messages', () => {
      const pointName = 'the start and end point'
      const result = createPointSpecificErrorMessages(
        pointName,
        COORDINATE_SYSTEMS.WGS84
      )

      expect(result.LATITUDE_REQUIRED).toBe(
        'Enter the latitude of the start and end point'
      )
      expect(result.LONGITUDE_REQUIRED).toBe(
        'Enter the longitude of the start and end point'
      )
      expect(result.LATITUDE_NON_NUMERIC).toBe(
        'Latitude of the start and end point must be a number'
      )
      expect(result.LONGITUDE_DECIMAL_PLACES).toBe(
        'Longitude of the start and end point must include 6 decimal places, like -1.399500'
      )
    })

    test('should create OSGB36 point-specific error messages', () => {
      const pointName = 'point 2'
      const result = createPointSpecificErrorMessages(
        pointName,
        COORDINATE_SYSTEMS.OSGB36
      )

      expect(result.EASTINGS_REQUIRED).toBe('Enter the eastings of point 2')
      expect(result.NORTHINGS_REQUIRED).toBe('Enter the northings of point 2')
      expect(result.EASTINGS_NON_NUMERIC).toBe(
        'Eastings of point 2 must be a number'
      )
      expect(result.NORTHINGS_WHOLE_NUMBER).toBe(
        'Northings of point 2 must be a whole number'
      )
      expect(result.EASTINGS_POSITIVE_NUMBER).toBe(
        'Eastings of point 2 must be a positive 6-digit number, like 123456'
      )
    })
  })
})
