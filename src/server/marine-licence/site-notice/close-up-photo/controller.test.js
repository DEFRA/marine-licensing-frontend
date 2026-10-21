import {
  siteNoticeCloseUpPhotoController,
  siteNoticeCloseUpPhotoSettings,
  SITE_NOTICE_CLOSE_UP_PHOTO_VIEW_ROUTE
} from '#src/server/marine-licence/site-notice/close-up-photo/controller.js'
import * as photoUpload from '#src/server/marine-licence/site-notice/utils.js'
import { mockMarineLicenceWithApplicationTask } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'

const marineLicenceId = mockMarineLicenceWithApplicationTask.id
const displayUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceId}`

describe('#siteNoticeCloseUpPhotoController', () => {
  beforeEach(() => {
    vi.spyOn(photoUpload, 'renderPhotoUploadPage').mockResolvedValue({})
  })

  test('renders the close-up photo upload for the location', async () => {
    const request = createMockRequest({
      marineLicence: mockMarineLicenceWithApplicationTask,
      params: { marineLicenceId },
      query: { location: '1' }
    })
    const h = createMockH()

    await siteNoticeCloseUpPhotoController.handler(request, h)

    expect(photoUpload.renderPhotoUploadPage).toHaveBeenCalledWith(request, h, {
      field: 'closeUpPhoto',
      viewRoute: SITE_NOTICE_CLOSE_UP_PHOTO_VIEW_ROUTE,
      settings: siteNoticeCloseUpPhotoSettings,
      uploadPageUrl: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_CLOSE_UP_PHOTO}/${marineLicenceId}?location=1`,
      backLink: `${displayUrl}#site-location-1`,
      failureUrl: displayUrl,
      logLabel: 'site notice close-up photo upload'
    })
  })

  test('redirects to view details when there is no site notice task', async () => {
    const h = createMockH()

    await siteNoticeCloseUpPhotoController.handler(
      createMockRequest({
        marineLicence: {
          ...mockMarineLicenceWithApplicationTask,
          applicationTasks: []
        },
        params: { marineLicenceId },
        query: { location: '1' }
      }),
      h
    )

    expect(photoUpload.renderPhotoUploadPage).not.toHaveBeenCalled()
    expect(h.redirect).toHaveBeenCalledWith(
      `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicenceId}`
    )
  })
})
