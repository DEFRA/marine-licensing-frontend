import {
  siteNoticeDisplayController,
  siteNoticeDisplaySubmitController,
  siteNoticeDisplayAddEvidenceController,
  SITE_NOTICE_DISPLAY_VIEW_ROUTE
} from '#src/server/marine-licence/site-notice/display/controller.js'
import * as authRequests from '#src/server/common/helpers/authenticated-requests.js'
import { findSiteNoticeTask } from '#src/server/common/helpers/marine-licence/site-notice.js'
import { getMarineLicenceService } from '#src/services/marine-licence-service/index.js'
import {
  mockMarineLicenceWithApplicationTask,
  mockApplicationTaskContactId
} from '#src/server/test-helpers/mocks/marine-licence-mocks.js'
import { marineLicenceRoutes } from '#src/server/common/constants/routes.js'
import {
  createMockH,
  createMockRequest
} from '#src/server/test-helpers/mocks/helpers.js'
import * as authUtils from '#src/server/common/plugins/auth/utils.js'

vi.mock('#src/services/marine-licence-service/index.js')
vi.mock('#src/server/common/plugins/auth/utils.js')

describe('#siteNoticeDisplay', () => {
  const mockH = createMockH()

  beforeEach(() => {
    vi.spyOn(authUtils, 'getUserSession').mockResolvedValue({
      contactId: mockApplicationTaskContactId
    })
  })

  describe('#siteNoticeDisplayController', () => {
    test('handler should render with correct context', async () => {
      const mockService = {
        getMarineLicenceById: vi
          .fn()
          .mockResolvedValue(mockMarineLicenceWithApplicationTask)
      }
      vi.mocked(getMarineLicenceService).mockReturnValue(mockService)

      await siteNoticeDisplayController.handler(
        createMockRequest({
          params: {
            marineLicenceId: mockMarineLicenceWithApplicationTask.id
          }
        }),
        mockH
      )

      const licenceId = mockMarineLicenceWithApplicationTask.id
      const expectedViewDetailsUrl = `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${licenceId}`

      expect(mockH.view).toHaveBeenCalledWith(SITE_NOTICE_DISPLAY_VIEW_ROUTE, {
        backLink: expectedViewDetailsUrl,
        pageTitle: 'Display a site notice',
        heading: 'Display a site notice',
        pageCaption: 'MLA/2026/10264 - Test Project',
        addEvidenceFormAction: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_ADD_EVIDENCE}/${licenceId}`,
        canAddLocation: true,
        deleteLocationUrl: `/marine-licence/${licenceId}/delete-location`,
        evidenceLinks: {
          locationName: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_LOCATION_NAME}/${licenceId}`,
          dateDisplayed: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DATE_DISPLAYED}/${licenceId}`,
          closeUpPhoto: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_CLOSE_UP_PHOTO}/${licenceId}`,
          positionPhoto: `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_POSITION_PHOTO}/${licenceId}`
        },
        showCommunityUserSection: true,
        showMarineUserSection: true,
        showMultipleSitesSection: false,
        evidenceSubmission: null,
        canSendEvidence: true,
        siteNoticeEvidence: [
          {
            closeUpPhoto: 'test.jpg',
            dateDisplayed: '22 May 2026',
            locationName: 'North pier',
            positionPhoto: 'test.jpg'
          }
        ]
      })
    })

    test('redirects to view details when there is no site notice task', async () => {
      vi.mocked(getMarineLicenceService).mockReturnValue({
        getMarineLicenceById: vi.fn().mockResolvedValue({
          ...mockMarineLicenceWithApplicationTask,
          applicationTasks: []
        })
      })

      await siteNoticeDisplayController.handler(
        createMockRequest({
          params: { marineLicenceId: mockMarineLicenceWithApplicationTask.id }
        }),
        mockH
      )

      expect(mockH.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${mockMarineLicenceWithApplicationTask.id}`
      )
      expect(mockH.view).not.toHaveBeenCalled()
    })

    test('Should handle API errors in catch block', async () => {
      const mockError = new Error('API Error')

      const mockRequest = createMockRequest({
        params: {
          marineLicenceId: mockMarineLicenceWithApplicationTask.id
        }
      })

      getMarineLicenceService.mockReturnValue({
        getMarineLicenceById: vi.fn().mockRejectedValue(mockError)
      })

      await expect(
        siteNoticeDisplayController.handler(mockRequest, mockH)
      ).rejects.toThrow('Error displaying site notice display page')

      expect(mockH.view).not.toHaveBeenCalled()
    })
  })

  describe('#siteNoticeDisplaySubmitController', () => {
    const marineLicenceId = mockMarineLicenceWithApplicationTask.id
    const { taskId } = findSiteNoticeTask(mockMarineLicenceWithApplicationTask)

    const submit = async (marineLicence) => {
      vi.mocked(getMarineLicenceService).mockReturnValue({
        getMarineLicenceById: vi.fn().mockResolvedValue(marineLicence)
      })

      await siteNoticeDisplaySubmitController.handler(
        createMockRequest({ params: { marineLicenceId } }),
        mockH
      )
      return mockH
    }

    beforeEach(() => {
      vi.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({})
    })

    test('resolves the site notice task and returns to view details', async () => {
      await submit(mockMarineLicenceWithApplicationTask)

      expect(authRequests.authenticatedPostRequest).toHaveBeenCalledWith(
        expect.anything(),
        `/marine-licence/${marineLicenceId}/application-tasks/${taskId}/resolve`,
        {}
      )
      expect(mockH.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicenceId}`
      )
    })

    test('does not resolve the task when evidence is incomplete', async () => {
      await submit({
        ...mockMarineLicenceWithApplicationTask,
        siteNoticeEvidence: [{ locationName: 'North pier' }]
      })

      expect(authRequests.authenticatedPostRequest).not.toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceId}`
      )
    })

    test('redirects to view details when there is no site notice task', async () => {
      await submit({
        ...mockMarineLicenceWithApplicationTask,
        applicationTasks: []
      })

      expect(authRequests.authenticatedPostRequest).not.toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicenceId}`
      )
    })

    test('redirects to display page when task is resolved', async () => {
      const resolvedAt = '2026-10-01T12:00:00.000Z'

      const mockResolvedMarineLicenceWithApplicationTask = {
        ...mockMarineLicenceWithApplicationTask
      }

      mockResolvedMarineLicenceWithApplicationTask.applicationTasks[1].resolvedAt =
        resolvedAt

      await submit(mockResolvedMarineLicenceWithApplicationTask)

      expect(authRequests.authenticatedPostRequest).not.toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceId}`
      )
    })
  })

  describe('#siteNoticeDisplayAddEvidenceController', () => {
    const marineLicenceId = mockMarineLicenceWithApplicationTask.id

    beforeEach(() => {
      vi.spyOn(authRequests, 'authenticatedPostRequest').mockResolvedValue({})
    })

    test('redirects to view details when there is no site notice task', async () => {
      vi.mocked(getMarineLicenceService).mockReturnValue({
        getMarineLicenceById: vi.fn().mockResolvedValue({
          ...mockMarineLicenceWithApplicationTask,
          applicationTasks: []
        })
      })

      await siteNoticeDisplayAddEvidenceController.handler(
        createMockRequest({ params: { marineLicenceId } }),
        mockH
      )

      expect(authRequests.authenticatedPostRequest).not.toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_VIEW_DETAILS}/${marineLicenceId}`
      )
    })

    test('redirects to display page when task is resolved', async () => {
      const resolvedAt = '2026-10-01T12:00:00.000Z'

      const mockResolvedMarineLicenceWithApplicationTask = {
        ...mockMarineLicenceWithApplicationTask
      }

      mockResolvedMarineLicenceWithApplicationTask.applicationTasks[1].resolvedAt =
        resolvedAt

      vi.mocked(getMarineLicenceService).mockReturnValue({
        getMarineLicenceById: vi
          .fn()
          .mockResolvedValue(mockResolvedMarineLicenceWithApplicationTask)
      })

      await siteNoticeDisplayAddEvidenceController.handler(
        createMockRequest({ params: { marineLicenceId } }),
        mockH
      )

      expect(authRequests.authenticatedPostRequest).not.toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceId}`
      )
    })

    test('handles errors by redirecting to display page', async () => {
      const mockError = new Error('API Error')

      const mockRequest = createMockRequest({
        params: { marineLicenceId }
      })

      getMarineLicenceService.mockReturnValue({
        getMarineLicenceById: vi.fn().mockRejectedValue(mockError)
      })

      await siteNoticeDisplayAddEvidenceController.handler(mockRequest, mockH)

      expect(authRequests.authenticatedPostRequest).not.toHaveBeenCalled()
      expect(mockH.redirect).toHaveBeenCalledWith(
        `${marineLicenceRoutes.MARINE_LICENCE_SITE_NOTICE_DISPLAY}/${marineLicenceId}`
      )
    })
  })
})
