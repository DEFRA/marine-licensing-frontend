import { buildMarinePlanPolicyDocumentsData } from '#src/server/common/helpers/marine-licence/marine-plan-policy-documents-data.js'
import {
  mockMarinePlanPolicies,
  mockMarinePlanPolicyDocument
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

const buildDocument = (document, policies = mockMarinePlanPolicies) =>
  buildMarinePlanPolicyDocumentsData({
    marinePlanPolicySupportingDocuments: { linkedDocuments: [document] },
    marinePlanPolicies: policies
  })[0]

describe('buildMarinePlanPolicyDocumentsData', () => {
  test('returns an empty array when there are no documents', () => {
    expect(buildMarinePlanPolicyDocumentsData({})).toEqual([])
    expect(buildMarinePlanPolicyDocumentsData(undefined)).toEqual([])
  })

  test('builds the filename, type, linked policies and links', () => {
    const document = buildDocument({
      ...mockMarinePlanPolicyDocument,
      documentType: 'heritage-assessment',
      policyLinks: [
        { policyCode: 'S-CC-1', location: 'Page 1' },
        { policyCode: 'S-CC-2', location: 'Page 2' }
      ]
    })

    expect(document.filename).toBe(
      mockMarinePlanPolicyDocument.uploadedFile.filename
    )
    expect(document.type).toBe('Heritage Assessment')
    expect(document.typeOther).toBe('')
    expect(document.policies).toEqual([
      { title: 'South Climate change 1 (S-CC-1)', location: 'Page 1' },
      { title: 'South Climate change 2 (S-CC-2)', location: 'Page 2' }
    ])
    expect(document.deleteHref).toContain(
      mockMarinePlanPolicyDocument.documentId
    )
    expect(document.changeTypeHref).toMatch(/\?action=change$/)
    expect(document.changePoliciesHref).toMatch(/\?action=change$/)
  })

  test('includes the description for an other document type', () => {
    const document = buildDocument({
      ...mockMarinePlanPolicyDocument,
      documentType: 'other',
      documentTypeOther: 'Survey'
    })

    expect(document.type).toBe('Other supporting evidence')
    expect(document.typeOther).toBe('Survey')
  })

  test('handles a document with no type or policies yet', () => {
    const document = buildDocument({
      ...mockMarinePlanPolicyDocument,
      documentType: undefined,
      policyLinks: undefined
    })

    expect(document.type).toBe('')
    expect(document.policies).toEqual([])
  })

  test('falls back to the policy code when the policy is not found', () => {
    const document = buildDocument({
      ...mockMarinePlanPolicyDocument,
      policyLinks: [{ policyCode: 'X-1', location: 'Page 1' }]
    })

    expect(document.policies).toEqual([{ title: 'X-1', location: 'Page 1' }])
  })
})
