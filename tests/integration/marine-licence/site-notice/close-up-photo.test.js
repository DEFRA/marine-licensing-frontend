import { getByRole, getByText } from '@testing-library/dom'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import { getUserSession } from '~/src/server/common/plugins/auth/utils.js'
import * as cdpUploadService from '~/src/services/cdp-upload-service/index.js'
import {
  mockApplicationTaskContactId,
  mockMarineLicenceWithApplicationTask
} from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'
import { statusCodes } from '~/src/server/common/constants/status-codes.js'
import { makeGetRequest } from '~/src/server/test-helpers/server-requests.js'

vi.mock('~/src/server/common/plugins/auth/utils.js')
vi.mock('~/src/services/cdp-upload-service/index.js')

describe('Site notice close-up photo page', () => {
  const getServer = setupTestServer()
  const requestUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_CLOSE_UP_PHOTO}/${mockMarineLicenceWithApplicationTask.id}?location=1`
  const displayUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${mockMarineLicenceWithApplicationTask.id}`

  beforeEach(() => {
    mockMarineLicence(mockMarineLicenceWithApplicationTask)
    vi.mocked(getUserSession).mockResolvedValue({
      contactId: mockApplicationTaskContactId
    })
    vi.mocked(cdpUploadService.getCdpUploadService).mockReturnValue({
      initiate: vi.fn().mockResolvedValue({
        uploadId: 'test-upload-id',
        statusUrl: 'test-status-url',
        uploadUrl: 'https://cdp/upload'
      })
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

    expect(getByText(document, 'Test Project')).toBeInTheDocument()
    expect(getByText(document, 'Location 1')).toBeInTheDocument()

    expect(
      getByText(document, /all the text on the notice can be read/)
    ).toBeInTheDocument()

    expect(
      getByRole(document, 'button', { name: 'Continue' })
    ).toBeInTheDocument()

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      displayUrl
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
      url: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_CLOSE_UP_PHOTO}/${mockMarineLicenceWithApplicationTask.id}?location=99`,
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.redirect)
  })

  test('redirects to the site notice page when the upload cannot be started', async () => {
    vi.mocked(cdpUploadService.getCdpUploadService).mockReturnValue({
      initiate: vi.fn().mockRejectedValue(new Error('CDP down'))
    })

    const { statusCode } = await makeGetRequest({
      url: requestUrl,
      server: getServer()
    })

    expect(statusCode).toBe(statusCodes.redirect)
  })
})
