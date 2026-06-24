import { vi } from 'vitest'
import { config } from '#src/config/config.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import * as mlCacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as wfdCacheUtils from '#src/server/common/helpers/marine-licence/session-cache/water-framework-directive.js'
import {
  waterFrameworkFileUploadController,
  WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD_VIEW_ROUTE
} from '#src/server/marine-licence/water-framework-directive/file-upload/controller.js'
import { mockMarineLicenceApplication } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import * as cdpUploadService from '#src/services/cdp-upload-service/index.js'
import {
  WFD_ACCEPT_ATTRIBUTE,
  s3PathForWaterFrameworkDirective
} from '#src/server/common/constants/water-framework-directive.js'
import { createMockRequest } from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/services/cdp-upload-service/index.js')
vi.mock(
  '~/src/server/common/helpers/marine-licence/session-cache/water-framework-directive.js'
)
vi.mock('~/src/config/config.js')

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

describe('#fileUpload', () => {
  let getMarineLicenceCacheSpy
  let updateWaterFrameworkDirectiveSpy
  let mockCdpService

  const createMockH = () => ({
    view: vi.fn(),
    redirect: vi.fn()
  })

  const createStandardUploadConfig = () => ({
    uploadId: 'test-upload-id',
    uploadUrl: 'https://upload.example.com',
    statusUrl: 'https://status.example.com',
    maxFileSize: 50000000
  })

  const setupStandardFileUploadTest = async (mockRequest, mockH) => {
    mockCdpService.initiate.mockResolvedValue(createStandardUploadConfig())
    await waterFrameworkFileUploadController.handler(mockRequest, mockH)
  }

  const expectViewCalledWith = (mockH, expectedContent) => {
    expect(mockH.view).toHaveBeenCalledWith(
      WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD_VIEW_ROUTE,
      expect.objectContaining(expectedContent)
    )
  }

  beforeEach(() => {
    config.get.mockImplementation((key) => {
      if (key === 'cdpUploader') return { s3Bucket: 'test-bucket' }
      return undefined
    })

    getMarineLicenceCacheSpy = vi
      .spyOn(mlCacheUtils, 'getMarineLicenceCache')
      .mockReturnValue(mockMarineLicenceApplication)

    updateWaterFrameworkDirectiveSpy = vi
      .spyOn(wfdCacheUtils, 'updateWaterFrameworkDirective')
      .mockResolvedValue()

    vi.spyOn(
      wfdCacheUtils,
      'getWaterFrameworkDirectiveReturnRoute'
    ).mockReturnValue(undefined)

    vi.spyOn(
      wfdCacheUtils,
      'setWaterFrameworkDirectiveReturnToCache'
    ).mockResolvedValue()

    mockCdpService = { initiate: vi.fn() }
    vi.spyOn(cdpUploadService, 'getCdpUploadService').mockReturnValue(
      mockCdpService
    )
  })

  describe('#waterFrameworkFileUploadController', () => {
    let mockRequest
    let mockH

    beforeEach(() => {
      mockRequest = createMockRequest()
      mockH = createMockH()
    })

    describe('Display upload page', () => {
      test('should display file upload page with correct data', async () => {
        await setupStandardFileUploadTest(mockRequest, mockH)

        expectViewCalledWith(mockH, {
          pageTitle: 'Upload your Water Framework Directive assessment',
          heading: 'Upload your Water Framework Directive assessment',
          projectName: mockMarineLicenceApplication.projectName,
          uploadUrl: 'https://upload.example.com',
          maxFileSize: 50000000,
          acceptAttribute: WFD_ACCEPT_ATTRIBUTE,
          backLink:
            marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
        })
      })

      test('should use review-your-answers back link and no cancel when action=change', async () => {
        const RYA_ROUTE =
          marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS

        vi.spyOn(
          wfdCacheUtils,
          'getWaterFrameworkDirectiveReturnRoute'
        ).mockReturnValue(RYA_ROUTE)

        mockRequest = createMockRequest({ query: { action: 'change' } })
        await setupStandardFileUploadTest(mockRequest, mockH)

        expectViewCalledWith(mockH, {
          backLink: RYA_ROUTE,
          cancelLink: undefined
        })
      })

      test('should use excluded-activities back link and task-list cancel when wfdReturnTo is set but no action param', async () => {
        vi.spyOn(
          wfdCacheUtils,
          'getWaterFrameworkDirectiveReturnRoute'
        ).mockReturnValue(
          marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_REVIEW_YOUR_ANSWERS
        )

        await setupStandardFileUploadTest(mockRequest, mockH)

        expectViewCalledWith(mockH, {
          backLink:
            marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_EXCLUDED_ACTIVITIES,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
        })
      })

      test('should use WFD accept attribute (.odt,.docx)', async () => {
        await setupStandardFileUploadTest(mockRequest, mockH)

        expectViewCalledWith(mockH, { acceptAttribute: '.odt,.docx' })
      })
    })

    describe('CDP upload session initialisation', () => {
      test('should initialize CDP upload with correct parameters', async () => {
        await setupStandardFileUploadTest(mockRequest, mockH)

        expect(cdpUploadService.getCdpUploadService).toHaveBeenCalledWith()
        expect(mockCdpService.initiate).toHaveBeenCalledWith({
          redirectUrl:
            marineLicenceRoutes.MARINE_LICENCE_WATER_FRAMEWORK_DIRECTIVE_UPLOAD_AND_WAIT,
          s3Path: s3PathForWaterFrameworkDirective,
          s3Bucket: 'test-bucket'
        })

        expect(updateWaterFrameworkDirectiveSpy).toHaveBeenCalledWith(
          mockRequest,
          mockH,
          'uploadConfig',
          {
            uploadId: 'test-upload-id',
            statusUrl: 'https://status.example.com'
          }
        )
      })
    })

    describe('Error handling', () => {
      test('should display error from session and clear it after display', async () => {
        getMarineLicenceCacheSpy.mockReturnValue({
          ...mockMarineLicenceApplication,
          waterFrameworkDirective: {
            uploadError: {
              message: 'The selected file contains a virus',
              fieldName: 'file',
              fileType: 'odt'
            }
          }
        })
        mockCdpService.initiate.mockResolvedValue(createStandardUploadConfig())

        await waterFrameworkFileUploadController.handler(mockRequest, mockH)

        expect(mockH.view).toHaveBeenCalledWith(
          WATER_FRAMEWORK_DIRECTIVE_FILE_UPLOAD_VIEW_ROUTE,
          expect.objectContaining({
            errorSummary: expect.arrayContaining([
              expect.objectContaining({
                text: 'The selected file contains a virus',
                href: '#file'
              })
            ]),
            errors: expect.objectContaining({
              file: expect.objectContaining({
                text: 'The selected file contains a virus'
              })
            })
          })
        )

        expect(updateWaterFrameworkDirectiveSpy).toHaveBeenCalledWith(
          mockRequest,
          mockH,
          'uploadError',
          null
        )
      })

      test('should handle CDP service initialization failure and redirect to task list', async () => {
        mockCdpService.initiate.mockRejectedValue(
          new Error('CDP service unavailable')
        )

        await waterFrameworkFileUploadController.handler(mockRequest, mockH)

        expect(mockRequest.logger.error).toHaveBeenCalledWith(
          expect.objectContaining({
            err: expect.any(Error)
          }),
          'Failed to initialize WFD file upload'
        )

        expect(mockH.redirect).toHaveBeenCalledWith(
          marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
        )
      })
    })

    describe('Mutation testing coverage', () => {
      test('should log warning when uploadedFile exists without uploadError', async () => {
        getMarineLicenceCacheSpy.mockReturnValue({
          ...mockMarineLicenceApplication,
          waterFrameworkDirective: {
            uploadedFile: { filename: 'test.odt', fileSize: 1024 },
            uploadError: null
          }
        })
        mockCdpService.initiate.mockResolvedValue(createStandardUploadConfig())

        await waterFrameworkFileUploadController.handler(mockRequest, mockH)

        expect(mockRequest.logger.debug).toHaveBeenCalledWith(
          'Uploaded file without error found, but starting a new upload session'
        )
      })

      test.each([
        {
          scenario: 'no uploadedFile',
          waterFrameworkDirective: {}
        },
        {
          scenario: 'uploadedFile is null',
          waterFrameworkDirective: { uploadedFile: null }
        },
        {
          scenario: 'uploadedFile with uploadError (error takes precedence)',
          waterFrameworkDirective: {
            uploadedFile: { filename: 'test.odt', fileSize: 1024 },
            uploadError: {
              message: 'The selected file contains a virus',
              fieldName: 'file',
              fileType: 'odt'
            }
          }
        }
      ])(
        'should not log warning when $scenario',
        async ({ waterFrameworkDirective }) => {
          getMarineLicenceCacheSpy.mockReturnValue({
            ...mockMarineLicenceApplication,
            waterFrameworkDirective
          })
          mockCdpService.initiate.mockResolvedValue(
            createStandardUploadConfig()
          )

          await waterFrameworkFileUploadController.handler(mockRequest, mockH)

          expect(mockRequest.logger.debug).not.toHaveBeenCalledWith(
            'Uploaded file without error found, but starting a new upload session'
          )
        }
      )

      test('should map error message correctly in error summary', async () => {
        const testMessage = 'Test error message'
        getMarineLicenceCacheSpy.mockReturnValue({
          ...mockMarineLicenceApplication,
          waterFrameworkDirective: {
            uploadError: {
              message: testMessage,
              fieldName: 'file',
              fileType: 'odt'
            }
          }
        })
        mockCdpService.initiate.mockResolvedValue(createStandardUploadConfig())

        await waterFrameworkFileUploadController.handler(mockRequest, mockH)

        expectViewCalledWith(mockH, {
          errorSummary: expect.arrayContaining([
            expect.objectContaining({ text: testMessage })
          ])
        })
      })
    })
  })
})
