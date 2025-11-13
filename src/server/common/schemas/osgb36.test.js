import {
  osgb36ValidationSchema,
  createOsgb36MultipleCoordinatesSchema,
  createOsgb36CoordinateSchema
} from '#src/server/common/schemas/osgb36.js'

describe('#osgb36ValidationSchema model', () => {
  describe('Pass validation', () => {
    test('valid data', () => {
      const result = osgb36ValidationSchema.validate({
        eastings: '425053',
        northings: '564180'
      })

      expect(result.error).toBeUndefined()
    })

    test('eastings and northings have leading zeros', () => {
      const result = osgb36ValidationSchema.validate({
        eastings: '000053',
        northings: '000080'
      })

      expect(result.error).toBeUndefined()
    })

    test('eastings and northings have values of zero and are padded with zeroes', () => {
      const result = osgb36ValidationSchema.validate({
        eastings: '000000',
        northings: '0000000'
      })

      expect(result.error).toBeUndefined()
    })

    test('eastings and northings have values of zero with no zero-padding', () => {
      const result = osgb36ValidationSchema.validate({
        eastings: '0',
        northings: '0'
      })

      expect(result.error).toBeUndefined()
    })

    test('minimum eastings and northings with leading zeroes', () => {
      const result = osgb36ValidationSchema.validate({
        eastings: '000001',
        northings: '000001'
      })

      expect(result.error).toBeUndefined()
    })

    test('northing 7 digits with leading zeroes', () => {
      const result = osgb36ValidationSchema.validate({
        eastings: '000001',
        northings: '0870840'
      })

      expect(result.error).toBeUndefined()
    })
  })

  describe('Fail validation', () => {
    test('empty data', () => {
      const request = {}

      const result = osgb36ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('EASTINGS_REQUIRED')
      expect(result.error.message).toContain('NORTHINGS_REQUIRED')
    })

    test('eastings is an empty string', () => {
      const request = {
        eastings: '',
        northings: '564180'
      }

      const result = osgb36ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('EASTINGS_REQUIRED')
      expect(result.error.message).not.toContain('NORTHINGS_REQUIRED')
    })

    test('northings is an empty string', () => {
      const request = {
        eastings: '425053',
        northings: ''
      }

      const result = osgb36ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).not.toContain('EASTINGS_REQUIRED')
      expect(result.error.message).toContain('NORTHINGS_REQUIRED')
    })

    test('northings and eastings are above maximum allowed values', () => {
      const request = {
        eastings: '1000000',
        northings: '10000000'
      }

      const result = osgb36ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('EASTINGS_LENGTH')
      expect(result.error.message).toContain('NORTHINGS_LENGTH')
    })

    test('northings and eastings are not left padded with zeros', () => {
      const request = {
        eastings: '100', // should be 000100
        northings: '100' // should be 000100 or 0000100
      }

      const result = osgb36ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('EASTINGS_LENGTH')
      expect(result.error.message).toContain('NORTHINGS_LENGTH')
    })

    test('eastings and northings are negative numbers', () => {
      const request = {
        eastings: '-4250531',
        northings: '-56418001'
      }

      const result = osgb36ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('EASTINGS_POSITIVE_NUMBER')
      expect(result.error.message).toContain('NORTHINGS_POSITIVE_NUMBER')
    })

    test('eastings and northings contain incorrect characters', () => {
      const request = {
        eastings: '42505/',
        northings: '56410/'
      }

      const result = osgb36ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('EASTINGS_NON_NUMERIC')
      expect(result.error.message).toContain('NORTHINGS_NON_NUMERIC')
    })

    test('eastings and northings contain - inside the value', () => {
      const request = {
        eastings: '425-057',
        northings: '564-109'
      }

      const result = osgb36ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error.message).toContain('EASTINGS_NON_NUMERIC')
      expect(result.error.message).toContain('NORTHINGS_NON_NUMERIC')
    })

    test('non-numeric input like "abc123"', () => {
      const request = {
        eastings: 'abc123',
        northings: '564180'
      }

      const result = osgb36ValidationSchema.validate(request, {
        abortEarly: false
      })

      expect(result.error).toBeDefined()
      expect(result.error.message).toContain('EASTINGS_NON_NUMERIC')
      expect(result.error.message).not.toContain('NORTHINGS_NON_NUMERIC')

      // Verify only one error for eastings (no duplicate)
      const eastingsErrors = result.error.details.filter((detail) =>
        detail.path.includes('eastings')
      )
      expect(eastingsErrors).toHaveLength(1)
    })
  })
})

describe('#createOsgb36MultipleCoordinatesSchema', () => {
  test('Should correctly validate valid multiple coordinates', () => {
    const schema = createOsgb36MultipleCoordinatesSchema()
    const request = {
      coordinates: [
        { eastings: '425053', northings: '564180' },
        { eastings: '425054', northings: '564181' },
        { eastings: '425055', northings: '564182' }
      ]
    }

    const result = schema.validate(request)

    expect(result.error).toBeUndefined()
  })

  test('Should correctly validate when coordinates array is empty', () => {
    const schema = createOsgb36MultipleCoordinatesSchema()
    const request = {
      coordinates: []
    }

    const result = schema.validate(request)

    expect(result.error.message).toContain(
      'You must provide at least 3 coordinate points'
    )
  })

  test('Should correctly validate when coordinates array has insufficient points', () => {
    const schema = createOsgb36MultipleCoordinatesSchema()
    const request = {
      coordinates: [
        { eastings: '425053', northings: '564180' },
        { eastings: '425054', northings: '564181' }
      ]
    }

    const result = schema.validate(request)

    expect(result.error.message).toContain(
      'You must provide at least 3 coordinate points'
    )
  })

  test('Should correctly validate when coordinates field is missing', () => {
    const schema = createOsgb36MultipleCoordinatesSchema()
    const request = {}

    const result = schema.validate(request)

    expect(result.error.message).toContain('Coordinates are required')
  })

  test('Should correctly validate when individual coordinates are invalid', () => {
    const schema = createOsgb36MultipleCoordinatesSchema()
    const request = {
      coordinates: [
        { eastings: '10000', northings: '10000' },
        { eastings: '425054', northings: '564181' },
        { eastings: '425055', northings: '564182' }
      ]
    }

    const result = schema.validate(request, { abortEarly: false })

    expect(result.error.message).toContain('Eastings must be 6 digits')
    expect(result.error.message).toContain('Northings must be 6 or 7 digits')
  })

  test('Should correctly validate with additional unknown fields', () => {
    const schema = createOsgb36MultipleCoordinatesSchema()
    const request = {
      coordinates: [
        { eastings: '425053', northings: '564180' },
        { eastings: '425054', northings: '564181' },
        { eastings: '425055', northings: '564182' }
      ],
      additionalField: 'should be ignored'
    }

    const result = schema.validate(request)

    expect(result.error).toBeUndefined()
  })
})

describe('#createOsgb36CoordinateSchema', () => {
  test('Should default to simple messageType when not specified', () => {
    const schema = createOsgb36CoordinateSchema('eastings')
    const result = schema.validate('')

    expect(result.error).toBeDefined()
    expect(result.error.message).toContain('Enter the eastings')
  })

  describe('Error message specification verification', () => {
    test('Should show correct error for blank eastings field with withPoint messageType', () => {
      const schema = createOsgb36CoordinateSchema(
        'eastings',
        'withPoint',
        'point 2'
      )
      const result = schema.validate('')

      expect(result.error).toBeDefined()
      expect(result.error.message).toBe('Enter the eastings of point 2')
    })

    test('Should show correct error for blank northings field with withPoint messageType', () => {
      const schema = createOsgb36CoordinateSchema(
        'northings',
        'withPoint',
        'point 3'
      )
      const result = schema.validate('')

      expect(result.error).toBeDefined()
      expect(result.error.message).toBe('Enter the northings of point 3')
    })

    test('Should show correct error for non-numeric eastings with withPoint messageType', () => {
      const schema = createOsgb36CoordinateSchema(
        'eastings',
        'withPoint',
        'point 2'
      )
      const result = schema.validate('abc123')

      expect(result.error).toBeDefined()
      expect(result.error.message).toBe('Eastings of point 2 must be a number')
    })

    test('Should show correct error for non-numeric northings with withPoint messageType', () => {
      const schema = createOsgb36CoordinateSchema(
        'northings',
        'withPoint',
        'point 3'
      )
      const result = schema.validate('xyz789')

      expect(result.error).toBeDefined()
      expect(result.error.message).toBe('Northings of point 3 must be a number')
    })

    test('Should show correct error for negative eastings with withPoint messageType', () => {
      const schema = createOsgb36CoordinateSchema(
        'eastings',
        'withPoint',
        'point 2'
      )
      const result = schema.validate('-123456')

      expect(result.error).toBeDefined()
      expect(result.error.message).toBe(
        'Eastings of point 2 must be a positive 6-digit number, like 123456'
      )
    })

    test('Should show correct error for negative northings with withPoint messageType', () => {
      const schema = createOsgb36CoordinateSchema(
        'northings',
        'withPoint',
        'point 3'
      )
      const result = schema.validate('-1234567')

      expect(result.error).toBeDefined()
      expect(result.error.message).toBe(
        'Northings of point 3 must be a positive 6 or 7-digit number, like 123456'
      )
    })

    test('Should show correct error for eastings not exactly 6 digits with withPoint messageType', () => {
      const schema = createOsgb36CoordinateSchema(
        'eastings',
        'withPoint',
        'point 2'
      )
      const result = schema.validate('12345') // 5 digits

      expect(result.error).toBeDefined()
      expect(result.error.message).toBe('Eastings of point 2 must be 6 digits')
    })

    test('Should show correct error for northings not 6 or 7 digits with withPoint messageType', () => {
      const schema = createOsgb36CoordinateSchema(
        'northings',
        'withPoint',
        'point 3'
      )
      const result = schema.validate('12345') // 5 digits

      expect(result.error).toBeDefined()
      expect(result.error.message).toBe(
        'Northings of point 3 must be 6 or 7 digits'
      )
    })

    test('Should show correct error for eastings with too many digits', () => {
      const schema = createOsgb36CoordinateSchema(
        'eastings',
        'withPoint',
        'point 2'
      )
      const result = schema.validate('1234567') // 7 digits

      expect(result.error).toBeDefined()
      expect(result.error.message).toBe('Eastings of point 2 must be 6 digits')
    })

    test('Should show correct error for northings with too many digits', () => {
      const schema = createOsgb36CoordinateSchema(
        'northings',
        'withPoint',
        'point 3'
      )
      const result = schema.validate('12345678') // 8 digits

      expect(result.error).toBeDefined()
      expect(result.error.message).toBe(
        'Northings of point 3 must be 6 or 7 digits'
      )
    })
  })
})
