import {
  getPhotoUploadErrorDisplay,
  initiatePhotoUpload,
  PHOTO_FILE_TYPE_ERROR_MESSAGE,
  PHOTO_MAX_FILE_SIZE,
  PHOTO_UPLOAD_SESSION_KEY
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
})
