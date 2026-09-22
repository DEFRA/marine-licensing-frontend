import { vi } from 'vitest'
import { uploadConstructionDrawingEntraUserController } from '#src/server/marine-licence/site-details/upload-construction-drawing/entra-user-controller.js'
import { UPLOAD_CONSTRUCTION_DRAWING_VIEW_ROUTE } from '#src/server/marine-licence/site-details/upload-construction-drawing/controller.js'
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

describe('uploadConstructionDrawingEntraUserController', () => {
  let initiate

  const request = () =>
    createMockRequest({
      params: { applicationReference: 'MLA-2026-10264' },
      query: { site: '1', drawing: '2' }
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

    await uploadConstructionDrawingEntraUserController.handler(request(), h)

    expect(initiate).toHaveBeenCalledWith(
      expect.objectContaining({
        redirectUrl:
          '/marine-licence/redaction/MLA-2026-10264/upload-construction-drawing-wait?site=1&drawing=2',
        s3Path: 'marine-licence/construction-drawings',
        maxFileSize: 10 * 1024 * 1024
      })
    )
    expect(redactionUpload.setRedactionUpload).toHaveBeenCalledWith(
      expect.anything(),
      h,
      { uploadId: 'test-upload-id', statusUrl: 'test-status-url' }
    )
    expect(h.view).toHaveBeenCalledWith(
      UPLOAD_CONSTRUCTION_DRAWING_VIEW_ROUTE,
      expect.objectContaining({
        heading: 'Site 1: Upload construction drawing 2',
        projectName: 'Test Project',
        uploadUrl: 'https://cdp/upload',
        backLink:
          '/marine-licence/redaction/MLA-2026-10264#construction-drawing-site-1-2',
        cancelLink:
          '/marine-licence/redaction/MLA-2026-10264#construction-drawing-site-1-2'
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

    await uploadConstructionDrawingEntraUserController.handler(request(), h)

    const viewParams = h.view.mock.calls[0][1]
    expect(viewParams.errorSummary).toBeDefined()
    expect(viewParams.errors.file.text).toBe(
      'The selected file contains a virus'
    )
  })
})
