import { createDocumentCards } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-documents-review/utils.js'
import {
  mockMarinePlanPolicies,
  mockMarinePlanPolicyDocument
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

const buildCard = (document) =>
  createDocumentCards({ documents: [document] }, mockMarinePlanPolicies)[0]

describe('createDocumentCards', () => {
  test('builds a card with the type and a list of linked policies', () => {
    const card = buildCard({
      ...mockMarinePlanPolicyDocument,
      documentType: 'heritage-assessment',
      policyLinks: [
        { policyCode: 'S-CC-1', location: 'Page 1' },
        { policyCode: 'S-CC-2', location: 'Page 2' }
      ]
    })

    expect(card.title).toBe(mockMarinePlanPolicyDocument.uploadedFile.filename)
    expect(card.rows[0].value.html).toBe('Heritage Assessment')
    expect(card.rows[1].value.html).toContain(
      '<li>South Climate change 1 (S-CC-1) - Page 1</li><li>South Climate change 2 (S-CC-2) - Page 2</li>'
    )
  })

  test('handles a document with no type or policies yet', () => {
    const card = buildCard(mockMarinePlanPolicyDocument)

    expect(card.rows[0].value.html).toBe('')
    expect(card.rows[1].value.html).not.toContain('<li>')
  })

  test('adds the escaped "other" description on a new line', () => {
    const card = buildCard({
      ...mockMarinePlanPolicyDocument,
      documentType: 'other',
      documentTypeOther: '<b>Test survey</b>',
      policyLinks: []
    })

    expect(card.rows[0].value.html).toBe(
      'Other supporting evidence<br>&lt;b&gt;Test survey&lt;/b&gt;'
    )
  })
})
