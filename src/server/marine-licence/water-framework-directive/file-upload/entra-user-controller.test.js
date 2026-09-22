import { vi } from 'vitest'
import { waterFrameworkFileUploadEntraUserController } from '#src/server/marine-licence/water-framework-directive/file-upload/entra-user-controller.js'
import {
  WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD_VIEW_ROUTE,
  WFD_FILE_UPLOAD_PAGE_HEADING
} from '#src/server/marine-licence/water-framework-directive/file-upload/controller.js'
import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import * as redactionUpload from '#src/server/common/helpers/marine-licence/session-cache/redaction-upload.js'
import { config } from '#src/config/config.js'
import {
  createMockRequest,
  createMockH
} from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('~/src/services/cdp-upload-service/index.js')
vi.mock('~/src/services/marine-licence-service/index.js')
vi.mock(
  '~/src/server/common/helpers/marine-licence/session-cache/redaction-upload.js'
)
vi.mock('~/src/config/config.js')

vi.mock('~/src/server/common/helpers/logging/logger-options.js', () => ({
  loggerOptions: {
    enabled: true,
    ignorePaths: ['/health'],
    redact: { paths: [] }
  }
}))

describe('waterFrameworkFileUploadEntraUserController', () => {
  let initiate

  const request = () =>
    createMockRequest({
      params: { applicationReference: 'MLA-2026-10264' },
      query: {}
    })

  beforeEach(() => {
    config.get.mockReturnValue({ s3Bucket: 'test-bucket' })

    initiate = vi.fn().mockResolvedValue({
      uploadId: 'test-upload-id',
      statusUrl: 'test-status-url',
      uploadUrl: 'https://cdp/upload'
    })
    vi.mocked(getCdpUploadService).mockReturnValue({ initiate })

    vi.mocked(getMarineLicenceService).mockReturnValue({
      getMarineLicenceByReference: vi.fn().mockResolvedValue({
        id: 'test-licence-id',
        projectName: 'Test Project'
      })
    })

    vi.mocked(redactionUpload.getRedactionUpload).mockReturnValue({})
  })

  test('initiates the upload, keeps in session and renders the view', async () => {
    const h = createMockH()

    await waterFrameworkFileUploadEntraUserController.handler(request(), h)

    expect(initiate).toHaveBeenCalledWith(
      expect.objectContaining({
        redirectUrl:
          '/marine-licence/redaction/MLA-2026-10264/water-framework-directive-upload-and-wait',
        s3Path: 'marine-licence/water-framework-directive'
      })
    )
    expect(redactionUpload.setRedactionUpload).toHaveBeenCalledWith(
      expect.anything(),
      h,
      { uploadId: 'test-upload-id', statusUrl: 'test-status-url' }
    )
    expect(h.view).toHaveBeenCalledWith(
      WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD_VIEW_ROUTE,
      expect.objectContaining({
        heading: WFD_FILE_UPLOAD_PAGE_HEADING,
        projectName: 'Test Project',
        backLink:
          '/marine-licence/redaction/MLA-2026-10264#water-framework-directive-card',
        cancelLink:
          '/marine-licence/redaction/MLA-2026-10264#water-framework-directive-card'
      })
    )
  })

  test('shows an upload error left behind by the wait page', async () => {
    vi.mocked(redactionUpload.getRedactionUpload).mockReturnValue({
      uploadError: {
        message: 'The selected file contains a virus',
        fieldName: 'file'
      }
    })
    const h = createMockH()

    await waterFrameworkFileUploadEntraUserController.handler(request(), h)

    const viewParams = h.view.mock.calls[0][1]
    expect(viewParams.errorSummary).toBeDefined()
    expect(viewParams.errors.file.text).toBe(
      'The selected file contains a virus'
    )
  })
})
