import { getByRole } from '@testing-library/dom'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { authenticatedPatchRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicenceApplication,
  mockMarinePlanPolicyDocument,
  mockMarinePlanPolicies
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'

const { documentId } = mockMarinePlanPolicyDocument
const deleteUrl = (id = documentId) =>
  marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DELETE_SUPPORTING_DOCUMENT.replace(
    '{documentId}',
    id
  )

const mockLicenceWithDocument = (otherDocuments = []) =>
  mockMarineLicence({
    ...mockMarineLicenceApplication,
    marinePlanPolicySupportingDocuments: {
      ...mockMarineLicenceApplication.marinePlanPolicySupportingDocuments,
      documents: [
        {
          ...mockMarinePlanPolicyDocument,
          policyLinks: mockMarinePlanPolicies.map(({ policyCode }) => ({
            policyCode,
            location: 'Section 2'
          }))
        },
        ...otherDocuments
      ]
    }
  })

describe('Marine plan policy delete supporting document page', () => {
  const getServer = setupTestServer()

  const loadDeletePage = () =>
    loadPage({ requestUrl: deleteUrl(), server: getServer() })

  const submitDeleteForm = () =>
    submitForm({ requestUrl: deleteUrl(), server: getServer() })

  beforeEach(() => {
    mockLicenceWithDocument()
  })

  test('shows the confirmation page with the document name and navigation', async () => {
    const document = await loadDeletePage()

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Are you sure you want to delete this document?'
    )
    expect(document.querySelector('.govuk-caption-l')).toHaveTextContent(
      mockMarineLicenceApplication.projectName
    )
    expect(document.querySelector('.govuk-inset-text')).toHaveTextContent(
      mockMarinePlanPolicyDocument.uploadedFile.filename
    )
    expect(document.querySelector('main p')).toHaveTextContent(
      `It will no longer support ${mockMarinePlanPolicies
        .map(({ policyCode }) => policyCode)
        .join(' and ')}`
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENTS_REVIEW
    )
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENTS_REVIEW
    )
    expect(
      getByRole(document, 'button', { name: 'Yes, delete document' })
    ).toBeInTheDocument()
  })

  test('returns 404 when the document is not attached to the marine licence', async () => {
    const { statusCode } = await makeGetRequest({
      url: deleteUrl('00000000-0000-4000-8000-000000000000'),
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.notFound)
  })

  test('returns 404 when there is no marine licence in the session', async () => {
    mockMarineLicence({})

    const { statusCode } = await makeGetRequest({
      url: deleteUrl(),
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.notFound)
  })

  test('deletes the last document and returns to the marine plan policies page', async () => {
    const { response } = await submitDeleteForm()

    expect(authenticatedPatchRequest).toHaveBeenCalledWith(
      expect.any(Object),
      apiRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DELETE_DOCUMENT,
      {
        id: mockMarineLicenceApplication.id,
        documentId
      }
    )
    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
    )
  })

  test('returns to the review page when other documents remain', async () => {
    mockLicenceWithDocument([
      {
        ...mockMarinePlanPolicyDocument,
        documentId: '00000000-0000-4000-8000-000000000001'
      }
    ])

    const { response } = await submitDeleteForm()

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENTS_REVIEW
    )
  })
})
