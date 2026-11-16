import {
  marinePlanPolicyDocumentPolicyParamsSchema,
  marinePlanPolicyDocumentPolicySchema
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-document-policy/schema.js'

describe('#marinePlanPolicyDocumentPolicySchema', () => {
  test('accepts an array of policy values', () => {
    const { error } = marinePlanPolicyDocumentPolicySchema.validate({
      supportedPolicies: ['1', '2']
    })
    expect(error).toBeUndefined()
  })

  test.each([{}, { supportedPolicies: [] }])(
    'requires at least one policy (%j)',
    (payload) => {
      const { error } = marinePlanPolicyDocumentPolicySchema.validate(payload)
      expect(error.details[0]).toEqual(
        expect.objectContaining({
          path: ['supportedPolicies'],
          message: 'POLICY_LINKS_REQUIRED'
        })
      )
    }
  )

  test('accepts a single selected policy as a string', () => {
    const { error, value } = marinePlanPolicyDocumentPolicySchema.validate({
      supportedPolicies: 'S-CC-1',
      'location-S-CC-1': ' section 4.2 '
    })
    expect(error).toBeUndefined()
    expect(value['location-S-CC-1']).toBe('section 4.2')
  })

  test('ignores an empty location for an unselected policy', () => {
    const { error } = marinePlanPolicyDocumentPolicySchema.validate({
      supportedPolicies: ['S-CC-1'],
      'location-S-CC-1': 'pages 12 to 15',
      'location-S-CC-2': ''
    })
    expect(error).toBeUndefined()
  })

  test.each(['', '   '])(
    'requires a location for a selected policy (%j)',
    (location) => {
      const { error } = marinePlanPolicyDocumentPolicySchema.validate({
        supportedPolicies: ['S-CC-1'],
        'location-S-CC-1': location
      })
      expect(error.details[0]).toEqual(
        expect.objectContaining({
          path: ['location-S-CC-1'],
          message: 'DOCUMENT_LOCATION_REQUIRED'
        })
      )
    }
  )

  test('rejects a location over 70 characters', () => {
    const { error } = marinePlanPolicyDocumentPolicySchema.validate({
      supportedPolicies: ['S-CC-1'],
      'location-S-CC-1': 'a'.repeat(71)
    })
    expect(error.details[0]).toEqual(
      expect.objectContaining({
        path: ['location-S-CC-1'],
        message: 'DOCUMENT_LOCATION_MAX_LENGTH'
      })
    )
  })

  test('rejects non-string items', () => {
    const { error } = marinePlanPolicyDocumentPolicySchema.validate({
      supportedPolicies: [1, 2]
    })
    expect(error).toBeDefined()
  })
})

describe('#marinePlanPolicyDocumentPolicyParamsSchema', () => {
  test('accepts a uuid documentId', () => {
    const { error } = marinePlanPolicyDocumentPolicyParamsSchema.validate({
      documentId: 'c7e4ef70-7c7d-4464-8401-7bf4e6f47351'
    })
    expect(error).toBeUndefined()
  })

  test.each([undefined, 'undefined', 'not-a-uuid'])(
    'rejects documentId %s',
    (documentId) => {
      const { error } = marinePlanPolicyDocumentPolicyParamsSchema.validate({
        documentId
      })
      expect(error).toBeDefined()
    }
  )
})
