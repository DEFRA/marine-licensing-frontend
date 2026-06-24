import { vi } from 'vitest'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import * as cdpUploadService from '~/src/services/cdp-upload-service/index.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import {
  getByLabelText,
  getByRole,
  getByText,
  queryByRole
} from '@testing-library/dom'

vi.mock('~/src/services/cdp-upload-service/index.js')

describe('File upload page (Water Framework Directive)', () => {
  const getServer = setupTestServer()

  beforeEach(() => {
    const mockCdpService = {
      initiate: vi.fn().mockResolvedValue({
        uploadId: 'test-upload-id',
        uploadUrl: 'https://upload.example.com',
        statusUrl: 'https://status.example.com',
        maxFileSize: 50000000
      })
    }

    vi.mocked(cdpUploadService.getCdpUploadService).mockReturnValue(
      mockCdpService
    )

    mockMarineLicence(mockMarineLicenceApplication)
  })

  test('renders page content', async () => {
    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD,
      server: getServer()
    })

    const h1 = getByRole(document, 'heading', { level: 1 })
    expect(h1).toHaveTextContent(
      'Upload your Water Framework Directive assessment'
    )

    expect(
      getByText(document, 'You can only upload a file that is a .docx or .odt.')
    ).toBeInTheDocument()

    const uploadInput = getByLabelText(
      document,
      /Upload your Water Framework Directive assessment/
    )
    expect(uploadInput).toBeInTheDocument()

    const continueButton = getByRole(document, 'button', { name: 'Continue' })
    expect(continueButton).toBeInTheDocument()

    expect(getByRole(document, 'link', { name: 'Cancel' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
    )

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES
    )
  })

  test('should show review-your-answers back link and no cancel when accessed via change link', async () => {
    const document = await loadPage({
      requestUrl: `${marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD}?action=change`,
      server: getServer()
    })

    expect(getByRole(document, 'link', { name: 'Back' })).toHaveAttribute(
      'href',
      marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
    )
    expect(
      queryByRole(document, 'link', { name: 'Cancel' })
    ).not.toBeInTheDocument()
  })
})
