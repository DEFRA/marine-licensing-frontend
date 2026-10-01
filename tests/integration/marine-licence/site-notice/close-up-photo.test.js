import { getByRole, getByText } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage, submitForm } from '~/tests/integration/shared/app-server.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import {
  mockApplicationTaskContactId,
  mockMarineLicenceWithApplicationTask
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')

describe('Site notice close-up photo page', () => {
  const getServer = setupTestServer()
  const requestUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_CLOSE_UP_PHOTO}/${mockMarineLicenceWithApplicationTask.id}?evidence=1`
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
      getByRole(document, 'heading', { name: 'Close-up photo upload' })
    ).toBeInTheDocument()

    expect(
      getByText(document, 'MLA/2026/10264 - Test Project')
    ).toBeInTheDocument()

    expect(
      getByRole(document, 'button', { name: 'Save and continue' })
    ).toBeInTheDocument()

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      displayUrl
    )
  })

  test('save and continue redirects to site notice display', async () => {
    const { response } = await submitForm({
      requestUrl,
      server: getServer(),
      formData: {}
    })

    expect(response.statusCode).toBe(statusCodes.redirect)
    expect(response.headers.location).toBe(displayUrl)
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
      url: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_CLOSE_UP_PHOTO}/${mockMarineLicenceWithApplicationTask.id}?evidence=99`,
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.redirect)
  })
})
