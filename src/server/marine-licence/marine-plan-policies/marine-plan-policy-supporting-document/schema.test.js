import { marinePlanPolicySupportingDocumentSchema } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-supporting-document/schema.js'

describe('#marinePlanPolicySupportingDocumentSchema', () => {
  test('should validate with no fields', () => {
    const { error } = marinePlanPolicySupportingDocumentSchema.validate({})
    expect(error).toBeUndefined()
  })
})
