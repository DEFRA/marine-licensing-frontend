import { durationSchema } from '#src/server/marine-licence/site-details/maximum-duration/schema.js'

describe('#durationSchema', () => {
  test('accepts valid years and months', () => {
    const { error } = durationSchema.validate({
      'duration-years': '2',
      'duration-months': '6'
    })
    expect(error).toBeUndefined()
  })

  test('accepts zero values', () => {
    const { error } = durationSchema.validate({
      'duration-years': '0',
      'duration-months': '0'
    })
    expect(error).toBeUndefined()
  })

  test('fails on years when years is missing', () => {
    const { error } = durationSchema.validate({
      'duration-months': '6'
    })
    expect(error?.message).toBe('DURATION_REQUIRED')
    expect(error?.details[0].path).toEqual(['duration-years'])
  })

  test('fails on months when years is filled but months is missing', () => {
    const { error } = durationSchema.validate({
      'duration-years': '2'
    })
    expect(error?.message).toBe('DURATION_REQUIRED')
    expect(error?.details[0].path).toEqual(['duration-months'])
  })

  test('fails on years when years is empty', () => {
    const { error } = durationSchema.validate({
      'duration-years': '',
      'duration-months': '6'
    })
    expect(error?.message).toBe('DURATION_REQUIRED')
    expect(error?.details[0].path).toEqual(['duration-years'])
  })

  test('fails on months when years is filled but months is empty', () => {
    const { error } = durationSchema.validate({
      'duration-years': '2',
      'duration-months': ''
    })
    expect(error?.message).toBe('DURATION_REQUIRED')
    expect(error?.details[0].path).toEqual(['duration-months'])
  })

  test('produces only one error when both fields are empty', () => {
    const { error } = durationSchema.validate(
      { 'duration-years': '', 'duration-months': '' },
      { abortEarly: false }
    )
    expect(error?.details).toHaveLength(1)
  })
})
