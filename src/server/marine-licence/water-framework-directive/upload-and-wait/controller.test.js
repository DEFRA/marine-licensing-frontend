import { vi } from 'vitest'
import { waterFrameworkDirectiveUploadAndWaitController } from '#src/server/marine-licence/water-framework-directive/upload-and-wait/controller.js'
import { UPLOAD_AND_WAIT_VIEW_ROUTE } from '#src/server/common/helpers/file-upload/constants.js'
import * as mlCacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as wfdCacheUtils from '#src/server/common/helpers/marine-licence/session-cache/water-framework-directive.js'
import * as cdpUploadService from '#src/services/cdp-upload-service/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { saveWaterFrameworkDirectiveToBackend } from '#src/server/common/helpers/marine-licence/water-framework-directive/save-water-framework-directive.js'
import { config } from '#src/config/config.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/services/cdp-upload-service/index.js')
vi.mock(
  '~/src/server/common/helpers/marine-licence/session-cache/water-framework-directive.js'
)
vi.mock(
  '~/src/server/common/helpers/marine-licence/water-framework-directive/save-water-framework-directive.js'
)

vi.mock('~/src/server/common/helpers/logging/logger-options.js', () => ({
  loggerOptions: {
    enabled: true,
    ignorePaths: ['/health'],
    redact: { paths: [] }
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

// Test Data Factories
const createMockUploadConfig = (overrides = {}) => ({
  uploadId: 'test-upload-id',
  statusUrl: 'test-status-url',
  ...overrides
})

const createMockStatusResponse = (status, overrides = {}) => ({
  status,
  filename: 'test.odt',
  fileSize: 1024,
  contentType: 'application/vnd.oasis.opendocument.text',
  completedAt: '2025-01-01T00:00:00.000Z',
  ...(status === 'ready' && {
    s3Location: {
      s3Bucket: 'test-bucket',
      s3Key: 'test-key',
      fileId: 'test-id',
      s3Url: 'test-url',
      checksumSha256: 'test-checksum'
    }
  }),
  ...overrides
})

const createMockMarineLicence = (overrides = {}) => ({
  projectName: 'Test Project',
  waterFrameworkDirective: {
    uploadConfig: createMockUploadConfig()
  },
  ...overrides
})

const createMockRequest = () => ({
  logger: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  },
  yar: { get: vi.fn(), set: vi.fn(), commit: vi.fn() }
})

const createMockResponseHandler = () => ({
  view: vi.fn(),
  redirect: vi.fn()
})

const wfdFileUploadRoute =
  marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD

describe('#uploadAndWait', () => {
  let getMarineLicenceCacheSpy
  let updateWaterFrameworkDirectiveSpy
  let mockCdpService

  beforeEach(() => {
    getMarineLicenceCacheSpy = vi
      .spyOn(mlCacheUtils, 'getMarineLicenceCache')
      .mockReturnValue(createMockMarineLicence())

    updateWaterFrameworkDirectiveSpy = vi
      .spyOn(wfdCacheUtils, 'updateWaterFrameworkDirective')
      .mockResolvedValue()

    mockCdpService = { getStatus: vi.fn() }
    vi.spyOn(cdpUploadService, 'getCdpUploadService').mockReturnValue(
      mockCdpService
    )
  })

  describe('#waterFrameworkDirectiveUploadAndWaitController', () => {
    let mockRequest
    let h

    beforeEach(() => {
      mockRequest = createMockRequest()
      h = createMockResponseHandler()
    })

    describe('when no upload config exists', () => {
      test('should redirect to WFD file upload', async () => {
        getMarineLicenceCacheSpy.mockReturnValue({
          projectName: 'Test Project',
          waterFrameworkDirective: {}
        })

        await waterFrameworkDirectiveUploadAndWaitController.handler(
          mockRequest,
          h
        )

        expect(h.redirect).toHaveBeenCalledWith(wfdFileUploadRoute)
      })
    })

    describe('when checking upload status', () => {
      test.each(['pending', 'scanning'])(
        'should show waiting page when status is %s',
        async (status) => {
          mockCdpService.getStatus.mockResolvedValue(
            createMockStatusResponse(status)
          )

          await waterFrameworkDirectiveUploadAndWaitController.handler(
            mockRequest,
            h
          )

          expect(mockCdpService.getStatus).toHaveBeenCalledWith(
            'test-upload-id',
            'test-status-url'
          )

          expect(h.view).toHaveBeenCalledWith(UPLOAD_AND_WAIT_VIEW_ROUTE, {
            pageTitle: 'Checking your file...',
            heading: 'Checking your file...',
            projectName: 'Test Project',
            isProcessing: true,
            pageRefreshTimeInSeconds: 2,
            filename: 'test.odt',
            tryAgainLink: wfdFileUploadRoute,
            cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
          })
        }
      )

      test('should redirect to WFD file upload for unknown status', async () => {
        mockCdpService.getStatus.mockResolvedValue({
          status: 'unknown',
          filename: 'test.odt'
        })

        await waterFrameworkDirectiveUploadAndWaitController.handler(
          mockRequest,
          h
        )

        expect(mockRequest.logger.warn).toHaveBeenCalledWith(
          { uploadId: 'test-upload-id', status: 'unknown' },
          'WFD FileUpload: Unknown upload status'
        )

        expect(h.redirect).toHaveBeenCalledWith(wfdFileUploadRoute)
      })
    })

    describe('when file upload is ready', () => {
      test('should save uploaded file details and redirect to task list', async () => {
        mockCdpService.getStatus.mockResolvedValue(
          createMockStatusResponse('ready')
        )

        await waterFrameworkDirectiveUploadAndWaitController.handler(
          mockRequest,
          h
        )

        expect(updateWaterFrameworkDirectiveSpy).toHaveBeenCalledWith(
          mockRequest,
          h,
          'uploadedFile',
          {
            filename: 'test.odt'
          }
        )

        expect(updateWaterFrameworkDirectiveSpy).toHaveBeenCalledWith(
          mockRequest,
          h,
          's3Location',
          {
            s3Bucket: config.get('cdpUploader').s3Bucket,
            s3Key: 'test-key',
            checksumSha256: 'test-checksum'
          }
        )

        expect(updateWaterFrameworkDirectiveSpy).toHaveBeenCalledWith(
          mockRequest,
          h,
          'uploadConfig',
          null
        )

        expect(saveWaterFrameworkDirectiveToBackend).toHaveBeenCalledWith(
          expect.any(Object)
        )

        expect(h.redirect).toHaveBeenCalledWith(
          marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
        )
      })

      test('should handle missing s3Location gracefully and still redirect', async () => {
        const statusResponse = createMockStatusResponse('ready')
        delete statusResponse.s3Location
        mockCdpService.getStatus.mockResolvedValue(statusResponse)

        await waterFrameworkDirectiveUploadAndWaitController.handler(
          mockRequest,
          h
        )

        expect(updateWaterFrameworkDirectiveSpy).toHaveBeenCalledWith(
          mockRequest,
          h,
          'uploadedFile',
          {
            filename: 'test.odt'
          }
        )

        expect(h.redirect).toHaveBeenCalledWith(
          marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
        )
      })
    })

    describe('when upload is rejected', () => {
      test('should store virus error, log it, and redirect to WFD file upload', async () => {
        mockCdpService.getStatus.mockResolvedValue({
          status: 'rejected',
          errorCode: 'VIRUS_DETECTED',
          message: 'The selected file contains a virus'
        })

        await waterFrameworkDirectiveUploadAndWaitController.handler(
          mockRequest,
          h
        )

        expect(mockRequest.logger.error).toHaveBeenCalledWith(
          {
            error: {
              code: 'VIRUS_DETECTED',
              message: 'The selected file contains a virus'
            }
          },
          'WFD FileUpload: CDP rejection error'
        )

        expect(updateWaterFrameworkDirectiveSpy).toHaveBeenCalledWith(
          mockRequest,
          h,
          'uploadError',
          {
            message: 'The selected file contains a virus',
            fieldName: 'file'
          }
        )

        expect(updateWaterFrameworkDirectiveSpy).toHaveBeenCalledWith(
          mockRequest,
          h,
          'uploadConfig',
          null
        )

        expect(h.redirect).toHaveBeenCalledWith(wfdFileUploadRoute)
      })

      test.each([
        {
          scenario: 'rejected status with no errorCode',
          status: 'rejected',
          message: 'Unknown rejection'
        },
        {
          scenario: 'error status',
          status: 'error',
          message: 'Processing failed'
        }
      ])(
        'should use default error message for $scenario',
        async ({ status, message }) => {
          mockCdpService.getStatus.mockResolvedValue({ status, message })

          await waterFrameworkDirectiveUploadAndWaitController.handler(
            mockRequest,
            h
          )

          expect(updateWaterFrameworkDirectiveSpy).toHaveBeenCalledWith(
            mockRequest,
            h,
            'uploadError',
            {
              message: 'The selected file could not be uploaded – try again',
              fieldName: 'file'
            }
          )

          expect(h.redirect).toHaveBeenCalledWith(wfdFileUploadRoute)
        }
      )
    })

    describe('when service errors occur', () => {
      test('should handle CDP service errors gracefully', async () => {
        mockCdpService.getStatus.mockRejectedValue(
          new Error('Service unavailable')
        )

        await waterFrameworkDirectiveUploadAndWaitController.handler(
          mockRequest,
          h
        )

        expect(mockRequest.logger.error).toHaveBeenCalledWith(
          { err: expect.any(Error) },
          'WFD FileUpload: Failed to check upload status'
        )

        expect(updateWaterFrameworkDirectiveSpy).toHaveBeenCalledWith(
          mockRequest,
          h,
          'uploadConfig',
          null
        )

        expect(h.redirect).toHaveBeenCalledWith(wfdFileUploadRoute)
      })
    })

    describe('edge cases', () => {
      test('should handle empty filename in pending status response', async () => {
        mockCdpService.getStatus.mockResolvedValue({
          status: 'pending',
          filename: ''
        })

        await waterFrameworkDirectiveUploadAndWaitController.handler(
          mockRequest,
          h
        )

        expect(h.view).toHaveBeenCalledWith(UPLOAD_AND_WAIT_VIEW_ROUTE, {
          pageTitle: 'Checking your file...',
          heading: 'Checking your file...',
          projectName: 'Test Project',
          isProcessing: true,
          pageRefreshTimeInSeconds: 2,
          filename: '',
          tryAgainLink: wfdFileUploadRoute,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
        })
      })
    })
  })
})
