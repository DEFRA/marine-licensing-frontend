import { marinePlanPolicyDocumentTypeSchema } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-document-type/schema.js'

describe('#marinePlanPolicyDocumentTypeSchema', () => {
  test('should validate with no fields', () => {
    const { error } = marinePlanPolicyDocumentTypeSchema.validate({})
    expect(error).toBeUndefined()
  })
})
