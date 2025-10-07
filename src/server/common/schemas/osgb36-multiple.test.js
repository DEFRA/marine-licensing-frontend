import { createOsgb36MultipleCoordinatesSchema } from '#src/server/common/schemas/osgb36.js'

describe('#multipleCoordinates OSGB36 schema', () => {
  describe('#createOsgb36MultipleCoordinatesSchema', () => {
    test('Should correctly validate valid OSGB36 coordinates array', () => {
      const payload = {
        coordinates: [
          { eastings: '123456', northings: '654321' },
          { eastings: '234567', northings: '765432' },
          { eastings: '345678', northings: '876543' }
        ]
      }

      const schema = createOsgb36MultipleCoordinatesSchema()
      const result = schema.validate(payload)

      expect(result.error).toBeUndefined()
    })

    test('Should correctly validate with more than 3 coordinates', () => {
      const payload = {
        coordinates: [
          { eastings: '123456', northings: '654321' },
          { eastings: '234567', northings: '765432' },
          { eastings: '345678', northings: '876543' },
          { eastings: '456789', northings: '987654' },
          { eastings: '567890', northings: '1098765' }
        ]
      }

      const schema = createOsgb36MultipleCoordinatesSchema()
      const result = schema.validate(payload)

      expect(result.error).toBeUndefined()
    })

    test('Should require at least 3 coordinates', () => {
      const payload = {
        coordinates: [
          { eastings: '123456', northings: '654321' },
          { eastings: '234567', northings: '765432' }
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
          { eastings: 'invalid', northings: '654321' },
          { eastings: '234567', northings: '765432' },
          { eastings: '345678', northings: '876543' }
        ]
      }

      const schema = createOsgb36MultipleCoordinatesSchema()
      const result = schema.validate(payload)

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('Eastings must be a number')
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
          { eastings: '12345', northings: '65432' }, // Too short
          { eastings: '234567', northings: '765432' },
          { eastings: '345678', northings: '876543' }
        ]
      }

      const schema = createOsgb36MultipleCoordinatesSchema()
      const result = schema.validate(payload)

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('Eastings must be 6 digits')
    })

    test('Should allow unknown fields in payload', () => {
      const payload = {
        coordinates: [
          { eastings: '123456', northings: '654321' },
          { eastings: '234567', northings: '765432' },
          { eastings: '345678', northings: '876543' }
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
          { eastings: 'abc123', northings: '654321' },
          { eastings: '234567', northings: '765432' },
          { eastings: '345678', northings: '876543' }
        ]
      }

      const schema = createOsgb36MultipleCoordinatesSchema()
      const result = schema.validate(payload, { abortEarly: false })

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('Eastings must be a number')

      // Verify only one error for the first coordinate's eastings (no duplicate)
      const eastingsErrors = result.error.details.filter(
        (detail) =>
          detail.path.includes('coordinates') &&
          detail.path.includes(0) &&
          detail.path.includes('eastings')
      )
      expect(eastingsErrors).toHaveLength(1)
    })
  })
})
