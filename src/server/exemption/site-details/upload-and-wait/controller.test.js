import { createServer } from '~/src/server/index.js'
import {
  uploadAndWaitController,
  UPLOAD_AND_WAIT_VIEW_ROUTE
} from '~/src/server/exemption/site-details/upload-and-wait/controller.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import * as cdpUploadService from '~/src/services/cdp-upload-service/index.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { routes } from '~/src/server/common/constants/routes.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock('~/src/services/cdp-upload-service/index.js')

describe('#uploadAndWait', () => {
  /** @type {Server} */
  let server
  let getExemptionCacheSpy
  let updateExemptionSiteDetailsSpy
  let mockCdpService

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

    jest
      .spyOn(cdpUploadService, 'getCdpUploadService')
      .mockReturnValue(mockCdpService)
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

    test('should redirect to FILE_UPLOAD when status is ready', async () => {
      getExemptionCacheSpy.mockReturnValue({
        projectName: 'Test Project',
        siteDetails: { uploadConfig: mockUploadConfig }
      })

      const statusResponse = {
        status: 'ready',
        filename: 'test.zip',
        fileSize: 3754,
        completedAt: '2025-07-02T21:29:38.471Z',
        s3Location: {
          s3Bucket: 'test-bucket',
          s3Key:
            's3Path/a283cf8a-b13e-4ae3-85e9-7c3db9a4a076/558d2f8d-5b78-47e7-9958-e315763f44af',
          fileId: '558d2f8d-5b78-47e7-9958-e315763f44af',
          s3Url:
            's3://test-bucket/s3Path/a283cf8a-b13e-4ae3-85e9-7c3db9a4a076/558d2f8d-5b78-47e7-9958-e315763f44af',
          detectedContentType: 'application/zip',
          checksumSha256: '2Vvqe1CDdtBezIBTQWyf3IYhc0dnuKgy/YeOY055s6g='
        }
      }

      mockCdpService.getStatus.mockResolvedValue(statusResponse)

      const h = { redirect: jest.fn() }

      await uploadAndWaitController.handler(mockRequest, h)

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

      expect(mockRequest.logger.debug).toHaveBeenCalledTimes(1)
    })
  })
})
