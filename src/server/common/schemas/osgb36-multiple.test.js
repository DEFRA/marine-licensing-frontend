import { createOsgb36MultipleCoordinatesSchema } from '#src/server/common/schemas/osgb36.js'

describe('#multipleCoordinates OSGB36 schema', () => {
  describe('#createOsgb36MultipleCoordinatesSchema', () => {
    test('Should correctly validate valid OSGB36 coordinates array', () => {
      const payload = {
        coordinates: [
          { easting: '123456', northing: '654321' },
          { easting: '234567', northing: '765432' },
          { easting: '345678', northing: '876543' }
        ]
      }

      const schema = createOsgb36MultipleCoordinatesSchema()
      const result = schema.validate(payload)

      expect(result.error).toBeUndefined()
    })

    test('Should correctly validate with more than 3 coordinates', () => {
      const payload = {
        coordinates: [
          { easting: '123456', northing: '654321' },
          { easting: '234567', northing: '765432' },
          { easting: '345678', northing: '876543' },
          { easting: '456789', northing: '987654' },
          { easting: '567890', northing: '1098765' }
        ]
      }

      const schema = createOsgb36MultipleCoordinatesSchema()
      const result = schema.validate(payload)

      expect(result.error).toBeUndefined()
    })

    test('Should require at least 3 coordinates', () => {
      const payload = {
        coordinates: [
          { easting: '123456', northing: '654321' },
          { easting: '234567', northing: '765432' }
        ]
      }

      const schema = createOsgb36MultipleCoordinatesSchema()
      const result = schema.validate(payload)

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('at least 3 coordinate points')
    })

    test('Should validate individual coordinate fields', () => {
      const payload = {
        coordinates: [
          { easting: 'invalid', northing: '654321' },
          { easting: '234567', northing: '765432' },
          { easting: '345678', northing: '876543' }
        ]
      }

      const schema = createOsgb36MultipleCoordinatesSchema()
      const result = schema.validate(payload)

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('Easting must be a number')
    })

    test('Should require coordinates array', () => {
      const payload = {}

      const schema = createOsgb36MultipleCoordinatesSchema()
      const result = schema.validate(payload)

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('required')
    })

    test('Should validate coordinate ranges', () => {
      const payload = {
        coordinates: [
          { easting: '12345', northing: '65432' }, // Too short
          { easting: '234567', northing: '765432' },
          { easting: '345678', northing: '876543' }
        ]
      }

      const schema = createOsgb36MultipleCoordinatesSchema()
      const result = schema.validate(payload)

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('Easting must be 6 digits')
    })

    test('Should allow unknown fields in payload', () => {
      const payload = {
        coordinates: [
          { easting: '123456', northing: '654321' },
          { easting: '234567', northing: '765432' },
          { easting: '345678', northing: '876543' }
        ],
        id: 'exemption-123',
        csrfToken: 'token-value'
      }

      const schema = createOsgb36MultipleCoordinatesSchema()
      const result = schema.validate(payload)

      expect(result.error).toBeUndefined()
    })

    test('Should generate single error message for non-numeric input like "abc123"', () => {
      const payload = {
        coordinates: [
          { easting: 'abc123', northing: '654321' },
          { easting: '234567', northing: '765432' },
          { easting: '345678', northing: '876543' }
        ]
      }

      const schema = createOsgb36MultipleCoordinatesSchema()
      const result = schema.validate(payload, { abortEarly: false })

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('Easting must be a number')

      // Verify only one error for the first coordinate's easting (no duplicate)
      const eastingErrors = result.error.details.filter(
        (detail) =>
          detail.path.includes('coordinates') &&
          detail.path.includes(0) &&
          detail.path.includes('easting')
      )
      expect(eastingErrors).toHaveLength(1)
    })
  })
})
