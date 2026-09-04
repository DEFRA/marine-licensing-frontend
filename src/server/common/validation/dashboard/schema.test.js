import { dashboardFilterSchema } from '#src/server/common/validation/dashboard/schema.js'

describe('#dashboardFilterSchema', () => {
  test('should validate an empty payload', () => {
    const { error } = dashboardFilterSchema.validate({})

    expect(error).toBeUndefined()
  })

  test('should validate a valid show value', () => {
    const { error } = dashboardFilterSchema.validate({ show: 'my-projects' })

    expect(error).toBeUndefined()
  })

  test('should fail on an invalid show value', () => {
    const { error } = dashboardFilterSchema.validate({ show: 'not-a-value' })

    expect(error).toBeDefined()
  })

  test('should validate a single status value and modify it to an array', () => {
    const { error, value } = dashboardFilterSchema.validate({
      status: 'ACTIVE'
    })

    expect(error).toBeUndefined()
    expect(value.status).toEqual(['ACTIVE'])
  })

  test('should validate multiple status values', () => {
    const { error } = dashboardFilterSchema.validate({
      status: ['ACTIVE', 'DRAFT']
    })

    expect(error).toBeUndefined()
  })

  test('should fail on an invalid status value', () => {
    const { error } = dashboardFilterSchema.validate({
      status: 'NOT_A_STATUS'
    })

    expect(error).toBeDefined()
  })

  test('should validate a valid type value', () => {
    const { error } = dashboardFilterSchema.validate({
      type: 'marine-licence'
    })

    expect(error).toBeUndefined()
  })

  test('should fail on an invalid type value', () => {
    const { error } = dashboardFilterSchema.validate({ type: 'not-a-type' })

    expect(error).toBeDefined()
  })

  test('should fail on an unknown field', () => {
    const { error } = dashboardFilterSchema.validate({ notAField: 'value' })

    expect(error).toBeDefined()
  })
})
