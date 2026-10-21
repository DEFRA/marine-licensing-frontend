import {
  siteNoticeResubmitController,
  siteNoticeResubmitSubmitController,
  SITE_NOTICE_RESUBMIT_VIEW_ROUTE
} from '#src/server/marine-licence/site-notice/resubmit/controller.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import {
  mockMarineLicenceWithResubmissionTask,
  mockResubmissionTaskId,
  mockResubmissionWithAllPhotos,
  mockResubmittedMarineLicence
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'

const marineLicenceId = mockMarineLicenceWithResubmissionTask.id
const taskUrl = `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT}/${marineLicenceId}/${mockResubmissionTaskId}`
const viewDetailsUrl = `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicenceId}`

const buildRequest = (
  marineLicence,
  resubmissionTask = marineLicence.applicationTasks[1]
) =>
  createMockRequest({
    params: { marineLicenceId, taskId: mockResubmissionTaskId },
    marineLicence,
    resubmissionTask
  })

describe('#siteNoticeResubmitController', () => {
  test('renders the rejected locations with links to upload both photos', () => {
    const h = createMockH()

    siteNoticeResubmitController.handler(
      buildRequest(mockMarineLicenceWithResubmissionTask),
      h
    )

    expect(h.view).toHaveBeenCalledWith(
      SITE_NOTICE_RESUBMIT_VIEW_ROUTE,
      expect.objectContaining({
        pageTitle: 'Resubmit site notice evidence',
        heading: 'Resubmit site notice evidence',
        backLink: viewDetailsUrl,
        pageCaption: 'MLA/2026/10264 - Test Project',
        photoLinks: {
          closeUpPhoto: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_CLOSE_UP_PHOTO}/${marineLicenceId}/${mockResubmissionTaskId}`,
          positionPhoto: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_RESUBMIT_POSITION_PHOTO}/${marineLicenceId}/${mockResubmissionTaskId}`
        },
        locations: [
          expect.objectContaining({ locationNumber: 1 }),
          expect.objectContaining({ locationNumber: 3 }),
          expect.objectContaining({ locationNumber: 4 })
        ],
        evidenceSubmission: null,
        canSendEvidence: false
      })
    )
  })

  test('lets the applicant send evidence once every photo is added', () => {
    const h = createMockH()

    siteNoticeResubmitController.handler(
      buildRequest(mockResubmissionWithAllPhotos()),
      h
    )

    expect(h.view).toHaveBeenCalledWith(
      SITE_NOTICE_RESUBMIT_VIEW_ROUTE,
      expect.objectContaining({ canSendEvidence: true })
    )
  })
})

describe('#siteNoticeResubmitSubmitController', () => {
  beforeEach(() => {
    vi.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({})
  })

  test('resolves the task and returns to view details', async () => {
    const h = createMockH()

    await siteNoticeResubmitSubmitController.handler(
      buildRequest(mockResubmissionWithAllPhotos()),
      h
    )

    expect(authRequests.authenticatedPostRequest).toHaveBeenCalledWith(
      expect.anything(),
      `/marine-licence/${marineLicenceId}/application-tasks/${mockResubmissionTaskId}/resolve`,
      {}
    )
    expect(h.redirect).toHaveBeenCalledWith(viewDetailsUrl)
  })

  test.each([
    ['a photo is still missing', mockMarineLicenceWithResubmissionTask],
    ['the task is already resolved', mockResubmittedMarineLicence]
  ])(
    'returns to the task page without resolving when %s',
    async (_label, marineLicence) => {
      const h = createMockH()

      await siteNoticeResubmitSubmitController.handler(
        buildRequest(marineLicence),
        h
      )

      expect(authRequests.authenticatedPostRequest).not.toHaveBeenCalled()
      expect(h.redirect).toHaveBeenCalledWith(taskUrl)
    }
  )
})
