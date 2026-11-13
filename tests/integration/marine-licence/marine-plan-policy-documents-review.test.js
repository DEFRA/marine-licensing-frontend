import { getByRole } from '@testing-library/dom'
import { JSDOM } from 'jsdom'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicenceApplication,
  mockMarinePlanPolicies,
  mockMarinePlanPolicyDocument,
  mockMarinePlanPolicySupportingDocuments
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'

const documentPolicyUrl =
  marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_POLICY.replace(
    '{documentId}',
    mockMarinePlanPolicyDocument.documentId
  )

describe('Marine plan policy documents review page', () => {
  const getServer = setupTestServer()

  const loadDocumentsReviewPage = async (headers) => {
    const response = await makeGetRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENTS_REVIEW,
      server: getServer(),
      headers
    })
    return new JSDOM(response.result).window.document
  }

  beforeEach(() => {
    mockMarineLicence({
      ...mockMarineLicenceApplication,
      marinePlanPolicySupportingDocuments: {
        ...mockMarinePlanPolicySupportingDocuments,
        documents: [
          {
            ...mockMarinePlanPolicyDocument,
            documentType: 'ecological-assessment',
            policyLinks: mockMarinePlanPolicies.map(({ policyCode }) => ({
              policyCode,
              location: 'Section 2'
            }))
          }
        ]
      }
    })
  })

  test('shows a summary card for each document', async () => {
    const document = await loadDocumentsReviewPage()
    const card = document.querySelector('.govuk-summary-card')
    const [type, policies] = card.querySelectorAll('.govuk-summary-list__value')

    expect(card.querySelector('.govuk-summary-card__title')).toHaveTextContent(
      mockMarinePlanPolicyDocument.uploadedFile.filename
    )
    expect(type).toHaveTextContent('Ecological Assessment')
    expect(
      [...policies.querySelectorAll('li')].map((li) => li.textContent)
    ).toEqual([
      'South Climate change 2 (S-CC-2) - Section 2',
      'South Climate change 1 (S-CC-1) - Section 2'
    ])
  })

  test('shows the expected page content', async () => {
    const document = await loadDocumentsReviewPage({
      referer: `http://localhost${documentPolicyUrl}`
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Supporting documents'
    )
    expect(document.querySelector('.govuk-caption-l')).toHaveTextContent(
      mockMarineLicenceApplication.projectName
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      documentPolicyUrl
    )
    expect(getByRole(document, 'button', { name: 'Continue' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
    )
  })

  test('back link goes to the marine plan policies page when there is no previous page', async () => {
    const document = await loadDocumentsReviewPage()

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
    )
  })

  test('returns 404 when there is no marine licence in the session', async () => {
    mockMarineLicence({})

    const { statusCode } = await makeGetRequest({
      url: marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENTS_REVIEW,
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.notFound)
  })
})
