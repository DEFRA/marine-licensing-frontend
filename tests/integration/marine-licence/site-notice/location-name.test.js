import { getByLabelText, getByRole, getByText } from '@testing-library/dom'
import {
  apiRoutes,
  marineLicenceRoutes
} from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import {
  mockSiteNoticeEvidence,
  mockApplicationTaskContactId,
  mockMarineLicenceWithApplicationTask
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'
import { authenticatedPatchRequest } from '~/src/server/common/helpers/authenticated-requests.js'
import { validateErrors } from '~/tests/integration/shared/expect-utils.js'
import { LOCATION_NAME_MAX_LENGTH } from '~/src/server/common/validation/location-name/constants.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('Site notice location name page', () => {
  const getServer = setupTestServer()
  const requestUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_LOCATION_NAME}/${mockMarineLicenceWithApplicationTask.id}?location=1`
  const displayUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${mockMarineLicenceWithApplicationTask.id}`

  beforeEach(() => {
    mockMarineLicence(mockMarineLicenceWithApplicationTask)
    vi.mocked(getUserSession).mockResolvedValue({
      contactId: mockApplicationTaskContactId
    })
  })

  test('should display the correct content', async () => {
    const document = await loadPage({
      requestUrl,
      server: getServer()
    })

    expect(
      getByRole(document, 'heading', { name: 'Location name' })
    ).toBeInTheDocument()

    expect(getByText(document, 'Test Project')).toBeInTheDocument()
    expect(getByText(document, 'Location 1')).toBeInTheDocument()

    expect(
      getByRole(document, 'button', { name: 'Save and continue' })
    ).toBeInTheDocument()

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      displayUrl
    )
    expect(getByLabelText(document, 'Location name')).toBeInTheDocument()
    expect(document.body).toHaveTextContent(
      "Give a specific description of where you displayed this notice, so we can tell it apart from any other locations. For example, 'Tynemouth harbour, noticeboard by north pier' rather than just 'Tynemouth harbour.'"
    )

    expect(
      getByRole(document, 'textbox', {
        name: /Location name/i
      })
    ).toHaveValue(mockSiteNoticeEvidence.locationName)
  })

  test('save and continue redirects to site notice display', async () => {
    const locationName = 'Tynemouth harbour, noticeboard by north pier'
    const { response } = await submitForm({
      requestUrl,
      server: getServer(),
      formData: { locationName }
    })

    expect(authenticatedPatchRequest).toHaveBeenCalledWith(
      expect.any(Object),
      apiRoutes.UPDATE_SITE_NOTICE_EVIDENCE,
      {
        locationName,
        id: mockMarineLicenceWithApplicationTask.id,
        evidenceIndex: 0
      }
    )
    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(displayUrl)
  })

  test('shows an error when the location name is missing', async () => {
    const { response, document } = await submitForm({
      requestUrl,
      server: getServer(),
      formData: {}
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    expect(authenticatedPatchRequest).not.toHaveBeenCalled()
    validateErrors(
      [{ field: 'locationName', message: 'Enter the location name' }],
      document
    )
  })

  test('shows an error when the location name is too long', async () => {
    const { response, document } = await submitForm({
      requestUrl,
      server: getServer(),
      formData: { locationName: 'A'.repeat(LOCATION_NAME_MAX_LENGTH + 1) }
    })

    expect(response.statusCode).toBe(statusCodes.ok)
    validateErrors(
      [
        {
          field: 'locationName',
          message: 'Location name must be 250 characters or fewer'
        }
      ],
      document
    )
  })

  test('forbids anyone who did not submit the application', async () => {
    vi.mocked(getUserSession).mockResolvedValue({ contactId: 'someone-else' })

    const { statusCode } = await makeGetRequest({
      url: requestUrl,
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.forbidden)
  })

  test('redirects when the evidence number is not valid', async () => {
    const { statusCode } = await makeGetRequest({
      url: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_LOCATION_NAME}/${mockMarineLicenceWithApplicationTask.id}?location=99`,
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.redirect)
  })
})
