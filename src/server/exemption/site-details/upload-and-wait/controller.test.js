import { createServer } from '~/src/server/index.js'
import {
  uploadAndWaitController,
  UPLOAD_AND_WAIT_VIEW_ROUTE
} from '~/src/server/exemption/site-details/upload-and-wait/controller.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import * as cdpUploadService from '~/src/services/cdp-upload-service/index.js'
import * as fileValidationService from '~/src/services/file-validation/index.js'
import * as authenticatedRequests from '~/src/server/common/helpers/authenticated-requests.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { config } from '~/src/config/config.js'
import path from 'path'
import hapi from '@hapi/hapi'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock('~/src/services/cdp-upload-service/index.js')
jest.mock('~/src/services/file-validation/index.js')
jest.mock('~/src/server/common/helpers/authenticated-requests.js')
jest.mock('~/src/config/config.js')
jest.mock('path')
jest.mock('@hapi/hapi')

// Mock logger configuration
jest.mock('~/src/server/common/helpers/logging/logger-options.js', () => ({
  loggerOptions: {
    enabled: true,
    ignorePaths: ['/health'],
    redact: {
      paths: []
    }
  }
}))

// Mock logger
jest.mock('~/src/server/common/helpers/logging/logger.js', () => ({
  createLogger: jest.fn().mockReturnValue({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn()
  })
}))

// Mock path.join to return a fixed path
path.join.mockImplementation((...args) => args.join('/'))

// Mock manifest file
jest.mock('~/src/config/nunjucks/context/context.js', () => ({
  getContext: jest.fn().mockReturnValue({})
}))

// Mock session configuration
jest.mock('~/src/server/common/helpers/session-cache/session-cache.js', () => ({
  sessionConfig: {
    cache: {
      name: 'test-cache',
      ttl: 24 * 60 * 60 * 1000
    }
  }
}))

// Mock cache engine
jest.mock('~/src/server/common/helpers/session-cache/cache-engine.js', () => ({
  getCacheEngine: jest.fn().mockReturnValue({
    start: jest.fn(),
    stop: jest.fn(),
    isReady: jest.fn().mockReturnValue(true),
    validateSegmentName: jest.fn(),
    get: jest.fn(),
    set: jest.fn(),
    drop: jest.fn()
  })
}))

// Mock server cache
const mockServerCache = {
  get: jest.fn(),
  set: jest.fn(),
  drop: jest.fn()
}

// Mock Hapi server
const mockServer = {
  app: {},
  cache: jest.fn().mockReturnValue(mockServerCache),
  register: jest.fn(),
  ext: jest.fn(),
  initialize: jest.fn(),
  stop: jest.fn()
}

hapi.server.mockReturnValue(mockServer)

describe('#uploadAndWait', () => {
  /** @type {Server} */
  let server
  let getExemptionCacheSpy
  let updateExemptionSiteDetailsSpy
  let mockCdpService
  let mockFileValidationService
  let authenticatedPostRequestSpy

  beforeAll(async () => {
    config.get.mockImplementation((key) => {
      switch (key) {
        case 'cdpUploader':
          return {
            s3Bucket: 'test-bucket'
          }
        case 'root':
          return '/test/root'
        case 'assetPath':
          return '/test/assets'
        case 'env':
          return 'test'
        case 'isDev':
          return false
        case 'isTest':
          return true
        case 'isProd':
          return false
        case 'serviceName':
          return 'test-service'
        case 'serviceUrl':
          return 'http://test-service'
        case 'port':
          return 3000
        case 'staticCacheControl':
          return 'public, max-age=86400'
        case 'cookieOptions':
          return {
            ttl: 24 * 60 * 60 * 1000,
            encoding: 'base64json',
            isSecure: true,
            isHttpOnly: true,
            clearInvalid: true,
            strictHeader: true
          }
        case 'sessionCookieName':
          return 'test-session'
        case 'redisHost':
          return 'localhost'
        case 'redisPort':
          return 6379
        case 'redisPassword':
          return ''
        case 'redisPrefix':
          return 'test:'
        case 'redisTls':
          return false
        case 'redisDb':
          return 0
        case 'redisTimeout':
          return 2000
        case 'sessionTtl':
          return 24 * 60 * 60 * 1000
        case 'trustStorePath':
          return '/test/trust-store'
        case 'trustStoreType':
          return 'test'
        case 'trustStorePassword':
          return 'test'
        case 'trustStoreCerts':
          return []
        case 'trustStoreEnabled':
          return false
        case 'session.cache.name':
          return 'test-cache'
        case 'session.cache.engine':
          return 'memory'
        case 'session.cookie.password':
          return 'test-password'
        case 'session.cookie.ttl':
          return 24 * 60 * 60 * 1000
        case 'session.cookie.secure':
          return false
        case 'redis.ttl':
          return 24 * 60 * 60 * 1000
        case 'log':
          return {
            enabled: true,
            redact: []
          }
        default:
          return undefined
      }
    })

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

    authenticatedPostRequestSpy = jest
      .spyOn(authenticatedRequests, 'authenticatedPostRequest')
      .mockResolvedValue({
        statusCode: 200,
        payload: {
          message: 'success',
          value: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                geometry: {
                  type: 'Point',
                  coordinates: [0, 0]
                }
              }
            ]
          }
        }
      })

    jest
      .spyOn(cdpUploadService, 'getCdpUploadService')
      .mockReturnValue(mockCdpService)

    jest
      .spyOn(fileValidationService, 'getFileValidationService')
      .mockReturnValue(mockFileValidationService)
  })

  afterAll(async () => {
    if (server) {
      await server.stop({ timeout: 0 })
    }
  })

  describe('#uploadAndWaitController', () => {
    const mockRequest = {
      logger: {
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        info: jest.fn()
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

    test('should redirect to REVIEW_SITE_DETAILS when status is ready and file validation passes', async () => {
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
          s3Key: 'test-key',
          fileId: 'test-id',
          s3Url: 'test-url',
          checksumSha256: 'test-checksum'
        }
      }

      mockCdpService.getStatus.mockResolvedValue(statusResponse)

      // Mock successful file validation
      mockFileValidationService.validateFileExtension.mockReturnValue({
        isValid: true,
        extension: 'kml',
        errorMessage: null
      })

      // Mock config for S3 bucket
      config.get.mockImplementation((key) => {
        if (key === 'cdpUploader') {
          return {
            s3Bucket: 'test-bucket'
          }
        }
        return undefined
      })

      const h = { redirect: jest.fn() }

      await uploadAndWaitController.handler(mockRequest, h)

      expect(
        mockFileValidationService.validateFileExtension
      ).toHaveBeenCalledWith('test.kml', ['kml'])

      expect(authenticatedPostRequestSpy).toHaveBeenCalledWith(
        mockRequest,
        '/geo-parser/extract',
        {
          s3Bucket: 'test-bucket',
          s3Key: 'test-key',
          fileType: 'kml'
        }
      )

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'uploadedFile',
        {
          ...statusResponse,
          s3Location: {
            s3Bucket: 'test-bucket',
            s3Key: statusResponse.s3Location.s3Key,
            fileId: statusResponse.s3Location.fileId,
            s3Url: statusResponse.s3Location.s3Url,
            checksumSha256: statusResponse.s3Location.checksumSha256
          }
        }
      )

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'extractedCoordinates',
        [
          {
            type: 'Point',
            coordinates: [0, 0]
          }
        ]
      )

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'geoJSON',
        {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [0, 0]
              }
            }
          ]
        }
      )

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'featureCount',
        1
      )

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'uploadConfig',
        undefined
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
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
        fileSize: 5432,
        completedAt: '2025-07-02T21:29:38.471Z',
        s3Location: {
          s3Bucket: 'test-bucket',
          s3Key: 'test-key',
          fileId: 'test-id',
          s3Url: 'test-url',
          checksumSha256: 'test-checksum'
        }
      }

      mockCdpService.getStatus.mockResolvedValue(statusResponse)

      // Mock successful shapefile validation
      mockFileValidationService.validateFileExtension.mockReturnValue({
        isValid: true,
        extension: 'zip',
        errorMessage: null
      })

      // Mock config for S3 bucket
      config.get.mockImplementation((key) => {
        if (key === 'cdpUploader') {
          return {
            s3Bucket: 'test-bucket'
          }
        }
        return undefined
      })

      const h = { redirect: jest.fn() }

      await uploadAndWaitController.handler(mockRequest, h)

      expect(
        mockFileValidationService.validateFileExtension
      ).toHaveBeenCalledWith('coordinates.zip', ['zip'])

      expect(authenticatedPostRequestSpy).toHaveBeenCalledWith(
        mockRequest,
        '/geo-parser/extract',
        {
          s3Bucket: 'test-bucket',
          s3Key: 'test-key',
          fileType: 'shapefile'
        }
      )

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'uploadedFile',
        {
          ...statusResponse,
          s3Location: {
            s3Bucket: 'test-bucket',
            s3Key: statusResponse.s3Location.s3Key,
            fileId: statusResponse.s3Location.fileId,
            s3Url: statusResponse.s3Location.s3Url,
            checksumSha256: statusResponse.s3Location.checksumSha256
          }
        }
      )

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'extractedCoordinates',
        [
          {
            type: 'Point',
            coordinates: [0, 0]
          }
        ]
      )

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'geoJSON',
        {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [0, 0]
              }
            }
          ]
        }
      )

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'featureCount',
        1
      )

      expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
        mockRequest,
        'uploadConfig',
        undefined
      )

      expect(h.redirect).toHaveBeenCalledWith(routes.REVIEW_SITE_DETAILS)
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
