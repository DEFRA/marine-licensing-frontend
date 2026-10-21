import { siteNoticeResubmitPositionPhotoController } from '#src/server/marine-licence/site-notice/resubmit/position-photo/controller.js'
import {
  SITE_NOTICE_POSITION_PHOTO_VIEW_ROUTE,
  siteNoticePositionPhotoSettings
} from '#src/server/marine-licence/site-notice/position-photo/controller.js'
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

describe('#siteNoticeResubmitPositionPhotoController', () => {
  test('renders the position photo upload, returning to the resubmission', async () => {
    vi.spyOn(photoUpload, 'renderPhotoUploadPage').mockResolvedValue({})
    const request = createMockRequest({
      marineLicence: mockMarineLicenceWithResubmissionTask,
      params: { marineLicenceId, taskId: mockResubmissionTaskId },
      query: { location: '4' }
    })
    const h = createMockH()

    await siteNoticeResubmitPositionPhotoController.handler(request, h)

    expect(photoUpload.renderPhotoUploadPage).toHaveBeenCalledWith(request, h, {
      field: 'positionPhoto',
      viewRoute: SITE_NOTICE_POSITION_PHOTO_VIEW_ROUTE,
      settings: siteNoticePositionPhotoSettings,
      uploadPageUrl: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_POSITION_PHOTO}/${marineLicenceId}/${mockResubmissionTaskId}?location=4`,
      redirectUrl: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_PHOTO_UPLOAD_AND_WAIT}/${marineLicenceId}/${mockResubmissionTaskId}?location=4`,
      backLink: `${taskUrl}#site-location-4`,
      failureUrl: taskUrl,
      logLabel: 'site notice resubmission position photo upload'
    })
  })
})
