import { getByRole, within } from '@testing-library/dom'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '~/src/server/common/constants/routes.js'
import { authenticatedPatchRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import {
  mockMarineLicenceApplication,
  mockMarinePlanPolicies,
  mockMarinePlanPolicyDocument
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'

const { documentId } = mockMarinePlanPolicyDocument
const policyLabel = (code) => {
  const { title, policyCode } = mockMarinePlanPolicies.find(
    (policy) => policy.policyCode === code
  )
  return `${title} (${policyCode})`
}
const documentPolicyUrl = (id = documentId) =>
  marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_POLICY.replace(
    '{documentId}',
    id
  )
const documentTypeUrl = (id = documentId) =>
  marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_TYPE.replace(
    '{documentId}',
    id
  )

const mockLicenceWithDocument = (document = mockMarinePlanPolicyDocument) =>
  mockMarineLicence({
    ...mockMarineLicenceApplication,
    marinePlanPolicySupportingDocuments: {
      ...mockMarineLicenceApplication.marinePlanPolicySupportingDocuments,
      documents: [document],
      requiringDocuments: ['S-CC-1', 'S-CC-2']
    }
  })

describe('Marine plan policy document policy page', () => {
  const getServer = setupTestServer()

  const loadDocumentPolicyPage = () =>
    loadPage({ requestUrl: documentPolicyUrl(), server: getServer() })

  const submitDocumentPolicyForm = (formData) =>
    submitForm({
      requestUrl: documentPolicyUrl(),
      server: getServer(),
      formData
    })

  beforeEach(() => {
    mockLicenceWithDocument()
  })

  const expectFieldError = (document, field, message) => {
    const summary = getByRole(document, 'alert')
    expect(
      within(summary).getByRole('link', { name: message })
    ).toHaveAttribute('href', `#${field}`)
    expect(document.querySelector(`#${field}-error`)).toHaveTextContent(message)
  }

  test('shows the heading, policies requiring documents, and the back, cancel and save links', async () => {
    const document = await loadDocumentPolicyPage()

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Which policies does this document support?'
    )
    expect(document.querySelector('.govuk-inset-text')).toHaveTextContent(
      mockMarinePlanPolicyDocument.uploadedFile.filename
    )
    expect(document.querySelector('#supportedPolicies-hint')).toHaveTextContent(
      'Select every policy this document supports. For each one, tell us where in the document the relevant information is.'
    )

    expect(
      getByRole(document, 'checkbox', {
        name: policyLabel('S-CC-1')
      })
    ).toBeInTheDocument()

    expect(
      getByRole(document, 'checkbox', {
        name: policyLabel('S-CC-2')
      })
    ).toBeInTheDocument()
    expect(document.querySelector('input:checked')).toBeNull()
    expect(
      getByRole(document, 'button', { name: 'Save and continue' })
    ).toHaveTextContent('Save and continue')
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      documentTypeUrl()
    )
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
    )
  })

  test('pre-selects saved policy links with their locations', async () => {
    mockLicenceWithDocument({
      ...mockMarinePlanPolicyDocument,
      policyLinks: [{ policyCode: 'S-CC-2', location: 'section 4.2' }]
    })

    const document = await loadDocumentPolicyPage()

    expect(
      getByRole(document, 'checkbox', { name: policyLabel('S-CC-2') })
    ).toBeChecked()
    expect(
      getByRole(document, 'checkbox', { name: policyLabel('S-CC-1') })
    ).not.toBeChecked()
    expect(document.querySelector('#location-S-CC-2')).toHaveValue(
      'section 4.2'
    )
  })

  test('shows a location field with hint for each policy', async () => {
    const document = await loadDocumentPolicyPage()

    for (const code of ['S-CC-1', 'S-CC-2']) {
      const input = document.querySelector(`#location-${code}`)
      expect(input).toHaveAttribute('name', `location-${code}`)
      expect(
        document.querySelector(`label[for="location-${code}"]`)
      ).toHaveTextContent('Where is the information in this document?')
      expect(
        document.querySelector(`#location-${code}-hint`)
      ).toHaveTextContent('For example, section 4.2 or pages 12 to 15')
    }
  })

  test('saves the selected policy links and redirects on success', async () => {
    const { response } = await submitDocumentPolicyForm({
      supportedPolicies: ['S-CC-1'],
      'location-S-CC-1': ' section 4.2 ',
      'location-S-CC-2': ''
    })

    expect(authenticatedPatchRequest).toHaveBeenCalledWith(
      expect.any(Object),
      apiRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_LINKS,
      {
        id: mockMarineLicenceApplication.id,
        documentId,
        policyLinks: [{ policyCode: 'S-CC-1', location: 'section 4.2' }]
      }
    )
    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(documentPolicyUrl())
  })

  test('shows an error when no policies are selected', async () => {
    const { response, document } = await submitDocumentPolicyForm({
      'location-S-CC-1': '',
      'location-S-CC-2': ''
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    expect(authenticatedPatchRequest).not.toHaveBeenCalled()
    expectFieldError(
      document,
      'supportedPolicies',
      'Select the policies this document supports'
    )
    const errorGroup = document.querySelector('.govuk-form-group--error')
    expect(errorGroup.querySelector('h1')).toBeInTheDocument()
    expect(errorGroup.querySelector('.govuk-inset-text')).toBeInTheDocument()
  })

  test('shows an error when a selected policy has no location', async () => {
    const { response, document } = await submitDocumentPolicyForm({
      supportedPolicies: 'S-CC-1',
      'location-S-CC-1': '  ',
      'location-S-CC-2': ''
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    expectFieldError(
      document,
      'location-S-CC-1',
      'Enter where the information is in this document'
    )
    expect(document.querySelector('#location-S-CC-2-error')).toBeNull()
    expect(
      getByRole(document, 'checkbox', {
        name: policyLabel('S-CC-1')
      })
    ).toBeChecked()
  })

  test('shows an error when a location is over 70 characters', async () => {
    const tooLong = 'a'.repeat(71)
    const { response, document } = await submitDocumentPolicyForm({
      supportedPolicies: ['S-CC-1'],
      'location-S-CC-1': tooLong
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    expectFieldError(
      document,
      'location-S-CC-1',
      'The location of the information in the document must be 70 characters or fewer'
    )
    expect(document.querySelector('#location-S-CC-1')).toHaveValue(tooLong)
  })

  test('returns 404 when the document is not on the marine licence', async () => {
    const { statusCode } = await makeGetRequest({
      url: documentPolicyUrl('00000000-0000-4000-8000-000000000000'),
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.notFound)
  })

  test('returns 404 when there is no marine licence in the session', async () => {
    mockMarineLicence({})

    const { statusCode } = await makeGetRequest({
      url: documentPolicyUrl(),
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.notFound)
  })

  test('returns 400 when the documentId is not a uuid', async () => {
    const { statusCode } = await makeGetRequest({
      url: documentPolicyUrl('not-a-uuid'),
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.badRequest)
  })
})
