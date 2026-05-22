import { publicConsultationSchema } from '#src/server/common/validation/public-consultation/schema.js'

describe('#publicConsultationSchema', () => {
  test('should validate when consulted is no', () => {
    const { error } = publicConsultationSchema.validate({ consulted: 'no' })
    expect(error).toBeUndefined()
  })

  test('should validate when consulted is yes with details', () => {
    const { error } = publicConsultationSchema.validate({
      consulted: 'yes',
      details: 'We spoke to the local fishing association.'
    })
    expect(error).toBeUndefined()
  })

  test('should fail on empty payload', () => {
    const { error } = publicConsultationSchema.validate({})
    expect(error.message).toBe('PUBLIC_CONSULTATION_REQUIRED')
  })

  test('should fail on invalid consulted value', () => {
    const { error } = publicConsultationSchema.validate({ consulted: 'maybe' })
    expect(error.message).toBe('PUBLIC_CONSULTATION_REQUIRED')
  })

  test('should fail when consulted is yes but details is empty', () => {
    const { error } = publicConsultationSchema.validate({
      consulted: 'yes',
      details: ''
    })
    expect(error.message).toBe('PUBLIC_CONSULTATION_DETAILS_REQUIRED')
  })

  test('should fail when details exceeds 1000 characters', () => {
    const { error } = publicConsultationSchema.validate({
      consulted: 'yes',
      details: 'a'.repeat(1001)
    })
    expect(error.message).toBe('PUBLIC_CONSULTATION_DETAILS_MAX_LENGTH')
  })
})
