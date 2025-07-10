import { createServer } from '~/src/server/index.js'
import {
  fileUploadController,
  FILE_UPLOAD_VIEW_ROUTE
} from '~/src/server/exemption/site-details/file-upload/controller.js'
import * as cacheUtils from '~/src/server/common/helpers/session-cache/utils.js'
import * as cdpUploadService from '~/src/services/cdp-upload-service/index.js'
import { mockExemption } from '~/src/server/test-helpers/mocks.js'
import { routes } from '~/src/server/common/constants/routes.js'
import { config } from '~/src/config/config.js'

jest.mock('~/src/server/common/helpers/session-cache/utils.js')
jest.mock('~/src/services/cdp-upload-service/index.js')

describe('#fileUpload', () => {
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
      initiate: jest.fn(),
      getStatus: jest.fn()
    }

    jest
      .spyOn(cdpUploadService, 'getCdpUploadService')
      .mockReturnValue(mockCdpService)
  })

  afterAll(async () => {
    await server.stop({ timeout: 0 })
  })

  describe('#fileUploadController', () => {
    const mockRequest = {
      logger: {
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      },
      server: {
        plugins: {
          crumb: {
            generate: jest.fn().mockReturnValue('mock-csrf-token')
          }
        }
      }
    }

    const mockH = {
      view: jest.fn(),
      redirect: jest.fn()
    }

    beforeEach(() => {
      mockH.view.mockClear()
      mockH.redirect.mockClear()
      mockRequest.server.plugins.crumb.generate.mockClear()
    })

    describe('AC1 - Display page based on file type selection', () => {
      test('Should redirect to file type selection when no fileUploadType is set', async () => {
        // Given - No file type selected
        getExemptionCacheSpy.mockReturnValue({
          ...mockExemption,
          siteDetails: {}
        })

        // When
        await fileUploadController.handler(mockRequest, mockH)

        // Then
        expect(mockH.redirect).toHaveBeenCalledWith(
          routes.CHOOSE_FILE_UPLOAD_TYPE
        )
      })

      test('Should display KML upload page with correct title and content', async () => {
        // Given - KML file type selected
        getExemptionCacheSpy.mockReturnValue({
          ...mockExemption,
          siteDetails: { fileUploadType: 'kml' }
        })

        mockCdpService.initiate.mockResolvedValue({
          uploadId: 'test-upload-id',
          uploadUrl: 'https://upload.example.com',
          statusUrl: 'https://status.example.com',
          maxFileSize: 50000000
        })

        // When
        await fileUploadController.handler(mockRequest, mockH)

        // Then
        expect(mockH.view).toHaveBeenCalledWith(
          FILE_UPLOAD_VIEW_ROUTE,
          expect.objectContaining({
            pageTitle: 'Upload a file',
            heading: 'Upload a KML file',
            projectName: 'Test Project',
            acceptAttribute: '.kml',
            fileUploadType: 'kml',
            backLink: routes.CHOOSE_FILE_UPLOAD_TYPE,
            cancelLink: `${routes.TASK_LIST}?cancel=site-details`
          })
        )
      })

      test('Should display Shapefile upload page with correct title and content', async () => {
        // Given - Shapefile type selected
        getExemptionCacheSpy.mockReturnValue({
          ...mockExemption,
          siteDetails: { fileUploadType: 'shapefile' }
        })

        mockCdpService.initiate.mockResolvedValue({
          uploadId: 'test-upload-id',
          uploadUrl: 'https://upload.example.com',
          statusUrl: 'https://status.example.com',
          maxFileSize: 50000000
        })

        // When
        await fileUploadController.handler(mockRequest, mockH)

        // Then
        expect(mockH.view).toHaveBeenCalledWith(
          FILE_UPLOAD_VIEW_ROUTE,
          expect.objectContaining({
            pageTitle: 'Upload a file',
            heading: 'Upload a Shapefile',
            projectName: 'Test Project',
            acceptAttribute: '.zip',
            fileUploadType: 'shapefile'
          })
        )
      })
    })

    describe('AC2 & AC3 - File upload functionality (Choose file & Drop file)', () => {
      test('Should initialize CDP upload session for KML', async () => {
        // Given - KML file type
        getExemptionCacheSpy.mockReturnValue({
          ...mockExemption,
          siteDetails: { fileUploadType: 'kml' }
        })

        mockCdpService.initiate.mockResolvedValue({
          uploadId: 'test-upload-id',
          uploadUrl: 'https://upload.example.com',
          statusUrl: 'https://status.example.com',
          maxFileSize: 50000000
        })

        // When
        await fileUploadController.handler(mockRequest, mockH)

        // Then - Should get CDP service without MIME types
        expect(cdpUploadService.getCdpUploadService).toHaveBeenCalledWith()

        // And CDP should be initiated with correct parameters
        expect(mockCdpService.initiate).toHaveBeenCalledWith({
          redirectUrl: `${config.get('appBaseUrl')}${routes.UPLOAD_AND_WAIT}`,
          s3Path: 'exemptions',
          s3Bucket: config.get('cdpUploader').s3Bucket
        })
      })

      test('Should initialize CDP upload session for Shapefile', async () => {
        // Given - Shapefile type
        getExemptionCacheSpy.mockReturnValue({
          ...mockExemption,
          siteDetails: { fileUploadType: 'shapefile' }
        })

        mockCdpService.initiate.mockResolvedValue({
          uploadId: 'test-upload-id',
          uploadUrl: 'https://upload.example.com',
          statusUrl: 'https://status.example.com',
          maxFileSize: 50000000
        })

        // When
        await fileUploadController.handler(mockRequest, mockH)

        // Then - Should get CDP service without MIME types
        expect(cdpUploadService.getCdpUploadService).toHaveBeenCalledWith()
      })

      test('Should store upload configuration in session', async () => {
        // Given
        getExemptionCacheSpy.mockReturnValue({
          ...mockExemption,
          siteDetails: { fileUploadType: 'kml' }
        })

        const mockUploadConfig = {
          uploadId: 'test-upload-id',
          uploadUrl: 'https://upload.example.com',
          statusUrl: 'https://status.example.com',
          maxFileSize: 50000000
        }

        mockCdpService.initiate.mockResolvedValue(mockUploadConfig)

        // When
        await fileUploadController.handler(mockRequest, mockH)

        // Then - Should store upload config in session
        expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
          mockRequest,
          'uploadConfig',
          {
            uploadId: 'test-upload-id',
            statusUrl: 'https://status.example.com',
            fileType: 'kml'
          }
        )
      })
    })

    describe('AC4 - Validation and error handling', () => {
      test('Should display error from session and clear it after display', async () => {
        // Given - Error stored in session from previous upload attempt
        getExemptionCacheSpy.mockReturnValue({
          ...mockExemption,
          siteDetails: {
            fileUploadType: 'kml',
            uploadError: {
              message: 'The selected file contains a virus',
              fieldName: 'file',
              fileType: 'kml'
            }
          }
        })

        mockCdpService.initiate.mockResolvedValue({
          uploadId: 'test-upload-id',
          uploadUrl: 'https://upload.example.com',
          statusUrl: 'https://status.example.com',
          maxFileSize: 50000000
        })

        // When
        await fileUploadController.handler(mockRequest, mockH)

        // Then - Should display error and clear it from session
        expect(mockH.view).toHaveBeenCalledWith(
          FILE_UPLOAD_VIEW_ROUTE,
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

        expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
          mockRequest,
          'uploadError',
          undefined
        )

        expect(mockRequest.logger.debug).toHaveBeenCalledWith(
          'Displaying upload error from session',
          expect.objectContaining({
            message: 'The selected file contains a virus',
            fieldName: 'file',
            fileType: 'kml'
          })
        )
      })

      test('Should handle CDP service initialization failure', async () => {
        // Given - CDP service fails to initialize
        getExemptionCacheSpy.mockReturnValue({
          ...mockExemption,
          siteDetails: { fileUploadType: 'kml' }
        })

        mockCdpService.initiate.mockRejectedValue(
          new Error('CDP service unavailable')
        )

        // When
        await fileUploadController.handler(mockRequest, mockH)

        // Then - Should log error and redirect to file type selection
        expect(mockRequest.logger.error).toHaveBeenCalledWith(
          'Failed to initialize file upload',
          expect.objectContaining({
            error: 'CDP service unavailable',
            exemptionId: mockExemption.id,
            fileUploadType: 'kml'
          })
        )

        expect(mockH.redirect).toHaveBeenCalledWith(
          routes.CHOOSE_FILE_UPLOAD_TYPE
        )
      })

      test('Logs a warning before re-uploading a file', async () => {
        // Given - File already uploaded, and no uploadError
        getExemptionCacheSpy.mockReturnValue({
          ...mockExemption,
          siteDetails: {
            fileUploadType: 'kml',
            uploadError: null,
            uploadedFile: {
              filename: 'test.kml',
              fileSize: 1024
            }
          }
        })
        // When
        await fileUploadController.handler(mockRequest, mockH)
        // Then - it logs a warning twice
        expect(mockRequest.logger.debug).toHaveBeenCalledTimes(2)
      })
    })

    describe('Template data and navigation', () => {
      test('Should include correct navigation links', async () => {
        // Given
        getExemptionCacheSpy.mockReturnValue({
          ...mockExemption,
          siteDetails: { fileUploadType: 'kml' }
        })

        mockCdpService.initiate.mockResolvedValue({
          uploadId: 'test-upload-id',
          uploadUrl: 'https://upload.example.com',
          statusUrl: 'https://status.example.com',
          maxFileSize: 50000000
        })

        // When
        await fileUploadController.handler(mockRequest, mockH)

        // Then - AC6 & AC7: Should have correct back and cancel links
        expect(mockH.view).toHaveBeenCalledWith(
          FILE_UPLOAD_VIEW_ROUTE,
          expect.objectContaining({
            backLink: routes.CHOOSE_FILE_UPLOAD_TYPE, // AC7 - Back to file type selection
            cancelLink: `${routes.TASK_LIST}?cancel=site-details` // AC6 - Cancel to task list
          })
        )
      })

      test('Should not include CSRF token when showing upload form', async () => {
        // Given - No file uploaded, showing upload form
        getExemptionCacheSpy.mockReturnValue({
          ...mockExemption,
          siteDetails: { fileUploadType: 'kml' }
        })

        mockCdpService.initiate.mockResolvedValue({
          uploadId: 'test-upload-id',
          uploadUrl: 'https://upload.example.com',
          statusUrl: 'https://status.example.com',
          maxFileSize: 50000000
        })

        // When
        await fileUploadController.handler(mockRequest, mockH)

        // Then - Should NOT include CSRF token in upload form state
        expect(mockH.view).toHaveBeenCalledWith(
          FILE_UPLOAD_VIEW_ROUTE,
          expect.not.objectContaining({
            csrfToken: expect.anything()
          })
        )
      })

      test('Should include upload form configuration when showing upload form', async () => {
        // Given
        getExemptionCacheSpy.mockReturnValue({
          ...mockExemption,
          siteDetails: { fileUploadType: 'kml' }
        })

        const mockUploadConfig = {
          uploadId: 'test-upload-id',
          uploadUrl: 'https://upload.example.com',
          statusUrl: 'https://status.example.com',
          maxFileSize: 50000000
        }

        mockCdpService.initiate.mockResolvedValue(mockUploadConfig)

        // When
        await fileUploadController.handler(mockRequest, mockH)

        // Then - Should include upload configuration
        expect(mockH.view).toHaveBeenCalledWith(
          FILE_UPLOAD_VIEW_ROUTE,
          expect.objectContaining({
            uploadUrl: 'https://upload.example.com',
            maxFileSize: 50000000,
            acceptAttribute: '.kml'
          })
        )
      })
    })
  })

  describe('Edge cases and error scenarios', () => {
    const mockRequest = {
      logger: {
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      },
      server: {
        plugins: {
          crumb: {
            generate: jest.fn().mockReturnValue('mock-csrf-token')
          }
        }
      }
    }

    const mockH = {
      view: jest.fn(),
      redirect: jest.fn()
    }

    beforeEach(() => {
      mockH.view.mockClear()
      mockH.redirect.mockClear()
    })

    test('Should handle missing siteDetails in exemption cache', async () => {
      // Given - Exemption cache with no siteDetails
      getExemptionCacheSpy.mockReturnValue({
        ...mockExemption,
        siteDetails: undefined
      })

      // When
      await fileUploadController.handler(mockRequest, mockH)

      // Then - Should redirect to file type selection
      expect(mockH.redirect).toHaveBeenCalledWith(
        routes.CHOOSE_FILE_UPLOAD_TYPE
      )
    })

    test('Should handle uploadedFile with uploadError (error takes precedence)', async () => {
      // Given - Both uploaded file and error present (error should take precedence)
      getExemptionCacheSpy.mockReturnValue({
        ...mockExemption,
        siteDetails: {
          fileUploadType: 'kml',
          uploadedFile: {
            filename: 'test.kml',
            fileSize: 1024
          },
          uploadError: {
            message: 'The selected file contains a virus',
            fieldName: 'file',
            fileType: 'kml'
          }
        }
      })

      mockCdpService.initiate.mockResolvedValue({
        uploadId: 'test-upload-id',
        uploadUrl: 'https://upload.example.com',
        statusUrl: 'https://status.example.com',
        maxFileSize: 50000000
      })

      // When
      await fileUploadController.handler(mockRequest, mockH)

      // Then - Should show upload form with error (not success state)
      expect(mockH.view).toHaveBeenCalledWith(
        FILE_UPLOAD_VIEW_ROUTE,
        expect.objectContaining({
          errorSummary: expect.any(Array),
          errors: expect.any(Object)
        })
      )
    })

    test('Should handle unknown file type gracefully', async () => {
      // Given - Unknown file type
      getExemptionCacheSpy.mockReturnValue({
        ...mockExemption,
        siteDetails: { fileUploadType: 'unknown' }
      })

      mockCdpService.initiate.mockResolvedValue({
        uploadId: 'test-upload-id',
        uploadUrl: 'https://upload.example.com',
        statusUrl: 'https://status.example.com',
        maxFileSize: 50000000
      })

      // When
      await fileUploadController.handler(mockRequest, mockH)

      // Then - Should use generic upload configuration
      expect(mockH.view).toHaveBeenCalledWith(
        FILE_UPLOAD_VIEW_ROUTE,
        expect.objectContaining({
          heading: 'Upload a file',
          acceptAttribute: ''
        })
      )
    })
  })

  describe('ML-70 requirements validation', () => {
    const mockRequest = {
      logger: {
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn()
      }
    }

    const mockH = {
      view: jest.fn(),
      redirect: jest.fn()
    }

    beforeEach(() => {
      mockH.view.mockClear()
      mockH.redirect.mockClear()
    })

    test('Should support 50MB maximum file size as per ML-70', async () => {
      // Given
      getExemptionCacheSpy.mockReturnValue({
        ...mockExemption,
        siteDetails: { fileUploadType: 'kml' }
      })

      mockCdpService.initiate.mockResolvedValue({
        uploadId: 'test-upload-id',
        uploadUrl: 'https://upload.example.com',
        statusUrl: 'https://status.example.com',
        maxFileSize: 50000000 // 50MB as per ML-70
      })

      // When
      await fileUploadController.handler(mockRequest, mockH)

      // Then - Should include 50MB file size limit
      expect(mockH.view).toHaveBeenCalledWith(
        FILE_UPLOAD_VIEW_ROUTE,
        expect.objectContaining({
          maxFileSize: 50000000
        })
      )
    })

    test('Should support both KML and Shapefile types as per ML-70', async () => {
      // Test both file types are handled correctly
      const fileTypes = [
        {
          type: 'kml',
          expectedHeading: 'Upload a KML file',
          expectedAccept: '.kml'
        },
        {
          type: 'shapefile',
          expectedHeading: 'Upload a Shapefile',
          expectedAccept: '.zip'
        }
      ]

      for (const fileType of fileTypes) {
        // Given
        getExemptionCacheSpy.mockReturnValue({
          ...mockExemption,
          siteDetails: { fileUploadType: fileType.type }
        })

        mockCdpService.initiate.mockResolvedValue({
          uploadId: 'test-upload-id',
          uploadUrl: 'https://upload.example.com',
          statusUrl: 'https://status.example.com',
          maxFileSize: 50000000
        })

        mockH.view.mockClear()

        // When
        await fileUploadController.handler(mockRequest, mockH)

        // Then - Should get CDP service without MIME types
        expect(cdpUploadService.getCdpUploadService).toHaveBeenCalledWith()

        expect(mockH.view).toHaveBeenCalledWith(
          FILE_UPLOAD_VIEW_ROUTE,
          expect.objectContaining({
            heading: fileType.expectedHeading,
            acceptAttribute: fileType.expectedAccept,
            fileUploadType: fileType.type
          })
        )
      }
    })
  })
})
