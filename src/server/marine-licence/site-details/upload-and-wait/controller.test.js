import { vi } from 'vitest'
import { uploadAndWaitController } from '#src/server/marine-licence/site-details/upload-and-wait/controller.js'
import { UPLOAD_AND_WAIT_VIEW_ROUTE } from '#src/server/common/helpers/file-upload/constants.js'
import * as mlCacheUtils from '#src/server/common/helpers/marine-licence/session-cache/utils.js'
import * as cdpUploadService from '#src/services/cdp-upload-service/index.js'
import * as geoParseUpload from '#src/server/common/helpers/file-upload/geo-parse-upload.js'
import * as authenticatedRequests from '#src/server/common/helpers/authenticated-requests.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import { config } from '#src/config/config.js'

vi.mock('~/src/server/common/helpers/marine-licence/session-cache/utils.js')
vi.mock('~/src/services/cdp-upload-service/index.js')
vi.mock('~/src/server/common/helpers/authenticated-requests.js')
vi.mock('~/src/server/common/helpers/exemptions/save-site-details.js')

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

// Test Data Factories
const createMockUploadConfig = (overrides = {}) => ({
  uploadId: 'test-upload-id',
  statusUrl: 'test-status-url',
  fileType: 'kml',
  ...overrides
})

const createMockStatusResponse = (status, overrides = {}) => ({
  status,
  filename: 'test.kml',
  fileSize: 1024,
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
  siteDetails: [{ uploadConfig: createMockUploadConfig() }],
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

const createMockGeoJsonResponse = (featureCount = 1) => ({
  statusCode: 200,
  payload: {
    message: 'success',
    value: {
      type: 'FeatureCollection',
      features: Array.from({ length: featureCount }, (_, index) => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [index + 1, index + 2]
        }
      }))
    }
  }
})

const createMockResponseHandler = () => ({
  view: vi.fn(),
  redirect: vi.fn()
})

// Mock Configuration Setup
const setupMockConfig = () => {
  config.get.mockImplementation((key) => {
    if (key === 'cdpUploader') {
      return { s3Bucket: 'test-bucket' }
    }
    return undefined
  })
}

// Service Mock Setup Helpers
const setupMockServices = () => {
  const mockCdpService = {
    getStatus: vi.fn()
  }

  vi.spyOn(cdpUploadService, 'getCdpUploadService').mockReturnValue(
    mockCdpService
  )

  const mockValidateUploadedFile = vi.spyOn(
    geoParseUpload,
    'validateUploadedFile'
  )

  return { mockCdpService, mockValidateUploadedFile }
}

const setupCacheSpies = () => {
  const getMarineLicenceCacheSpy = vi
    .spyOn(mlCacheUtils, 'getMarineLicenceCache')
    .mockReturnValue(createMockMarineLicence())

  const updateMarineLicenceSiteDetailsSpy = vi
    .spyOn(mlCacheUtils, 'updateMarineLicenceSiteDetails')
    .mockImplementation()

  return {
    getMarineLicenceCacheSpy,
    updateMarineLicenceSiteDetailsSpy
  }
}

const setupAuthenticatedRequestSpy = () => {
  return vi
    .spyOn(authenticatedRequests, 'authenticatedPostRequest')
    .mockResolvedValue(createMockGeoJsonResponse(1))
}

// Error Testing Helpers
const expectRejectedStatusHandling = async (
  mockRequest,
  getMarineLicenceCacheSpy,
  mockCdpService,
  updateMarineLicenceSiteDetailsSpy,
  errorCode,
  rawMessage,
  expectedErrorMessage,
  fileType = 'kml'
) => {
  getMarineLicenceCacheSpy.mockReturnValue(
    createMockMarineLicence({
      siteDetails: [{ uploadConfig: createMockUploadConfig({ fileType }) }]
    })
  )
  mockCdpService.getStatus.mockResolvedValue({
    status: 'rejected',
    errorCode,
    message: rawMessage
  })

  const h = createMockResponseHandler()

  await uploadAndWaitController.handler(mockRequest, h)

  expect(updateMarineLicenceSiteDetailsSpy).toHaveBeenCalledWith(
    mockRequest,
    expect.any(Object),
    0,
    'uploadError',
    {
      message: expectedErrorMessage,
      fieldName: 'file',
      fileType
    }
  )
  expect(updateMarineLicenceSiteDetailsSpy).toHaveBeenCalledWith(
    mockRequest,
    expect.any(Object),
    0,
    'uploadConfig',
    null
  )
  expect(h.redirect).toHaveBeenCalledWith(
    marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD
  )
}

const expectFileValidationFailure = async (
  mockRequest,
  getMarineLicenceCacheSpy,
  mockCdpService,
  mockValidateUploadedFile,
  updateMarineLicenceSiteDetailsSpy,
  filename,
  fileType,
  errorMessage
) => {
  getMarineLicenceCacheSpy.mockReturnValue(
    createMockMarineLicence({
      siteDetails: [{ uploadConfig: createMockUploadConfig({ fileType }) }]
    })
  )

  const statusResponse = createMockStatusResponse('ready', { filename })
  mockCdpService.getStatus.mockResolvedValue(statusResponse)

  mockValidateUploadedFile.mockResolvedValue({
    isValid: false,
    extension: filename.split('.').pop(),
    errorMessage
  })

  const h = createMockResponseHandler()

  await uploadAndWaitController.handler(mockRequest, h)

  expect(updateMarineLicenceSiteDetailsSpy).toHaveBeenCalledWith(
    mockRequest,
    expect.any(Object),
    0,
    'uploadError',
    {
      message: errorMessage,
      fieldName: 'file',
      fileType
    }
  )
  expect(updateMarineLicenceSiteDetailsSpy).toHaveBeenCalledWith(
    mockRequest,
    expect.any(Object),
    0,
    'uploadConfig',
    null
  )
  expect(h.redirect).toHaveBeenCalledWith(
    marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD
  )

  expect(updateMarineLicenceSiteDetailsSpy).not.toHaveBeenCalledWith(
    mockRequest,
    'uploadedFile',
    expect.anything()
  )
}

describe('#uploadAndWait', () => {
  let getMarineLicenceCacheSpy
  let updateMarineLicenceSiteDetailsSpy
  let mockCdpService
  let mockValidateUploadedFile
  let authenticatedPostRequestSpy

  beforeEach(() => {
    setupMockConfig()

    const cacheSpies = setupCacheSpies()
    getMarineLicenceCacheSpy = cacheSpies.getMarineLicenceCacheSpy
    updateMarineLicenceSiteDetailsSpy =
      cacheSpies.updateMarineLicenceSiteDetailsSpy

    const services = setupMockServices()
    mockCdpService = services.mockCdpService
    mockValidateUploadedFile = services.mockValidateUploadedFile

    authenticatedPostRequestSpy = setupAuthenticatedRequestSpy()
  })

  describe('#uploadAndWaitController', () => {
    const mockRequest = createMockRequest()

    describe('when no upload config exists', () => {
      test('should redirect to MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE', async () => {
        getMarineLicenceCacheSpy.mockReturnValue({})
        const h = createMockResponseHandler()

        await uploadAndWaitController.handler(mockRequest, h)

        expect(h.redirect).toHaveBeenCalledWith(
          marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE
        )
      })
    })

    describe('when checking upload status', () => {
      test('should show waiting page when status is pending', async () => {
        getMarineLicenceCacheSpy.mockReturnValue(createMockMarineLicence())
        mockCdpService.getStatus.mockResolvedValue(
          createMockStatusResponse('pending')
        )
        const h = createMockResponseHandler()

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
          filename: 'test.kml',
          tryAgainLink: marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
        })
      })

      test('should show waiting page when status is scanning', async () => {
        getMarineLicenceCacheSpy.mockReturnValue(createMockMarineLicence())
        mockCdpService.getStatus.mockResolvedValue(
          createMockStatusResponse('scanning')
        )
        const h = createMockResponseHandler()

        await uploadAndWaitController.handler(mockRequest, h)

        expect(h.view).toHaveBeenCalledWith(UPLOAD_AND_WAIT_VIEW_ROUTE, {
          pageTitle: 'Checking your file...',
          heading: 'Checking your file...',
          projectName: 'Test Project',
          isProcessing: true,
          pageRefreshTimeInSeconds: 2,
          filename: 'test.kml',
          tryAgainLink: marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
        })
      })

      test('should redirect to MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE for unknown status', async () => {
        getMarineLicenceCacheSpy.mockReturnValue(createMockMarineLicence())
        mockCdpService.getStatus.mockResolvedValue({
          status: 'unknown',
          filename: 'test.kml'
        })

        const h = createMockResponseHandler()

        await uploadAndWaitController.handler(mockRequest, h)

        expect(mockRequest.logger.warn).toHaveBeenCalledWith(
          {
            uploadId: 'test-upload-id',
            status: 'unknown'
          },
          'FileUpload: Unknown upload status'
        )

        expect(h.redirect).toHaveBeenCalledWith(
          marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE
        )
      })
    })

    describe('when file upload is ready', () => {
      describe('with valid KML file', () => {
        test('should process file and redirect to site details', async () => {
          getMarineLicenceCacheSpy.mockReturnValue(createMockMarineLicence())
          const statusResponse = createMockStatusResponse('ready')
          mockCdpService.getStatus.mockResolvedValue(statusResponse)

          mockValidateUploadedFile.mockResolvedValue({
            isValid: true,
            extension: 'kml',
            errorMessage: null
          })

          const h = createMockResponseHandler()

          await uploadAndWaitController.handler(mockRequest, h)

          expect(authenticatedPostRequestSpy).toHaveBeenCalledWith(
            mockRequest,
            '/geo-parser/extract',
            {
              s3Bucket: 'test-bucket',
              s3Key: 'test-key',
              fileType: 'kml'
            }
          )

          expect(h.redirect).toHaveBeenCalledWith(
            marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD
          )
        })
      })

      describe('with valid Shapefile', () => {
        test('should process shapefile and redirect to site details', async () => {
          getMarineLicenceCacheSpy.mockReturnValue(
            createMockMarineLicence({
              siteDetails: [
                {
                  uploadConfig: createMockUploadConfig({
                    fileType: 'shapefile'
                  })
                }
              ]
            })
          )

          const statusResponse = createMockStatusResponse('ready', {
            filename: 'coordinates.zip'
          })
          mockCdpService.getStatus.mockResolvedValue(statusResponse)

          mockValidateUploadedFile.mockResolvedValue({
            isValid: true,
            extension: 'zip',
            errorMessage: null
          })

          const h = createMockResponseHandler()

          await uploadAndWaitController.handler(mockRequest, h)

          expect(authenticatedPostRequestSpy).toHaveBeenCalledWith(
            mockRequest,
            '/geo-parser/extract',
            {
              s3Bucket: 'test-bucket',
              s3Key: 'test-key',
              fileType: 'shapefile'
            }
          )

          expect(h.redirect).toHaveBeenCalledWith(
            marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD
          )
        })
      })
    })

    describe('when file validation fails', () => {
      test('should redirect to file upload with error for wrong extension', async () => {
        await expectFileValidationFailure(
          mockRequest,
          getMarineLicenceCacheSpy,
          mockCdpService,
          mockValidateUploadedFile,
          updateMarineLicenceSiteDetailsSpy,
          'document.pdf',
          'kml',
          'The selected file must be a KML file'
        )
      })
    })

    describe('when upload is rejected', () => {
      test('should redirect to file upload with virus error message', async () => {
        await expectRejectedStatusHandling(
          mockRequest,
          getMarineLicenceCacheSpy,
          mockCdpService,
          updateMarineLicenceSiteDetailsSpy,
          'VIRUS_DETECTED',
          'The selected file contains a virus',
          'The selected file contains a virus'
        )
      })

      test('should handle error status the same as rejected status', async () => {
        getMarineLicenceCacheSpy.mockReturnValue(createMockMarineLicence())
        mockCdpService.getStatus.mockResolvedValue({
          status: 'error',
          message: 'Processing failed'
        })

        const h = createMockResponseHandler()

        await uploadAndWaitController.handler(mockRequest, h)

        expect(updateMarineLicenceSiteDetailsSpy).toHaveBeenCalledWith(
          mockRequest,
          expect.any(Object),
          0,
          'uploadError',
          {
            message: 'The selected file could not be uploaded – try again',
            fieldName: 'file',
            fileType: 'kml'
          }
        )

        expect(updateMarineLicenceSiteDetailsSpy).toHaveBeenCalledWith(
          mockRequest,
          expect.any(Object),
          0,
          'uploadConfig',
          null
        )

        expect(h.redirect).toHaveBeenCalledWith(
          marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD
        )
      })
    })

    describe('when geo-parser API fails', () => {
      test('should handle geo-parser API errors gracefully', async () => {
        getMarineLicenceCacheSpy.mockReturnValue(createMockMarineLicence())
        const statusResponse = createMockStatusResponse('ready')
        mockCdpService.getStatus.mockResolvedValue(statusResponse)

        mockValidateUploadedFile.mockResolvedValue({
          isValid: true,
          extension: 'kml',
          errorMessage: null
        })

        authenticatedPostRequestSpy.mockRejectedValue(
          new Error('Geo-parser service unavailable')
        )

        const h = createMockResponseHandler()

        await uploadAndWaitController.handler(mockRequest, h)

        expect(authenticatedPostRequestSpy).toHaveBeenCalledWith(
          mockRequest,
          '/geo-parser/extract',
          {
            s3Bucket: 'test-bucket',
            s3Key: 'test-key',
            fileType: 'kml'
          }
        )

        expect(mockRequest.logger.error).toHaveBeenCalledWith(
          {
            err: expect.any(Error),
            filename: 'test.kml',
            fileType: 'kml',
            errorCode: null,
            mappedMessage:
              'The selected file could not be processed – try again'
          },
          'FileUpload: ERROR: Failed to extract coordinates from uploaded file'
        )

        expect(updateMarineLicenceSiteDetailsSpy).toHaveBeenCalledWith(
          mockRequest,
          expect.any(Object),
          0,
          'uploadError',
          {
            message: 'The selected file could not be processed – try again',
            fieldName: 'file',
            fileType: 'kml'
          }
        )

        expect(updateMarineLicenceSiteDetailsSpy).toHaveBeenCalledWith(
          mockRequest,
          expect.any(Object),
          0,
          'uploadConfig',
          null
        )

        expect(h.redirect).toHaveBeenCalledWith(
          marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD
        )
      })

      test('should handle SHAPEFILE_MISSING_CORE_FILES error from geo-parser', async () => {
        getMarineLicenceCacheSpy.mockReturnValue(
          createMockMarineLicence({
            siteDetails: [
              {
                uploadConfig: createMockUploadConfig({ fileType: 'shapefile' })
              }
            ]
          })
        )
        const statusResponse = createMockStatusResponse('ready', {
          filename: 'coordinates.zip'
        })
        mockCdpService.getStatus.mockResolvedValue(statusResponse)

        mockValidateUploadedFile.mockResolvedValue({
          isValid: true,
          extension: 'zip',
          errorMessage: null
        })

        const geoParserError = new Error('Shapefile validation failed')
        geoParserError.data = {
          payload: {
            message: 'SHAPEFILE_MISSING_CORE_FILES'
          }
        }
        authenticatedPostRequestSpy.mockRejectedValue(geoParserError)

        const h = createMockResponseHandler()

        await uploadAndWaitController.handler(mockRequest, h)

        expect(mockRequest.logger.error).toHaveBeenCalledWith(
          {
            err: geoParserError,
            filename: 'coordinates.zip',
            fileType: 'shapefile',
            errorCode: 'SHAPEFILE_MISSING_CORE_FILES',
            mappedMessage:
              'The selected file must include .shp .shx and .dbf files'
          },
          'FileUpload: ERROR: Failed to extract coordinates from uploaded file'
        )

        expect(updateMarineLicenceSiteDetailsSpy).toHaveBeenCalledWith(
          mockRequest,
          expect.any(Object),
          0,
          'uploadError',
          {
            message: 'The selected file must include .shp .shx and .dbf files',
            fieldName: 'file',
            fileType: 'shapefile'
          }
        )

        expect(updateMarineLicenceSiteDetailsSpy).toHaveBeenCalledWith(
          mockRequest,
          expect.any(Object),
          0,
          'uploadConfig',
          null
        )

        expect(h.redirect).toHaveBeenCalledWith(
          marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD
        )
      })
    })

    describe('when service errors occur', () => {
      test('should handle CDP service errors gracefully', async () => {
        getMarineLicenceCacheSpy.mockReturnValue(createMockMarineLicence())
        mockCdpService.getStatus.mockRejectedValue(
          new Error('Service unavailable')
        )

        const h = createMockResponseHandler()

        await uploadAndWaitController.handler(mockRequest, h)

        expect(mockRequest.logger.error).toHaveBeenCalledWith(
          {
            err: expect.any(Error),
            uploadId: 'test-upload-id'
          },
          'FileUpload: ERROR: Failed to check upload status'
        )

        expect(updateMarineLicenceSiteDetailsSpy).toHaveBeenCalledWith(
          mockRequest,
          expect.any(Object),
          0,
          'uploadConfig',
          null
        )

        expect(h.redirect).toHaveBeenCalledWith(
          marineLicenceRoutes.MARINE_LICENCE_CHOOSE_FILE_UPLOAD_TYPE
        )
      })
    })

    describe('edge cases', () => {
      test('should handle missing s3Location in status response', async () => {
        getMarineLicenceCacheSpy.mockReturnValue(createMockMarineLicence())
        const statusResponse = createMockStatusResponse('ready')
        delete statusResponse.s3Location
        mockCdpService.getStatus.mockResolvedValue(statusResponse)

        mockValidateUploadedFile.mockResolvedValue({
          isValid: true,
          extension: 'kml',
          errorMessage: null
        })

        const h = createMockResponseHandler()

        await uploadAndWaitController.handler(mockRequest, h)

        expect(updateMarineLicenceSiteDetailsSpy).toHaveBeenCalledWith(
          mockRequest,
          expect.any(Object),
          0,
          'uploadError',
          {
            message: 'The selected file could not be processed – try again',
            fieldName: 'file',
            fileType: 'kml'
          }
        )

        expect(updateMarineLicenceSiteDetailsSpy).toHaveBeenCalledWith(
          mockRequest,
          expect.any(Object),
          0,
          'uploadConfig',
          null
        )
        expect(h.redirect).toHaveBeenCalledWith(
          marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD
        )
      })

      test('should handle empty filename in status response', async () => {
        getMarineLicenceCacheSpy.mockReturnValue(createMockMarineLicence())
        mockCdpService.getStatus.mockResolvedValue({
          status: 'pending',
          filename: ''
        })

        const h = createMockResponseHandler()

        await uploadAndWaitController.handler(mockRequest, h)

        expect(h.view).toHaveBeenCalledWith(UPLOAD_AND_WAIT_VIEW_ROUTE, {
          pageTitle: 'Checking your file...',
          heading: 'Checking your file...',
          projectName: 'Test Project',
          isProcessing: true,
          pageRefreshTimeInSeconds: 2,
          filename: '',
          tryAgainLink: marineLicenceRoutes.MARINE_LICENCE_FILE_UPLOAD,
          cancelLink: marineLicenceRoutes.MARINE_LICENCE_TASK_LIST
        })
      })
    })
  })
})
