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

  test('should validate a single user value and modify it to an array', () => {
    const { error, value } = dashboardFilterSchema.validate({
      show: 'specific-user',
      user: '3fa85f64-5717-4562-b3fc-2c963f66afa6'
    })

    expect(error).toBeUndefined()
    expect(value.user).toEqual(['3fa85f64-5717-4562-b3fc-2c963f66afa6'])
  })

  test('should validate multiple user values', () => {
    const { error } = dashboardFilterSchema.validate({
      show: 'specific-user',
      user: [
        '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d'
      ]
    })

    expect(error).toBeUndefined()
  })

  test('should validate when show is specific-user and user is missing (all unchecked)', () => {
    const { error } = dashboardFilterSchema.validate({ show: 'specific-user' })

    expect(error).toBeUndefined()
  })

  test('should fail when show is specific-user and user is not a valid uuid', () => {
    const { error } = dashboardFilterSchema.validate({
      show: 'specific-user',
      user: 'not-a-uuid'
    })

    expect(error).toBeDefined()
  })

  test('should strip user, not fail, when show is not specific-user', () => {
    const { error, value } = dashboardFilterSchema.validate({
      show: 'my-projects',
      user: '3fa85f64-5717-4562-b3fc-2c963f66afa6'
    })

    expect(error).toBeUndefined()
    expect(value.user).toBeUndefined()
  })

  test('should strip user, not fail, when show is absent', () => {
    const { error, value } = dashboardFilterSchema.validate({
      user: '3fa85f64-5717-4562-b3fc-2c963f66afa6'
    })

    expect(error).toBeUndefined()
    expect(value.user).toBeUndefined()
  })
})
