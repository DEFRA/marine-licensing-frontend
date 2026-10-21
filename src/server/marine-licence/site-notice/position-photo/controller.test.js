import {
  siteNoticePositionPhotoController,
  siteNoticePositionPhotoSettings,
  SITE_NOTICE_POSITION_PHOTO_VIEW_ROUTE
} from '#src/server/marine-licence/site-notice/position-photo/controller.js'
import * as photoUpload from '#src/server/marine-licence/site-notice/utils.js'
import { mockMarineLicenceWithApplicationTask } from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'

const marineLicenceId = mockMarineLicenceWithApplicationTask.id
const displayUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceId}`

describe('#siteNoticePositionPhotoController', () => {
  beforeEach(() => {
    vi.spyOn(photoUpload, 'renderPhotoUploadPage').mockResolvedValue({})
  })

  test('renders the position photo upload for the location', async () => {
    const request = createMockRequest({
      marineLicence: mockMarineLicenceWithApplicationTask,
      params: { marineLicenceId },
      query: { location: '1' }
    })
    const h = createMockH()

    await siteNoticePositionPhotoController.handler(request, h)

    expect(photoUpload.renderPhotoUploadPage).toHaveBeenCalledWith(request, h, {
      field: 'positionPhoto',
      viewRoute: SITE_NOTICE_POSITION_PHOTO_VIEW_ROUTE,
      settings: siteNoticePositionPhotoSettings,
      uploadPageUrl: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_POSITION_PHOTO}/${marineLicenceId}?location=1`,
      backLink: `${displayUrl}#site-location-1`,
      failureUrl: displayUrl,
      logLabel: 'site notice position photo upload'
    })
  })

  test('redirects to view details when there is no site notice task', async () => {
    const h = createMockH()

    await siteNoticePositionPhotoController.handler(
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
