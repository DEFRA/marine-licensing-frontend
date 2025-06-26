import { createWgs84MultipleCoordinatesSchema } from '~/src/server/common/schemas/wgs84-multiple.js'

describe('#multipleCoordinates WGS84 schema', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  describe('#createWgs84MultipleCoordinatesSchema', () => {
    test('Should correctly validate valid WGS84 coordinates', () => {
      const request = {
        id: '507f1f77bcf86cd799439011',
        'coordinates[0][latitude]': '55.019889',
        'coordinates[0][longitude]': '-1.399500',
        'coordinates[1][latitude]': '55.019890',
        'coordinates[1][longitude]': '-1.399501',
        'coordinates[2][latitude]': '55.019891',
        'coordinates[2][longitude]': '-1.399502'
      }

      const schema = createWgs84MultipleCoordinatesSchema(request)
      const result = schema.validate(request)

      expect(result.error).toBeUndefined()
    })

    test('Should correctly validate with more than 3 coordinates', () => {
      const request = {
        id: '507f1f77bcf86cd799439011',
        'coordinates[0][latitude]': '55.019889',
        'coordinates[0][longitude]': '-1.399500',
        'coordinates[1][latitude]': '55.019890',
        'coordinates[1][longitude]': '-1.399501',
        'coordinates[2][latitude]': '55.019891',
        'coordinates[2][longitude]': '-1.399502',
        'coordinates[3][latitude]': '55.019892',
        'coordinates[3][longitude]': '-1.399503'
      }

      const schema = createWgs84MultipleCoordinatesSchema(request)
      const result = schema.validate(request)

      expect(result.error).toBeUndefined()
    })

    test('Should require exemption ID', () => {
      const request = {
        'coordinates[0][latitude]': '55.019889',
        'coordinates[0][longitude]': '-1.399500',
        'coordinates[1][latitude]': '55.019890',
        'coordinates[1][longitude]': '-1.399501',
        'coordinates[2][latitude]': '55.019891',
        'coordinates[2][longitude]': '-1.399502'
      }

      const schema = createWgs84MultipleCoordinatesSchema(request)
      const result = schema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('Exemption ID is required')
    })

    test('Should validate ID format', () => {
      const request = {
        id: 'invalid-id',
        'coordinates[0][latitude]': '55.019889',
        'coordinates[0][longitude]': '-1.399500',
        'coordinates[1][latitude]': '55.019890',
        'coordinates[1][longitude]': '-1.399501',
        'coordinates[2][latitude]': '55.019891',
        'coordinates[2][longitude]': '-1.399502'
      }

      const schema = createWgs84MultipleCoordinatesSchema(request)
      const result = schema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain(
        'Exemption ID must be a valid ObjectId'
      )
    })

    test('Should validate latitude range with specification-compliant error', () => {
      const request = {
        id: '507f1f77bcf86cd799439011',
        'coordinates[0][latitude]': '95.019889',
        'coordinates[0][longitude]': '-1.399500',
        'coordinates[1][latitude]': '55.019890',
        'coordinates[1][longitude]': '-1.399501',
        'coordinates[2][latitude]': '55.019891',
        'coordinates[2][longitude]': '-1.399502'
      }

      const schema = createWgs84MultipleCoordinatesSchema(request)
      const result = schema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain(
        'Latitude of the start and end point must be between -90 and 90'
      )
    })

    test('Should validate longitude range with specification-compliant error', () => {
      const request = {
        id: '507f1f77bcf86cd799439011',
        'coordinates[0][latitude]': '55.019889',
        'coordinates[0][longitude]': '-181.399500',
        'coordinates[1][latitude]': '55.019890',
        'coordinates[1][longitude]': '-1.399501',
        'coordinates[2][latitude]': '55.019891',
        'coordinates[2][longitude]': '-1.399502'
      }

      const schema = createWgs84MultipleCoordinatesSchema(request)
      const result = schema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain(
        'Longitude of the start and end point must be between -180 and 180'
      )
    })

    test('Should validate decimal places', () => {
      const request = {
        id: '507f1f77bcf86cd799439011',
        'coordinates[0][latitude]': '55.01988',
        'coordinates[0][longitude]': '-1.39950',
        'coordinates[1][latitude]': '55.019890',
        'coordinates[1][longitude]': '-1.399501',
        'coordinates[2][latitude]': '55.019891',
        'coordinates[2][longitude]': '-1.399502'
      }

      const schema = createWgs84MultipleCoordinatesSchema(request)
      const result = schema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain(
        'Latitude of the start and end point must include 6 decimal places, like 55.019889'
      )
      expect(result.error.message).toContain(
        'Longitude of the start and end point must include 6 decimal places, like -1.399500'
      )
    })

    test('Should validate numeric format', () => {
      const request = {
        id: '507f1f77bcf86cd799439011',
        'coordinates[0][latitude]': 'abc',
        'coordinates[0][longitude]': 'def',
        'coordinates[1][latitude]': '55.019890',
        'coordinates[1][longitude]': '-1.399501',
        'coordinates[2][latitude]': '55.019891',
        'coordinates[2][longitude]': '-1.399502'
      }

      const schema = createWgs84MultipleCoordinatesSchema(request)
      const result = schema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain(
        'Latitude of the start and end point must be a number'
      )
      expect(result.error.message).toContain(
        'Longitude of the start and end point must be a number'
      )
    })

    test('Should validate required fields', () => {
      const request = {
        id: '507f1f77bcf86cd799439011',
        'coordinates[0][latitude]': '',
        'coordinates[0][longitude]': '',
        'coordinates[1][latitude]': '55.019890',
        'coordinates[1][longitude]': '-1.399501',
        'coordinates[2][latitude]': '55.019891',
        'coordinates[2][longitude]': '-1.399502'
      }

      const schema = createWgs84MultipleCoordinatesSchema(request)
      const result = schema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain(
        'Enter the latitude of the start and end point'
      )
      expect(result.error.message).toContain(
        'Enter the longitude of the start and end point'
      )
    })

    test('Should validate point labels correctly', () => {
      const request = {
        id: '507f1f77bcf86cd799439011',
        'coordinates[0][latitude]': '55.019889',
        'coordinates[0][longitude]': '-1.399500',
        'coordinates[1][latitude]': '',
        'coordinates[1][longitude]': '',
        'coordinates[2][latitude]': '55.019891',
        'coordinates[2][longitude]': '-1.399502'
      }

      const schema = createWgs84MultipleCoordinatesSchema(request)
      const result = schema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('Enter the latitude of point 2')
      expect(result.error.message).toContain('Enter the longitude of point 2')
    })
  })
})
