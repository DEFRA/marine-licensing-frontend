import { consultationResponseSchema } from '#src/server/marine-licence/consultation-response/schema.js'

describe('#consultationResponseSchema', () => {
  test('should validate when a response is present', () => {
    const { error } = consultationResponseSchema.validate({
      consultationResponse: 'No objections'
    })
    expect(error).toBeUndefined()
  })

  test('should validate when the response is exactly 1000 characters', () => {
    const { error } = consultationResponseSchema.validate({
      consultationResponse: 'a'.repeat(1000)
    })
    expect(error).toBeUndefined()
  })

  test('should trim the response', () => {
    const { value } = consultationResponseSchema.validate({
      consultationResponse: '  No objections  '
    })
    expect(value.consultationResponse).toBe('No objections')
  })

  test.each([
    ['empty', { consultationResponse: '' }],
    ['whitespace only', { consultationResponse: '   ' }],
    ['missing', {}]
  ])(
    'should fail with CONSULTATION_RESPONSE_REQUIRED when response is %s',
    (_, payload) => {
      const { error } = consultationResponseSchema.validate(payload)
      expect(error.details[0].message).toBe('CONSULTATION_RESPONSE_REQUIRED')
    }
  )

  test('should fail with CONSULTATION_RESPONSE_MAX_LENGTH when response is over 1000 characters', () => {
    const { error } = consultationResponseSchema.validate({
      consultationResponse: 'a'.repeat(1001)
    })
    expect(error.details[0].message).toBe('CONSULTATION_RESPONSE_MAX_LENGTH')
  })
})
