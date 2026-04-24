import { activityDurationSchema } from '#src/server/marine-licence/site-details/activity-duration/schema.js'

describe('#activityDurationSchema', () => {
  test('accepts valid years and months', () => {
    const { error } = activityDurationSchema.validate({
      'activity-duration-years': '2',
      'activity-duration-months': '6'
    })
    expect(error).toBeUndefined()
  })

  test('accepts zero values', () => {
    const { error } = activityDurationSchema.validate({
      'activity-duration-years': '0',
      'activity-duration-months': '0'
    })
    expect(error).toBeUndefined()
  })

  test('fails on years when years is missing', () => {
    const { error } = activityDurationSchema.validate({
      'activity-duration-months': '6'
    })
    expect(error?.message).toBe('DURATION_REQUIRED')
    expect(error?.details[0].path).toEqual(['activity-duration-years'])
  })

  test('fails on months when years is filled but months is missing', () => {
    const { error } = activityDurationSchema.validate({
      'activity-duration-years': '2'
    })
    expect(error?.message).toBe('DURATION_REQUIRED')
    expect(error?.details[0].path).toEqual(['activity-duration-months'])
  })

  test('fails on years when years is empty', () => {
    const { error } = activityDurationSchema.validate({
      'activity-duration-years': '',
      'activity-duration-months': '6'
    })
    expect(error?.message).toBe('DURATION_REQUIRED')
    expect(error?.details[0].path).toEqual(['activity-duration-years'])
  })

  test('fails on months when years is filled but months is empty', () => {
    const { error } = activityDurationSchema.validate({
      'activity-duration-years': '2',
      'activity-duration-months': ''
    })
    expect(error?.message).toBe('DURATION_REQUIRED')
    expect(error?.details[0].path).toEqual(['activity-duration-months'])
  })

  test('produces only one error when both fields are empty', () => {
    const { error } = activityDurationSchema.validate(
      { 'activity-duration-years': '', 'activity-duration-months': '' },
      { abortEarly: false }
    )
    expect(error?.details).toHaveLength(1)
  })
})
