import { slugSchema } from '#src/server/journey/self-service/schemas/slug.js'

describe('#slugSchema', () => {
  test('Should accept a valid 22-character slug', () => {
    const result = slugSchema.validate(`${'a'.repeat(20)}_-`)

    expect(result.error).toBeUndefined()
  })

  test('Should reject a slug that is too short', () => {
    const result = slugSchema.validate('tooShort')

    expect(result.error).toBeDefined()
  })

  test('Should reject a slug that is too long', () => {
    const result = slugSchema.validate('a'.repeat(23))

    expect(result.error).toBeDefined()
  })

  test('Should reject a slug containing disallowed characters', () => {
    const result = slugSchema.validate(`${'a'.repeat(20)}.!`)

    expect(result.error).toBeDefined()
  })

  test('Should reject a missing slug', () => {
    const result = slugSchema.validate(undefined)

    expect(result.error).toBeDefined()
  })
})
