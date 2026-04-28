import { activityDurationSchema } from '#src/server/marine-licence/site-details/activity-duration/schema.js'

describe('#activityDurationSchema', () => {
  test('accepts valid years and months', () => {
    const { error } = activityDurationSchema.validate({
      'activity-duration-years': '2',
      'activity-duration-months': '6'
    })
    expect(error).toBeUndefined()
  })

  test('accepts zero years with non-zero months', () => {
    const { error } = activityDurationSchema.validate({
      'activity-duration-years': '0',
      'activity-duration-months': '6'
    })
    expect(error).toBeUndefined()
  })

  test('fails when both years and months are 0', () => {
    const { error } = activityDurationSchema.validate({
      'activity-duration-years': '0',
      'activity-duration-months': '0'
    })
    expect(error?.message).toBe('DURATION_BOTH_ZERO')
    expect(error?.details[0].path).toEqual(['activity-duration-months'])
  })

  test('fails on years when years is missing', () => {
    const { error } = activityDurationSchema.validate({
      'activity-duration-months': '6'
    })
    expect(error?.message).toBe('YEARS_REQUIRED')
    expect(error?.details[0].path).toEqual(['activity-duration-years'])
  })

  test('fails on months when years is filled but months is missing', () => {
    const { error } = activityDurationSchema.validate({
      'activity-duration-years': '2'
    })
    expect(error?.message).toBe('MONTHS_REQUIRED')
    expect(error?.details[0].path).toEqual(['activity-duration-months'])
  })

  test('fails on years when years is empty', () => {
    const { error } = activityDurationSchema.validate({
      'activity-duration-years': '',
      'activity-duration-months': '6'
    })
    expect(error?.message).toBe('YEARS_REQUIRED')
    expect(error?.details[0].path).toEqual(['activity-duration-years'])
  })

  test('fails on months when years is filled but months is empty', () => {
    const { error } = activityDurationSchema.validate({
      'activity-duration-years': '2',
      'activity-duration-months': ''
    })
    expect(error?.message).toBe('MONTHS_REQUIRED')
    expect(error?.details[0].path).toEqual(['activity-duration-months'])
  })

  test('produces both required errors when both fields are empty', () => {
    const { error } = activityDurationSchema.validate(
      { 'activity-duration-years': '', 'activity-duration-months': '' },
      { abortEarly: false }
    )
    expect(error?.details).toHaveLength(2)
  })

  test('fails on years when years is not an integer', () => {
    const { error } = activityDurationSchema.validate({
      'activity-duration-years': '1.5',
      'activity-duration-months': '6'
    })
    expect(error?.message).toBe('YEARS_NOT_INTEGER')
    expect(error?.details[0].path).toEqual(['activity-duration-years'])
  })

  test('fails on months when months is not an integer', () => {
    const { error } = activityDurationSchema.validate({
      'activity-duration-years': '2',
      'activity-duration-months': 'abc'
    })
    expect(error?.message).toBe('MONTHS_NOT_VALID')
    expect(error?.details[0].path).toEqual(['activity-duration-months'])
  })

  test('fails on months when months is greater than 11', () => {
    const { error } = activityDurationSchema.validate({
      'activity-duration-years': '2',
      'activity-duration-months': '12'
    })
    expect(error?.message).toBe('MONTHS_NOT_VALID')
    expect(error?.details[0].path).toEqual(['activity-duration-months'])
  })
})
