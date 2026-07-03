import { feeEstimateSchema } from '#src/server/common/validation/fee-estimate/schema.js'
import { feeEstimateErrorMessages } from '#src/server/common/validation/fee-estimate/constants.js'

describe('#feeEstimateSchema', () => {
  const validPayload = {
    termsAndConditions: 'true',
    accept: 'yes',
    feeBand: '2A'
  }

  test('should validate a valid payload', () => {
    const { error } = feeEstimateSchema.validate(validPayload)

    expect(error).toBeUndefined()
  })

  test('should validate when accept is no', () => {
    const { error } = feeEstimateSchema.validate({
      ...validPayload,
      accept: 'no'
    })

    expect(error).toBeUndefined()
  })

  test('should fail on empty payload', () => {
    const { error } = feeEstimateSchema.validate({})

    expect(error.details.length).toBeGreaterThan(0)
  })

  test('should fail when termsAndConditions is missing', () => {
    const { error } = feeEstimateSchema.validate({
      ...validPayload,
      termsAndConditions: undefined
    })

    expect(error.message).toBe(
      feeEstimateErrorMessages.FEE_ESTIMATE_TERMS_AND_CONDITIONS_REQUIRED
    )
  })

  test('should fail when termsAndConditions is not true', () => {
    const { error } = feeEstimateSchema.validate({
      ...validPayload,
      termsAndConditions: 'false'
    })

    expect(error.message).toBe(
      feeEstimateErrorMessages.FEE_ESTIMATE_TERMS_AND_CONDITIONS_REQUIRED
    )
  })

  test('should fail when accept is missing', () => {
    const { error } = feeEstimateSchema.validate({
      ...validPayload,
      accept: undefined
    })

    expect(error.message).toBe(
      feeEstimateErrorMessages.FEE_ESTIMATE_ACCEPT_REQUIRED
    )
  })

  test('should fail when accept is an invalid value', () => {
    const { error } = feeEstimateSchema.validate({
      ...validPayload,
      accept: 'maybe'
    })

    expect(error.message).toBe(
      feeEstimateErrorMessages.FEE_ESTIMATE_ACCEPT_REQUIRED
    )
  })

  test('should fail when feeBand is missing', () => {
    const { error } = feeEstimateSchema.validate({
      ...validPayload,
      feeBand: undefined
    })

    expect(error.details[0].type).toBe('any.required')
  })

  test('should fail when feeBand is an invalid value', () => {
    const { error } = feeEstimateSchema.validate({
      ...validPayload,
      feeBand: '3B'
    })

    expect(error.details[0].type).toBe('any.only')
  })
})
