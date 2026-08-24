import { vi } from 'vitest'
import { uploadConstructionDrawingWaitController } from '#src/server/marine-licence/site-details/upload-construction-drawing-wait/controller.js'
import { UPLOAD_AND_WAIT_VIEW_ROUTE } from '#src/server/common/helpers/file-upload/constants.js'
import * as mlCacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as cdpUploadService from '#src/services/cdp-upload-service/index.js'
import * as geoParseUpload from '#src/server/common/helpers/file-upload/geo-parse-upload.js'
import * as authenticatedRequests from '#src/server/common/helpers/authenticated-requests.js'
import {
  apiRoutes,
  marineLicenceRoutes
} from '#src/server/common/constants/routes.js'
import { config } from '#src/config/config.js'
import {
  createMockRequest,
  createMockH
} from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/services/cdp-upload-service/index.js')
vi.mock('~/src/server/common/helpers/authenticated-requests.js')
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
    redact: {
      paths: []
    }
  }
}))

vi.mock('~/src/server/common/helpers/logging/logger.js', () => ({
  createLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn()
  })
}))

const mockUploadConfig = {
  uploadId: 'test-upload-id',
  statusUrl: 'test-status-url',
  fileType: 'construction-drawing',
  siteIndex: 0,
  drawingIndex: 1
}

const mockMarineLicence = (overrides = {}) => ({
  id: 'test-licence-id',
  projectName: 'Test Project',
  siteDetails: [{ uploadConfig: mockUploadConfig }],
  ...overrides
})

describe('uploadConstructionDrawingWaitController', () => {
  let mockCdpService

  beforeEach(() => {
    config.get.mockReturnValue({ s3Bucket: 'test-bucket' })

    mockCdpService = { getStatus: vi.fn() }
    vi.mocked(cdpUploadService.getCdpUploadService).mockReturnValue(
      mockCdpService
    )
    vi.mocked(mlCacheUtils.getMarineLicenceCache).mockReturnValue(
      mockMarineLicence()
    )
    vi.mocked(mlCacheUtils.updateMarineLicenceSiteDetails).mockImplementation(
      () => {}
    )
  })

  it('redirects to review site details when the site query param is missing', async () => {
    const request = createMockRequest({ query: {} })
    const h = createMockH()

    await uploadConstructionDrawingWaitController.handler(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    )
  })

  it('redirects to review site details when there is no upload in progress for the site', async () => {
    vi.mocked(mlCacheUtils.getMarineLicenceCache).mockReturnValue(
      mockMarineLicence({ siteDetails: [{}] })
    )
    const request = createMockRequest({ query: { site: '1' } })
    const h = createMockH()

    await uploadConstructionDrawingWaitController.handler(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    )
  })

  it('shows the waiting page while the file is pending or scanning', async () => {
    mockCdpService.getStatus.mockResolvedValue({
      status: 'scanning',
      filename: 'drawing.pdf'
    })
    const request = createMockRequest({ query: { site: '1' } })
    const h = createMockH()

    await uploadConstructionDrawingWaitController.handler(request, h)

    expect(h.view).toHaveBeenCalledWith(
      UPLOAD_AND_WAIT_VIEW_ROUTE,
      expect.objectContaining({ isProcessing: true, filename: 'drawing.pdf' })
    )
  })

  it('persists the drawing and redirects to the anchored card when the file is ready and valid', async () => {
    mockCdpService.getStatus.mockResolvedValue({
      status: 'ready',
      filename: 'drawing.pdf',
      s3Location: {
        s3Key: 'test-key',
        checksumSha256: 'test-checksum'
      }
    })
    vi.mocked(geoParseUpload.validateUploadedFile).mockResolvedValue({
      isValid: true
    })
    const request = createMockRequest({ query: { site: '1' } })
    const h = createMockH()

    await uploadConstructionDrawingWaitController.handler(request, h)

    expect(
      authenticatedRequests.authenticatedPatchRequest
    ).toHaveBeenCalledWith(request, apiRoutes.UPDATE_CONSTRUCTION_DRAWING, {
      id: 'test-licence-id',
      siteIndex: 0,
      drawingIndex: 1,
      filename: 'drawing.pdf',
      s3Location: {
        s3Bucket: 'test-bucket',
        s3Key: 'test-key',
        checksumSha256: 'test-checksum'
      }
    })

    expect(mlCacheUtils.updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
      request,
      h,
      0,
      'uploadConfig',
      null
    )

    expect(h.redirect).toHaveBeenCalledWith(
      '/marine-licence/review-site-details#construction-drawing-site-1-2'
    )
  })

  it('stores an error and redirects back to the upload screen when the file extension is invalid', async () => {
    mockCdpService.getStatus.mockResolvedValue({
      status: 'ready',
      filename: 'drawing.exe',
      s3Location: { s3Key: 'test-key', checksumSha256: 'test-checksum' }
    })
    vi.mocked(geoParseUpload.validateUploadedFile).mockResolvedValue({
      isValid: false,
      errorMessage:
        'The selected file must be a PDF or image (.bmp, .gif, .jpg, .jpeg, .png, .tif) file'
    })
    const request = createMockRequest({ query: { site: '1' } })
    const h = createMockH()

    await uploadConstructionDrawingWaitController.handler(request, h)

    expect(mlCacheUtils.updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
      request,
      h,
      0,
      'uploadError',
      expect.objectContaining({
        message:
          'The selected file must be a PDF or image (.bmp, .gif, .jpg, .jpeg, .png, .tif) file'
      })
    )
    expect(h.redirect).toHaveBeenCalledWith(
      `${marineLicenceRoutes.MARINE_LICENCE_UPLOAD_CONSTRUCTION_DRAWING}?site=1&drawing=2`
    )
  })

  // The extension check only sees the filename, so a file renamed to .pdf passes it.
  // Nothing downstream opens a drawing, unlike the geo-parser for KML/shapefile or the
  // backend 415 for WFD, so this is the only thing standing between a mislabelled file
  // and the application record.
  it('stores an error and redirects back when the detected content type is not allowed', async () => {
    mockCdpService.getStatus.mockResolvedValue({
      status: 'ready',
      filename: 'drawing.pdf',
      s3Location: {
        s3Key: 'test-key',
        checksumSha256: 'test-checksum',
        detectedContentType: 'application/zip'
      }
    })
    vi.mocked(geoParseUpload.validateUploadedFile).mockResolvedValue({
      isValid: true
    })
    const request = createMockRequest({ query: { site: '1' } })
    const h = createMockH()

    await uploadConstructionDrawingWaitController.handler(request, h)

    expect(mlCacheUtils.updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
      request,
      h,
      0,
      'uploadError',
      expect.objectContaining({
        message:
          'The selected file must be a PDF or image (.bmp, .gif, .jpg, .jpeg, .png, .tif) file'
      })
    )
    expect(h.redirect).toHaveBeenCalledWith(
      `${marineLicenceRoutes.MARINE_LICENCE_UPLOAD_CONSTRUCTION_DRAWING}?site=1&drawing=2`
    )
    expect(
      authenticatedRequests.authenticatedPatchRequest
    ).not.toHaveBeenCalled()
  })

  it.each([['application/pdf'], ['image/jpeg'], ['image/tiff'], ['image/bmp']])(
    'persists the drawing when the detected content type is %s',
    async (detectedContentType) => {
      mockCdpService.getStatus.mockResolvedValue({
        status: 'ready',
        filename: 'drawing.pdf',
        s3Location: {
          s3Key: 'test-key',
          checksumSha256: 'test-checksum',
          detectedContentType
        }
      })
      vi.mocked(geoParseUpload.validateUploadedFile).mockResolvedValue({
        isValid: true
      })
      const request = createMockRequest({ query: { site: '1' } })
      const h = createMockH()

      await uploadConstructionDrawingWaitController.handler(request, h)

      expect(authenticatedRequests.authenticatedPatchRequest).toHaveBeenCalled()
    }
  )

  // CDP not classifying a file is not the same as classifying it as disallowed - failing
  // here would block legitimate uploads, and the extension check still applies.
  it('persists the drawing when CDP reports no detected content type', async () => {
    mockCdpService.getStatus.mockResolvedValue({
      status: 'ready',
      filename: 'drawing.pdf',
      s3Location: { s3Key: 'test-key', checksumSha256: 'test-checksum' }
    })
    vi.mocked(geoParseUpload.validateUploadedFile).mockResolvedValue({
      isValid: true
    })
    const request = createMockRequest({ query: { site: '1' } })
    const h = createMockH()

    await uploadConstructionDrawingWaitController.handler(request, h)

    expect(authenticatedRequests.authenticatedPatchRequest).toHaveBeenCalled()
  })

  it('maps a CDP virus rejection to the correct message and redirects back to the upload screen', async () => {
    mockCdpService.getStatus.mockResolvedValue({
      status: 'rejected',
      errorCode: 'VIRUS_DETECTED',
      message: 'virus found'
    })
    const request = createMockRequest({ query: { site: '1' } })
    const h = createMockH()

    await uploadConstructionDrawingWaitController.handler(request, h)

    expect(mlCacheUtils.updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
      request,
      h,
      0,
      'uploadError',
      expect.objectContaining({
        message: 'The selected file contains a virus'
      })
    )
    expect(h.redirect).toHaveBeenCalledWith(
      `${marineLicenceRoutes.MARINE_LICENCE_UPLOAD_CONSTRUCTION_DRAWING}?site=1&drawing=2`
    )
  })

  it('maps a CDP file-too-large rejection to the 10MB-specific message', async () => {
    mockCdpService.getStatus.mockResolvedValue({
      status: 'rejected',
      errorCode: 'FILE_TOO_LARGE',
      message: 'too big'
    })
    const request = createMockRequest({ query: { site: '1' } })
    const h = createMockH()

    await uploadConstructionDrawingWaitController.handler(request, h)

    expect(mlCacheUtils.updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
      request,
      h,
      0,
      'uploadError',
      expect.objectContaining({
        message: 'The selected file must be smaller than 10 MB'
      })
    )
  })

  it('redirects to review site details for an unknown status', async () => {
    mockCdpService.getStatus.mockResolvedValue({ status: 'unknown' })
    const request = createMockRequest({ query: { site: '1' } })
    const h = createMockH()

    await uploadConstructionDrawingWaitController.handler(request, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    )
  })

  it('clears the upload config and redirects when checking status fails', async () => {
    mockCdpService.getStatus.mockRejectedValue(new Error('network error'))
    const request = createMockRequest({ query: { site: '1' } })
    const h = createMockH()

    await uploadConstructionDrawingWaitController.handler(request, h)

    expect(mlCacheUtils.updateMarineLicenceSiteDetails).toHaveBeenCalledWith(
      request,
      h,
      0,
      'uploadConfig',
      null
    )
    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_REVIEW_SITE_DETAILS
    )
  })
})
