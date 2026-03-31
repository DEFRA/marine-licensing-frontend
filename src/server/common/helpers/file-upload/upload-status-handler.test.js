import { vi } from 'vitest'
import { handleReadyStatus } from '#src/server/common/helpers/file-upload/upload-status-handler.js'
import * as geoParseUpload from '#src/server/common/helpers/file-upload/geo-parse-upload.js'

vi.mock('~/src/server/common/helpers/file-upload/geo-parse-upload.js')

describe('#handleReadyStatus', () => {
  const mockRequest = {}
  const uploadConfig = { fileType: 'kml' }
  const status = { filename: 'test.kml' }
  const fileUploadRoute = '/file-upload'
  let mockH
  let mockStoreUploadError

  beforeEach(() => {
    mockH = { redirect: vi.fn() }
    mockStoreUploadError = vi.fn()
  })

  test('should return null when validation passes', async () => {
    vi.mocked(geoParseUpload.validateUploadedFile).mockResolvedValue({
      isValid: true,
      extension: 'kml',
      errorMessage: null
    })

    const result = await handleReadyStatus(
      status,
      uploadConfig,
      mockRequest,
      mockH,
      { storeUploadError: mockStoreUploadError, fileUploadRoute }
    )

    expect(result).toBeNull()
    expect(mockStoreUploadError).not.toHaveBeenCalled()
    expect(mockH.redirect).not.toHaveBeenCalled()
  })

  test('should store error and redirect when validation fails', async () => {
    vi.mocked(geoParseUpload.validateUploadedFile).mockResolvedValue({
      isValid: false,
      extension: 'pdf',
      errorMessage: 'The selected file must be a KML file'
    })

    await handleReadyStatus(status, uploadConfig, mockRequest, mockH, {
      storeUploadError: mockStoreUploadError,
      fileUploadRoute
    })

    expect(mockStoreUploadError).toHaveBeenCalledWith(
      mockRequest,
      mockH,
      { message: 'The selected file must be a KML file', fieldName: 'file' },
      'kml'
    )
    expect(mockH.redirect).toHaveBeenCalledWith(fileUploadRoute)
  })
})
