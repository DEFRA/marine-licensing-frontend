import { vi } from 'vitest'
import { config } from '#src/config/config.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import * as mlCacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import { fileUploadController } from '#src/server/marine-licence/site-details/file-upload/controller.js'
import * as cdpUploadService from '#src/services/cdp-upload-service/index.js'
import { FILE_UPLOAD_VIEW_ROUTE } from '#src/server/common/helpers/file-upload/constants.js'
import { mockMarineLicenceApplication } from '~/src/server/test-helpers/mocks/marine-licence-mocks.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/services/cdp-upload-service/index.js')
vi.mock('~/src/config/config.js')

vi.mock('~/src/server/common/helpers/logging/logger.js', () => ({
  createLogger: vi.fn().mockReturnValue({
    info: vi.fn()
  })
}))

const createMockRequest = () => ({
  logger: { debug: vi.fn(), warn: vi.fn(), error: vi.fn() },
  yar: { get: vi.fn(), set: vi.fn(), commit: vi.fn() }
})

const createMockH = () => ({
  view: vi.fn(),
  redirect: vi.fn()
})

const createMockMarineLicence = (siteDetails = {}) => ({
  ...mockMarineLicenceApplication,
  siteDetails: [siteDetails]
})

const createStandardUploadConfig = () => ({
  uploadId: 'test-upload-id',
  uploadUrl: 'https://upload.example.com',
  statusUrl: 'https://status.example.com',
  maxFileSize: 50000000
})

describe('#fileUpload (marine-licence)', () => {
  let getMarineLicenceCacheSpy
  let updateMarineLicenceSiteDetailsSpy
  let mockCdpService

  beforeEach(() => {
    config.get.mockReturnValue({ s3Bucket: 'test-bucket' })

    getMarineLicenceCacheSpy = vi
      .spyOn(mlCacheUtils, 'getMarineLicenceCache')
      .mockReturnValue(createMockMarineLicence({ fileUploadType: 'kml' }))

    updateMarineLicenceSiteDetailsSpy = vi
      .spyOn(mlCacheUtils, 'updateMarineLicenceSiteDetails')
      .mockImplementation()

    mockCdpService = { initiate: vi.fn() }
    vi.spyOn(cdpUploadService, 'getCdpUploadService').mockReturnValue(
      mockCdpService
    )
  })

  test('should redirect to correct page when no fileUploadType is set', async () => {
    getMarineLicenceCacheSpy.mockReturnValue(createMockMarineLicence({}))
    const mockRequest = createMockRequest()
    const h = createMockH()

    await fileUploadController.handler(mockRequest, h)

    expect(h.redirect).toHaveBeenCalledWith(
      marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE
    )
  })

  describe('when uploadError is present', () => {
    test('should display error summary and clear uploadError from session', async () => {
      // Given an upload error stored in session
      const uploadError = {
        message: 'The selected file contains a virus',
        fieldName: 'file',
        fileType: 'kml'
      }
      getMarineLicenceCacheSpy.mockReturnValue(
        createMockMarineLicence({ fileUploadType: 'kml', uploadError })
      )
      mockCdpService.initiate.mockResolvedValue(createStandardUploadConfig())

      const mockRequest = createMockRequest()
      const h = createMockH()

      // When the handler is called
      await fileUploadController.handler(mockRequest, h)

      // Then the error is displayed
      expect(h.view).toHaveBeenCalledWith(
        FILE_UPLOAD_VIEW_ROUTE,
        expect.objectContaining({
          errorSummary: expect.any(Array),
          errors: expect.any(Object)
        })
      )

      // And the error is cleared from the session
      expect(updateMarineLicenceSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        expect.any(Object),
        0,
        'uploadError',
        null
      )
    })
  })

  describe('when CDP service fails', () => {
    test('should log error and redirect to MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE', async () => {
      mockCdpService.initiate.mockRejectedValue(
        new Error('CDP service unavailable')
      )
      const mockRequest = createMockRequest()
      const h = createMockH()

      await fileUploadController.handler(mockRequest, h)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        expect.objectContaining({ err: expect.any(Error) }),
        'Failed to initialize file upload'
      )
      expect(h.redirect).toHaveBeenCalledWith(
        marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE
      )
    })
  })
})
