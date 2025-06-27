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
        pageTitle: 'File upload status',
        heading: 'Your file is currently being checked for viruses',
        projectName: 'Test Project',
        isProcessing: true,
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
        pageTitle: 'File upload status',
        heading: 'Your file is currently being checked for viruses',
        projectName: 'Test Project',
        isProcessing: true,
        filename: 'test.kml'
      })
    })

    test('should redirect to FILE_UPLOAD when status is ready', async () => {
      getExemptionCacheSpy.mockReturnValue({
        projectName: 'Test Project',
        siteDetails: { uploadConfig: mockUploadConfig }
      })

      mockCdpService.getStatus.mockResolvedValue({
        status: 'ready',
        filename: 'test.kml',
        fileSize: 1024,
        uploadedAt: '2023-01-01T00:00:00Z'
      })

      const h = { redirect: jest.fn() }

      await uploadAndWaitController.handler(mockRequest, h)

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'uploadedFile',
        {
          filename: 'test.kml',
          fileSize: 1024,
          uploadedAt: '2023-01-01T00:00:00Z',
          s3Key: 'test-upload-id',
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
          message: 'file is password protected',
          expected: 'The selected file is password protected'
        },
        {
          message: 'must be a kml file',
          expected: 'The selected file must be a KML file'
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

      expect(mockRequest.logger.debug).toHaveBeenCalledWith(
        'Upload status check',
        {
          uploadId: 'test-upload-id',
          status: 'pending',
          filename: 'test.kml'
        }
      )
    })
  })
})
