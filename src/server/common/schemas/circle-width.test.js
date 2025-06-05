import { circleWidthValidationSchema } from '~/src/server/common/schemas/circle-width.js'

describe('#osgb36ValidationSchema model', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  test('Should correctly validate on valid data', () => {
    const result = circleWidthValidationSchema.validate({ width: '20' })

    expect(result.error).toBeUndefined()
  })

  test('Should correctly validate on empty data', () => {
    const request = {}

    const result = circleWidthValidationSchema.validate(request, {
      abortEarly: false
    })

    expect(result.error.message).toBe('WIDTH_REQUIRED')
  })

  test('Should correctly validate when width is an empty string', () => {
    const result = circleWidthValidationSchema.validate(
      { width: '' },
      {
        abortEarly: false
      }
    )

    expect(result.error.message).toContain('WIDTH_REQUIRED')
  })

  test('Should correctly validate when width is below minimum allowed value', () => {
    const result = circleWidthValidationSchema.validate(
      { width: '0' },
      {
        abortEarly: false
      }
    )

    expect(result.error.message).toBe('WIDTH_MIN')
  })

  test('Should correctly validate when width is a negative number', () => {
    const result = circleWidthValidationSchema.validate(
      { width: '-5' },
      {
        abortEarly: false
      }
    )

    expect(result.error.message).toBe('WIDTH_MIN')
  })

  test('Should correctly validate when width contains incorrect characters', () => {
    const result = circleWidthValidationSchema.validate(
      { width: 'test' },
      {
        abortEarly: false
      }
    )

    expect(result.error.message).toBe('WIDTH_INVALID')
  })

  test('Should correctly validate when width is not an integer', () => {
    const result = circleWidthValidationSchema.validate(
      { width: '12.2' },
      {
        abortEarly: false
      }
    )

    expect(result.error.message).toBe('WIDTH_NON_INTEGER')
  })
})
