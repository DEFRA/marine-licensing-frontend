import {
  wgs84ValidationSchema,
  createCoordinateSchema
} from '#src/server/common/schemas/wgs84.js'
import { mockExemption } from '#src/server/test-helpers/mocks/exemption.js'

describe('#centreCoordinate models', () => {
  describe('#wgs84ValidationSchema model', () => {
    test('Should correctly validate on valid data', () => {
      const request = {
        latitude: mockExemption.siteDetails[0].coordinates.latitude,
        longitude: mockExemption.siteDetails[0].coordinates.longitude
      }

      const result = wgs84ValidationSchema.validate(request)

      expect(result.error).toBeUndefined()
    })

    test('Should correctly validate on empty data', () => {
      const request = {}

      const result = wgs84ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('LATITUDE_REQUIRED')
      expect(result.error.message).toContain('LONGITUDE_REQUIRED')
    })

    test('Should correctly validate when latitude and longitude are empty strings', () => {
      const request = {
        latitude: '',
        longitude: ''
      }

      const result = wgs84ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('LATITUDE_REQUIRED')
      expect(result.error.message).toContain('LONGITUDE_REQUIRED')
    })

    test('Should correctly validate when latitude and longitude is below minimum allowed value', () => {
      const request = {
        latitude: '-91',
        longitude: '-181'
      }

      const result = wgs84ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('LATITUDE_LENGTH')
      expect(result.error.message).toContain('LONGITUDE_LENGTH')
    })

    test('Should correctly validate when latitude and longitude is above maximum allowed value', () => {
      const request = {
        latitude: '91',
        longitude: '181'
      }

      const result = wgs84ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('LATITUDE_LENGTH')
      expect(result.error.message).toContain('LONGITUDE_LENGTH')
    })

    test('Should correctly validate when latitude and longitude have incorrect characters', () => {
      const request = {
        latitude: '-9/',
        longitude: '-18/'
      }

      const result = wgs84ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('LATITUDE_NON_NUMERIC')
      expect(result.error.message).toContain('LONGITUDE_NON_NUMERIC')
    })

    test('Should correctly validate latitude and longitude do not have correct decimal places', () => {
      const request = {
        latitude: '50.12345',
        longitude: '50.12345'
      }

      const result = wgs84ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('LATITUDE_DECIMAL_PLACES')
      expect(result.error.message).toContain('LONGITUDE_DECIMAL_PLACES')
    })

    test('Should generate single error message for non-numeric input like "abc123"', () => {
      const request = {
        latitude: 'abc123',
        longitude: '-1.399500'
      }

      const result = wgs84ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('LATITUDE_NON_NUMERIC')
      expect(result.error.message).not.toContain('LONGITUDE_NON_NUMERIC')

      const latitudeErrors = result.error.details.filter((detail) =>
        detail.path.includes('latitude')
      )
      expect(latitudeErrors).toHaveLength(1)
    })

    test('Should correctly validate latitude and longitude with multiple dots as non-numeric', () => {
      const request = {
        latitude: '1.2.3',
        longitude: '4.5.6'
      }

      const result = wgs84ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('LATITUDE_NON_NUMERIC')
      expect(result.error.message).toContain('LONGITUDE_NON_NUMERIC')
    })
  })

  describe('#createCoordinateSchema', () => {
    test('Should create schema with constants messageType', () => {
      const schema = createCoordinateSchema('latitude', 'constants')
      const result = schema.validate('')

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('LATITUDE_REQUIRED')
    })

    test('Should create schema with simple messageType', () => {
      const schema = createCoordinateSchema('latitude', 'simple')
      const result = schema.validate('')

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('Enter the latitude')
    })

    test('Should create schema with withPoint messageType', () => {
      const schema = createCoordinateSchema('latitude', 'withPoint', 'point 1')
      const result = schema.validate('')

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('Enter the latitude of point 1')
    })

    test('Should validate valid coordinate with simple messageType', () => {
      const schema = createCoordinateSchema('latitude', 'simple')
      const result = schema.validate('55.019889')

      expect(result.error).toBeUndefined()
    })

    test('Should handle non-numeric input with simple messageType', () => {
      const schema = createCoordinateSchema('latitude', 'simple')
      const result = schema.validate('invalid')

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('Latitude must be a number')
    })

    test('Should handle range validation with simple messageType', () => {
      const schema = createCoordinateSchema('latitude', 'simple')
      const result = schema.validate('-91.000000')

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain(
        'Latitude must be between -90 and 90'
      )
    })

    test('Should handle decimal places validation with withPoint messageType', () => {
      const schema = createCoordinateSchema(
        'longitude',
        'withPoint',
        'center point'
      )
      const result = schema.validate('-1.3995')

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain(
        'Longitude of center point must include 6 decimal places'
      )
    })

    test('Should default to simple messageType when not specified', () => {
      const schema = createCoordinateSchema('longitude')
      const result = schema.validate('')

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('Enter the longitude')
    })

    test('Should handle longitude validation with withPoint messageType', () => {
      const schema = createCoordinateSchema('longitude', 'withPoint', 'point A')
      const result = schema.validate('181.000000')

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain(
        'Longitude of point A must be between -180 and 180'
      )
    })
  })
})
