import { createDocumentCards } from '#src/server/marine-licence/marine-plan-policies/marine-plan-policy-documents-review/utils.js'
import {
  mockMarinePlanPolicies,
  mockMarinePlanPolicyDocument
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'

const buildCard = (document) =>
  createDocumentCards(
    { linkedDocuments: [document] },
    mockMarinePlanPolicies
  )[0]

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
    expect(card.rows[0].actions.items[0].text).toBe('Change')
    expect(card.rows[1].actions.items[0].text).toBe('Change')
  })

  test('handles a document with no type or policies yet', () => {
    const card = buildCard(mockMarinePlanPolicyDocument)

    expect(card.rows[0].value.html).toBe('')
    expect(card.rows[1].value.html).toBe('')
  })

  test('falls back to the policy code when the policy is not found', () => {
    const card = buildCard({
      ...mockMarinePlanPolicyDocument,
      policyLinks: [{ policyCode: 'X-<b>-1', location: 'Page 1' }]
    })

    expect(card.rows[1].value.html).toContain('<li>X-&lt;b&gt;-1 - Page 1</li>')
  })

  test('escapes text correctly', () => {
    const card = createDocumentCards(
      {
        linkedDocuments: [
          {
            ...mockMarinePlanPolicyDocument,
            policyLinks: [{ policyCode: 'S-CC-1', location: 'Page 1' }]
          }
        ]
      },
      [{ policyCode: 'S-CC-1', title: '<b>Climate</b>' }]
    )[0]

    expect(card.rows[1].value.html).toContain(
      '<li>&lt;b&gt;Climate&lt;/b&gt; (S-CC-1) - Page 1</li>'
    )
  })
})
