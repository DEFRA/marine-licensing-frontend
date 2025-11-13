import { vi } from 'vitest'
import { config } from '#src/config/config.js'
import { routes } from '#src/server/common/constants/routes.js'
import * as cacheUtils from '#src/server/common/helpers/session-cache/utils.js'
import {
  FILE_UPLOAD_VIEW_ROUTE,
  fileUploadController
} from '#src/server/exemption/site-details/file-upload/controller.js'
import { mockExemption } from '#src/server/test-helpers/mocks.js'
import * as cdpUploadService from '#src/services/cdp-upload-service/index.js'

vi.mock('~/src/server/common/helpers/session-cache/utils.js')
vi.mock('~/src/services/cdp-upload-service/index.js')

describe('#fileUpload', () => {
  let getExemptionCacheSpy
  let updateExemptionSiteDetailsSpy
  let mockCdpService

  const createMockRequest = () => ({
    logger: {
      debug: vi.fn(),
      warn: vi.fn(),
      error: vi.fn()
    },
    server: {
      plugins: {
        crumb: {
          generate: vi.fn().mockReturnValue('mock-csrf-token')
        }
      }
    },
    yar: {
      get: vi.fn(),
      set: vi.fn(),
      commit: vi.fn()
    }
  })

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

  const setupExemptionWithFileType = (
    fileUploadType,
    additionalSiteDetails = {}
  ) => {
    getExemptionCacheSpy.mockReturnValue({
      ...mockExemption,
      siteDetails: [{ fileUploadType, ...additionalSiteDetails }]
    })
  }

  const setupStandardFileUploadTest = async (
    fileUploadType,
    mockRequest,
    mockH
  ) => {
    setupExemptionWithFileType(fileUploadType)
    mockCdpService.initiate.mockResolvedValue(createStandardUploadConfig())
    await fileUploadController.handler(mockRequest, mockH)
  }

  const expectViewCalledWith = (mockH, expectedContent) => {
    expect(mockH.view).toHaveBeenCalledWith(
      FILE_UPLOAD_VIEW_ROUTE,
      expect.objectContaining(expectedContent)
    )
  }

  beforeEach(() => {
    getExemptionCacheSpy = vi
      .spyOn(cacheUtils, 'getExemptionCache')
      .mockReturnValue(mockExemption)

    updateExemptionSiteDetailsSpy = vi
      .spyOn(cacheUtils, 'updateExemptionSiteDetails')
      .mockImplementation()

    mockCdpService = {
      initiate: vi.fn(),
      getStatus: vi.fn()
    }

    vi.spyOn(cdpUploadService, 'getCdpUploadService').mockReturnValue(
      mockCdpService
    )
  })

  describe('#fileUploadController', () => {
    let mockRequest
    let mockH

    beforeEach(() => {
      mockRequest = createMockRequest()
      mockH = createMockH()
    })

    describe('AC1 - Display page based on file type selection', () => {
      test('Should redirect to file type selection when no fileUploadType is set', async () => {
        // Given - No file type selected
        getExemptionCacheSpy.mockReturnValue({
          ...mockExemption,
          siteDetails: [{}]
        })

        // When
        await fileUploadController.handler(mockRequest, mockH)

        // Then
        expect(mockH.redirect).toHaveBeenCalledWith(
          routes.CHOOSE_FILE_UPLOAD_TYPE
        )
      })

      test.each([
        {
          fileType: 'kml',
          expectedHeading: 'Upload a KML file',
          expectedAccept: '.kml'
        },
        {
          fileType: 'shapefile',
          expectedHeading: 'Upload a Shapefile',
          expectedAccept: '.zip'
        }
      ])(
        'Should display $fileType upload page with correct title and content',
        async ({ fileType, expectedHeading, expectedAccept }) => {
          // Given - File type selected
          // When
          await setupStandardFileUploadTest(fileType, mockRequest, mockH)

          // Then
          expectViewCalledWith(mockH, {
            pageTitle: 'Upload a file',
            heading: expectedHeading,
            projectName: 'Test Project',
            acceptAttribute: expectedAccept,
            fileUploadType: fileType,
            backLink: routes.CHOOSE_FILE_UPLOAD_TYPE,
            cancelLink: `${routes.TASK_LIST}?cancel=site-details`
          })
        }
      )
    })

    describe('AC2 & AC3 - File upload functionality (Choose file & Drop file)', () => {
      test.each(['kml', 'shapefile'])(
        'Should initialize CDP upload session for %s',
        async (fileType) => {
          // Given - File type
          await setupStandardFileUploadTest(fileType, mockRequest, mockH)

          // Then - Should get CDP service without MIME types
          expect(cdpUploadService.getCdpUploadService).toHaveBeenCalledWith()

          // And CDP should be initiated with correct parameters
          expect(mockCdpService.initiate).toHaveBeenCalledWith({
            redirectUrl: routes.UPLOAD_AND_WAIT,
            s3Path: 'exemptions',
            s3Bucket: config.get('cdpUploader').s3Bucket
          })
        }
      )

      test('Should store upload configuration in session', async () => {
        // Given & When
        await setupStandardFileUploadTest('kml', mockRequest, mockH)

        // Then - Should store upload config in session
        expect(updateExemptionSiteDetailsSpy).toHaveBeenCalledWith(
          mockRequest,
          expect.any(Object),
          0,
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
          siteDetails: [
            {
              fileUploadType: 'kml',
              uploadError: {
                message: 'The selected file contains a virus',
                fieldName: 'file',
                fileType: 'kml'
              }
            }
          ]
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
          expect.any(Object),
          0,
          'uploadError',
          null
        )

        expect(mockRequest.logger.debug).toHaveBeenCalledWith(
          expect.objectContaining({
            message: 'The selected file contains a virus',
            fieldName: 'file',
            fileType: 'kml'
          }),
          'Displaying upload error from session'
        )
      })

      test('Should handle CDP service initialization failure', async () => {
        // Given - CDP service fails to initialize
        getExemptionCacheSpy.mockReturnValue({
          ...mockExemption,
          siteDetails: [{ fileUploadType: 'kml' }]
        })

        mockCdpService.initiate.mockRejectedValue(
          new Error('CDP service unavailable')
        )

        // When
        await fileUploadController.handler(mockRequest, mockH)

        // Then - Should log error and redirect to file type selection
        expect(mockRequest.logger.error).toHaveBeenCalledWith(
          expect.objectContaining({
            err: expect.any(Error),
            exemptionId: mockExemption.id,
            fileUploadType: 'kml'
          }),
          'Failed to initialize file upload'
        )

        expect(mockH.redirect).toHaveBeenCalledWith(
          routes.CHOOSE_FILE_UPLOAD_TYPE
        )
      })

      test('Logs a warning before re-uploading a file', async () => {
        // Given - File already uploaded, and no uploadError
        getExemptionCacheSpy.mockReturnValue({
          ...mockExemption,
          siteDetails: [
            {
              fileUploadType: 'kml',
              uploadError: null,
              uploadedFile: {
                filename: 'test.kml',
                fileSize: 1024
              }
            }
          ]
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
          siteDetails: [{ fileUploadType: 'kml' }]
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
          siteDetails: [{ fileUploadType: 'kml' }]
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
        // Given & When
        await setupStandardFileUploadTest('kml', mockRequest, mockH)

        // Then - Should include upload configuration
        expectViewCalledWith(mockH, {
          uploadUrl: 'https://upload.example.com',
          maxFileSize: 50000000,
          acceptAttribute: '.kml'
        })
      })
    })
  })

  describe('Edge cases and error scenarios', () => {
    let mockRequest
    let mockH

    beforeEach(() => {
      mockRequest = createMockRequest()
      mockH = createMockH()
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
        siteDetails: [
          {
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
        ]
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
        siteDetails: [{ fileUploadType: 'unknown' }]
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
    let mockRequest
    let mockH

    beforeEach(() => {
      mockRequest = createMockRequest()
      mockH = createMockH()
    })

    test('Should support 50MB maximum file size as per ML-70', async () => {
      // Given
      // When
      await setupStandardFileUploadTest('kml', mockRequest, mockH)

      // Then - Should include 50MB file size limit
      expectViewCalledWith(mockH, {
        maxFileSize: 50000000
      })
    })

    test.each([
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
    ])(
      'Should support $type file type as per ML-70',
      async ({ type, expectedHeading, expectedAccept }) => {
        // Given
        await setupStandardFileUploadTest(type, mockRequest, mockH)

        // Then - Should get CDP service without MIME types
        expect(cdpUploadService.getCdpUploadService).toHaveBeenCalledWith()

        expectViewCalledWith(mockH, {
          heading: expectedHeading,
          acceptAttribute: expectedAccept,
          fileUploadType: type
        })
      }
    )
  })

  describe('Mutation testing coverage - surviving mutants', () => {
    let mockRequest, mockH

    beforeEach(() => {
      mockRequest = createMockRequest()
      mockH = createMockH()
    })

    const setupMutationTest = async (siteDetails, shouldMockCdp = true) => {
      getExemptionCacheSpy.mockReturnValue({
        ...mockExemption,
        siteDetails: [siteDetails]
      })
      if (shouldMockCdp) {
        mockCdpService.initiate.mockResolvedValue(createStandardUploadConfig())
      }
      await fileUploadController.handler(mockRequest, mockH)
    }

    test('Should map error message correctly in error summary', async () => {
      const testMessage = 'Test error message'
      await setupMutationTest({
        fileUploadType: 'kml',
        uploadError: {
          message: testMessage,
          fieldName: 'file',
          fileType: 'kml'
        }
      })

      expect(mockH.view).toHaveBeenCalledWith(
        FILE_UPLOAD_VIEW_ROUTE,
        expect.objectContaining({
          errorSummary: expect.arrayContaining([
            expect.objectContaining({
              text: testMessage
            })
          ])
        })
      )
    })

    test('Should log fileUploadType debug message', async () => {
      await setupMutationTest({ fileUploadType: 'kml' })

      expect(mockRequest.logger.debug).toHaveBeenCalledWith(
        'fileUploadController: fileUploadType [kml]'
      )
    })

    test.each([
      { type: 'empty string', value: '' },
      { type: 'whitespace', value: '   ' }
    ])('Should redirect when fileUploadType is $type', async ({ value }) => {
      await setupMutationTest({ fileUploadType: value }, false)

      expect(mockH.redirect).toHaveBeenCalledWith(
        routes.CHOOSE_FILE_UPLOAD_TYPE
      )
      expect(mockH.view).not.toHaveBeenCalled()
    })

    test('Should log warning when uploadedFile exists without uploadError', async () => {
      await setupMutationTest({
        fileUploadType: 'kml',
        uploadedFile: {
          filename: 'test.kml',
          fileSize: 1024
        }
      })

      expect(mockRequest.logger.debug).toHaveBeenCalledWith(
        'Uploaded file without error found, but starting a new upload session'
      )
    })

    test.each([
      {
        scenario: 'uploadedFile exists with uploadError',
        siteDetails: {
          fileUploadType: 'kml',
          uploadedFile: { filename: 'test.kml', fileSize: 1024 },
          uploadError: {
            message: 'File has virus',
            fieldName: 'file',
            fileType: 'kml'
          }
        }
      },
      {
        scenario: 'no uploadedFile exists',
        siteDetails: { fileUploadType: 'kml' }
      },
      {
        scenario: 'uploadedFile is falsy with no uploadError',
        siteDetails: { fileUploadType: 'kml', uploadedFile: null }
      }
    ])('Should not log warning when $scenario', async ({ siteDetails }) => {
      await setupMutationTest(siteDetails)

      expect(mockRequest.logger.debug).not.toHaveBeenCalledWith(
        'Uploaded file without error found, but starting a new upload session'
      )
    })

    test('Should handle all falsy fileUploadType values with redirect', async () => {
      const falsyValues = [null, undefined, false, 0, '']

      for (const falsyValue of falsyValues) {
        await setupMutationTest({ fileUploadType: falsyValue }, false)

        expect(mockH.redirect).toHaveBeenCalledWith(
          routes.CHOOSE_FILE_UPLOAD_TYPE
        )
        expect(mockH.view).not.toHaveBeenCalled()
        expect(mockCdpService.initiate).not.toHaveBeenCalled()
      }
    })
  })
})
