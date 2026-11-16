import { getByRole } from '@testing-library/dom'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { authenticatedPatchRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import { validateErrors } from '~/tests/integration/shared/expect-utils.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '~/src/server/common/constants/routes.js'
import { errorMessages } from '~/src/server/marine-licence/marine-plan-policies/marine-plan-policy-document-type/controller.js'
import {
  MPP_DOCUMENT_TYPE_OTHER_MAX_LENGTH,
  MPP_DOCUMENT_TYPES
} from '~/src/server/marine-licence/marine-plan-policies/marine-plan-policy-document-type/constants.js'
import {
  mockMarineLicenceApplication,
  mockMarinePlanPolicyDocument
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'

const { documentId } = mockMarinePlanPolicyDocument
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
      documents: [document]
    }
  })

describe('Marine plan policy document type page', () => {
  const getServer = setupTestServer()

  const loadDocumentTypePage = () =>
    loadPage({ requestUrl: documentTypeUrl(), server: getServer() })

  const submitDocumentTypeForm = (formData) =>
    submitForm({
      requestUrl: documentTypeUrl(),
      server: getServer(),
      formData
    })

  beforeEach(() => {
    mockLicenceWithDocument()
  })

  test('lists every document type with an "other" text field', async () => {
    const document = await loadDocumentTypePage()

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'What type of document is this?'
    )
    const radios = [...document.querySelectorAll('input[name="documentType"]')]
    expect(radios.map((radio) => radio.value)).toEqual(
      Object.keys(MPP_DOCUMENT_TYPES)
    )
    Object.values(MPP_DOCUMENT_TYPES).forEach((label) => {
      expect(getByRole(document, 'radio', { name: label })).toBeInTheDocument()
    })
    expect(document.getElementById('documentTypeOther')).not.toBeNull()
    expect(document.querySelector('input:checked')).toBeNull()
  })

  test('selects the saved document type', async () => {
    mockLicenceWithDocument({
      ...mockMarinePlanPolicyDocument,
      documentType: 'heritage-assessment'
    })

    const document = await loadDocumentTypePage()

    expect(
      getByRole(document, 'radio', { name: 'Heritage Assessment' })
    ).toBeChecked()
  })

  test('selects "other" and shows the saved description', async () => {
    mockLicenceWithDocument({
      ...mockMarinePlanPolicyDocument,
      documentType: 'other',
      documentTypeOther: 'Habitat survey'
    })

    const document = await loadDocumentTypePage()

    expect(
      getByRole(document, 'radio', { name: 'Other supporting evidence' })
    ).toBeChecked()
    expect(document.getElementById('documentTypeOther')).toHaveValue(
      'Habitat survey'
    )
  })

  test('returns 404 when the document is not on the marine licence', async () => {
    const { statusCode } = await makeGetRequest({
      url: documentTypeUrl('00000000-0000-4000-8000-000000000000'),
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.notFound)
  })

  test('returns 404 when there is no marine licence in the session', async () => {
    mockMarineLicence({})

    const { statusCode } = await makeGetRequest({
      url: documentTypeUrl(),
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.notFound)
  })

  test('returns 400 when the documentId is not a uuid', async () => {
    const { statusCode } = await makeGetRequest({
      url: documentTypeUrl('not-a-uuid'),
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.badRequest)
  })

  test('saves the document type and returns to the marine plan policies page', async () => {
    const { response } = await submitDocumentTypeForm({
      documentType: 'fisheries-assessment',
      documentTypeOther: 'ignored'
    })

    const expectedUrl =
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_POLICY.replace(
        '{documentId}',
        documentId
      )

    expect(authenticatedPatchRequest).toHaveBeenCalledWith(
      expect.any(Object),
      apiRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_TYPE,
      {
        id: mockMarineLicenceApplication.id,
        documentId,
        documentType: 'fisheries-assessment',
        documentTypeOther: undefined
      }
    )
    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(expectedUrl)
  })

  test('saves "other" with its description', async () => {
    await submitDocumentTypeForm({
      documentType: 'other',
      documentTypeOther: '  Habitat survey  '
    })

    expect(authenticatedPatchRequest).toHaveBeenCalledWith(
      expect.any(Object),
      apiRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_DOCUMENT_TYPE,
      expect.objectContaining({
        documentType: 'other',
        documentTypeOther: 'Habitat survey'
      })
    )
  })

  test.each([
    [{}, 'documentType', errorMessages.DOCUMENT_TYPE_REQUIRED],
    [
      { documentType: 'not-a-type' },
      'documentType',
      errorMessages.DOCUMENT_TYPE_REQUIRED
    ],
    [
      { documentType: 'other', documentTypeOther: ' ' },
      'documentTypeOther',
      errorMessages.DOCUMENT_TYPE_OTHER_REQUIRED
    ],
    [
      {
        documentType: 'other',
        documentTypeOther: 'a'.repeat(MPP_DOCUMENT_TYPE_OTHER_MAX_LENGTH + 1)
      },
      'documentTypeOther',
      errorMessages.DOCUMENT_TYPE_OTHER_MAX_LENGTH
    ]
  ])('shows an error for %o', async (formData, field, message) => {
    const { response, document } = await submitDocumentTypeForm(formData)

    expect(response.statusCode).toBe(statusCodes.ok)
    expect(authenticatedPatchRequest).not.toHaveBeenCalled()
    validateErrors([{ field, message }], document)
  })
})
