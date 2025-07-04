import { createOsgb36MultipleCoordinatesSchema } from '~/src/server/common/schemas/osgb36.js'

describe('#multipleCoordinates OSGB36 schema', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

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

    test('Should validate that coordinates must be whole numbers', () => {
      const payload = {
        coordinates: [
          { eastings: '123456.5', northings: '654321.5' }, // Decimal numbers not allowed
          { eastings: '234567', northings: '765432' },
          { eastings: '345678', northings: '876543' }
        ]
      }

      const schema = createOsgb36MultipleCoordinatesSchema()
      const result = schema.validate(payload)

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('Eastings must be a number')
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
  })
})
