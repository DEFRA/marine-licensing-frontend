import Wreck from '@hapi/wreck'
import { CdpUploadService, UPLOAD_STATUSES } from './cdp-upload-service.js'
import { config } from '~/src/config/config.js'

// Mock dependencies
const mockLoggerDebug = jest.fn()
const mockLoggerInfo = jest.fn()
const mockLoggerWarn = jest.fn()
const mockLoggerError = jest.fn()

jest.mock('@hapi/wreck')
jest.mock('~/src/server/common/helpers/logging/logger.js', () => ({
  createLogger: () => ({
    debug: (...args) => mockLoggerDebug(...args),
    info: (...args) => mockLoggerInfo(...args),
    warn: (...args) => mockLoggerWarn(...args),
    error: (...args) => mockLoggerError(...args)
  })
}))

// Test data constants
const mockUploadId = 'b18ceadb-afb1-4955-a70b-256bf94444d5'
const mockRedirectUrl = '/success-page'
const mockStatusUrl = `https://cdp-uploader/status/${mockUploadId}`
const mockUploadUrl = `/upload-and-scan/${mockUploadId}`
const mockAllowedMimeTypes = [
  'application/vnd.google-earth.kml+xml',
  'application/zip'
]

describe('#CdpUploadService', () => {
  let service

  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe('Constructor', () => {
    test('Should initialize with default configuration and no MIME types', () => {
      // Given / When
      service = new CdpUploadService()

      // Then
      expect(service.allowedMimeTypes).toBeUndefined()
      expect(service.config).toEqual(config.get('cdpUploader'))
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        {
          cdpServiceBaseUrl: config.get('cdpUploader').cdpUploadServiceBaseUrl,
          appBaseUrl: config.get('appBaseUrl'),
          timeout: config.get('cdpUploader').timeout,
          maxFileSize: config.get('cdpUploader').maxFileSize,
          allowedMimeTypes: undefined
        },
        'CdpUploadService initialized'
      )
    })

    test('Should initialize with provided MIME types', () => {
      // Given / When
      service = new CdpUploadService(mockAllowedMimeTypes)

      // Then
      expect(service.allowedMimeTypes).toEqual(mockAllowedMimeTypes)
      expect(mockLoggerDebug).toHaveBeenCalledWith(
        expect.objectContaining({
          cdpServiceBaseUrl: config.get('cdpUploader').cdpUploadServiceBaseUrl,
          appBaseUrl: config.get('appBaseUrl'),
          allowedMimeTypes: mockAllowedMimeTypes
        }),
        'CdpUploadService initialized'
      )
    })
  })

  describe('initiate()', () => {
    beforeEach(() => {
      service = new CdpUploadService(mockAllowedMimeTypes)
    })

    describe('Given successful API response', () => {
      test('Should initiate upload session with constructor MIME types', async () => {
        // Given
        const mockResponse = {
          uploadId: mockUploadId,
          uploadUrl: mockUploadUrl,
          statusUrl: mockStatusUrl
        }

        Wreck.post.mockResolvedValue({
          res: { statusCode: 200 },
          payload: mockResponse
        })

        // When
        const result = await service.initiate({
          redirectUrl: mockRedirectUrl,
          s3Bucket: config.get('cdpUploader').s3Bucket
        })

        // Then
        expect(Wreck.post).toHaveBeenCalledWith(
          `${config.get('cdpUploader').cdpUploadServiceBaseUrl}/initiate`,
          expect.objectContaining({
            json: true,
            payload: expect.stringContaining(
              '"mimeTypes":["application/vnd.google-earth.kml+xml","application/zip"]'
            ),
            timeout: 30000
          })
        )

        expect(result).toEqual({
          uploadId: mockUploadId,
          uploadUrl: mockUploadUrl,
          statusUrl: mockStatusUrl,
          maxFileSize: config.get('cdpUploader').maxFileSize,
          allowedTypes: mockAllowedMimeTypes
        })

        expect(mockLoggerInfo).toHaveBeenCalledWith(
          {
            uploadId: mockUploadId,
            redirectUrl: mockRedirectUrl
          },
          'Upload session initiated successfully'
        )
      })

      test('Should override constructor MIME types with parameter', async () => {
        // Given
        const overrideMimeTypes = ['application/vnd.google-earth.kml+xml']
        const mockResponse = {
          uploadId: mockUploadId,
          uploadUrl: mockUploadUrl
        }

        Wreck.post.mockResolvedValue({
          res: { statusCode: 200 },
          payload: mockResponse
        })

        // When
        const result = await service.initiate({
          redirectUrl: mockRedirectUrl,
          s3Bucket: config.get('cdpUploader').s3Bucket,
          allowedMimeTypes: overrideMimeTypes
        })

        // Then
        expect(Wreck.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            payload: expect.stringContaining(
              '"mimeTypes":["application/vnd.google-earth.kml+xml"]'
            )
          })
        )

        expect(result.allowedTypes).toEqual(overrideMimeTypes)
      })

      test('Should include s3Path when provided', async () => {
        // Given
        const s3Path = 'uploads/kml-files'
        const mockResponse = {
          uploadId: mockUploadId,
          uploadUrl: mockUploadUrl
        }

        Wreck.post.mockResolvedValue({
          res: { statusCode: 200 },
          payload: mockResponse
        })

        // When
        await service.initiate({
          redirectUrl: mockRedirectUrl,
          s3Bucket: config.get('cdpUploader').s3Bucket,
          allowedMimeTypes: mockAllowedMimeTypes,
          s3Path
        })

        // Then
        expect(Wreck.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            payload: expect.stringContaining('"redirect":"/success-page"')
          })
        )

        expect(Wreck.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            payload: expect.stringContaining('"s3Path":"uploads/kml-files"')
          })
        )
      })

      test('Should default s3Path to empty string when not provided', async () => {
        // Given
        const mockResponse = {
          uploadId: mockUploadId,
          uploadUrl: mockUploadUrl
        }

        Wreck.post.mockResolvedValue({
          res: { statusCode: 200 },
          payload: mockResponse
        })

        // When
        await service.initiate({
          redirectUrl: mockRedirectUrl,
          s3Bucket: config.get('cdpUploader').s3Bucket
        })

        // Then
        expect(Wreck.post).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            payload: expect.stringContaining('"s3Path":""')
          })
        )
      })

      test('Should return empty array for allowedTypes when no MIME types are configured', async () => {
        // Given - Create service with no constructor MIME types
        const serviceWithNoMimeTypes = new CdpUploadService()
        const mockResponse = {
          uploadId: mockUploadId,
          uploadUrl: mockUploadUrl,
          statusUrl: mockStatusUrl
        }

        Wreck.post.mockResolvedValue({
          res: { statusCode: 200 },
          payload: mockResponse
        })

        // When - Don't pass allowedMimeTypes parameter
        const result = await serviceWithNoMimeTypes.initiate({
          redirectUrl: mockRedirectUrl,
          s3Bucket: config.get('cdpUploader').s3Bucket
        })

        // Then - Should return empty array for allowedTypes (covers line 148: mimeTypes ?? [])
        expect(result).toEqual({
          uploadId: mockUploadId,
          uploadUrl: mockUploadUrl,
          statusUrl: mockStatusUrl,
          maxFileSize: config.get('cdpUploader').maxFileSize,
          allowedTypes: []
        })

        // Verify the API was called (the exact mimeTypes format doesn't matter for this test)
        expect(Wreck.post).toHaveBeenCalledTimes(1)
      })
    })

    describe('Given validation errors', () => {
      test('Should throw error when redirectUrl is not provided', async () => {
        // Given / When / Then
        await expect(
          service.initiate({
            s3Bucket: config.get('cdpUploader').s3Bucket
          })
        ).rejects.toThrow('redirectUrl is required')
      })

      test('Should throw error when s3Bucket is not provided', async () => {
        // Given / When / Then
        await expect(
          service.initiate({
            redirectUrl: mockRedirectUrl
          })
        ).rejects.toThrow('S3 Bucket is required')
      })

      test('Should throw error when both redirectUrl and s3Bucket are not provided', async () => {
        // Given / When / Then
        await expect(service.initiate({})).rejects.toThrow(
          'redirectUrl is required'
        )
      })
    })

    describe('Given API error responses', () => {
      test('Should handle 400 Bad Request error', async () => {
        // Given
        Wreck.post.mockResolvedValue({
          res: { statusCode: 400, statusMessage: 'Bad Request' },
          payload: { error: 'Invalid request' }
        })

        // When / Then
        await expect(
          service.initiate({
            redirectUrl: mockRedirectUrl,
            s3Bucket: config.get('cdpUploader').s3Bucket
          })
        ).rejects.toThrow('API call failed with status: 400')

        expect(mockLoggerError).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 400,
            statusText: 'Bad Request',
            endpoint: '/initiate'
          }),
          'API call failed with status: 400'
        )
      })

      test('Should handle network timeout', async () => {
        // Given
        const networkError = new Error('Request timeout')
        networkError.code = 'ETIMEDOUT'
        Wreck.post.mockRejectedValue(networkError)

        // When / Then
        await expect(
          service.initiate({
            redirectUrl: mockRedirectUrl,
            s3Bucket: config.get('cdpUploader').s3Bucket
          })
        ).rejects.toThrow('Request timeout')

        expect(mockLoggerError).toHaveBeenCalledWith(
          expect.objectContaining({
            error: 'Request timeout'
          }),
          'Failed to initiate upload session'
        )
      })
    })
  })

  describe('getStatus()', () => {
    beforeEach(() => {
      service = new CdpUploadService()
    })

    describe('Given successful API responses', () => {
      test('Should return error status when no files uploaded yet', async () => {
        // Given
        const mockResponse = {
          uploadStatus: 'initiated',
          form: {}
        }

        Wreck.get.mockResolvedValue({
          res: { statusCode: 200 },
          payload: mockResponse
        })

        // When
        const result = await service.getStatus(mockUploadId, mockStatusUrl)

        // Then
        expect(Wreck.get).toHaveBeenCalledWith(mockStatusUrl, {
          json: true,
          timeout: config.get('cdpUploader').timeout
        })

        expect(result).toEqual({
          status: 'error',
          message: 'Select a file to upload',
          errorCode: 'NO_FILE_SELECTED',
          retryable: true
        })

        expect(mockLoggerDebug).toHaveBeenCalledWith(
          {
            uploadId: mockUploadId,
            status: 'error'
          },
          'Upload status retrieved'
        )
      })

      test('Should return scanning status when file is being scanned', async () => {
        // Given
        const mockResponse = {
          uploadStatus: 'ready',
          form: {
            file: {
              filename: 'test-coordinates.kml',
              contentType: 'application/vnd.google-earth.kml+xml',
              fileStatus: 'pending',
              contentLength: 1024,
              hasError: false
            }
          }
        }

        Wreck.get.mockResolvedValue({
          res: { statusCode: 200 },
          payload: mockResponse
        })

        // When
        const result = await service.getStatus(mockUploadId, mockStatusUrl)

        // Then
        expect(result).toEqual({
          status: 'scanning',
          filename: 'test-coordinates.kml',
          fileSize: 1024
        })
      })

      test('Should return ready status when file is complete and ready', async () => {
        // Given
        const mockResponse = {
          uploadStatus: 'ready',
          form: {
            file: {
              filename: 'test-coordinates.kml',
              fileStatus: 'complete',
              contentLength: 1024,
              hasError: false
            }
          }
        }

        Wreck.get.mockResolvedValue({
          res: { statusCode: 200 },
          payload: mockResponse
        })

        // When
        const result = await service.getStatus(mockUploadId, mockStatusUrl)

        // Then
        expect(result).toEqual({
          status: 'ready',
          filename: 'test-coordinates.kml',
          fileSize: 1024,
          completedAt: expect.any(String)
        })
      })

      test('Should return rejected status with virus detection error', async () => {
        // Given
        const mockResponse = {
          uploadStatus: 'ready',
          form: {
            file: {
              filename: 'virus-test.kml',
              fileStatus: 'rejected',
              contentLength: 1024,
              hasError: true,
              errorMessage: 'The selected file contains a virus'
            }
          }
        }

        Wreck.get.mockResolvedValue({
          res: { statusCode: 200 },
          payload: mockResponse
        })

        // When
        const result = await service.getStatus(mockUploadId, mockStatusUrl)

        // Then
        expect(result).toEqual({
          status: 'rejected',
          filename: 'virus-test.kml',
          fileSize: 1024,
          completedAt: expect.any(String),
          message: 'The selected file contains a virus',
          errorCode: 'VIRUS_DETECTED'
        })
      })

      test('Should return the s3 file data when the file is ready', async () => {
        // Given
        const mockResponse = {
          uploadStatus: 'ready',
          metadata: {},
          form: {
            file: {
              fileId: '74c0eee1-bb7f-4f97-b975-7ea2151cd630',
              filename: 'coordinates.zip',
              contentType: 'application/zip',
              fileStatus: 'complete',
              contentLength: 4321,
              checksumSha256: '2Vvqe1CDdtBezIBTQWyf3IYhc0dnuKgy/YeOY055s6g=',
              detectedContentType: 'application/zip',
              s3Key:
                's3Path/ac33e356-7c25-43e2-aedc-2b895edae1ec/74c0eee1-bb7f-4f97-b975-7ea2151cd630',
              s3Bucket: 'marine-licensing-files'
            },
            numberOfRejectedFiles: 0
          }
        }

        Wreck.get.mockResolvedValue({
          res: { statusCode: 200 },
          payload: mockResponse
        })

        // When
        const result = await service.getStatus(mockUploadId, mockStatusUrl)

        // Then
        expect(result.s3Location).toBeDefined()
      })
    })

    describe('Given file validation errors matching ML-70 acceptance criteria', () => {
      test('Should handle file too large error (AC4)', async () => {
        // Given
        const errorResponse = {
          uploadStatus: 'ready',
          form: {
            file: {
              filename: 'large-file.kml',
              fileStatus: 'rejected',
              hasError: true,
              errorMessage: 'The selected file must be smaller than 50MB'
            }
          }
        }

        Wreck.get.mockResolvedValue({
          res: { statusCode: 200 },
          payload: errorResponse
        })

        // When
        const result = await service.getStatus(mockUploadId, mockStatusUrl)

        // Then
        expect(result.status).toBe('rejected')
        expect(result.message).toBe(
          'The selected file must be smaller than 50MB'
        )
        expect(result.errorCode).toBe('FILE_TOO_LARGE')
      })

      test('Should handle empty file error (AC4)', async () => {
        // Given
        const errorResponse = {
          uploadStatus: 'ready',
          form: {
            file: {
              filename: 'empty.kml',
              fileStatus: 'rejected',
              hasError: true,
              errorMessage: 'The selected file is empty'
            }
          }
        }

        Wreck.get.mockResolvedValue({
          res: { statusCode: 200 },
          payload: errorResponse
        })

        // When
        const result = await service.getStatus(mockUploadId, mockStatusUrl)

        // Then
        expect(result.status).toBe('rejected')
        expect(result.message).toBe('The selected file is empty')
        expect(result.errorCode).toBe('FILE_EMPTY')
      })

      test('Should handle invalid file type error (AC4)', async () => {
        // Given
        const errorResponse = {
          uploadStatus: 'ready',
          form: {
            file: {
              filename: 'document.pdf',
              fileStatus: 'rejected',
              hasError: true,
              errorMessage: 'The selected file must be a KML file'
            }
          }
        }

        Wreck.get.mockResolvedValue({
          res: { statusCode: 200 },
          payload: errorResponse
        })

        // When
        const result = await service.getStatus(mockUploadId, mockStatusUrl)

        // Then
        expect(result.status).toBe('rejected')
        expect(result.message).toBe('The selected file must be a KML file')
        expect(result.errorCode).toBe('INVALID_FILE_TYPE')
      })

      test('Should handle generic upload error (AC4)', async () => {
        // Given
        const errorResponse = {
          uploadStatus: 'ready',
          form: {
            file: {
              filename: 'error.kml',
              fileStatus: 'rejected',
              hasError: true,
              errorMessage:
                'The selected file could not be uploaded – try again'
            }
          }
        }

        Wreck.get.mockResolvedValue({
          res: { statusCode: 200 },
          payload: errorResponse
        })

        // When
        const result = await service.getStatus(mockUploadId, mockStatusUrl)

        // Then
        expect(result.status).toBe('rejected')
        expect(result.message).toBe(
          'The selected file could not be uploaded – try again'
        )
        expect(result.errorCode).toBe('UPLOAD_ERROR')
      })
    })

    describe('Given API error responses', () => {
      test('Should handle 404 Not Found (upload session not found)', async () => {
        // Given
        Wreck.get.mockResolvedValue({
          res: { statusCode: 404 },
          payload: null
        })

        // When
        const result = await service.getStatus(mockUploadId, mockStatusUrl)

        // Then
        expect(result).toEqual({
          status: 'error',
          message: 'Upload session not found',
          errorCode: 'UPLOAD_ERROR',
          retryable: false
        })

        expect(mockLoggerWarn).toHaveBeenCalledWith(
          {
            uploadId: mockUploadId
          },
          'Upload session not found'
        )
      })

      test('Should handle 400 Bad Request error', async () => {
        // Given
        Wreck.get.mockResolvedValue({
          res: { statusCode: 400, statusMessage: 'Bad Request' },
          payload: { error: 'Invalid upload ID format' }
        })

        // When / Then
        await expect(
          service.getStatus(mockUploadId, mockStatusUrl)
        ).rejects.toThrow('API call failed with status: 400')

        expect(mockLoggerError).toHaveBeenCalledWith(
          {
            uploadId: mockUploadId,
            status: 400,
            statusText: 'Bad Request',
            endpoint: '/status'
          },
          'API call failed with status: 400'
        )
      })

      test('Should handle 500 Internal Server Error', async () => {
        // Given
        Wreck.get.mockResolvedValue({
          res: { statusCode: 500 },
          payload: null
        })

        // When
        const result = await service.getStatus(mockUploadId, mockStatusUrl)

        // Then
        expect(result).toEqual({
          status: 'error',
          message: 'Service temporarily unavailable',
          errorCode: 'UPLOAD_ERROR',
          retryable: true
        })
      })

      test('Should handle connection timeout gracefully', async () => {
        // Given
        const timeoutError = new Error('Request timeout')
        timeoutError.code = 'ETIMEDOUT'
        Wreck.get.mockRejectedValue(timeoutError)

        // When
        const result = await service.getStatus(mockUploadId, mockStatusUrl)

        // Then
        expect(result).toEqual({
          status: 'error',
          message: 'Unable to check status',
          errorCode: 'UPLOAD_ERROR',
          retryable: true
        })

        expect(mockLoggerError).toHaveBeenCalledWith(
          {
            uploadId: mockUploadId,
            error: 'Request timeout'
          },
          'Request timeout when checking status'
        )
      })

      test('Should handle connection reset gracefully', async () => {
        // Given
        const resetError = new Error('Connection reset')
        resetError.code = 'ECONNRESET'
        Wreck.get.mockRejectedValue(resetError)

        // When
        const result = await service.getStatus(mockUploadId, mockStatusUrl)

        // Then
        expect(result).toEqual({
          status: 'error',
          message: 'Unable to check status',
          errorCode: 'UPLOAD_ERROR',
          retryable: true
        })
      })
    })
  })

  describe('Constants and Exports', () => {
    test('Should export UPLOAD_STATUSES constants', () => {
      // Given / When / Then
      expect(UPLOAD_STATUSES).toEqual({
        INITIATED: 'initiated',
        PENDING: 'pending',
        READY: 'ready',
        COMPLETE: 'complete',
        REJECTED: 'rejected',
        SCANNING: 'scanning',
        ERROR: 'error'
      })
    })

    test('Should have correct status constant values for ML-70 requirements', () => {
      // Given / When / Then
      expect(UPLOAD_STATUSES.PENDING).toBe('pending')
      expect(UPLOAD_STATUSES.READY).toBe('ready')
      expect(UPLOAD_STATUSES.REJECTED).toBe('rejected')
      expect(UPLOAD_STATUSES.ERROR).toBe('error')
    })
  })

  describe('Edge cases and boundary conditions', () => {
    beforeEach(() => {
      service = new CdpUploadService()
    })

    test('Should handle malformed response with no form data', async () => {
      // Given
      Wreck.get.mockResolvedValue({
        res: { statusCode: 200 },
        payload: { uploadStatus: 'pending' }
      })

      // When
      const result = await service.getStatus(mockUploadId, mockStatusUrl)

      // Then
      expect(result).toEqual({
        status: 'error',
        message: 'Select a file to upload',
        errorCode: 'NO_FILE_SELECTED',
        retryable: true
      })
    })

    test('Should handle form with keys but no valid file data', async () => {
      // Given - Form object exists with keys but no valid file data
      Wreck.get.mockResolvedValue({
        res: { statusCode: 200 },
        payload: {
          uploadStatus: 'initiated',
          form: {
            someKey: null // Has keys but Object.values(form)[0] returns null
          }
        }
      })

      // When
      const result = await service.getStatus(mockUploadId, mockStatusUrl)

      // Then
      expect(result).toEqual({
        status: 'error',
        message: 'Select a file to upload',
        errorCode: 'NO_FILE_SELECTED',
        retryable: true
      })
    })

    test('Should handle unknown upload status values', async () => {
      // Given - Unknown uploadStatus that falls to default case
      Wreck.get.mockResolvedValue({
        res: { statusCode: 200 },
        payload: {
          uploadStatus: 'unknown-status', // Unknown status hits default case
          form: {}
        }
      })

      // When
      const result = await service.getStatus(mockUploadId, mockStatusUrl)

      // Then
      expect(result).toEqual({
        status: 'error', // No file selected returns error
        message: 'Select a file to upload',
        retryable: true,
        errorCode: 'NO_FILE_SELECTED'
      })
    })

    test('Should handle ready upload status with no form data', async () => {
      // Given - Ready uploadStatus but no form data to cover READY case in _mapUploadStatus
      Wreck.get.mockResolvedValue({
        res: { statusCode: 200 },
        payload: {
          uploadStatus: 'ready', // Ready status should map to 'scanning'
          form: {} // No form data, so _mapUploadStatus is called
        }
      })

      // When
      const result = await service.getStatus(mockUploadId, mockStatusUrl)

      // Then
      expect(result).toEqual({
        status: 'error', // No file selected returns error
        message: 'Select a file to upload',
        errorCode: 'NO_FILE_SELECTED',
        retryable: true
      })
    })

    test('Should handle unknown upload status with file data to cover _determineOverallStatus default', async () => {
      // Given - Unknown uploadStatus with file data to hit different path
      Wreck.get.mockResolvedValue({
        res: { statusCode: 200 },
        payload: {
          uploadStatus: 'unknown-status', // Unknown status
          form: {
            file: {
              filename: 'test.kml',
              fileStatus: 'unknown-file-status', // Unknown file status hits default
              contentLength: 1024,
              hasError: false
            }
          }
        }
      })

      // When
      const result = await service.getStatus(mockUploadId, mockStatusUrl)

      // Then
      expect(result).toEqual({
        status: 'pending', // Default case returns 'pending'
        filename: 'test.kml',
        fileSize: 1024
      })
    })

    test('Should handle maximum file size (50MB limit from ML-70)', async () => {
      // Given
      const maxSizeResponse = {
        uploadStatus: 'ready',
        form: {
          file: {
            filename: 'max-size.kml',
            fileStatus: 'complete',
            contentLength: 50 * 1000 * 1000, // 50MB limit
            hasError: false
          }
        }
      }

      Wreck.get.mockResolvedValue({
        res: { statusCode: 200 },
        payload: maxSizeResponse
      })

      // When
      const result = await service.getStatus(mockUploadId, mockStatusUrl)

      // Then
      expect(result.fileSize).toBe(50 * 1000 * 1000)
      expect(result.status).toBe('ready')
    })

    test('Should validate timestamp format is ISO string', async () => {
      // Given
      const mockResponse = {
        uploadStatus: 'ready',
        form: {
          file: {
            filename: 'test.kml',
            fileStatus: 'complete',
            contentLength: 1024,
            hasError: false
          }
        }
      }

      Wreck.get.mockResolvedValue({
        res: { statusCode: 200 },
        payload: mockResponse
      })

      // When
      const result = await service.getStatus(mockUploadId, mockStatusUrl)

      // Then
      expect(result.completedAt).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
      )
    })
  })

  describe('ML-70 specific test scenarios', () => {
    beforeEach(() => {
      service = new CdpUploadService()
    })

    test('Should support KML file type validation', async () => {
      // Given - KML MIME type for coordinate file upload
      const kmlService = new CdpUploadService([
        'application/vnd.google-earth.kml+xml'
      ])

      const mockResponse = {
        uploadId: mockUploadId,
        uploadUrl: mockUploadUrl
      }

      Wreck.post.mockResolvedValue({
        res: { statusCode: 200 },
        payload: mockResponse
      })

      // When
      const result = await kmlService.initiate({
        redirectUrl: mockRedirectUrl,
        s3Bucket: config.get('cdpUploader').s3Bucket
      })

      // Then
      expect(result.allowedTypes).toEqual([
        'application/vnd.google-earth.kml+xml'
      ])
      expect(Wreck.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          payload: expect.stringContaining(
            '"mimeTypes":["application/vnd.google-earth.kml+xml"]'
          )
        })
      )
    })

    test('Should support Shapefile (ZIP) validation', async () => {
      // Given - ZIP MIME type for Shapefile upload
      const shapefileService = new CdpUploadService(['application/zip'])

      const mockResponse = {
        uploadId: mockUploadId,
        uploadUrl: mockUploadUrl
      }

      Wreck.post.mockResolvedValue({
        res: { statusCode: 200 },
        payload: mockResponse
      })

      // When
      const result = await shapefileService.initiate({
        redirectUrl: mockRedirectUrl,
        s3Bucket: config.get('cdpUploader').s3Bucket
      })

      // Then
      expect(result.allowedTypes).toEqual(['application/zip'])
      expect(Wreck.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          payload: expect.stringContaining('"mimeTypes":["application/zip"]')
        })
      )
    })

    test('Should handle both KML and Shapefile types as per ML-70 requirements', async () => {
      // Given - Both file types supported as per ML-70
      const bothTypesService = new CdpUploadService([
        'application/vnd.google-earth.kml+xml',
        'application/zip'
      ])

      const mockResponse = {
        uploadId: mockUploadId,
        uploadUrl: mockUploadUrl
      }

      Wreck.post.mockResolvedValue({
        res: { statusCode: 200 },
        payload: mockResponse
      })

      // When
      const result = await bothTypesService.initiate({
        redirectUrl: mockRedirectUrl,
        s3Bucket: config.get('cdpUploader').s3Bucket
      })

      // Then
      expect(result.allowedTypes).toEqual([
        'application/vnd.google-earth.kml+xml',
        'application/zip'
      ])
    })

    test('Should enforce 50MB file size limit as specified in ML-70', () => {
      // Given / When
      service = new CdpUploadService()

      // Then
      expect(service.config.maxFileSize).toBe(50 * 1000 * 1000) // 50MB as per ML-70
    })

    test('Should support organizing coordinate files with s3Path', async () => {
      // Given - Organize coordinate files in folders as per ML-70
      const kmlService = new CdpUploadService([
        'application/vnd.google-earth.kml+xml'
      ])
      const s3Path = 'exemptions/site-details/coordinates'
      const mockResponse = {
        uploadId: mockUploadId,
        uploadUrl: mockUploadUrl
      }

      Wreck.post.mockResolvedValue({
        res: { statusCode: 200 },
        payload: mockResponse
      })

      // When
      await kmlService.initiate({
        redirectUrl: mockRedirectUrl,
        s3Bucket: config.get('cdpUploader').s3Bucket,
        s3Path
      })

      // Then
      expect(Wreck.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          payload: expect.stringContaining(
            '"s3Path":"exemptions/site-details/coordinates"'
          )
        })
      )

      expect(Wreck.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          payload: expect.stringContaining(
            '"mimeTypes":["application/vnd.google-earth.kml+xml"]'
          )
        })
      )
    })
  })

  describe('Filename extraction (via FilenameHandler)', () => {
    it('should return regular filename when available', () => {
      const service = new CdpUploadService()
      const fileData = {
        filename: 'test-file.kml'
      }

      const result = service.filenameHandler.extractFilename(fileData)
      expect(result).toBe('test-file.kml')
    })

    it('should decode RFC-2047 base64 encoded filename', () => {
      const service = new CdpUploadService()
      const fileData = {
        encodedfilename: '=?utf-8?B?Y29vcmRvbm7DqWVzLWR1LXNpdGUua21s?='
      }

      const result = service.filenameHandler.extractFilename(fileData)
      expect(result).toBe('coordonnées-du-site.kml')
    })

    it('should decode RFC-2047 quoted-printable encoded filename', () => {
      const service = new CdpUploadService()
      const fileData = {
        encodedfilename: '=?utf-8?Q?coordonn=C3=A9es_du_site.kml?='
      }

      const result = service.filenameHandler.extractFilename(fileData)
      expect(result).toBe('coordonnées du site.kml')
    })

    it('should prefer regular filename over encoded filename when both present', () => {
      const service = new CdpUploadService()
      const fileData = {
        filename: 'regular-file.kml',
        encodedfilename: '=?UTF-8?B?encoded-file.kml?='
      }

      const result = service.filenameHandler.extractFilename(fileData)
      expect(result).toBe('regular-file.kml')
    })

    it('should return encoded filename as-is if decoding fails', () => {
      const service = new CdpUploadService()
      const fileData = {
        encodedfilename: '=?INVALID?ENCODING?broken?='
      }

      const result = service.filenameHandler.extractFilename(fileData)
      expect(result).toBe('=?INVALID?ENCODING?broken?=')
    })

    it('should decode RFC-2047 with Asian characters', () => {
      const service = new CdpUploadService()
      const fileData = {
        encodedfilename: '=?utf-8?B?6IqB5Zub5LqN5qCHLmttbA==?='
      }

      const result = service.filenameHandler.extractFilename(fileData)
      expect(result).toBe('芁四亍标.kml')
    })

    it('should return fallback when neither filename nor encodedfilename present', () => {
      const service = new CdpUploadService()
      const fileData = {}

      const result = service.filenameHandler.extractFilename(fileData)
      expect(result).toBe('unknown-file')
    })
  })

  describe('extractS3Location', () => {
    it('should extract complete S3 location for AC8 compliance', () => {
      const service = new CdpUploadService()
      const cdpResponse = {
        uploadStatus: 'ready',
        form: {
          'file-upload': {
            fileId: '9fcaabe5-77ec-44db-8356-3a6e8dc51b13',
            filename: 'coordinates.kml',
            contentType: 'application/vnd.google-earth.kml+xml',
            fileStatus: 'complete',
            contentLength: 4321,
            s3Key: 'path/to/9fcaabe5-77ec-44db-8356-3a6e8dc51b13',
            s3Bucket: 'marine-licensing-files',
            detectedContentType: 'application/vnd.google-earth.kml+xml',
            checksumSha256: 'bng5jOVC6TxEgwTUlX4DikFtDEYEc8vQTsOP0ZAv21c='
          }
        }
      }

      const result = service.extractS3Location(cdpResponse)

      expect(result).toEqual({
        s3Bucket: 'marine-licensing-files',
        s3Key: 'path/to/9fcaabe5-77ec-44db-8356-3a6e8dc51b13',
        fileId: '9fcaabe5-77ec-44db-8356-3a6e8dc51b13',
        s3Url:
          's3://marine-licensing-files/path/to/9fcaabe5-77ec-44db-8356-3a6e8dc51b13',
        detectedContentType: 'application/vnd.google-earth.kml+xml',
        checksumSha256: 'bng5jOVC6TxEgwTUlX4DikFtDEYEc8vQTsOP0ZAv21c='
      })
    })

    it('should return null when file is not ready', () => {
      const service = new CdpUploadService()
      const cdpResponse = {
        uploadStatus: 'pending',
        form: {}
      }

      const result = service.extractS3Location(cdpResponse)
      expect(result).toBeNull()
    })

    it('should return null when missing required S3 fields', () => {
      const service = new CdpUploadService()
      const cdpResponse = {
        uploadStatus: 'ready',
        form: {
          'file-upload': {
            fileId: '9fcaabe5-77ec-44db-8356-3a6e8dc51b13',
            filename: 'coordinates.kml',
            fileStatus: 'complete',
            contentLength: 11264
            // Missing s3Key and s3Bucket
          }
        }
      }

      const result = service.extractS3Location(cdpResponse)
      expect(result).toBeNull()
    })
  })

  describe('_extractErrorCode()', () => {
    let service

    beforeEach(() => {
      service = new CdpUploadService()
    })

    test('Should return UPLOAD_ERROR when no keyword matches are found', () => {
      const errorMessage = 'Some unexpected error that matches no keywords'
      const result = service._extractErrorCode(errorMessage)
      expect(result).toBe('UPLOAD_ERROR')
    })

    test('Should return specific error code when keyword matches', () => {
      const errorMessage = 'File contains a virus'
      const result = service._extractErrorCode(errorMessage)
      expect(result).toBe('VIRUS_DETECTED')
    })
  })
})
