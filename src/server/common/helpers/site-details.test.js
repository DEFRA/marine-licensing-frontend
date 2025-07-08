import {
  COORDINATE_ERROR_MESSAGES,
  generatePointSpecificErrorMessage
} from './site-details.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/exemptions.js'

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
})
