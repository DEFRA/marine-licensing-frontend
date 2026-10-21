import { siteNoticeResubmitCloseUpPhotoController } from '#src/server/marine-licence/site-notice/resubmit/close-up-photo/controller.js'
import { SITE_NOTICE_CLOSE_UP_PHOTO_VIEW_ROUTE } from '#src/server/marine-licence/site-notice/close-up-photo/controller.js'
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

const buildRequest = () =>
  createMockRequest({
    marineLicence: mockMarineLicenceWithResubmissionTask,
    params: { marineLicenceId, taskId: mockResubmissionTaskId },
    query: { location: '3' }
  })

describe('#siteNoticeResubmitCloseUpPhotoController', () => {
  beforeEach(() => {
    vi.spyOn(photoUpload, 'getPhotoUploadErrorDisplay').mockReturnValue({})
    vi.spyOn(photoUpload, 'initiatePhotoUpload').mockResolvedValue({
      uploadUrl: 'https://cdp/upload'
    })
  })

  test('starts a close-up photo upload that returns to the resubmission', async () => {
    const request = buildRequest()
    const h = createMockH()

    await siteNoticeResubmitCloseUpPhotoController.handler(request, h)

    expect(photoUpload.initiatePhotoUpload).toHaveBeenCalledWith(request, h, {
      field: 'closeUpPhoto',
      uploadPageUrl: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_CLOSE_UP_PHOTO}/${marineLicenceId}/${mockResubmissionTaskId}?location=3`,
      redirectUrl: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_PHOTO_UPLOAD_AND_WAIT}/${marineLicenceId}/${mockResubmissionTaskId}?location=3`
    })
    expect(h.view).toHaveBeenCalledWith(
      SITE_NOTICE_CLOSE_UP_PHOTO_VIEW_ROUTE,
      expect.objectContaining({
        heading: 'Close-up photo upload',
        projectName: 'Test Project',
        locationIndex: 3,
        uploadUrl: 'https://cdp/upload',
        acceptAttribute: photoUpload.PHOTO_ACCEPT_ATTRIBUTE,
        backLink: `${taskUrl}#site-location-3`
      })
    )
  })

  test('redirects to the task page when the upload cannot be started', async () => {
    vi.mocked(photoUpload.initiatePhotoUpload).mockRejectedValue(
      new Error('CDP down')
    )
    const h = createMockH()

    await siteNoticeResubmitCloseUpPhotoController.handler(buildRequest(), h)

    expect(h.redirect).toHaveBeenCalledWith(taskUrl)
  })
})
