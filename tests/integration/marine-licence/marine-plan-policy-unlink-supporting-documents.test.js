import { vi } from 'vitest'
import { getByRole } from '@testing-library/dom'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { authenticatedPatchRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '~/src/server/common/constants/routes.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  clearPendingUnlink,
  getPendingUnlink,
  setPendingUnlink
} from '~/src/server/marine-licence/marine-plan-policies/marine-plan-policy-unlink-supporting-documents/pending-unlink.js'

vi.mock(
  '~/src/server/marine-licence/marine-plan-policies/marine-plan-policy-unlink-supporting-documents/pending-unlink.js'
)

const policyCode = 'S-CC-1'
const pendingUnlink = {
  body: {
    id: mockMarineLicenceApplication.id,
    policyCode,
    response: 'My considered answer',
    requiresDocumentation: false
  },
  filenames: ['Assessment report v2.pdf', 'Technical appendix A.pdf']
}

const policyUrl = marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY.replace(
  '{policyCode}',
  policyCode
)

const unlinkUrl = (code = policyCode) =>
  marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_UNLINK_SUPPORTING_DOCUMENTS.replace(
    '{policyCode}',
    code
  )

describe('Marine plan policy unlink supporting documents page', () => {
  const getServer = setupTestServer()

  const loadUnlinkPage = () =>
    loadPage({ requestUrl: unlinkUrl(), server: getServer() })

  const submitUnlinkForm = () =>
    submitForm({ requestUrl: unlinkUrl(), server: getServer() })

  beforeEach(() => {
    mockMarineLicence(mockMarineLicenceApplication)
    vi.mocked(getPendingUnlink).mockReturnValue(pendingUnlink)
  })

  test('shows the confirmation page with the correct heading and navigation', async () => {
    const document = await loadUnlinkPage()

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Your consideration no longer refers to a document'
    )
    expect(document.querySelector('.govuk-caption-l')).toHaveTextContent(
      mockMarineLicenceApplication.projectName
    )
    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY.replace(
        '{policyCode}',
        policyCode
      )
    )
    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY.replace(
        '{policyCode}',
        policyCode
      )
    )
    expect(document.querySelector('main .govuk-body')).toHaveTextContent(
      'Documents that only support South Climate change 1 (S-CC-1) will be deleted.'
    )
    const insetItems = [
      ...document.querySelectorAll('.govuk-inset-text li')
    ].map((item) => item.textContent.trim())
    expect(insetItems).toEqual(pendingUnlink.filenames)
    const button = getByRole(document, 'button', {
      name: 'Continue and delete'
    })
    expect(button).toBeInTheDocument()
    expect(button.classList.contains('govuk-button--warning')).toBe(true)
  })

  test('redirects back to the policy page when nothing is pending', async () => {
    vi.mocked(getPendingUnlink).mockReturnValue(null)

    const response = await makeGetRequest({
      url: unlinkUrl(),
      server: getServer()
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(policyUrl)
  })

  test.each([
    [
      'the policy is not in the licence',
      'UNKNOWN-1',
      mockMarineLicenceApplication
    ],
    [
      'the licence has no marine plan policies',
      policyCode,
      { id: mockMarineLicenceApplication.id }
    ]
  ])('returns 404 when %s', async (_, code, licence) => {
    mockMarineLicence(licence)

    const response = await makeGetRequest({
      url: unlinkUrl(code),
      server: getServer()
    })

    expect(response.statusCode).toBe(statusCodes.notFound)
  })

  test('deletes the documents and redirects to the marine plan policies page', async () => {
    const { response } = await submitUnlinkForm()

    expect(clearPendingUnlink).toHaveBeenCalled()

    expect(authenticatedPatchRequest).toHaveBeenCalledWith(
      expect.any(Object),
      apiRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_RESPONSE,
      { ...pendingUnlink.body, confirmDocumentDeletion: true }
    )
    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
    )
  })

  test('redirects back to the policy page without saving when nothing is pending', async () => {
    vi.mocked(getPendingUnlink).mockReturnValue(null)

    const { response } = await submitUnlinkForm()

    expect(clearPendingUnlink).toHaveBeenCalled()
    expect(authenticatedPatchRequest).not.toHaveBeenCalled()
    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(policyUrl)
  })
})

describe('Marine plan policy page navigating to the unlink page', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    mockMarineLicence(mockMarineLicenceApplication)
  })

  test('clears any pending unlink when the policy page loads', async () => {
    await loadPage({ requestUrl: policyUrl, server: getServer() })

    expect(clearPendingUnlink).toHaveBeenCalled()
  })

  test('stores the payload and redirects to the unlink page when the backend needs confirmation', async () => {
    vi.mocked(authenticatedPatchRequest).mockResolvedValue({
      payload: {
        message: 'success',
        value: {
          confirmationRequired: true,
          orphanedDocuments: [{ documentId: 'doc-1', filename: 'a.pdf' }]
        }
      }
    })
    const policyConsideration = 'a'.repeat(70)

    const { response } = await submitForm({
      requestUrl: policyUrl,
      server: getServer(),
      formData: { policyConsideration }
    })

    expect(setPendingUnlink).toHaveBeenCalledWith(expect.any(Object), {
      body: {
        id: mockMarineLicenceApplication.id,
        policyCode,
        response: policyConsideration,
        requiresDocumentation: false
      },
      filenames: ['a.pdf']
    })
    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(unlinkUrl())
  })
})
