import {
  getPhotoUploadErrorDisplay,
  initiatePhotoUpload,
  PHOTO_ACCEPT_ATTRIBUTE,
  PHOTO_FILE_TYPE_ERROR_MESSAGE,
  PHOTO_MAX_FILE_SIZE,
  PHOTO_UPLOAD_SESSION_KEY,
  renderPhotoUploadPage
} from '#src/server/marine-licence/site-notice/utils.js'
import { getCdpUploadService } from '#src/services/cdp-upload-service/index.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'

vi.mock('#src/services/cdp-upload-service/index.js')

describe('site notice photo upload helpers', () => {
  describe('#initiatePhotoUpload', () => {
    test('starts an upload session and stores what the wait page needs', async () => {
      const initiate = vi.fn().mockResolvedValue({
        uploadId: 'upload-id',
        statusUrl: 'status-url',
        uploadUrl: 'https://cdp/upload'
      })
      vi.mocked(getCdpUploadService).mockReturnValue({ initiate })
      const request = createMockRequest({
        params: { marineLicenceId: 'licence-id' },
        query: { location: '2' },
        yar: { get: vi.fn(), set: vi.fn(), commit: vi.fn() }
      })

      const uploadConfig = await initiatePhotoUpload(request, createMockH(), {
        field: 'closeUpPhoto',
        uploadPageUrl: '/upload-page'
      })

      expect(uploadConfig.uploadUrl).toBe('https://cdp/upload')
      expect(initiate).toHaveBeenCalledWith(
        expect.objectContaining({
          redirectUrl: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_PHOTO_UPLOAD_AND_WAIT}/licence-id?location=2`,
          s3Path: 'marine-licence/site-notice',
          allowedMimeTypes: ['image/jpeg', 'image/png'],
          maxFileSize: PHOTO_MAX_FILE_SIZE
        })
      )
      expect(request.yar.set).toHaveBeenCalledWith(PHOTO_UPLOAD_SESSION_KEY, {
        uploadId: 'upload-id',
        statusUrl: 'status-url',
        field: 'closeUpPhoto',
        uploadPageUrl: '/upload-page'
      })
    })
  })

  describe('#getPhotoUploadErrorDisplay', () => {
    test('returns nothing when there is no upload error', () => {
      expect(getPhotoUploadErrorDisplay(createMockRequest())).toEqual({})
    })

    test('returns the stored upload error for display', () => {
      const { errors } = getPhotoUploadErrorDisplay(
        createMockRequest({
          yar: {
            get: vi.fn(() => ({
              uploadError: {
                message: PHOTO_FILE_TYPE_ERROR_MESSAGE,
                fieldName: 'file'
              }
            }))
          }
        })
      )

      expect(errors.file.text).toBe(PHOTO_FILE_TYPE_ERROR_MESSAGE)
    })
  })

  describe('#renderPhotoUploadPage', () => {
    const pageOptions = {
      field: 'positionPhoto',
      viewRoute: 'photo-view',
      settings: { heading: 'Photo upload' },
      uploadPageUrl: '/upload-page',
      redirectUrl: '/wait-page?location=3',
      backLink: '/task#site-location-3',
      failureUrl: '/task',
      logLabel: 'test photo upload'
    }

    const buildRequest = () =>
      createMockRequest({
        marineLicence: { projectName: 'Test Project' },
        params: { marineLicenceId: 'licence-id' },
        query: { location: '3' },
        yar: { get: vi.fn(), set: vi.fn(), commit: vi.fn() }
      })

    test('starts the upload and renders the photo page', async () => {
      const initiate = vi.fn().mockResolvedValue({
        uploadId: 'upload-id',
        statusUrl: 'status-url',
        uploadUrl: 'https://cdp/upload'
      })
      vi.mocked(getCdpUploadService).mockReturnValue({ initiate })
      const h = createMockH()

      await renderPhotoUploadPage(buildRequest(), h, pageOptions)

      expect(initiate).toHaveBeenCalledWith(
        expect.objectContaining({ redirectUrl: '/wait-page?location=3' })
      )
      expect(h.view).toHaveBeenCalledWith('photo-view', {
        heading: 'Photo upload',
        projectName: 'Test Project',
        locationIndex: 3,
        uploadUrl: 'https://cdp/upload',
        acceptAttribute: PHOTO_ACCEPT_ATTRIBUTE,
        backLink: '/task#site-location-3'
      })
    })

    test('logs and redirects when the upload cannot be started', async () => {
      const error = new Error('CDP down')
      vi.mocked(getCdpUploadService).mockReturnValue({
        initiate: vi.fn().mockRejectedValue(error)
      })
      const request = buildRequest()
      const h = createMockH()

      await renderPhotoUploadPage(request, h, pageOptions)

      expect(request.logger.error).toHaveBeenCalledWith(
        { err: error },
        'Failed to initialise test photo upload'
      )
      expect(h.redirect).toHaveBeenCalledWith('/task')
    })
  })
})
