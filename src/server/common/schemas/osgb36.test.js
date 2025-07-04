import {
  osgb36ValidationSchema,
  osgb36IntegerValidationSchema,
  createEastingsSchema,
  createNorthingsSchema
} from '~/src/server/common/schemas/osgb36.js'
import { COORDINATE_SYSTEMS } from '~/src/server/common/constants/coordinates.js'
import joi from 'joi'

const mockCoordinates = {
  [COORDINATE_SYSTEMS.OSGB36]: { eastings: '425053', northings: '564180' }
}

describe('#osgb36ValidationSchema model', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('Should correctly validate on valid data', () => {
    const request = mockCoordinates[COORDINATE_SYSTEMS.OSGB36]

    const result = osgb36ValidationSchema.validate(request)

    expect(result.error).toBeUndefined()
  })

  test('Should correctly validate on empty data', () => {
    const request = {}

    const result = osgb36ValidationSchema.validate(request, {
      abortEarly: false
    })

    expect(result.error.message).toContain('EASTINGS_REQUIRED')
    expect(result.error.message).toContain('NORTHINGS_REQUIRED')
  })

  test('Should correctly validate when eastings is an empty string', () => {
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

  test('Should correctly validate when northings is an empty string', () => {
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

  test('Should correctly validate when northings and eastings is below minimum allowed value', () => {
    const request = {
      eastings: '10000',
      northings: '10000'
    }

    const result = osgb36ValidationSchema.validate(request, {
      abortEarly: false
    })

    expect(result.error.message).toContain('EASTINGS_LENGTH')
    expect(result.error.message).toContain('NORTHINGS_LENGTH')
  })

  test('Should correctly validate when northings and eastings is above maximum allowed value', () => {
    const request = {
      eastings: '9999999',
      northings: '99999999'
    }

    const result = osgb36ValidationSchema.validate(request, {
      abortEarly: false
    })

    expect(result.error.message).toContain('EASTINGS_LENGTH')
    expect(result.error.message).toContain('NORTHINGS_LENGTH')
  })

  test('Should correctly validate when eastings and northings are negative numbers', () => {
    const request = {
      eastings: '-425053',
      northings: '-564180'
    }

    const result = osgb36ValidationSchema.validate(request, {
      abortEarly: false
    })

    expect(result.error.message).toContain('EASTINGS_POSITIVE_NUMBER')
    expect(result.error.message).toContain('NORTHINGS_POSITIVE_NUMBER')
  })

  test('Should correctly validate when eastings and northings contain incorrect characters', () => {
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

  test('Should correctly validate when eastings and northings contain - inside the value', () => {
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
})

describe('#osgb36IntegerValidationSchema model', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('Should correctly validate valid integer OSGB36 coordinates', () => {
    const request = {
      eastings: '425053',
      northings: '564180'
    }

    const result = osgb36IntegerValidationSchema.validate(request)

    expect(result.error).toBeUndefined()
  })

  test('Should correctly validate valid 7-digit northings', () => {
    const request = {
      eastings: '425053',
      northings: '1564180'
    }

    const result = osgb36IntegerValidationSchema.validate(request)

    expect(result.error).toBeUndefined()
  })

  test('Should correctly validate when fields are required but empty', () => {
    const request = {
      eastings: '',
      northings: ''
    }

    const result = osgb36IntegerValidationSchema.validate(request, {
      abortEarly: false
    })

    expect(result.error.message).toContain('Enter the eastings')
    expect(result.error.message).toContain('Enter the northings')
  })

  test('Should correctly validate when fields are required but missing', () => {
    const request = {}

    const result = osgb36IntegerValidationSchema.validate(request, {
      abortEarly: false
    })

    expect(result.error.message).toContain('Enter the eastings')
    expect(result.error.message).toContain('Enter the northings')
  })

  test('Should correctly validate when eastings contains decimal number', () => {
    const request = {
      eastings: '425053.5',
      northings: '564180'
    }

    const result = osgb36IntegerValidationSchema.validate(request)

    expect(result.error.message).toContain('Eastings must be a whole number')
  })

  test('Should correctly validate when northings contains decimal number', () => {
    const request = {
      eastings: '425053',
      northings: '564180.7'
    }

    const result = osgb36IntegerValidationSchema.validate(request)

    expect(result.error.message).toContain('Northings must be a whole number')
  })

  test('Should correctly validate when eastings contains non-numeric characters', () => {
    const request = {
      eastings: '42505a',
      northings: '564180'
    }

    const result = osgb36IntegerValidationSchema.validate(request)

    expect(result.error.message).toContain('Eastings must be a whole number')
  })

  test('Should correctly validate when northings contains non-numeric characters', () => {
    const request = {
      eastings: '425053',
      northings: '56418b'
    }

    const result = osgb36IntegerValidationSchema.validate(request)

    expect(result.error.message).toContain('Northings must be a whole number')
  })

  test('Should correctly validate when eastings is below minimum range', () => {
    const request = {
      eastings: '99999',
      northings: '564180'
    }

    const result = osgb36IntegerValidationSchema.validate(request)

    expect(result.error.message).toContain('Eastings must be 6 digits')
  })

  test('Should correctly validate when eastings is above maximum range', () => {
    const request = {
      eastings: '1000000',
      northings: '564180'
    }

    const result = osgb36IntegerValidationSchema.validate(request)

    expect(result.error.message).toContain('Eastings must be 6 digits')
  })

  test('Should correctly validate when northings is below minimum range', () => {
    const request = {
      eastings: '425053',
      northings: '99999'
    }

    const result = osgb36IntegerValidationSchema.validate(request)

    expect(result.error.message).toContain('Northings must be 6 or 7 digits')
  })

  test('Should correctly validate when northings is above maximum range', () => {
    const request = {
      eastings: '425053',
      northings: '10000000'
    }

    const result = osgb36IntegerValidationSchema.validate(request)

    expect(result.error.message).toContain('Northings must be 6 or 7 digits')
  })

  test('Should correctly validate when eastings is zero', () => {
    const request = {
      eastings: '0',
      northings: '564180'
    }

    const result = osgb36IntegerValidationSchema.validate(request)

    expect(result.error.message).toContain(
      'Eastings must be a positive 6-digit number, like 123456'
    )
  })

  test('Should correctly validate when northings is zero', () => {
    const request = {
      eastings: '425053',
      northings: '0'
    }

    const result = osgb36IntegerValidationSchema.validate(request)

    expect(result.error.message).toContain(
      'Northings must be a positive 6 or 7-digit number, like 123456'
    )
  })

  test('Should correctly validate when eastings is negative', () => {
    const request = {
      eastings: '-425053',
      northings: '564180'
    }

    const result = osgb36IntegerValidationSchema.validate(request)

    expect(result.error.message).toContain('Eastings must be a whole number')
  })

  test('Should correctly validate when northings is negative', () => {
    const request = {
      eastings: '425053',
      northings: '-564180'
    }

    const result = osgb36IntegerValidationSchema.validate(request)

    expect(result.error.message).toContain('Northings must be a whole number')
  })
})

describe('#createEastingsSchema', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('Should correctly validate valid eastings data', () => {
    const schema = createEastingsSchema('the start and end point')
    const result = schema.validate('425053')

    expect(result.error).toBeUndefined()
    expect(result.value).toBe('425053')
  })

  test('Should correctly validate when eastings is required but empty', () => {
    const schema = createEastingsSchema('point 2')
    const result = schema.validate('')

    expect(result.error.message).toContain('Enter the eastings of point 2')
  })

  test('Should correctly validate when eastings is required but missing', () => {
    const schema = createEastingsSchema('the start and end point')
    const result = schema.validate(undefined)

    expect(result.error.message).toContain(
      'Enter the eastings of the start and end point'
    )
  })

  test('Should correctly validate when eastings contains non-numeric characters', () => {
    const schema = createEastingsSchema('point 3')
    const result = schema.validate('42505a')

    expect(result.error.message).toContain(
      'Eastings of point 3 must be a whole number'
    )
  })

  test('Should correctly validate when eastings contains decimal number', () => {
    const schema = createEastingsSchema('point 2')
    const result = schema.validate('425053.5')

    expect(result.error.message).toContain(
      'Eastings of point 2 must be a whole number'
    )
  })

  test('Should correctly validate when eastings is below minimum range', () => {
    const schema = createEastingsSchema('the start and end point')
    const result = schema.validate('99999')

    expect(result.error.message).toContain(
      'Eastings of the start and end point must be 6 digits'
    )
  })

  test('Should correctly validate when eastings is above maximum range', () => {
    const schema = createEastingsSchema('point 4')
    const result = schema.validate('1000000')

    expect(result.error.message).toContain(
      'Eastings of point 4 must be 6 digits'
    )
  })

  test('Should correctly validate when eastings is negative', () => {
    const schema = createEastingsSchema('point 2')
    const result = schema.validate('-425053')

    expect(result.error.message).toContain(
      'Eastings of point 2 must be a whole number'
    )
  })

  test('Should correctly validate when eastings is zero', () => {
    const schema = createEastingsSchema('the start and end point')
    const result = schema.validate('0')

    expect(result.error.message).toContain(
      'Eastings of the start and end point must be a positive 6-digit number, like 123456'
    )
  })

  test('Should correctly validate required field error for eastings', () => {
    const schema = joi.object({
      eastings: createEastingsSchema('point 5')
    })
    const result = schema.validate({})

    expect(result.error.message).toContain('Enter the eastings of point 5')
  })
})

describe('#createNorthingsSchema', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('Should correctly validate valid northings data', () => {
    const schema = createNorthingsSchema('the start and end point')
    const result = schema.validate('564180')

    expect(result.error).toBeUndefined()
    expect(result.value).toBe('564180')
  })

  test('Should correctly validate valid 7-digit northings data', () => {
    const schema = createNorthingsSchema('point 2')
    const result = schema.validate('1564180')

    expect(result.error).toBeUndefined()
    expect(result.value).toBe('1564180')
  })

  test('Should correctly validate when northings is required but empty', () => {
    const schema = createNorthingsSchema('point 3')
    const result = schema.validate('')

    expect(result.error.message).toContain('Enter the northings of point 3')
  })

  test('Should correctly validate when northings is required but missing', () => {
    const schema = createNorthingsSchema('the start and end point')
    const result = schema.validate(undefined)

    expect(result.error.message).toContain(
      'Enter the northings of the start and end point'
    )
  })

  test('Should correctly validate when northings contains non-numeric characters', () => {
    const schema = createNorthingsSchema('point 2')
    const result = schema.validate('56418b')

    expect(result.error.message).toContain(
      'Northings of point 2 must be a whole number'
    )
  })

  test('Should correctly validate when northings contains decimal number', () => {
    const schema = createNorthingsSchema('point 4')
    const result = schema.validate('564180.7')

    expect(result.error.message).toContain(
      'Northings of point 4 must be a whole number'
    )
  })

  test('Should correctly validate when northings is below minimum range', () => {
    const schema = createNorthingsSchema('the start and end point')
    const result = schema.validate('99999')

    expect(result.error.message).toContain(
      'Northings of the start and end point must be 6 or 7 digits'
    )
  })

  test('Should correctly validate when northings is above maximum range', () => {
    const schema = createNorthingsSchema('point 2')
    const result = schema.validate('10000000')

    expect(result.error.message).toContain(
      'Northings of point 2 must be 6 or 7 digits'
    )
  })

  test('Should correctly validate when northings is negative', () => {
    const schema = createNorthingsSchema('point 3')
    const result = schema.validate('-564180')

    expect(result.error.message).toContain(
      'Northings of point 3 must be a whole number'
    )
  })

  test('Should correctly validate when northings is zero', () => {
    const schema = createNorthingsSchema('the start and end point')
    const result = schema.validate('0')

    expect(result.error.message).toContain(
      'Northings of the start and end point must be a positive 6 or 7-digit number, like 123456'
    )
  })

  test('Should correctly validate required field error for northings', () => {
    const schema = joi.object({
      northings: createNorthingsSchema('point 6')
    })
    const result = schema.validate({})

    expect(result.error.message).toContain('Enter the northings of point 6')
  })
})
