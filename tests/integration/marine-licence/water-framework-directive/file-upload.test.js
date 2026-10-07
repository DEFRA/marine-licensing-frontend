import { vi } from 'vitest'
import { marineLicenceRoutes } from '~/src/server/common/constants/routes.js'
import {
  mockMarineLicence,
  setupTestServer
} from '~/tests/integration/shared/test-setup-helpers.js'
import { loadPage } from '~/tests/integration/shared/app-server.js'
import * as cdpUploadService from '~/src/services/cdp-upload-service/index.js'
import {
  mockMarineLicenceApplication,
  mockSubmittedMarineLicenceApplication
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { getAuthProvider } from '~/src/server/common/helpers/authenticated-requests.js'
import { AUTH_STRATEGIES } from '~/src/server/common/constants/auth.js'
import { toApplicationReferenceUrlSegment } from '~/src/server/common/helpers/marine-licence/application-reference-url-segment.js'
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
    expect(uploadInput).toHaveAccessibleDescription(
      'You can only upload a file that is a .docx or .odt.'
    )

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

  test('shows a collapsed WFD assessment template help section', async () => {
    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD,
      server: getServer()
    })

    const summary = getByText(
      document,
      'Help with getting a WFD assessment template'
    )
    const details = summary.closest('details')
    expect(details).not.toHaveAttribute('open')

    expect(
      getByText(
        details,
        "If you need to provide a WFD assessment, you can use the following template. It's called a scoping document."
      )
    ).toBeInTheDocument()

    expect(
      getByRole(details, 'link', {
        name: 'Download the WFD assessment scoping document (ODT, 24KB)'
      })
    ).toHaveAttribute(
      'href',
      'https://assets.publishing.service.gov.uk/media/6ab4e3b9fceb6fb3a650110e/wfd_scoping_template__1_.odt'
    )

    const guidanceLink = getByRole(details, 'link', {
      name: "Read the Environment Agency's guidance on the Water Framework Directive assessments for more information (opens in new tab)"
    })
    expect(guidanceLink).toHaveAttribute(
      'href',
      'https://www.gov.uk/guidance/water-framework-directive-assessment-estuarine-and-coastal-waters'
    )
    expect(guidanceLink).toHaveAttribute('target', '_blank')
    expect(guidanceLink).toHaveAttribute('rel', 'noreferrer noopener')
  })

  test('shows the WFD assessment template help to internal users replacing the document', async () => {
    vi.mocked(getAuthProvider).mockReturnValue(AUTH_STRATEGIES.ENTRA_ID)
    mockMarineLicence(mockSubmittedMarineLicenceApplication)

    const document = await loadPage({
      requestUrl:
        marineLicenceRoutes.MARINE_LICENCE_REDACTION_WFD_FILE_UPLOAD.replace(
          '{applicationReference}',
          toApplicationReferenceUrlSegment(
            mockSubmittedMarineLicenceApplication.applicationReference
          )
        ),
      server: getServer()
    })

    expect(getByRole(document, 'heading', { level: 1 })).toHaveTextContent(
      'Upload your Water Framework Directive assessment'
    )
    expect(
      getByText(document, 'Help with getting a WFD assessment template')
    ).toBeInTheDocument()
  })
})
