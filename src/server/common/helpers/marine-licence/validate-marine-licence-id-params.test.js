import {
  marineLicenceIdParamsSchema,
  MARINE_LICENCE_ID_LENGTH
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
