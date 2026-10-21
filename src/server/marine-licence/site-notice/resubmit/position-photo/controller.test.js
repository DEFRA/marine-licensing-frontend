import { siteNoticeResubmitPositionPhotoController } from '#src/server/marine-licence/site-notice/resubmit/position-photo/controller.js'
import { SITE_NOTICE_POSITION_PHOTO_VIEW_ROUTE } from '#src/server/marine-licence/site-notice/position-photo/controller.js'
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
    query: { location: '4' }
  })

describe('#siteNoticeResubmitPositionPhotoController', () => {
  beforeEach(() => {
    vi.spyOn(photoUpload, 'getPhotoUploadErrorDisplay').mockReturnValue({})
    vi.spyOn(photoUpload, 'initiatePhotoUpload').mockResolvedValue({
      uploadUrl: 'https://cdp/upload'
    })
  })

  test('starts a position photo upload that returns to the resubmission', async () => {
    const request = buildRequest()
    const h = createMockH()

    await siteNoticeResubmitPositionPhotoController.handler(request, h)

    expect(photoUpload.initiatePhotoUpload).toHaveBeenCalledWith(request, h, {
      field: 'positionPhoto',
      uploadPageUrl: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_POSITION_PHOTO}/${marineLicenceId}/${mockResubmissionTaskId}?location=4`,
      redirectUrl: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_PHOTO_UPLOAD_AND_WAIT}/${marineLicenceId}/${mockResubmissionTaskId}?location=4`
    })
    expect(h.view).toHaveBeenCalledWith(
      SITE_NOTICE_POSITION_PHOTO_VIEW_ROUTE,
      expect.objectContaining({
        heading: 'Position and location photo upload',
        projectName: 'Test Project',
        locationIndex: 4,
        uploadUrl: 'https://cdp/upload',
        acceptAttribute: photoUpload.PHOTO_ACCEPT_ATTRIBUTE,
        backLink: `${taskUrl}#site-location-4`
      })
    )
  })

  test('redirects to the task page when the upload cannot be started', async () => {
    vi.mocked(photoUpload.initiatePhotoUpload).mockRejectedValue(
      new Error('CDP down')
    )
    const h = createMockH()

    await siteNoticeResubmitPositionPhotoController.handler(buildRequest(), h)

    expect(h.redirect).toHaveBeenCalledWith(taskUrl)
  })
})
