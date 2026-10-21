import {
  marineLicenceIdParamsSchema,
  MARINE_LICENCE_ID_LENGTH,
  TASK_ID_LENGTH,
  taskIdSchema
} from '#src/server/common/helpers/marine-licence/validate-marine-licence-id-params.js'

describe('#marineLicenceIdParamsSchema', () => {
  const validId = 'a'.repeat(MARINE_LICENCE_ID_LENGTH)

  test('accepts a valid marineLicenceId', () => {
    const { error, value } = marineLicenceIdParamsSchema.validate({
      marineLicenceId: validId
    })

    expect(error).toBeUndefined()
    expect(value).toEqual({ marineLicenceId: validId })
  })

  test.each([
    ['missing', {}],
    ['empty', { marineLicenceId: '' }],
    ['invalid format', { marineLicenceId: 'not-an-object-id' }]
  ])('rejects when marineLicenceId is %s', (_label, params) => {
    const { error } = marineLicenceIdParamsSchema.validate(params)

    expect(error).toBeDefined()
  })
})

describe('#taskIdSchema', () => {
  test('accepts a valid taskId', () => {
    const validId = 'b'.repeat(TASK_ID_LENGTH)

    expect(taskIdSchema.validate(validId)).toEqual({ value: validId })
  })

  test.each([
    ['missing', undefined],
    ['empty', ''],
    ['not hex', 'z'.repeat(TASK_ID_LENGTH)],
    ['the wrong length', 'b'.repeat(TASK_ID_LENGTH - 1)]
  ])('rejects a taskId that is %s', (_label, taskId) => {
    expect(taskIdSchema.validate(taskId).error).toBeDefined()
  })
})
