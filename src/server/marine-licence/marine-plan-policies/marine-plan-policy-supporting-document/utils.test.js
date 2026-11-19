import {
  getMarinePlanPolicyDeleteSupportingDocumentUrl,
  getMarinePlanPolicyDocumentPolicyUrl,
  getMarinePlanPolicyDocumentTypeUrl
} from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-supporting-document/utils.js'

describe('#marine plan policy document urls', () => {
  test('builds the document policy url', () => {
    expect(getMarinePlanPolicyDocumentPolicyUrl('abc-123')).toBe(
      '/marine-licence/marine-plan-policy/supporting-document-policy/abc-123'
    )
  })

  test('builds the document type url', () => {
    expect(getMarinePlanPolicyDocumentTypeUrl('abc-123')).toBe(
      '/marine-licence/marine-plan-policy/supporting-document-type/abc-123'
    )
  })

  test('builds the delete supporting document url', () => {
    expect(getMarinePlanPolicyDeleteSupportingDocumentUrl('abc-123')).toBe(
      '/marine-licence/marine-plan-policy/delete-supporting-document/abc-123'
    )
  })

  test('encodes the document id', () => {
    expect(getMarinePlanPolicyDocumentPolicyUrl('a/b')).toBe(
      '/marine-licence/marine-plan-policy/supporting-document-policy/a%2Fb'
    )
  })
})
