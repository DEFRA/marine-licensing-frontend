import { createOsgb36MultipleCoordinatesSchema } from '~/src/server/common/schemas/osgb36-multiple.js'

describe('#multipleCoordinates OSGB36 schema', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('#createOsgb36MultipleCoordinatesSchema', () => {
    test('Should correctly validate valid OSGB36 coordinates', () => {
      const request = {
        id: '507f1f77bcf86cd799439011',
        'coordinates[0][eastings]': '123456',
        'coordinates[0][northings]': '654321',
        'coordinates[1][eastings]': '234567',
        'coordinates[1][northings]': '765432',
        'coordinates[2][eastings]': '345678',
        'coordinates[2][northings]': '876543'
      }

      const schema = createOsgb36MultipleCoordinatesSchema(request)
      const result = schema.validate(request)

      expect(result.error).toBeUndefined()
    })

    test('Should correctly validate with more than 3 coordinates', () => {
      const request = {
        id: '507f1f77bcf86cd799439011',
        'coordinates[0][eastings]': '123456',
        'coordinates[0][northings]': '654321',
        'coordinates[1][eastings]': '234567',
        'coordinates[1][northings]': '765432',
        'coordinates[2][eastings]': '345678',
        'coordinates[2][northings]': '876543',
        'coordinates[3][eastings]': '456789',
        'coordinates[3][northings]': '987654'
      }

      const schema = createOsgb36MultipleCoordinatesSchema(request)
      const result = schema.validate(request)

      expect(result.error).toBeUndefined()
    })

    test('Should require exemption ID', () => {
      const request = {
        'coordinates[0][eastings]': '123456',
        'coordinates[0][northings]': '654321',
        'coordinates[1][eastings]': '234567',
        'coordinates[1][northings]': '765432',
        'coordinates[2][eastings]': '345678',
        'coordinates[2][northings]': '876543'
      }

      const schema = createOsgb36MultipleCoordinatesSchema(request)
      const result = schema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('Exemption ID is required')
    })

    test('Should validate ID format', () => {
      const request = {
        id: 'invalid-id',
        'coordinates[0][eastings]': '123456',
        'coordinates[0][northings]': '654321',
        'coordinates[1][eastings]': '234567',
        'coordinates[1][northings]': '765432',
        'coordinates[2][eastings]': '345678',
        'coordinates[2][northings]': '876543'
      }

      const schema = createOsgb36MultipleCoordinatesSchema(request)
      const result = schema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain(
        'Exemption ID must be a valid ObjectId'
      )
    })

    test('Should validate eastings range', () => {
      const request = {
        id: '507f1f77bcf86cd799439011',
        'coordinates[0][eastings]': '12345',
        'coordinates[0][northings]': '654321',
        'coordinates[1][eastings]': '234567',
        'coordinates[1][northings]': '765432',
        'coordinates[2][eastings]': '345678',
        'coordinates[2][northings]': '876543'
      }

      const schema = createOsgb36MultipleCoordinatesSchema(request)
      const result = schema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain(
        'Eastings of the start and end point must be 6 digits'
      )
    })

    test('Should validate northings range', () => {
      const request = {
        id: '507f1f77bcf86cd799439011',
        'coordinates[0][eastings]': '123456',
        'coordinates[0][northings]': '65432',
        'coordinates[1][eastings]': '234567',
        'coordinates[1][northings]': '765432',
        'coordinates[2][eastings]': '345678',
        'coordinates[2][northings]': '876543'
      }

      const schema = createOsgb36MultipleCoordinatesSchema(request)
      const result = schema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain(
        'Northings of the start and end point must be 6 or 7 digits'
      )
    })

    test('Should validate numeric format', () => {
      const request = {
        id: '507f1f77bcf86cd799439011',
        'coordinates[0][eastings]': 'abc',
        'coordinates[0][northings]': 'def',
        'coordinates[1][eastings]': '234567',
        'coordinates[1][northings]': '765432',
        'coordinates[2][eastings]': '345678',
        'coordinates[2][northings]': '876543'
      }

      const schema = createOsgb36MultipleCoordinatesSchema(request)
      const result = schema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain(
        'Eastings of the start and end point must be a number'
      )
      expect(result.error.message).toContain(
        'Northings of the start and end point must be a number'
      )
    })

    test('Should validate required fields', () => {
      const request = {
        id: '507f1f77bcf86cd799439011',
        'coordinates[0][eastings]': '',
        'coordinates[0][northings]': '',
        'coordinates[1][eastings]': '234567',
        'coordinates[1][northings]': '765432',
        'coordinates[2][eastings]': '345678',
        'coordinates[2][northings]': '876543'
      }

      const schema = createOsgb36MultipleCoordinatesSchema(request)
      const result = schema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain(
        'Enter the eastings of the start and end point'
      )
      expect(result.error.message).toContain(
        'Enter the northings of the start and end point'
      )
    })

    test('Should validate point labels correctly', () => {
      const request = {
        id: '507f1f77bcf86cd799439011',
        'coordinates[0][eastings]': '123456',
        'coordinates[0][northings]': '654321',
        'coordinates[1][eastings]': '',
        'coordinates[1][northings]': '',
        'coordinates[2][eastings]': '345678',
        'coordinates[2][northings]': '876543'
      }

      const schema = createOsgb36MultipleCoordinatesSchema(request)
      const result = schema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('Enter the eastings of point 2')
      expect(result.error.message).toContain('Enter the northings of point 2')
    })

    test('Should validate decimal numbers are rejected', () => {
      const request = {
        id: '507f1f77bcf86cd799439011',
        'coordinates[0][eastings]': '123456.5',
        'coordinates[0][northings]': '654321.5',
        'coordinates[1][eastings]': '234567',
        'coordinates[1][northings]': '765432',
        'coordinates[2][eastings]': '345678',
        'coordinates[2][northings]': '876543'
      }

      const schema = createOsgb36MultipleCoordinatesSchema(request)
      const result = schema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain(
        'Eastings of the start and end point must be a whole number'
      )
      expect(result.error.message).toContain(
        'Northings of the start and end point must be a whole number'
      )
    })
  })
})
