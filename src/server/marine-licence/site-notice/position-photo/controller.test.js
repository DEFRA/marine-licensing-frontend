import {
  siteNoticePositionPhotoController,
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
    vi.spyOn(photoUpload, 'getPhotoUploadErrorDisplay').mockReturnValue({})
    vi.spyOn(photoUpload, 'initiatePhotoUpload').mockResolvedValue({
      uploadUrl: 'https://cdp/upload'
    })
  })

  test('starts a position photo upload and renders the page', async () => {
    const request = createMockRequest({
      marineLicence: mockMarineLicenceWithApplicationTask,
      params: { marineLicenceId },
      query: { evidence: '1' }
    })
    const h = createMockH()

    await siteNoticePositionPhotoController.handler(request, h)

    expect(photoUpload.initiatePhotoUpload).toHaveBeenCalledWith(request, h, {
      field: 'positionPhoto',
      uploadPageUrl: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_POSITION_PHOTO}/${marineLicenceId}?evidence=1`
    })
    expect(h.view).toHaveBeenCalledWith(
      SITE_NOTICE_POSITION_PHOTO_VIEW_ROUTE,
      expect.objectContaining({
        heading: 'Position and location photo upload',
        projectName: 'Test Project',
        locationIndex: 1,
        uploadUrl: 'https://cdp/upload',
        acceptAttribute: photoUpload.PHOTO_ACCEPT_ATTRIBUTE,
        backLink: displayUrl
      })
    )
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
        query: { evidence: '1' }
      }),
      h
    )

    expect(photoUpload.initiatePhotoUpload).not.toHaveBeenCalled()
    expect(h.redirect).toHaveBeenCalledWith(
      `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicenceId}`
    )
  })
})
