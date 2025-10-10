import { createWgs84MultipleCoordinatesSchema } from '#src/server/common/schemas/wgs84.js'

describe('#multipleCoordinates WGS84 schema', () => {
  describe('#createWgs84MultipleCoordinatesSchema', () => {
    test('Should correctly validate valid WGS84 coordinates array', () => {
      const payload = {
        coordinates: [
          { latitude: '55.019889', longitude: '-1.399500' },
          { latitude: '55.019890', longitude: '-1.399501' },
          { latitude: '55.019891', longitude: '-1.399502' }
        ]
      }

      const schema = createWgs84MultipleCoordinatesSchema()
      const result = schema.validate(payload)

      expect(result.error).toBeUndefined()
    })

    test('Should correctly validate with more than 3 coordinates', () => {
      const payload = {
        coordinates: [
          { latitude: '55.019889', longitude: '-1.399500' },
          { latitude: '55.019890', longitude: '-1.399501' },
          { latitude: '55.019891', longitude: '-1.399502' },
          { latitude: '55.019892', longitude: '-1.399503' },
          { latitude: '55.019893', longitude: '-1.399504' }
        ]
      }

      const schema = createWgs84MultipleCoordinatesSchema()
      const result = schema.validate(payload)

      expect(result.error).toBeUndefined()
    })

    test('Should require at least 3 coordinates', () => {
      const payload = {
        coordinates: [
          { latitude: '55.019889', longitude: '-1.399500' },
          { latitude: '55.019890', longitude: '-1.399501' }
        ]
      }

      const schema = createWgs84MultipleCoordinatesSchema()
      const result = schema.validate(payload)

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('at least 3 coordinate points')
    })

    test('Should validate individual coordinate fields', () => {
      const payload = {
        coordinates: [
          { latitude: 'invalid', longitude: '-1.399500' },
          { latitude: '55.019890', longitude: '-1.399501' },
          { latitude: '55.019891', longitude: '-1.399502' }
        ]
      }

      const schema = createWgs84MultipleCoordinatesSchema()
      const result = schema.validate(payload)

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('Latitude must be a number')
    })

    test('Should require coordinates array', () => {
      const payload = {}

      const schema = createWgs84MultipleCoordinatesSchema()
      const result = schema.validate(payload)

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('required')
    })

    test('Should validate decimal places requirement', () => {
      const payload = {
        coordinates: [
          { latitude: '55.01988', longitude: '-1.39950' }, // Missing decimal places
          { latitude: '55.019890', longitude: '-1.399501' },
          { latitude: '55.019891', longitude: '-1.399502' }
        ]
      }

      const schema = createWgs84MultipleCoordinatesSchema()
      const result = schema.validate(payload)

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain(
        'Latitude must include 6 decimal places'
      )
    })

    test('Should allow unknown fields in payload', () => {
      const payload = {
        coordinates: [
          { latitude: '55.019889', longitude: '-1.399500' },
          { latitude: '55.019890', longitude: '-1.399501' },
          { latitude: '55.019891', longitude: '-1.399502' }
        ],
        id: 'exemption-123',
        csrfToken: 'token-value'
      }

      const schema = createWgs84MultipleCoordinatesSchema()
      const result = schema.validate(payload)

      expect(result.error).toBeUndefined()
    })
  })
})
