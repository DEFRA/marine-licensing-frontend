import { getByRole } from '@testing-library/dom'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { authenticatedPatchRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '~/src/server/common/constants/routes.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'

const policyCode = 'ABC-123'
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
    const button = getByRole(document, 'button', {
      name: 'Continue and delete'
    })
    expect(button).toBeInTheDocument()
    expect(button.classList.contains('govuk-button--warning')).toBe(true)
  })

  test('unlinks the supporting document and redirects to the marine plan policies page', async () => {
    const { response } = await submitUnlinkForm()

    expect(authenticatedPatchRequest).toHaveBeenCalledWith(
      expect.any(Object),
      apiRoutes.MARINE_LICENCE_MARINE_PLAN_POLICY_RESPONSE,
      {
        id: mockMarineLicenceApplication.id,
        policyCode,
        requiresDocumentation: false
      }
    )
    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(
      marineLicenceRoutes.MARINE_LICENCE_MARINE_PLAN_POLICIES
    )
  })
})
