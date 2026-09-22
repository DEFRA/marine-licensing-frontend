import { vi } from 'vitest'
import { uploadConstructionDrawingWaitEntraUserController } from '#src/server/marine-licence/site-details/upload-construction-drawing-wait/entra-user-controller.js'
import { waterFrameworkDirectiveUploadAndWaitEntraUserController } from '#src/server/marine-licence/water-framework-directive/upload-and-wait/entra-user-controller.js'
import { UPLOAD_AND_WAIT_VIEW_ROUTE } from '#src/server/common/helpers/file-upload/constants.js'
import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import * as redactionUpload from '#src/server/common/helpers/marine-licence/session-cache/redaction-upload.js'
import * as geoParseUpload from '#src/server/common/helpers/file-upload/geo-parse-upload.js'
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
vi.mock(
  '~/src/server/common/helpers/file-upload/geo-parse-upload.js',
  async () => {
    const actual = await vi.importActual(
      '~/src/server/common/helpers/file-upload/geo-parse-upload.js'
    )
    return { ...actual, validateUploadedFile: vi.fn() }
  }
)
vi.mock('~/src/config/config.js')

vi.mock('~/src/server/common/helpers/logging/logger-options.js', () => ({
  loggerOptions: {
    enabled: true,
    ignorePaths: ['/health'],
    redact: { paths: [] }
  }
}))

const marineLicence = { id: 'test-licence-id', projectName: 'Test Project' }

const readyStatus = {
  status: 'ready',
  filename: 'replacement.pdf',
  s3Location: {
    s3Key: 'test-key',
    checksumSha256: 'test-checksum',
    detectedContentType: 'application/pdf'
  }
}

describe('replace document wait controllers', () => {
  let saveRedaction
  let getStatus

  const drawingRequest = () =>
    createMockRequest({
      params: { applicationReference: 'MLA-2026-10264' },
      query: { site: '1', drawing: '2' }
    })

  beforeEach(() => {
    config.get.mockReturnValue({ s3Bucket: 'test-bucket' })

    getStatus = vi.fn().mockResolvedValue(readyStatus)
    vi.mocked(getCdpUploadService).mockReturnValue({ getStatus })

    saveRedaction = vi.fn()
    vi.mocked(getMarineLicenceService).mockReturnValue({
      saveRedaction,
      getMarineLicenceByReference: vi.fn().mockResolvedValue(marineLicence)
    })

    vi.mocked(redactionUpload.getRedactionUpload).mockReturnValue({
      uploadId: 'test-upload-id',
      statusUrl: 'test-status-url'
    })
    vi.mocked(geoParseUpload.validateUploadedFile).mockResolvedValue({
      isValid: true
    })
  })

  test('saves a replaced construction drawing against the redaction and returns to the card', async () => {
    const h = createMockH()

    await uploadConstructionDrawingWaitEntraUserController.handler(
      drawingRequest(),
      h
    )

    expect(saveRedaction).toHaveBeenCalledWith(
      'test-licence-id',
      'siteDetails.constructionDrawings.withholdDocument',
      undefined,
      {
        siteIndex: 0,
        drawingIndex: 1,
        withhold: true,
        filename: 'replacement.pdf',
        s3Location: {
          s3Bucket: 'test-bucket',
          s3Key: 'test-key',
          checksumSha256: 'test-checksum'
        }
      }
    )
    expect(redactionUpload.clearRedactionUpload).toHaveBeenCalled()
    expect(h.redirect).toHaveBeenCalledWith(
      '/marine-licence/redaction/MLA-2026-10264#construction-drawing-site-1-2'
    )
  })

  test('saves a replaced water framework directive document without indexes', async () => {
    getStatus.mockResolvedValue({
      ...readyStatus,
      s3Location: {
        ...readyStatus.s3Location,
        detectedContentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      }
    })
    const h = createMockH()

    await waterFrameworkDirectiveUploadAndWaitEntraUserController.handler(
      createMockRequest({
        params: { applicationReference: 'MLA-2026-10264' },
        query: {}
      }),
      h
    )

    expect(saveRedaction).toHaveBeenCalledWith(
      'test-licence-id',
      'waterFrameworkDirective.withholdDocument',
      undefined,
      expect.objectContaining({ withhold: true, filename: 'replacement.pdf' })
    )
    expect(saveRedaction.mock.calls[0][3]).not.toHaveProperty('siteIndex')
    expect(h.redirect).toHaveBeenCalledWith(
      '/marine-licence/redaction/MLA-2026-10264#water-framework-directive-card'
    )
  })

  test('shows the waiting page while the file is being scanned', async () => {
    getStatus.mockResolvedValue({ status: 'scanning', filename: 'drawing.pdf' })
    const h = createMockH()

    await uploadConstructionDrawingWaitEntraUserController.handler(
      drawingRequest(),
      h
    )

    expect(h.view).toHaveBeenCalledWith(
      UPLOAD_AND_WAIT_VIEW_ROUTE,
      expect.objectContaining({
        isProcessing: true,
        projectName: 'Test Project',
        tryAgainLink:
          '/marine-licence/redaction/MLA-2026-10264/upload-construction-drawing?site=1&drawing=2',
        cancelLink:
          '/marine-licence/redaction/MLA-2026-10264#construction-drawing-site-1-2'
      })
    )
    expect(saveRedaction).not.toHaveBeenCalled()
  })

  test('stores the error and returns to the upload page when the file is rejected', async () => {
    getStatus.mockResolvedValue({
      status: 'rejected',
      errorCode: 'VIRUS_DETECTED',
      message: 'infected'
    })
    const h = createMockH()

    await uploadConstructionDrawingWaitEntraUserController.handler(
      drawingRequest(),
      h
    )

    expect(redactionUpload.setRedactionUpload).toHaveBeenCalledWith(
      expect.anything(),
      h,
      {
        uploadError: {
          message: 'The selected file contains a virus',
          fieldName: 'file'
        }
      }
    )
    expect(h.redirect).toHaveBeenCalledWith(
      '/marine-licence/redaction/MLA-2026-10264/upload-construction-drawing?site=1&drawing=2'
    )
    expect(saveRedaction).not.toHaveBeenCalled()
  })

  test('rejects a file whose detected type is not allowed', async () => {
    getStatus.mockResolvedValue({
      ...readyStatus,
      s3Location: { ...readyStatus.s3Location, detectedContentType: 'text/csv' }
    })
    const h = createMockH()

    await uploadConstructionDrawingWaitEntraUserController.handler(
      drawingRequest(),
      h
    )

    expect(saveRedaction).not.toHaveBeenCalled()
    expect(h.redirect).toHaveBeenCalledWith(
      '/marine-licence/redaction/MLA-2026-10264/upload-construction-drawing?site=1&drawing=2'
    )
  })

  test('returns to the redaction page when there is no upload in progress', async () => {
    vi.mocked(redactionUpload.getRedactionUpload).mockReturnValue({})
    const h = createMockH()

    await uploadConstructionDrawingWaitEntraUserController.handler(
      drawingRequest(),
      h
    )

    expect(getStatus).not.toHaveBeenCalled()
    expect(h.redirect).toHaveBeenCalledWith(
      '/marine-licence/redaction/MLA-2026-10264#construction-drawing-site-1-2'
    )
  })
})
