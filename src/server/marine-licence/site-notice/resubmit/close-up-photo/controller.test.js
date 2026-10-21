import { siteNoticeResubmitCloseUpPhotoController } from '#src/server/marine-licence/site-notice/resubmit/close-up-photo/controller.js'
import {
  SITE_NOTICE_CLOSE_UP_PHOTO_VIEW_ROUTE,
  siteNoticeCloseUpPhotoSettings
} from '#src/server/marine-licence/site-notice/close-up-photo/controller.js'
import * as photoUpload from '#src/server/marine-licence/site-notice/utils.js'
import {
  mockMarineLicenceWithResubmissionTask,
  mockResubmissionTaskId
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'

const marineLicenceId = mockMarineLicenceWithResubmissionTask.id
const taskUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT}/${marineLicenceId}/${mockResubmissionTaskId}`

describe('#siteNoticeResubmitCloseUpPhotoController', () => {
  test('renders the close-up photo upload, returning to the resubmission', async () => {
    vi.spyOn(photoUpload, 'renderPhotoUploadPage').mockResolvedValue({})
    const request = createMockRequest({
      marineLicence: mockMarineLicenceWithResubmissionTask,
      params: { marineLicenceId, taskId: mockResubmissionTaskId },
      query: { location: '3' }
    })
    const h = createMockH()

    await siteNoticeResubmitCloseUpPhotoController.handler(request, h)

    expect(photoUpload.renderPhotoUploadPage).toHaveBeenCalledWith(request, h, {
      field: 'closeUpPhoto',
      viewRoute: SITE_NOTICE_CLOSE_UP_PHOTO_VIEW_ROUTE,
      settings: siteNoticeCloseUpPhotoSettings,
      uploadPageUrl: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_CLOSE_UP_PHOTO}/${marineLicenceId}/${mockResubmissionTaskId}?location=3`,
      redirectUrl: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_PHOTO_UPLOAD_AND_WAIT}/${marineLicenceId}/${mockResubmissionTaskId}?location=3`,
      backLink: `${taskUrl}#site-location-3`,
      failureUrl: taskUrl,
      logLabel: 'site notice resubmission close-up photo upload'
    })
  })
})
