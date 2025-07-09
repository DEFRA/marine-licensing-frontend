import { createServer } from '~/src/server/index.js'
import {
  uploadAndWaitController,
  UPLOAD_AND_WAIT_VIEW_ROUTE
} from '~/src/server/exemption/site-details/upload-and-wait/controller.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import * as cdpUploadService from '~/src/services/cdp-upload-service/index.js'
import * as fileValidationService from '~/src/services/file-validation/index.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { routes } from '~/src/server/common/constants/routes.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock('~/src/services/cdp-upload-service/index.js')
jest.mock('~/src/services/file-validation/index.js')

describe('#uploadAndWait', () => {
  /** @type {Server} */
  let server
  let getExemptionCacheSpy
  let updateExemptionSiteDetailsSpy
  let mockCdpService
  let mockFileValidationService

  beforeAll(async () => {
    server = await createServer()
    await server.initialize()
  })

  beforeEach(() => {
    jest.resetAllMocks()

    getExemptionCacheSpy = jest
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)

    updateExemptionSiteDetailsSpy = jest
      .spyOn(cacheUtils, 'updateExemptionSiteDetails')
      .mockImplementation()

    mockCdpService = {
      getStatus: jest.fn()
    }

    mockFileValidationService = {
      validateFileExtension: jest.fn()
    }

    jest
      .spyOn(cdpUploadService, 'getCdpUploadService')
      .mockReturnValue(mockCdpService)

    jest
      .spyOn(fileValidationService, 'getFileValidationService')
      .mockReturnValue(mockFileValidationService)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('#uploadAndWaitController', () => {
    const mockRequest = {
      logger: {
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      }
    }

    const mockUploadConfig = {
      uploadId: 'test-upload-id',
      statusUrl: 'test-status-url',
      fileType: 'kml'
    }

    test('should redirect to CHOOSE_FILE_UPLOAD_TYPE when no upload config exists', async () => {
      getExemptionCacheSpy.mockReturnValue({})
      const h = { redirect: jest.fn() }

      await uploadAndWaitController.handler(mockRequest, h)

      expect(h.redirect).toHaveBeenCalledWith(routes.CHOOSE_FILE_UPLOAD_TYPE)
    })

    test('should show waiting page when status is pending', async () => {
      getExemptionCacheSpy.mockReturnValue({
        projectName: 'Test Project',
        siteDetails: { uploadConfig: mockUploadConfig }
      })

      mockCdpService.getStatus.mockResolvedValue({
        status: 'pending',
        filename: 'test.kml'
      })

      const h = { view: jest.fn() }

      await uploadAndWaitController.handler(mockRequest, h)

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
        filename: 'test.kml'
      })
    })

    test('should show waiting page when status is scanning', async () => {
      getExemptionCacheSpy.mockReturnValue({
        projectName: 'Test Project',
        siteDetails: { uploadConfig: mockUploadConfig }
      })

      mockCdpService.getStatus.mockResolvedValue({
        status: 'scanning',
        filename: 'test.kml'
      })

      const h = { view: jest.fn() }

      await uploadAndWaitController.handler(mockRequest, h)

      expect(h.view).toHaveBeenCalledWith(UPLOAD_AND_WAIT_VIEW_ROUTE, {
        pageTitle: 'Checking your file...',
        heading: 'Checking your file...',
        projectName: 'Test Project',
        isProcessing: true,
        pageRefreshTimeInSeconds: 2,
        filename: 'test.kml'
      })
    })

    test('should redirect to FILE_UPLOAD when status is ready and file validation passes', async () => {
      getExemptionCacheSpy.mockReturnValue({
        projectName: 'Test Project',
        siteDetails: { uploadConfig: mockUploadConfig }
      })

      const statusResponse = {
        status: 'ready',
        filename: 'test.kml',
        fileSize: 3754,
        completedAt: '2025-07-02T21:29:38.471Z',
        s3Location: {
          s3Bucket: 'test-bucket',
          s3Key:
            's3Path/a283cf8a-b13e-4ae3-85e9-7c3db9a4a076/558d2f8d-5b78-47e7-9958-e315763f44af',
          fileId: '558d2f8d-5b78-47e7-9958-e315763f44af',
          s3Url:
            's3://test-bucket/s3Path/a283cf8a-b13e-4ae3-85e9-7c3db9a4a076/558d2f8d-5b78-47e7-9958-e315763f44af',
          detectedContentType: 'application/vnd.google-earth.kml+xml',
          checksumSha256: '2Vvqe1CDdtBezIBTQWyf3IYhc0dnuKgy/YeOY055s6g='
        }
      }

      mockCdpService.getStatus.mockResolvedValue(statusResponse)

      // Mock successful file validation
      mockFileValidationService.validateFileExtension.mockReturnValue({
        isValid: true,
        extension: 'kml',
        errorMessage: null
      })

      const h = { redirect: jest.fn() }

      await uploadAndWaitController.handler(mockRequest, h)

      expect(
        mockFileValidationService.validateFileExtension
      ).toHaveBeenCalledWith('test.kml', ['kml'])

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'uploadedFile',
        statusResponse
      )

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'uploadConfig',
        undefined
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.FILE_UPLOAD)
    })

    test('should redirect to FILE_UPLOAD with error when file validation fails for wrong extension', async () => {
      getExemptionCacheSpy.mockReturnValue({
        projectName: 'Test Project',
        siteDetails: { uploadConfig: mockUploadConfig }
      })

      const statusResponse = {
        status: 'ready',
        filename: 'document.pdf',
        fileSize: 1024,
        completedAt: '2025-07-02T21:29:38.471Z'
      }

      mockCdpService.getStatus.mockResolvedValue(statusResponse)

      // Mock failed file validation
      mockFileValidationService.validateFileExtension.mockReturnValue({
        isValid: false,
        extension: 'pdf',
        errorMessage: 'The selected file must be a KML file'
      })

      const h = { redirect: jest.fn() }

      await uploadAndWaitController.handler(mockRequest, h)

      expect(
        mockFileValidationService.validateFileExtension
      ).toHaveBeenCalledWith('document.pdf', ['kml'])

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'uploadError',
        {
          message: 'The selected file must be a KML file',
          fieldName: 'file',
          fileType: 'kml'
        }
      )

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'uploadConfig',
        undefined
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.FILE_UPLOAD)

      // Should not store uploaded file when validation fails
      expect(updateExemptionSiteDetailsSpy).not.toHaveBeenCalledWith(
        mockRequest,
        'uploadedFile',
        expect.anything()
      )
    })

    test('should validate shapefile extensions correctly', async () => {
      const shapefileUploadConfig = {
        ...mockUploadConfig,
        fileType: 'shapefile'
      }

      getExemptionCacheSpy.mockReturnValue({
        projectName: 'Test Project',
        siteDetails: { uploadConfig: shapefileUploadConfig }
      })

      const statusResponse = {
        status: 'ready',
        filename: 'coordinates.zip',
        fileSize: 5432
      }

      mockCdpService.getStatus.mockResolvedValue(statusResponse)

      // Mock successful shapefile validation
      mockFileValidationService.validateFileExtension.mockReturnValue({
        isValid: true,
        extension: 'zip',
        errorMessage: null
      })

      const h = { redirect: jest.fn() }

      await uploadAndWaitController.handler(mockRequest, h)

      expect(
        mockFileValidationService.validateFileExtension
      ).toHaveBeenCalledWith('coordinates.zip', ['zip'])

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'uploadedFile',
        statusResponse
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.FILE_UPLOAD)
    })

    test('should redirect to FILE_UPLOAD with error when status is rejected', async () => {
      getExemptionCacheSpy.mockReturnValue({
        projectName: 'Test Project',
        siteDetails: { uploadConfig: mockUploadConfig }
      })

      mockCdpService.getStatus.mockResolvedValue({
        status: 'rejected',
        message: 'The selected file contains a virus'
      })

      const h = { redirect: jest.fn() }

      await uploadAndWaitController.handler(mockRequest, h)

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'uploadError',
        {
          message: 'The selected file contains a virus',
          fieldName: 'file',
          fileType: 'kml'
        }
      )

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'uploadConfig',
        undefined
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.FILE_UPLOAD)
    })

    test('should handle different error message types correctly', async () => {
      const testCases = [
        {
          message: 'file is empty',
          expected: 'The selected file is empty'
        },
        {
          message: 'file must be smaller than 50MB',
          expected: 'The selected file must be smaller than 50 MB'
        },
        {
          message: 'must be a kml file',
          expected: 'The selected file must be a KML file'
        },
        {
          message: 'Select a file to upload',
          expected: 'Select a file to upload'
        },
        {
          message: 'unknown error',
          expected: 'The selected file could not be uploaded – try again'
        }
      ]

      for (const testCase of testCases) {
        getExemptionCacheSpy.mockReturnValue({
          projectName: 'Test Project',
          siteDetails: { uploadConfig: mockUploadConfig }
        })

        mockCdpService.getStatus.mockResolvedValue({
          status: 'rejected',
          message: testCase.message
        })

        const h = { redirect: jest.fn() }

        await uploadAndWaitController.handler(mockRequest, h)

        expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
          mockRequest,
          'uploadError',
          expect.objectContaining({
            message: testCase.expected
          })
        )
      }
    })

    test('should handle unknown file type message correctly', async () => {
      const testCase = {
        message: 'must be a foo file',
        expected: 'The selected file could not be uploaded – try again'
      }

      const mockUploadConfigUnknownFile = {
        ...mockUploadConfig,
        fileType: 'foo'
      }

      getExemptionCacheSpy.mockReturnValue({
        projectName: 'Test Project',
        siteDetails: { uploadConfig: mockUploadConfigUnknownFile }
      })

      mockCdpService.getStatus.mockResolvedValue({
        status: 'rejected',
        message: testCase.message
      })

      const h = { redirect: jest.fn() }

      await uploadAndWaitController.handler(mockRequest, h)

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'uploadError',
        expect.objectContaining({
          message: testCase.expected
        })
      )
    })

    test('should handle shapefile error message correctly', async () => {
      const shapefileUploadConfig = {
        ...mockUploadConfig,
        fileType: 'shapefile'
      }

      getExemptionCacheSpy.mockReturnValue({
        projectName: 'Test Project',
        siteDetails: { uploadConfig: shapefileUploadConfig }
      })

      mockCdpService.getStatus.mockResolvedValue({
        status: 'rejected',
        message: 'must be a shapefile'
      })

      const h = { redirect: jest.fn() }

      await uploadAndWaitController.handler(mockRequest, h)

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'uploadError',
        expect.objectContaining({
          message: 'The selected file must be a Shapefile'
        })
      )
    })

    test('should redirect to CHOOSE_FILE_UPLOAD_TYPE for unknown status', async () => {
      getExemptionCacheSpy.mockReturnValue({
        projectName: 'Test Project',
        siteDetails: { uploadConfig: mockUploadConfig }
      })

      mockCdpService.getStatus.mockResolvedValue({
        status: 'unknown',
        filename: 'test.kml'
      })

      const h = { redirect: jest.fn() }

      await uploadAndWaitController.handler(mockRequest, h)

      expect(mockRequest.logger.warn).toHaveBeenCalledWith(
        'Unknown upload status',
        {
          uploadId: 'test-upload-id',
          status: 'unknown'
        }
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.CHOOSE_FILE_UPLOAD_TYPE)
    })

    test('should handle CDP service errors gracefully', async () => {
      getExemptionCacheSpy.mockReturnValue({
        projectName: 'Test Project',
        siteDetails: { uploadConfig: mockUploadConfig }
      })

      mockCdpService.getStatus.mockRejectedValue(
        new Error('Service unavailable')
      )

      const h = { redirect: jest.fn() }

      await uploadAndWaitController.handler(mockRequest, h)

      expect(mockRequest.logger.error).toHaveBeenCalledWith(
        'Failed to check upload status',
        {
          error: 'Service unavailable',
          uploadId: 'test-upload-id'
        }
      )

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'uploadConfig',
        undefined
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.CHOOSE_FILE_UPLOAD_TYPE)
    })

    test('should log debug information on successful status check', async () => {
      getExemptionCacheSpy.mockReturnValue({
        projectName: 'Test Project',
        siteDetails: { uploadConfig: mockUploadConfig }
      })

      mockCdpService.getStatus.mockResolvedValue({
        status: 'pending',
        filename: 'test.kml'
      })

      const h = { view: jest.fn() }

      await uploadAndWaitController.handler(mockRequest, h)

      expect(mockRequest.logger.debug).toHaveBeenCalledTimes(2)
    })

    test('should handle unknown file type in getAllowedExtensions default case', async () => {
      const unknownFileTypeConfig = {
        ...mockUploadConfig,
        fileType: 'unknown'
      }

      getExemptionCacheSpy.mockReturnValue({
        projectName: 'Test Project',
        siteDetails: { uploadConfig: unknownFileTypeConfig }
      })

      const statusResponse = {
        status: 'ready',
        filename: 'test.unknown',
        fileSize: 1024,
        completedAt: '2025-07-02T21:29:38.471Z'
      }

      mockCdpService.getStatus.mockResolvedValue(statusResponse)

      // Mock file validation to fail due to empty allowed extensions array
      mockFileValidationService.validateFileExtension.mockReturnValue({
        isValid: false,
        extension: 'unknown',
        errorMessage: 'The selected file could not be uploaded – try again'
      })

      const h = { redirect: jest.fn() }

      await uploadAndWaitController.handler(mockRequest, h)

      // Verify that validateFileExtension is called with empty array (default case)
      expect(
        mockFileValidationService.validateFileExtension
      ).toHaveBeenCalledWith('test.unknown', [])

      // Verify error handling for unknown file type
      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'uploadError',
        {
          message: 'The selected file could not be uploaded – try again',
          fieldName: 'file',
          fileType: 'unknown'
        }
      )

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'uploadConfig',
        undefined
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.FILE_UPLOAD)
    })
  })
})
