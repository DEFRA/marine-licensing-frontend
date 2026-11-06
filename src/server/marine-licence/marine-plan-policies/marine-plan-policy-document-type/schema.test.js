import {
  marinePlanPolicyDocumentTypeParamsSchema,
  marinePlanPolicyDocumentTypeSchema
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-document-type/schema.js'

describe('#marinePlanPolicyDocumentTypeSchema', () => {
  test('should validate with no fields', () => {
    const { error } = marinePlanPolicyDocumentTypeSchema.validate({})
    expect(error).toBeUndefined()
  })
})

describe('#marinePlanPolicyDocumentTypeParamsSchema', () => {
  test('accepts a uuid documentId', () => {
    const { error } = marinePlanPolicyDocumentTypeParamsSchema.validate({
      documentId: 'c7e4ef70-7c7d-4464-8401-7bf4e6f47351'
    })
    expect(error).toBeUndefined()
  })

  test.each([undefined, 'undefined', 'not-a-uuid'])(
    'rejects documentId %s',
    (documentId) => {
      const { error } = marinePlanPolicyDocumentTypeParamsSchema.validate({
        documentId
      })
      expect(error).toBeDefined()
    }
  )
})
